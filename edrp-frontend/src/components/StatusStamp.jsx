import "./RoleStamp.css";

const STATUS_STYLES = {
  Employee: { color: "var(--ink)", label: "EMPLOYEE" },
  Reviewer: { color: "var(--brass)", label: "REVIEWER" },
  Manager: { color: "var(--stamp-green)", label: "MANAGER" },
  Administrator: { color: "var(--stamp-red)", label: "ADMIN" },

  Draft: { color: "var(--text-muted)", label: "DRAFT" },
  "Under Review": { color: "var(--brass)", label: "UNDER REVIEW" },
  Approved: { color: "var(--stamp-green)", label: "APPROVED" },
  Rejected: { color: "var(--stamp-red)", label: "REJECTED" },
  Archived: { color: "var(--text-muted)", label: "ARCHIVED" },
};

function StatusStamp({ value }) {
  const style = STATUS_STYLES[value] || { color: "var(--ink)", label: value };

  return (
    <span className="role-stamp" style={{ borderColor: style.color, color: style.color }}>
      {style.label}
    </span>
  );
}

export default StatusStamp;