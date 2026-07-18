import { Link, useNavigate } from "react-router-dom";
import { logout } from "../services/api";
import NotificationBell from "./NotificationBell";

function AppHeader({ backTo, backLabel }) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="dashboard-header">
      <Link to="/dashboard" className="dashboard-header__brand" style={{ textDecoration: "none" }}>
        Expert Decision Replay Platform
      </Link>
      <div className="dashboard-header__actions">
        <div className="dashboard-header__actions">
          <NotificationBell />
          {backTo && (
            <button className="btn-ghost" onClick={() => navigate(backTo)}>
              {backLabel || "Back"}
            </button>
          )}
          <Link to="/dashboard" className="btn-ghost" style={{ textDecoration: "none" }}>
            Dashboard
          </Link>
          <button className="btn-ghost" onClick={handleLogout}>
            Log Out
          </button>
        </div>
        {backTo && (
          <button className="btn-ghost" onClick={() => navigate(backTo)}>
            {backLabel || "Back"}
          </button>
        )}
        <Link to="/dashboard" className="btn-ghost" style={{ textDecoration: "none" }}>
          Dashboard
        </Link>
        <button className="btn-ghost" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </header>
  );
}

export default AppHeader;