import "./RoleStamp.css";

const ROLE_STYLES = {
  Employee: { color: "var(--ink)", label: "EMPLOYEE" },
  Reviewer: { color: "var(--brass)", label: "REVIEWER" },
  Manager: { color: "var(--stamp-green)", label: "MANAGER" },
  Administrator: { color: "var(--stamp-red)", label: "ADMIN" },
};

function RoleStamp({ role }) {
  const style = ROLE_STYLES[role] || ROLE_STYLES.Employee;

  return (
    <span className="role-stamp" style={{ borderColor: style.color, color: style.color }}>
      {style.label}
    </span>
  );
}

export default RoleStamp;