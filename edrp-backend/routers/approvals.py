from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_db, get_current_user
from models import User, Decision, DecisionStatus, Approval, ApprovalDecision
from schemas import ApprovalCreate, ApprovalOut
from helpers import create_decision_version, get_next_required_role, APPROVAL_LEVELS
from helpers import log_action
from helpers import notify, notify_relevant_users, send_email

router = APIRouter(prefix="/decisions", tags=["Approvals"])

# This endpoint allows a user to review (approve or reject) a decision.
@router.post("/{decision_id}/approvals", response_model=ApprovalOut, status_code=201)
def review_decision(
    decision_id: int,
    payload: ApprovalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Create a new version of the decision before making any changes!!!!!!!!!!!!!!!!!
    create_decision_version(db, decision, current_user.id)
    next_required_role = get_next_required_role(decision_id, db)

    if next_required_role is None:
        raise HTTPException(
            status_code=400,
            detail="This decision has already been fully reviewed (approved or rejected).",
        )

    if current_user.role != next_required_role:
        raise HTTPException(
            status_code=403,
            detail=f"This decision currently requires review by a {next_required_role}, not a {current_user.role}.",
        )

    new_approval = Approval(
        decision_id=decision_id,
        reviewer_id=current_user.id,
        outcome=payload.outcome,
        comments=payload.comments,
    )
    db.add(new_approval)

    if payload.outcome == ApprovalDecision.REJECTED:
        decision.status = DecisionStatus.REJECTED
    else:
        levels_passed_after_this = len(
            db.query(Approval).filter(Approval.decision_id == decision_id).all()
        ) + 1
        if levels_passed_after_this >= len(APPROVAL_LEVELS):
            decision.status = DecisionStatus.APPROVED
        else:
            decision.status = DecisionStatus.UNDER_REVIEW

    notify_relevant_users(
        db,
        decision=decision,
        event_type="decision_" + payload.outcome.value.lower(),
        actor_id=current_user.id,
        details=f"Decision '{decision.title}' was {payload.outcome.value.lower()} by {current_user.role}.",
        link=f"/decisions/{decision.id}",
    )

    # If it's still under review, tell whoever's turn it is now
    if decision.status == DecisionStatus.UNDER_REVIEW:
        next_role = get_next_required_role(decision_id, db)
        if next_role:
            next_reviewers = db.query(User).filter(User.role == next_role).all()
            for reviewer in next_reviewers:
                notify(
                    db,
                    user_id=reviewer.id,
                    message=f"'{decision.title}' is awaiting your review.",
                    link=f"/decisions/{decision.id}",
            )
    log_action(
    db,
    actor_id=current_user.id,
    action="decision_reviewed",
    entity_type="Decision",
    entity_id=decision_id,
    details=f"{payload.outcome.value} by {current_user.role}",
    )   
    db.commit()
    db.refresh(new_approval)

    # ---- Email notifications (all fire in background threads) ----

    # 1. Email the decision creator about the outcome
    from models import User as _User
    creator = db.query(_User).filter(_User.id == decision.created_by).first()
    if creator:
        outcome_word = payload.outcome.value.capitalize()
        send_email(
            to_email=creator.email,
            subject=f"[EDRP] Your decision '{decision.title}' was {outcome_word}",
            body=(
                f"Hi {creator.name},\n\n"
                f"Your decision has been reviewed.\n\n"
                f"Title: {decision.title}\n"
                f"Outcome: {outcome_word}\n"
                f"Reviewed by: {current_user.name} ({current_user.role})\n"
                + (f"Comments: {new_approval.comments}\n" if new_approval.comments else "")
                + f"\nCurrent status: {decision.status.value}\n\n"
                "Log in to the EDRP platform to view the full approval history.\n\n"
                "Best regards,\n"
                "The EDRP Team"
            ),
        )

    # 2. If still under review, email the next level's reviewers
    if decision.status == DecisionStatus.UNDER_REVIEW:
        next_role_after_commit = get_next_required_role(decision_id, db)
        if next_role_after_commit:
            next_reviewers = db.query(_User).filter(_User.role == next_role_after_commit).all()
            for reviewer in next_reviewers:
                send_email(
                    to_email=reviewer.email,
                    subject=f"[EDRP] Decision awaiting your review: {decision.title}",
                    body=(
                        f"Hi {reviewer.name},\n\n"
                        f"A decision has passed the previous review stage and now requires "
                        f"your review as {next_role_after_commit}.\n\n"
                        f"Title: {decision.title}\n\n"
                        "Please log in to the EDRP platform to review this decision.\n\n"
                        "Best regards,\n"
                        "The EDRP Team"
                    ),
                )

    return ApprovalOut(
        id=new_approval.id,
        decision_id=new_approval.decision_id,
        reviewer_id=new_approval.reviewer_id,
        reviewer_name=current_user.name,
        outcome=new_approval.outcome,
        comments=new_approval.comments,
        reviewed_at=new_approval.reviewed_at,
    )

# This endpoint allows a user to list all approvals for a specific decision.
@router.get("/{decision_id}/approvals", response_model=List[ApprovalOut])
def list_approvals(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    approvals = (
        db.query(Approval)
        .filter(Approval.decision_id == decision_id)
        .order_by(Approval.reviewed_at.asc())
        .all()
    )

    reviewer_ids = {a.reviewer_id for a in approvals}
    reviewers = db.query(User).filter(User.id.in_(reviewer_ids)).all()
    reviewer_names = {r.id: r.name for r in reviewers}

    return [
        ApprovalOut(
            id=a.id,
            decision_id=a.decision_id,
            reviewer_id=a.reviewer_id,
            reviewer_name=reviewer_names.get(a.reviewer_id, "Unknown"),
            outcome=a.outcome,
            comments=a.comments,
            reviewed_at=a.reviewed_at,
        )
        for a in approvals
    ]

