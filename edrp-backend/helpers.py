import os
import smtplib
import threading
from typing import Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session

# ---------------------------------------------------------------------------
# SMTP Email helper with HTML + Plain Text support
# ---------------------------------------------------------------------------

def send_email(to_email: str, subject: str, body: str, html_body: str | None = None) -> None:
    """
    Send an email via SMTP in a background thread (supporting plain text and rich HTML).

    Reads credentials from env vars set in .env:
      SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM
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

            # Attach plain text fallback
            msg.attach(MIMEText(body, "plain", "utf-8"))

            # Attach HTML version if available
            if html_body:
                msg.attach(MIMEText(html_body, "html", "utf-8"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_from, [to_email], msg.as_string())
        except Exception as exc:
            # Log but never raise — email failure must not break API transaction
            print(f"[SMTP] Failed to send email to {to_email}: {exc}")

    threading.Thread(target=_send, daemon=True).start()


def build_decision_email_html(
    recipient_name: str,
    headline: str,
    decision_title: str,
    decision_id: int,
    status_label: str,
    status_color: str,
    actor_info: str | None = None,
    comments: str | None = None,
    next_step: str | None = None,
    action_url: str | None = None,
) -> str:
    """
    Generate a responsive, beautifully styled HTML email template for EDRP notifications.
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    target_link = action_url or f"{frontend_url}/decisions/{decision_id}"

    comments_section = ""
    if comments and comments.strip():
        comments_section = f"""
        <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Reviewer Comments & Feedback</p>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #1e293b; font-style: italic;">"{comments.strip()}"</p>
        </div>
        """

    actor_row = ""
    if actor_info:
        actor_row = f"""
        <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #64748b; width: 140px;">Action Taken By:</td>
            <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 600;">{actor_info}</td>
        </tr>
        """

    next_step_section = ""
    if next_step:
        next_step_section = f"""
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 16px; margin: 16px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #1e40af;">Next Required Action / Stage</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #1d4ed8;">{next_step}</p>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{headline}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
            <!-- Header Bar -->
            <tr>
                <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px 32px; text-align: left;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td>
                                <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">EDRP Platform</h1>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Expert Decision Replay Platform</p>
                            </td>
                            <td align="right">
                                <span style="background-color: {status_color}; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; letter-spacing: 0.5px; display: inline-block;">
                                    {status_label}
                                </span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- Content Body -->
            <tr>
                <td style="padding: 32px;">
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a;">Hello <strong>{recipient_name}</strong>,</p>
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.5;">{headline}</p>

                    <!-- Decision Details Card -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                        <tr>
                            <td style="padding: 6px 0; font-size: 14px; color: #64748b; width: 140px;">Decision ID:</td>
                            <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 600;">#{decision_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Decision Title:</td>
                            <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 600;">{decision_title}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Current Status:</td>
                            <td style="padding: 6px 0; font-size: 14px; color: {status_color}; font-weight: 700;">{status_label}</td>
                        </tr>
                        {actor_row}
                    </table>

                    {comments_section}
                    {next_step_section}

                    <!-- CTA Button -->
                    <div style="margin: 28px 0 16px 0; text-align: center;">
                        <a href="{target_link}" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);">
                            View Decision in EDRP &rarr;
                        </a>
                    </div>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td style="background-color: #f1f5f9; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                        This is an automated notification from the Expert Decision Replay Platform.
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


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
    and the manager's name.
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
    Creates an in-app notification for a specific user.
    """
    from models import Notification

    note = Notification(user_id=user_id, message=message, link=link)
    db.add(note)


def create_decision_version(db, decision, changed_by_id: int):
    """
    Saves a snapshot of the decision's CURRENT state as the next version number.
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
    Dispatches in-app notifications to all relevant users based on their role and relationship to the decision.
    """
    from models import User, Team

    creator = db.query(User).filter(User.id == decision.created_by).first()
    manager_id = None
    if creator and creator.team_id:
        team = db.query(Team).filter(Team.id == creator.team_id).first()
        if team:
            manager_id = team.manager_id

    all_users = db.query(User).all()
    notified_user_ids = set()

    for u in all_users:
        if u.id == actor_id:
            continue  # Don't notify the person who performed the action

        should_notify = False

        if u.role == "Administrator":
            should_notify = True
        elif u.role == "Manager" and u.id == manager_id:
            should_notify = True
        elif u.id == decision.created_by:
            should_notify = True
        elif u.role == "Reviewer":
            if event_type in ("decision_created", "decision_approved", "decision_rejected", "decision_status_changed"):
                should_notify = True

        if should_notify and u.id not in notified_user_ids:
            notify(db, u.id, details, link)
            notified_user_ids.add(u.id)


