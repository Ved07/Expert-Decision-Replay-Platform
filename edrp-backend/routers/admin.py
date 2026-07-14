from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc

from auth import get_db, require_admin
from models import User, Team, Decision

router = APIRouter(prefix="/admin", tags=["Admin"])

# This endpoint is for admin users to get some basic statistics about the system.
@router.get("/stats")
def get_admin_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(User).count()
    total_decisions = db.query(Decision).count()
    total_teams = db.query(Team).count()

    status_counts = (
        db.query(Decision.status, sqlfunc.count(Decision.id))
        .group_by(Decision.status)
        .all()
    )

    return {
        "total_users": total_users,
        "total_decisions": total_decisions,
        "total_teams": total_teams,
        "decisions_by_status": {status.value: count for status, count in status_counts},
    }
