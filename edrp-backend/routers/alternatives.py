from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_db, get_current_user
from models import User, Decision, Alternative
from schemas import AlternativeCreate, AlternativeOut

router = APIRouter(prefix="/decisions", tags=["Alternatives"])

# This endpoint allows a user to create a new alternative for a specific decision.
@router.post("/{decision_id}/alternatives", response_model=AlternativeOut, status_code=201)
def create_alternative(
    decision_id: int,
    payload: AlternativeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    new_alt = Alternative(decision_id=decision_id, **payload.model_dump())
    db.add(new_alt)
    db.commit()
    db.refresh(new_alt)
    return new_alt

# This endpoint allows a user to list all alternatives for a specific decision.
@router.get("/{decision_id}/alternatives", response_model=List[AlternativeOut])
def list_alternatives(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    return db.query(Alternative).filter(Alternative.decision_id == decision_id).all()
