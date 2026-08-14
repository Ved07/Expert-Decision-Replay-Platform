import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getCurrentUser, getMyDecisions, getPendingReviewDecisions, getAdminStats,
} from "../services/api";
import AppHeader from "../components/AppHeader";
import RoleStamp from "../components/RoleStamp";
import StatusStamp from "../components/StatusStamp";
import SkeletonLoader from "../components/SkeletonLoader";
import MyTeamCard from "../components/MyTeamCard";
import SystemStatsBarChart from "../components/SystemStatsBarChart";
import DecisionStatusChart from "../components/DecisionStatusChart";
import "./Dashboard.css";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [myDecisions, setMyDecisions] = useState([]);
  const [pendingReview, setPendingReview] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
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
        setError(err.friendlyMessage || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        <AppHeader />
        <div className="dashboard-container">
          <div className="skeleton-page">
            <SkeletonLoader variant="card" count={1} />
            <SkeletonLoader variant="list" count={3} />
          </div>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="dashboard-page">
      <AppHeader />

      {error && (
        <div className="auth-error-banner" style={{ maxWidth: 800, margin: "20px auto 0" }}>
          <p className="auth-error-banner__text">{error}</p>
        </div>
      )}

      {user && (
        <div className="dashboard-container animate-fade-in">
          {/* ---- Greeting Banner & Profile summary ---- */}
          <section className="record-card dashboard-profile-banner">
            <div className="dashboard-profile-banner__main">
              <p className="record-card__eyebrow">
                {getGreeting()}, {user.name.split(" ")[0]} &bull; Record No. #{user.id}
              </p>
              <h1 className="record-card__title">{user.name}</h1>
              <div className="dashboard-profile-banner__fields">
                <div className="record-field">
                  <span className="record-field__label">Email</span>
                  <span className="record-field__value">{user.email}</span>
                </div>
                <div className="record-field">
                  <span className="record-field__label">Role</span>
                  <span className="record-field__value"><RoleStamp role={user.role} /></span>
                </div>
              </div>
            </div>
          </section>

          <div className="dashboard-grid">
            <div className="dashboard-grid__main">
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
                  
                  <div className="dashboard-charts-row">
                    <div className="chart-box">
                      <h3 className="chart-box__title">System Totals</h3>
                      <SystemStatsBarChart
                        totalUsers={adminStats.total_users}
                        totalTeams={adminStats.total_teams}
                        totalDecisions={adminStats.total_decisions}
                      />
                    </div>
                    <div className="chart-box">
                      <h3 className="chart-box__title">Decisions by Status</h3>
                      <DecisionStatusChart statusData={adminStats.decisions_by_status} />
                    </div>
                  </div>

                  <h3 className="chart-box__title" style={{ marginTop: 24 }}>Status Breakdown</h3>
                  <div className="status-breakdown">
                    {Object.entries(adminStats.decisions_by_status).map(([status, count]) => (
                      <Link
                        to={`/decisions?status=${encodeURIComponent(status)}`}
                        className="status-breakdown__row"
                        key={status}
                        style={{ textDecoration: "none" }}
                      >
                        <StatusStamp value={status} />
                        <span className="status-breakdown__count">{count} {count === 1 ? 'file' : 'files'}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="admin-actions-bar">
                    <Link to="/audit-log" className="btn-ghost-light">
                      View Full Audit Log
                    </Link>
                    <Link to="/users" className="btn-ghost-light">
                      Manage Users
                    </Link>
                    <Link to="/team" className="btn-ghost-light">
                      Manage Teams
                    </Link>
                  </div>
                </section>
              )}

              {/* ---- Pending My Review (Reviewer/Manager/Admin only) ---- */}
              {["Reviewer", "Manager", "Administrator"].includes(user.role) && (
                <section className="detail-section">
                  <div className="detail-section__header">
                    <h2 className="detail-section__title" style={{ border: "none", margin: 0, padding: 0 }}>
                      Pending My Review
                    </h2>
                    {pendingReview.length > 0 && (
                      <span className="detail-section__badge">{pendingReview.length} pending</span>
                    )}
                  </div>
                  {pendingReview.length === 0 ? (
                    <p className="detail-section__empty">Nothing awaiting your review right now.</p>
                  ) : (
                    <div className="mini-decision-list">
                      {pendingReview.map((d) => (
                        <Link to={`/decisions/${d.id}`} key={d.id} className="mini-decision-card mini-decision-card--pending">
                          <span className="mini-decision-card__id">FILE #{d.id}</span>
                          <span className="mini-decision-card__title">{d.title}</span>
                          <StatusStamp value={d.status} />
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ---- My Decisions (everyone) ---- */}
              <section className="detail-section">
                <div className="detail-section__header">
                  <h2 className="detail-section__title" style={{ border: "none", margin: 0, padding: 0 }}>
                    My Decisions
                  </h2>
                  <div className="detail-section__actions">
                    <Link to="/decisions/new" className="btn-ghost-light">+ New Decision</Link>
                    <Link to="/decisions" className="btn-ghost-light">View All</Link>
                  </div>
                </div>
                {myDecisions.length === 0 ? (
                  <p className="detail-section__empty">You haven't recorded any decisions yet.</p>
                ) : (
                  <div className="mini-decision-list">
                    {myDecisions.map((d) => (
                      <Link to={`/decisions/${d.id}`} key={d.id} className="mini-decision-card">
                        <span className="mini-decision-card__id">FILE #{d.id}</span>
                        <span className="mini-decision-card__title">{d.title}</span>
                        <StatusStamp value={d.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="dashboard-grid__sidebar">
              <MyTeamCard userRole={user.role} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;