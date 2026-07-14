from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_db, get_current_user
from models import User, Decision, DecisionStatus
from schemas import DecisionCreate, DecisionUpdate, DecisionOut
from helpers import get_next_required_role

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
    return new_decision

# This endpoint allows a user to list all decisions.
@router.get("", response_model=List[DecisionOut])
def list_decisions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Decision).order_by(Decision.created_at.desc()).all()

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

    update_data = payload.model_dump(exclude_unset=True)
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
