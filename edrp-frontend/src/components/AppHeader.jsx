import { Link, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../services/api";
import NotificationBell from "./NotificationBell";

function AppHeader({ backTo, backLabel }) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const isDashboardActive = location.pathname === "/dashboard";
  const isDecisionsActive = location.pathname.startsWith("/decisions");

  return (
    <header className="dashboard-header">
      <Link to="/" className="dashboard-header__brand" aria-label="Expert Decision Replay Platform Dashboard">
        <span className="dashboard-header__brand-mark">⬡</span>
        <span className="dashboard-header__brand-text">Expert Decision Replay Platform</span>
      </Link>

      <nav className="dashboard-header__actions" aria-label="Header Navigation">
        <NotificationBell />
        
        {backTo && (
          <button className="btn-ghost" onClick={() => navigate(backTo)}>
            ← {backLabel || "Back"}
          </button>
        )}

        <Link
          to="/dashboard"
          className={`btn-ghost ${isDashboardActive ? "btn-ghost--active" : ""}`}
          aria-current={isDashboardActive ? "page" : undefined}
        >
          Dashboard
        </Link>

        <Link
          to="/decisions"
          className={`btn-ghost ${isDecisionsActive ? "btn-ghost--active" : ""}`}
          aria-current={isDecisionsActive ? "page" : undefined}
        >
          Decisions
        </Link>

        <button className="btn-ghost btn-ghost--logout" onClick={handleLogout}>
          Log Out
        </button>
      </nav>
    </header>
  );
}

export default AppHeader;