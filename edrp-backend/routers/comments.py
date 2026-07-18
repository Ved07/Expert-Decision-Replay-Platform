from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_db, get_current_user
from models import User, Decision, Comment
from schemas import CommentCreate, CommentOut

router = APIRouter(prefix="/decisions", tags=["Comments"])

# This endpoint allows a user to create a new comment for a specific decision.
@router.post("/{decision_id}/comments", response_model=CommentOut, status_code=201)
def create_comment(
    decision_id: int,
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    new_comment = Comment(
        decision_id=decision_id,
        author_id=current_user.id,
        content=payload.content,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return CommentOut(
        id=new_comment.id,
        decision_id=new_comment.decision_id,
        author_id=new_comment.author_id,
        author_name=current_user.name,
        content=new_comment.content,
        created_at=new_comment.created_at,
    )

# This endpoint allows a user to list all comments for a specific decision.
@router.get("/{decision_id}/comments", response_model=List[CommentOut])
def list_comments(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comments = (
        db.query(Comment)
        .filter(Comment.decision_id == decision_id)
        .order_by(Comment.created_at.asc())
        .all()
    )

    author_ids = {c.author_id for c in comments}
    authors = db.query(User).filter(User.id.in_(author_ids)).all()
    author_names = {a.id: a.name for a in authors}

    return [
        CommentOut(
            id=c.id,
            decision_id=c.decision_id,
            author_id=c.author_id,
            author_name=author_names.get(c.author_id, "Unknown"),
            content="[deleted]" if c.is_deleted else c.content,
            created_at=c.created_at,
        )
        for c in comments
    ]

from helpers import log_action
router1 = APIRouter(prefix="", tags=["Comments"])
@router1.delete("/comments/{comment_id}",status_code=204)
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.author_id != current_user.id and current_user.role != "Administrator":
        raise HTTPException(status_code=403, detail="You can only delete your own comments")

    comment.is_deleted = True  # soft delete — the row stays, just marked

    log_action(
        db,
        actor_id=current_user.id,
        action="comment_deleted",
        entity_type="Comment",
        entity_id=comment.id,
        details=comment.content[:100],  # keep a snippet for audit context
    )

    db.commit()
    return None