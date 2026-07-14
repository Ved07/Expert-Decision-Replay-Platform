from sqlalchemy.orm import Session

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