def dispatch_decision_event(
    db: Session,
    decision,
    event_type: str,
    actor: Any = None,
    comments: str | None = None,
    next_role: str | None = None,
):
    """
    Comprehensive multi-role notification and email dispatcher.
    Ensures:
      1. Employee (Creator) is automatically emailed with outcomes, reviewer notes, and next stages.
      2. Reviewers, Managers, and Admins are emailed & notified at their respective review gates.
      3. All relevant stakeholders receive real-time in-app notifications.
    """
    from models import User, Team, DecisionStatus

    creator = db.query(User).filter(User.id == decision.created_by).first()
    creator_name = creator.name if creator else "Employee"
    creator_email = creator.email if creator else None

    # Identify Manager of the creator's team
    manager = None
    if creator and creator.team_id:
        team = db.query(Team).filter(Team.id == creator.team_id).first()
        if team and team.manager_id:
            manager = db.query(User).filter(User.id == team.manager_id).first()

    actor_name = actor.name if actor else "System"
    actor_role = actor.role if actor else "Platform"
    actor_info = f"{actor_name} ({actor_role})" if actor else None
    actor_id = actor.id if actor else 0

    link = f"/decisions/{decision.id}"

    # -----------------------------------------------------------------------
    # 1. EVENT: DECISION CREATED (Submitted by Employee)
    # -----------------------------------------------------------------------
    if event_type == "decision_created":
        # In-app notifications
        notify_relevant_users(
            db,
            decision=decision,
            event_type="decision_created",
            actor_id=actor_id,
            details=f"New decision '{decision.title}' was submitted by {creator_name}.",
            link=link,
        )

        # Email to Employee (Creator) - Confirmation
        if creator_email:
            send_email(
                to_email=creator_email,
                subject=f"[EDRP] Decision Submitted: {decision.title}",
                body=(
                    f"Hi {creator_name},\n\n"
                    f"Your decision '{decision.title}' has been successfully recorded in the EDRP platform.\n\n"
                    f"Status: Under Review (Stage 1: Reviewer)\n"
                    f"It has been routed to the Reviewer team for initial assessment.\n\n"
                    f"You will be notified by email as reviewers evaluate your decision.\n\n"
                    "Best regards,\nThe EDRP Team"
                ),
                html_body=build_decision_email_html(
                    recipient_name=creator_name,
                    headline="Your decision has been submitted successfully and entered the approval workflow.",
                    decision_title=decision.title,
                    decision_id=decision.id,
                    status_label="Under Review",
                    status_color="#3b82f6",
                    actor_info=actor_info,
                    next_step="Stage 1 Review: Awaiting evaluation by a Reviewer.",
                ),
            )

        # Email to Reviewers - Stage 1 Action Required
        reviewers = db.query(User).filter(User.role == "Reviewer").all()
        for r in reviewers:
            if r.id != actor_id:
                send_email(
                    to_email=r.email,
                    subject=f"[EDRP] Action Required: Review Decision '{decision.title}'",
                    body=(
                        f"Hi {r.name},\n\n"
                        f"A new decision '{decision.title}' has been submitted by {creator_name} and is awaiting your review.\n\n"
                        f"Please log in to review the alternatives, criteria, and rationale.\n\n"
                        "Best regards,\nThe EDRP Team"
                    ),
                    html_body=build_decision_email_html(
                        recipient_name=r.name,
                        headline=f"A new decision has been submitted by <strong>{creator_name}</strong> and requires your review.",
                        decision_title=decision.title,
                        decision_id=decision.id,
                        status_label="Awaiting Review",
                        status_color="#3b82f6",
                        actor_info=f"Created by {creator_name}",
                        next_step="Please review the decision alternatives and submit your approval or feedback.",
                    ),
                )

        # Email to Manager (if creator has a manager)
        if manager and manager.id != actor_id:
            send_email(
                to_email=manager.email,
                subject=f"[EDRP] Team Update: {creator_name} created decision '{decision.title}'",
                body=(
                    f"Hi {manager.name},\n\n"
                    f"Team member {creator_name} submitted a new decision: '{decision.title}'.\n\n"
                    f"It is currently undergoing Stage 1 Reviewer evaluation and will route to you upon reviewer sign-off.\n\n"
                    "Best regards,\nThe EDRP Team"
                ),
                html_body=build_decision_email_html(
                    recipient_name=manager.name,
                    headline=f"Your team member <strong>{creator_name}</strong> has submitted a new decision.",
                    decision_title=decision.title,
                    decision_id=decision.id,
                    status_label="Under Review",
                    status_color="#3b82f6",
                    actor_info=f"Submitted by {creator_name}",
                    next_step="Currently undergoing Reviewer check. You will be notified when it reaches Manager review.",
                ),
            )

    # -----------------------------------------------------------------------
    # 2. EVENT: DECISION APPROVED (At Stage 1, Stage 2, or Final Stage)
    # -----------------------------------------------------------------------
    elif event_type == "decision_approved":
        is_fully_approved = decision.status == DecisionStatus.APPROVED

        status_text = "Fully Approved" if is_fully_approved else f"Approved ({actor_role} Stage)"
        status_color = "#10b981" if is_fully_approved else "#3b82f6"

        notify_relevant_users(
            db,
            decision=decision,
            event_type="decision_approved",
            actor_id=actor_id,
            details=f"Decision '{decision.title}' was approved by {actor_info}."
            + (f" Next required: {next_role}" if next_role else " (Fully Approved!)"),
            link=link,
        )

        # A. Email the Employee (Creator)
        if creator_email and creator.id != actor_id:
            headline_text = (
                f"🎉 Great news! Your decision <strong>'{decision.title}'</strong> has received final sign-off and is now <strong>Fully Approved</strong>."
                if is_fully_approved
                else f"Your decision <strong>'{decision.title}'</strong> was reviewed and <strong>Approved</strong> by {actor_info}."
            )
            next_step_desc = (
                "All approval stages are complete. The decision is recorded and active."
                if is_fully_approved
                else f"The decision now progresses to Stage: <strong>{next_role}</strong>."
            )

            send_email(
                to_email=creator_email,
                subject=f"[EDRP] Decision Update: '{decision.title}' Approved by {actor_role}",
                body=(
                    f"Hi {creator_name},\n\n"
                    f"Your decision '{decision.title}' was approved by {actor_info}.\n\n"
                    + (f"Reviewer Feedback: {comments}\n\n" if comments else "")
                    + f"Status: {status_text}\n"
                    + f"Next Step: {next_step_desc}\n\n"
                    "Best regards,\nThe EDRP Team"
                ),
                html_body=build_decision_email_html(
                    recipient_name=creator_name,
                    headline=headline_text,
                    decision_title=decision.title,
                    decision_id=decision.id,
                    status_label=status_text,
                    status_color=status_color,
                    actor_info=actor_info,
                    comments=comments,
                    next_step=next_step_desc,
                ),
            )

        # B. If advancing to the next stage, email the next group of approvers
        if next_role:
            next_users = db.query(User).filter(User.role == next_role).all()
            for u in next_users:
                if u.id != actor_id:
                    # In-app notification
                    notify(db, u.id, f"'{decision.title}' passed {actor_role} review and is awaiting your approval.", link)

                    # Email notification
                    send_email(
                        to_email=u.email,
                        subject=f"[EDRP] Action Required: Decision Awaiting Your Review: {decision.title}",
                        body=(
                            f"Hi {u.name},\n\n"
                            f"The decision '{decision.title}' (created by {creator_name}) has passed previous review by {actor_info} "
                            f"and now requires your review as {next_role}.\n\n"
                            + (f"Previous Reviewer Notes: {comments}\n\n" if comments else "")
                            + "Please log in to EDRP to review and submit your decision.\n\n"
                            "Best regards,\nThe EDRP Team"
                        ),
                        html_body=build_decision_email_html(
                            recipient_name=u.name,
                            headline=f"Decision '{decision.title}' has passed {actor_role} sign-off and now requires your review as <strong>{next_role}</strong>.",
                            decision_title=decision.title,
                            decision_id=decision.id,
                            status_label="Awaiting Your Review",
                            status_color="#3b82f6",
                            actor_info=f"Approved by {actor_info}",
                            comments=comments,
                            next_step=f"Please review the decision details and submit your {next_role} approval or feedback.",
                        ),
                    )

        # C. If fully approved, notify Manager and Admin for their records
        if is_fully_approved:
            if manager and manager.id != actor_id and manager.id != creator.id:
                send_email(
                    to_email=manager.email,
                    subject=f"[EDRP] Team Decision Fully Approved: {decision.title}",
                    body=(
                        f"Hi {manager.name},\n\n"
                        f"Decision '{decision.title}' by {creator_name} has successfully passed all approval stages and is now Fully Approved.\n\n"
                        "Best regards,\nThe EDRP Team"
                    ),
                    html_body=build_decision_email_html(
                        recipient_name=manager.name,
                        headline=f"Team member <strong>{creator_name}</strong>'s decision has been <strong>Fully Approved</strong> across all workflow stages.",
                        decision_title=decision.title,
                        decision_id=decision.id,
                        status_label="Fully Approved",
                        status_color="#10b981",
                        actor_info=actor_info,
                        comments=comments,
                        next_step="Decision is archived as approved and active.",
                    ),
                )

    # -----------------------------------------------------------------------
    # 3. EVENT: DECISION REJECTED
    # -----------------------------------------------------------------------
    elif event_type == "decision_rejected":
        notify_relevant_users(
            db,
            decision=decision,
            event_type="decision_rejected",
            actor_id=actor_id,
            details=f"Decision '{decision.title}' was rejected by {actor_info}.",
            link=link,
        )

        # Email to Employee (Creator)
        if creator_email and creator.id != actor_id:
            send_email(
                to_email=creator_email,
                subject=f"[EDRP] Decision Update: '{decision.title}' Rejected by {actor_role}",
                body=(
                    f"Hi {creator_name},\n\n"
                    f"Your decision '{decision.title}' was reviewed by {actor_info} and marked as Rejected.\n\n"
                    + (f"Reason / Feedback: {comments}\n\n" if comments else "")
                    + "You can review the feedback on the platform and submit a revised version if needed.\n\n"
                    "Best regards,\nThe EDRP Team"
                ),
                html_body=build_decision_email_html(
                    recipient_name=creator_name,
                    headline=f"Your decision <strong>'{decision.title}'</strong> was reviewed by {actor_info} and was <strong>Rejected</strong>.",
                    decision_title=decision.title,
                    decision_id=decision.id,
                    status_label="Rejected",
                    status_color="#ef4444",
                    actor_info=actor_info,
                    comments=comments,
                    next_step="You may review the feedback comments and make adjustments or create a revised decision.",
                ),
            )

        # Email to Manager
        if manager and manager.id != actor_id and manager.id != creator.id:
            send_email(
                to_email=manager.email,
                subject=f"[EDRP] Team Notice: '{decision.title}' Rejected by {actor_role}",
                body=(
                    f"Hi {manager.name},\n\n"
                    f"Decision '{decision.title}' by {creator_name} was rejected by {actor_info}.\n\n"
                    + (f"Comments: {comments}\n\n" if comments else "")
                    + "Best regards,\nThe EDRP Team"
                ),
                html_body=build_decision_email_html(
                    recipient_name=manager.name,
                    headline=f"Decision '{decision.title}' (submitted by <strong>{creator_name}</strong>) was rejected by {actor_info}.",
                    decision_title=decision.title,
                    decision_id=decision.id,
                    status_label="Rejected",
                    status_color="#ef4444",
                    actor_info=actor_info,
                    comments=comments,
                ),
            )