from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_db, get_current_user, require_admin
from models import User, Team
from schemas import TeamCreate, TeamOut, TeamUpdate, TeamDetailOut
from helpers import build_team_detail

router = APIRouter(prefix="/teams", tags=["Teams"])


@router.post(
    "",
    response_model=TeamOut,
    summary="Create a team",
    description="Create a new team record and optionally assign an initial manager.",
    response_description="Team created successfully.",
    status_code=201,
)
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


@router.get(
    "",
    response_model=List[TeamOut],
    summary="List all teams",
    description="Fetch all available team definitions for organization-level management and visibility.",
    response_description="Team list retrieved successfully.",
    status_code=200,
)
def list_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Team).all()


@router.get(
    "/mine",
    response_model=TeamDetailOut,
    summary="Get my team",
    description="Return the team that the authenticated user belongs to or manages, including team member details.",
    response_description="Team profile retrieved successfully.",
    status_code=200,
)
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


@router.patch(
    "/{team_id}",
    response_model=TeamDetailOut,
    summary="Update a team",
    description="Modify team metadata, including manager assignment, for an existing team record.",
    response_description="Team updated successfully.",
    status_code=200,
)
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


@router.delete(
    "/{team_id}",
    summary="Delete a team",
    description="Delete a team after first removing member team assignments, preserving the integrity of the organization model.",
    response_description="Team deleted successfully.",
    status_code=204,
)
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


@router.get(
    "/{team_id}",
    response_model=TeamDetailOut,
    summary="Get team details",
    description="Retrieve a detailed view of a specific team, including manager information and current members.",
    response_description="Team details retrieved successfully.",
    status_code=200,
)
def get_team_detail(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return build_team_detail(team, db)
