import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getCurrentUser, getMyDecisions, getPendingReviewDecisions, getAdminStats,
} from "../services/api";
import AppHeader from "../components/AppHeader";
import RoleStamp from "../components/RoleStamp";
import StatusStamp from "../components/StatusStamp";
import "./Dashboard.css";
import MyTeamCard from "../components/MyTeamCard";


function Dashboard() {
  const [user, setUser] = useState(null);
  const [myDecisions, setMyDecisions] = useState([]);
  const [pendingReview, setPendingReview] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const userData = await getCurrentUser();
        setUser(userData);

        // Always relevant, regardless of role
        const mine = await getMyDecisions();
        setMyDecisions(mine);

        // Only Reviewer/Manager/Administrator will get anything meaningful back here
        if (["Reviewer", "Manager", "Administrator"].includes(userData.role)) {
          const pending = await getPendingReviewDecisions();
          setPendingReview(pending);
        }

        // Only Administrators are allowed to call this at all
        if (userData.role === "Administrator") {
          const stats = await getAdminStats();
          setAdminStats(stats);
        }
      } catch (err) {
        setError(err.friendlyMessage);
      }
    }

    loadDashboard();
  }, []);

  if (!user && !error) {
    return <p style={{ padding: 40, color: "var(--line)" }}>Loading dashboard...</p>;
  }

  return (
    <div className="dashboard-page">
      <AppHeader />

      {error && (
        <p className="form-error" style={{ textAlign: "center", padding: "12px 0", margin: 0 }}>
          {error}
        </p>
      )}

      {user && (
        <div className="dashboard-container">

          {/* ---- Profile summary ---- */}
          <div className="record-card">
            <p className="record-card__eyebrow">Record No. {user.id}</p>
            <h1 className="record-card__title">{user.name}</h1>
            <div className="record-field">
              <span className="record-field__label">Email</span>
              <span className="record-field__value">{user.email}</span>
            </div>
            <div className="record-field">
              <span className="record-field__label">Role</span>
              <span className="record-field__value"><RoleStamp role={user.role} /></span>
            </div>
          </div>

          {/* ---- Admin Stats (Administrator only) ---- */}
          {adminStats && (
            <section className="detail-section">
              <h2 className="detail-section__title">System Overview</h2>
              <div className="stats-grid">
                <Link to="/users" className="stat-box stat-box--clickable">
                  <span className="stat-box__value">{adminStats.total_users}</span>
                  <span className="stat-box__label">Users</span>
                </Link>
                <Link to="/team" className="stat-box stat-box--clickable">
                  <span className="stat-box__value">{adminStats.total_teams}</span>
                  <span className="stat-box__label">Teams</span>
                </Link>
                <Link to="/decisions" className="stat-box stat-box--clickable">
                  <span className="stat-box__value">{adminStats.total_decisions}</span>
                  <span className="stat-box__label">Decisions</span>
                </Link>
              </div>

              <div className="status-breakdown">
                {Object.entries(adminStats.decisions_by_status).map(([status, count]) => (
                  <Link
                    to={`/decisions?status=${encodeURIComponent(status)}`}
                    className="status-breakdown__row"
                    key={status}
                    style={{ textDecoration: "none" }}
                  >
                    <StatusStamp value={status} />
                    <span className="status-breakdown__count">{count}</span>
                  </Link>
                ))}
              </div>
              <Link to="/audit-log" className="btn-ghost-light" style={{ display: "inline-block", marginTop: 16 }}>
                View Full Audit Log
              </Link>
              <Link to="/users" className="btn-ghost-light" style={{ display: "inline-block", marginTop: 16, marginLeft: 12 }}>
              Manage Users
            </Link>
            </section>
          )}

          {/* ---- Pending My Review (Reviewer/Manager/Admin only) ---- */}
          {["Reviewer", "Manager", "Administrator"].includes(user.role) && (
            <section className="detail-section">
              <h2 className="detail-section__title">Pending My Review</h2>
              {pendingReview.length === 0 && (
                <p className="detail-section__empty">Nothing awaiting your review right now.</p>
              )}
              <div className="mini-decision-list">
                {pendingReview.map((d) => (
                  <Link to={`/decisions/${d.id}`} key={d.id} className="mini-decision-card">
                    <span className="mini-decision-card__id">File #{d.id}</span>
                    <span className="mini-decision-card__title">{d.title}</span>
                    <StatusStamp value={d.status} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ---- My Decisions (everyone) ---- */}
          <section className="detail-section">
            <div className="detail-section__header">
              <h2 className="detail-section__title" style={{ border: "none", margin: 0, padding: 0 }}>
                My Decisions
              </h2>
              <Link to="/decisions" className="btn-ghost-light">View All Decisions</Link>
            </div>
            {myDecisions.length === 0 && (
              <p className="detail-section__empty">You haven't recorded any decisions yet.</p>
            )}
            <div className="mini-decision-list">
              {myDecisions.map((d) => (
                <Link to={`/decisions/${d.id}`} key={d.id} className="mini-decision-card">
                  <span className="mini-decision-card__id">File #{d.id}</span>
                  <span className="mini-decision-card__title">{d.title}</span>
                  <StatusStamp value={d.status} />
                </Link>
              ))}
            </div>
          </section>

          <MyTeamCard userRole={user.role} />

        </div>
      )}
    </div>
  );
}

export default Dashboard;