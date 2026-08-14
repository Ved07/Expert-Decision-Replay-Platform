import io
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from openpyxl import Workbook

from auth import get_db, get_current_user
from models import User, Decision, DecisionStatus, Alternative, Approval, DecisionVersion
from schemas import DecisionCreate, DecisionUpdate, DecisionOut, DecisionVersionOut
from helpers import get_next_required_role, log_action, create_decision_version, notify_relevant_users, send_email

router = APIRouter(prefix="/decisions", tags=["Decisions"])


def attach_creator_name(decision, db) -> dict:
    """
    Decision doesn't store the creator's name directly (only created_by,
    a user ID) — this looks it up and returns a dict shaped like
    DecisionOut, ready to be returned directly from any endpoint.
    """
    creator = db.query(User).filter(User.id == decision.created_by).first()
    return {
        "id": decision.id,
        "title": decision.title,
        "problem_statement": decision.problem_statement,
        "status": decision.status,
        "created_by": decision.created_by,
        "creator_name": creator.name if creator else "Unknown",
        "created_at": decision.created_at,
        "updated_at": decision.updated_at,
    }


# ---------------- Core CRUD ----------------

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
        entity_id=new_decision.id,
        details=new_decision.title,
    )
    notify_relevant_users(
        db,
        decision=new_decision,
        event_type="decision_created",
        actor_id=current_user.id,
        details=f"New decision '{new_decision.title}' was created.",
        link=f"/decisions/{new_decision.id}"
    )
    db.commit()

    # Email all Reviewers about the new pending decision
    reviewers = db.query(User).filter(User.role == "Reviewer").all()
    for reviewer in reviewers:
        send_email(
            to_email=reviewer.email,
            subject=f"[EDRP] New decision pending your review: {new_decision.title}",
            body=(
                f"Hi {reviewer.name},\n\n"
                f"A new decision has been submitted and requires your review.\n\n"
                f"Title: {new_decision.title}\n"
                f"Submitted by: {current_user.name}\n\n"
                f"Please log in to the EDRP platform to review this decision.\n\n"
                "Best regards,\n"
                "The EDRP Team"
            ),
        )

    return attach_creator_name(new_decision, db)


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

    decisions = query.order_by(Decision.created_at.desc()).all()
    return [attach_creator_name(d, db) for d in decisions]


@router.get("/mine", response_model=List[DecisionOut])
def get_my_decisions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decisions = (
        db.query(Decision)
        .filter(Decision.created_by == current_user.id)
        .order_by(Decision.created_at.desc())
        .all()
    )
    return [attach_creator_name(d, db) for d in decisions]


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
    return [attach_creator_name(d, db) for d in pending]


@router.get("/export/excel")
def export_decisions_excel(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decisions = db.query(Decision).order_by(Decision.created_at.desc()).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Decisions"

    ws.append(["ID", "Title", "Status", "Problem Statement", "Created At"])

    for d in decisions:
        ws.append([
            d.id,
            d.title,
            d.status.value,
            d.problem_statement,
            d.created_at.strftime("%Y-%m-%d %H:%M") if d.created_at else "",
        ])

    for cell in ws[1]:
        cell.font = cell.font.copy(bold=True)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=decisions_export.xlsx"},
    )


