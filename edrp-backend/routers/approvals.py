from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_db, get_current_user
from models import User, Decision, DecisionStatus, Approval, ApprovalDecision
from schemas import ApprovalCreate, ApprovalOut
from helpers import get_next_required_role, APPROVAL_LEVELS

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

    db.commit()
    db.refresh(new_approval)

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
