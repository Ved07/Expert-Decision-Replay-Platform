import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole } from "../services/api";
import AppHeader from "../components/AppHeader";
import RoleStamp from "../components/RoleStamp";
import "./UserManagement.css";

const ROLES = ["Employee", "Reviewer", "Manager", "Administrator"];

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleRoleChange(userId, newRole) {
    try {
      await updateUserRole(userId, newRole);
      loadUsers();
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  return (
    <div className="decision-detail-page">
      <AppHeader backTo="/dashboard" backLabel="Back to Dashboard" />

      <div className="decision-detail-container">
        <div className="record-card">
          <p className="record-card__eyebrow">Administrator View</p>
          <h1 className="record-card__title">Manage Users</h1>
        </div>

        {error && <p className="form-error" style={{ textAlign: "center" }}>{error}</p>}

        <section className="detail-section">
          <div className="user-mgmt-table">
            <div className="user-mgmt-row user-mgmt-row--header">
              <span>Name</span>
              <span>Email</span>
              <span>Current Role</span>
              <span>Change Role</span>
            </div>
            {users.map((u) => (
              <div className="user-mgmt-row" key={u.id}>
                <span>{u.name}</span>
                <span className="user-mgmt-email">{u.email}</span>
                <span><RoleStamp role={u.role} /></span>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default UserManagement;