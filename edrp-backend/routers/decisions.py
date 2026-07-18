from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_db, get_current_user
from models import User, Decision, DecisionStatus
from schemas import DecisionCreate, DecisionUpdate, DecisionOut
from helpers import get_next_required_role
from helpers import log_action
from fastapi import Query
from helpers import create_decision_version
from models import DecisionVersion
from schemas import DecisionVersionOut


router = APIRouter(prefix="/decisions", tags=["Decisions"])

# This endpoint allows a user to create a new decision.
@router.post("", response_model=DecisionOut, status_code=201)
def create_decision(
    payload: DecisionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_decision = Decision(
        title=payload.title,
        problem_statement=payload.problem_statement,
        created_by=current_user.id,
    )
    db.add(new_decision)

    
    db.commit()
    db.refresh(new_decision)
    log_action(
        db,
        actor_id=current_user.id,
        action="decision_created",
        entity_type="Decision",
        entity_id=new_decision.id,  # careful: available only after db.flush(), see note below
        details=new_decision.title,
    )
    db.commit()
    return new_decision

# This endpoint allows a user to list all decisions.

@router.get("", response_model=List[DecisionOut])
def list_decisions(
    search: str | None = Query(None),
    status_filter: DecisionStatus | None = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Decision)

    if search:
        query = query.filter(Decision.title.ilike(f"%{search}%"))

    if status_filter:
        query = query.filter(Decision.status == status_filter)

    return query.order_by(Decision.created_at.desc()).all()

# This endpoint allows a user to list their own decisions.
@router.get("/mine", response_model=List[DecisionOut])
def get_my_decisions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Decision)
        .filter(Decision.created_by == current_user.id)
        .order_by(Decision.created_at.desc())
        .all()
    )

# This endpoint allows a user to list all decisions that are pending their review.
@router.get("/pending-review", response_model=List[DecisionOut])
def get_pending_review_decisions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("Reviewer", "Manager", "Administrator"):
        return []

    under_review = (
        db.query(Decision)
        .filter(Decision.status == DecisionStatus.UNDER_REVIEW)
        .all()
    )

    pending = [
        d for d in under_review
        if get_next_required_role(d.id, db) == current_user.role
    ]
    return pending

# This endpoint allows a user to retrieve a specific decision.
@router.get("/{decision_id}", response_model=DecisionOut)
def get_decision(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision

# This endpoint allows a user to update a specific decision.

@router.patch("/{decision_id}", response_model=DecisionOut)
def update_decision(
    decision_id: int,
    payload: DecisionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if decision.created_by != current_user.id and current_user.role != "Administrator":
        raise HTTPException(status_code=403, detail="You can only edit decisions you created")

    update_data = payload.model_dump(exclude_unset=True)

    if update_data:
        create_decision_version(db, decision, current_user.id)

    for field, value in update_data.items():
        setattr(decision, field, value)

    db.commit()
    db.refresh(decision)
    return decision

# This endpoint allows a user to delete a specific decision.
@router.delete("/{decision_id}", status_code=204)
def delete_decision(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    db.delete(decision)
    db.commit()
    return None



@router.get("/{decision_id}/versions", response_model=List[DecisionVersionOut])
def list_decision_versions(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    versions = (
        db.query(DecisionVersion)
        .filter(DecisionVersion.decision_id == decision_id)
        .order_by(DecisionVersion.version_number.desc())
        .all()
    )

    changer_ids = {v.changed_by for v in versions}
    changers = db.query(User).filter(User.id.in_(changer_ids)).all()
    changer_names = {c.id: c.name for c in changers}

    return [
        DecisionVersionOut(
            id=v.id,
            version_number=v.version_number,
            title=v.title,
            problem_statement=v.problem_statement,
            status=v.status,
            changed_by=v.changed_by,
            changed_by_name=changer_names.get(v.changed_by, "Unknown"),
            created_at=v.created_at,
        )
        for v in versions
    ]


