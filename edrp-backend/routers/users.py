from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_db, get_current_user, require_admin
from models import User, Team
from schemas import UserOut

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
    }


@router.get("/unassigned", response_model=List[UserOut])
def list_unassigned_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("Administrator", "Manager"):
        raise HTTPException(status_code=403, detail="Not authorized to view this")

    return db.query(User).filter(User.team_id.is_(None)).all()


@router.get("")
def list_users(admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for u in users:
        result.append({"id": u.id, "name": u.name, "email": u.email, "role": u.role})
    return result


@router.patch("/{user_id}/role")
def update_role(
    user_id: int,
    new_role: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = new_role
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "role": user.role}


@router.patch("/{user_id}/team")
def assign_user_to_team(
    user_id: int,
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    is_admin = current_user.role == "Administrator"
    is_this_teams_manager = team.manager_id == current_user.id

    if not (is_admin or is_this_teams_manager):
        raise HTTPException(
            status_code=403,
            detail="Only an Administrator, or this team's manager, can add members",
        )

    user.team_id = team_id
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "team_id": user.team_id}


@router.delete("/{user_id}/team", status_code=204)
def remove_user_from_team(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.team_id:
        raise HTTPException(status_code=400, detail="This user is not part of any team")

    team = db.query(Team).filter(Team.id == user.team_id).first()

    is_admin = current_user.role == "Administrator"
    is_this_teams_manager = team and team.manager_id == current_user.id

    if not (is_admin or is_this_teams_manager):
        raise HTTPException(
            status_code=403,
            detail="Only an Administrator, or this team's manager, can remove members",
        )

    user.team_id = None
    db.commit()
    return None

from helpers import log_action

@router.patch("/{user_id}/role")
def update_role(
    user_id: int,
    new_role: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = user.role
    user.role = new_role

    log_action(
        db,
        actor_id=admin_user.id,
        action="role_changed",
        entity_type="User",
        entity_id=user.id,
        details=f"Role changed from {old_role} to {new_role}",
    )

    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "role": user.role}