@router.get("/{decision_id}", response_model=DecisionOut)
def get_decision(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return attach_creator_name(decision, db)


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

    old_status = decision.status

    for field, value in update_data.items():
        setattr(decision, field, value)

    if "status" in update_data and update_data["status"] != old_status:
        notify_relevant_users(
            db,
            decision=decision,
            event_type="decision_status_changed",
            actor_id=current_user.id,
            details=f"Decision '{decision.title}' status changed to {decision.status.value}.",
            link=f"/decisions/{decision.id}"
        )

    db.commit()
    db.refresh(decision)
    return attach_creator_name(decision, db)

from models import Comment, Alternative, Attachment, Approval, DecisionVersion
import os

UPLOAD_DIR = "uploads"


@router.delete("/{decision_id}", status_code=204)
def delete_decision(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if decision.created_by != current_user.id and current_user.role != "Administrator":
        raise HTTPException(status_code=403, detail="You can only delete decisions you created")

    # Remove the actual attachment files from disk before deleting their DB records
    attachments = db.query(Attachment).filter(Attachment.decision_id == decision_id).all()
    for attachment in attachments:
        file_path = os.path.join(UPLOAD_DIR, attachment.stored_filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    # Delete every child record that references this decision, in any order
    # (none of these reference each other, so order among them doesn't matter —
    # only that they all happen BEFORE the parent Decision is deleted)
    db.query(Comment).filter(Comment.decision_id == decision_id).delete()
    db.query(Alternative).filter(Alternative.decision_id == decision_id).delete()
    db.query(Attachment).filter(Attachment.decision_id == decision_id).delete()
    db.query(Approval).filter(Approval.decision_id == decision_id).delete()
    db.query(DecisionVersion).filter(DecisionVersion.decision_id == decision_id).delete()

    log_action(
        db,
        actor_id=current_user.id,
        action="decision_deleted",
        entity_type="Decision",
        entity_id=decision.id,
        details=decision.title,
    )

    db.delete(decision)
    db.commit()
    return None

# ---------------- Version history ----------------

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


# ---------------- Export ----------------

@router.get("/{decision_id}/export/pdf")
def export_decision_pdf(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    alternatives = db.query(Alternative).filter(Alternative.decision_id == decision_id).all()
    approvals = db.query(Approval).filter(Approval.decision_id == decision_id).all()

    buffer = io.BytesIO()
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Small", fontSize=9, textColor=colors.grey))

    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    story = []

    story.append(Paragraph(f"Decision Report — File #{decision.id}", styles["Title"]))
    story.append(Paragraph(decision.title, styles["Heading2"]))
    story.append(Paragraph(f"Status: {decision.status.value}", styles["Normal"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Problem Statement", styles["Heading3"]))
    story.append(Paragraph(decision.problem_statement, styles["Normal"]))
    story.append(Spacer(1, 16))

    if alternatives:
        story.append(Paragraph("Alternatives Considered", styles["Heading3"]))
        data = [["Title", "Pros", "Cons", "Cost"]]
        for alt in alternatives:
            data.append([alt.title, alt.pros or "-", alt.cons or "-", alt.estimated_cost or "-"])
        table = Table(data, colWidths=[4 * cm, 4 * cm, 4 * cm, 3 * cm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#12181F")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(table)
        story.append(Spacer(1, 16))

    if approvals:
        story.append(Paragraph("Approval History", styles["Heading3"]))
        for a in approvals:
            story.append(Paragraph(
                f"{a.outcome.value} — reviewed {a.reviewed_at.strftime('%Y-%m-%d %H:%M')}",
                styles["Normal"]
            ))
            if a.comments:
                story.append(Paragraph(a.comments, styles["Small"]))

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=decision_{decision.id}.pdf"},
    )

@router.post("/{decision_id}/versions/{version_id}/restore", response_model=DecisionOut)
def restore_decision_version(
    decision_id: int,
    version_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if decision.created_by != current_user.id and current_user.role != "Administrator":
        raise HTTPException(status_code=403, detail="You can only restore decisions you created")

    version = (
        db.query(DecisionVersion)
        .filter(DecisionVersion.id == version_id, DecisionVersion.decision_id == decision_id)
        .first()
    )
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Snapshot the CURRENT state before overwriting it — restoring is itself a change
    create_decision_version(db, decision, current_user.id)

    decision.title = version.title
    decision.problem_statement = version.problem_statement
    decision.status = version.status

    log_action(
        db,
        actor_id=current_user.id,
        action="decision_restored",
        entity_type="Decision",
        entity_id=decision.id,
        details=f"Restored to version {version.version_number}",
    )

    db.commit()
    db.refresh(decision)
    return attach_creator_name(decision, db)