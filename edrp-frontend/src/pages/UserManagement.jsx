import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole } from "../services/api";
import AppHeader from "../components/AppHeader";
import RoleStamp from "../components/RoleStamp";
import SkeletonLoader from "../components/SkeletonLoader";
import "./UserManagement.css";

const ROLES = ["Employee", "Reviewer", "Manager", "Administrator"];

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      setError("");
    } catch (err) {
      setError(err.friendlyMessage || "Failed to load user directory.");
    } finally {
      setLoading(false);
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

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="decision-detail-page">
      <AppHeader backTo="/dashboard" backLabel="Back to Dashboard" />

      <div className="decision-detail-container animate-fade-in">
        <div className="record-card">
          <p className="record-card__eyebrow">Administrator View</p>
          <h1 className="record-card__title">User Access &amp; Role Management</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 16px" }}>
            Promote or reassign system roles to control review authority and governance permissions.
          </p>

          <div className="user-search-wrapper">
            <input
              type="text"
              placeholder="Filter by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="decision-filters__search"
              aria-label="Filter users"
            />
          </div>
        </div>

        {error && <p className="form-error" style={{ textAlign: "center" }}>{error}</p>}

        {loading ? (
          <section className="detail-section">
            <SkeletonLoader variant="row" count={4} />
          </section>
        ) : (
          <section className="detail-section">
            <div className="detail-section__header">
              <h2 className="detail-section__title" style={{ border: "none", margin: 0, padding: 0 }}>
                User Directory
              </h2>
              <span className="detail-section__badge">{filteredUsers.length} of {users.length} users</span>
            </div>

            <div className="user-mgmt-table">
              <div className="user-mgmt-row user-mgmt-row--header">
                <span>Name</span>
                <span>Email</span>
                <span>Current Role</span>
                <span>Action</span>
              </div>

              {filteredUsers.length === 0 ? (
                <p className="detail-section__empty" style={{ padding: 20, textAlign: "center" }}>
                  No users found matching &ldquo;{searchTerm}&rdquo;
                </p>
              ) : (
                filteredUsers.map((u) => (
                  <div className="user-mgmt-row" key={u.id}>
                    <span className="user-mgmt-name">{u.name}</span>
                    <span className="user-mgmt-email">{u.email}</span>
                    <span><RoleStamp role={u.role} /></span>
                    <select
                      className="user-role-select"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      aria-label={`Change role for ${u.name}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default UserManagement;