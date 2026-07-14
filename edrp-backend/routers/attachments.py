import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from auth import get_db, get_current_user
from models import User, Decision, Attachment
from schemas import AttachmentOut

router = APIRouter(tags=["Attachments"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 
@router.post("/decisions/{decision_id}/attachments", response_model=AttachmentOut, status_code=201)
async def upload_attachment(
    decision_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    file_extension = os.path.splitext(file.filename)[1]
    stored_name = f"{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, stored_name)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    new_attachment = Attachment(
        decision_id=decision_id,
        original_filename=file.filename,
        stored_filename=stored_name,
        uploaded_by=current_user.id,
    )
    db.add(new_attachment)
    db.commit()
    db.refresh(new_attachment)
    return new_attachment

# 
@router.get("/decisions/{decision_id}/attachments", response_model=List[AttachmentOut])
def list_attachments(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Attachment).filter(Attachment.decision_id == decision_id).all()

# 
@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    file_path = os.path.join(UPLOAD_DIR, attachment.stored_filename)
    return FileResponse(
        path=file_path,
        filename=attachment.original_filename,
    )

# 
@router.delete("/attachments/{attachment_id}", status_code=204)
def delete_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if attachment.uploaded_by != current_user.id and current_user.role != "Administrator":
        raise HTTPException(status_code=403, detail="You can only delete your own uploads")

    file_path = os.path.join(UPLOAD_DIR, attachment.stored_filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(attachment)
    db.commit()
    return None
