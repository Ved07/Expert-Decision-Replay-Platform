from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_db, require_admin
from models import User, AuditLog

router = APIRouter(prefix="/audit-logs", tags=["Audit"])


@router.get("")
def list_audit_logs(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()

    actor_ids = {log.actor_id for log in logs}
    actors = db.query(User).filter(User.id.in_(actor_ids)).all()
    actor_names = {a.id: a.name for a in actors}

    return [
        {
            "id": log.id,
            "actor_name": actor_names.get(log.actor_id, "Unknown"),
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at,
        }
        for log in logs
    ]