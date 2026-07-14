from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_db, get_current_user, require_admin
from models import User, Team
from schemas import TeamCreate, TeamOut, TeamUpdate, TeamDetailOut
from helpers import build_team_detail

router = APIRouter(prefix="/teams", tags=["Teams"])


@router.post("", response_model=TeamOut)
def create_team(
    team: TeamCreate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    new_team = Team(name=team.name, manager_id=team.manager_id)
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return new_team


@router.get("", response_model=List[TeamOut])
def list_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Team).all()


@router.get("/mine", response_model=TeamDetailOut)
def get_my_team(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    team = None

    if current_user.role == "Manager":
        team = db.query(Team).filter(Team.manager_id == current_user.id).first()

    if not team and current_user.team_id:
        team = db.query(Team).filter(Team.id == current_user.team_id).first()

    if not team:
        raise HTTPException(status_code=404, detail="You are not assigned to a team yet")

    return build_team_detail(team, db)


@router.patch("/{team_id}", response_model=TeamDetailOut)
def update_team(
    team_id: int,
    payload: TeamUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)

    db.commit()
    db.refresh(team)
    return build_team_detail(team, db)


@router.delete("/{team_id}", status_code=204)
def delete_team(
    team_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    db.query(User).filter(User.team_id == team_id).update({User.team_id: None})

    db.delete(team)
    db.commit()
    return None


@router.get("/{team_id}", response_model=TeamDetailOut)
def get_team_detail(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return build_team_detail(team, db)
