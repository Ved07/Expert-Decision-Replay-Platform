import os
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session

# ---------------------------------------------------------------------------
# SMTP Email helper
# ---------------------------------------------------------------------------

def send_email(to_email: str, subject: str, body: str) -> None:
    """
    Send a plain-text email via SMTP in a background thread.

    Reads credentials from env vars set in .env:
      SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM

    Deliberately never raises — if the send fails the error is printed to
    the server log and the API call continues normally.
    """
    def _send():
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USERNAME", "")
        smtp_pass = os.getenv("SMTP_PASSWORD", "")
        smtp_from = os.getenv("SMTP_FROM", smtp_user)

        if not smtp_user or not smtp_pass or smtp_pass == "your-16-char-gmail-app-password":
            # Not configured yet — skip silently
            return

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"EDRP Platform <{smtp_from}>"
            msg["To"] = to_email
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_from, [to_email], msg.as_string())
        except Exception as exc:
            # Log but never raise — email failure must not affect the API
            print(f"[SMTP] Failed to send email to {to_email}: {exc}")

    threading.Thread(target=_send, daemon=True).start()


APPROVAL_LEVELS = ["Reviewer", "Manager", "Administrator"]



def get_next_required_role(decision_id: int, db: Session) -> str | None:
    """
    Looks at the approval history for a decision and figures out which
    role needs to review it next.

    Returns:
    - A role name (e.g. "Manager") if that level still needs to review it
    - None if the decision has either been rejected, or has passed
      through every level (fully approved)
    """
    from models import Approval, ApprovalDecision

    approvals = (
        db.query(Approval)
        .filter(Approval.decision_id == decision_id)
        .order_by(Approval.reviewed_at.asc())
        .all()
    )

    for approval in approvals:
        if approval.outcome == ApprovalDecision.REJECTED:
            return None  # rejected — no further review needed, it's finished

    levels_passed = len(approvals)

    if levels_passed >= len(APPROVAL_LEVELS):
        return None  # every level has signed off — fully approved

    return APPROVAL_LEVELS[levels_passed]


def build_team_detail(team, db: Session):
    """
    Builds a full TeamDetailOut for a given Team row: its members list
    and the manager's name (looked up separately, since Team only
    stores manager_id, not the manager's name directly).
    """
    from models import User
    from schemas import TeamDetailOut, TeamMemberOut

    members = db.query(User).filter(User.team_id == team.id).all()

    manager_name = None
    if team.manager_id:
        manager = db.query(User).filter(User.id == team.manager_id).first()
        manager_name = manager.name if manager else None

    return TeamDetailOut(
        id=team.id,
        name=team.name,
        manager_id=team.manager_id,
        manager_name=manager_name,
        members=[
            TeamMemberOut(id=m.id, name=m.name, email=m.email, role=m.role)
            for m in members
        ],
    )


def log_action(db, actor_id: int, action: str, entity_type: str, entity_id: int, details: str | None = None):
    """
    Records one audit entry. Call this from any endpoint right after
    a meaningful action succeeds — role changes, approvals, deletions, etc.
    Deliberately does NOT commit the session itself — it just adds the
    row, so it gets saved together with whatever else that endpoint is
    already committing (one transaction, one commit).
    """
    from models import AuditLog

    entry = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(entry)

def notify(db, user_id: int, message: str, link: str | None = None):
    """
    Creates a notification for a specific user. Like log_action, this
    does NOT commit — it just adds the row, so it's saved together
    with whatever else the calling endpoint is already committing.
    """
    from models import Notification

    note = Notification(user_id=user_id, message=message, link=link)
    db.add(note)

def create_decision_version(db, decision, changed_by_id: int):
    """
    Saves a snapshot of the decision's CURRENT state (before you apply
    new changes to it) as the next version number in its history.
    Call this right before modifying decision.title/problem_statement/status.
    """
    from models import DecisionVersion

    latest = (
        db.query(DecisionVersion)
        .filter(DecisionVersion.decision_id == decision.id)
        .order_by(DecisionVersion.version_number.desc())
        .first()
    )
    next_version = (latest.version_number + 1) if latest else 1

    snapshot = DecisionVersion(
        decision_id=decision.id,
        version_number=next_version,
        title=decision.title,
        problem_statement=decision.problem_statement,
        status=decision.status,
        changed_by=changed_by_id,
    )
    db.add(snapshot)

def notify_relevant_users(db: Session, decision, event_type: str, actor_id: int, details: str, link: str | None = None):
    """
    Dispatches notifications to all relevant users based on their role and relationship to the decision.
    Visibility rules:
    - Admin -> all events
    - Reviewer -> decisions pending review + approvals/rejections
    - Employer -> all decisions related to their organization (Manager of creator's team)
    - Employee -> decisions they created
    """
    from models import User, Team

    creator = db.query(User).filter(User.id == decision.created_by).first()
    manager_id = None
    if creator and creator.team_id:
        team = db.query(Team).filter(Team.id == creator.team_id).first()
        if team:
            manager_id = team.manager_id

    # Gather all users
    all_users = db.query(User).all()
    
    notified_user_ids = set()

    for u in all_users:
        if u.id == actor_id:
            continue  # Don't notify the person who took the action
        
        should_notify = False

        if u.role == "Administrator":
            should_notify = True
        elif u.role == "Manager" and u.id == manager_id:
            should_notify = True
        elif u.id == decision.created_by:
            should_notify = True
        elif u.role == "Reviewer":
            # Reviewers care about creation (needs review) and approvals/rejections
            if event_type in ("decision_created", "decision_approved", "decision_rejected", "decision_status_changed"):
                should_notify = True

        if should_notify and u.id not in notified_user_ids:
            notify(db, u.id, details, link)
            notified_user_ids.add(u.id)