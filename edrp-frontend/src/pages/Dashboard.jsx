import { useState, useEffect } from "react";
import { getCurrentUser, logout } from "../services/api";
import RoleStamp from "../components/RoleStamp";
import "./Dashboard.css";
import { Link } from "react-router-dom";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await getCurrentUser();
        setUser(data);
      } catch (err) {
        setError("Could not load profile. Please log in again.");
      }
    }
    fetchUser();
  }, []);

  function handleLogout() {
    logout();
    window.location.href = "/login";
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <span className="dashboard-header__brand">Expert Decision Replay Platform</span>
        <button className="btn-ghost" onClick={handleLogout}>Log Out</button>
      </header>

      {error && <p className="form-error" style={{ textAlign: "center", marginTop: 40 }}>{error}</p>}

      {!error && !user && (
        <p style={{ textAlign: "center", marginTop: 40, color: "var(--line)" }}>Loading record...</p>
      )}

      {user && (
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
          <Link to="/decisions" className="btn-primary" style={{ display: "inline-block", textAlign: "center", textDecoration: "none", marginTop: 8 }}>
  View Decisions
</Link>
        </div>
      )}
    </div>
  );
}

export default Dashboard;