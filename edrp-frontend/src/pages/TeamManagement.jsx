import { useState, useEffect } from "react";
import {
  getCurrentUser, getMyTeam, getAllTeams, getTeamDetail,
  getUnassignedUsers, addUserToTeam, removeUserFromTeam,
  createTeam, updateTeam,
  deleteTeam
} from "../services/api";
import AppHeader from "../components/AppHeader";
import RoleStamp from "../components/RoleStamp";
import "./TeamManagement.css";

function TeamManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [team, setTeam] = useState(null);
  const [unassigned, setUnassigned] = useState([]);
  const [error, setError] = useState("");

  const [newTeamName, setNewTeamName] = useState("");
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const isAdmin = currentUser && currentUser.role === "Administrator";

  async function loadInitial() {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);

      if (user.role === "Administrator") {
        const teams = await getAllTeams();
        setAllTeams(teams);
        if (teams.length > 0) setSelectedTeamId(teams[0].id);
      } else {
        const myTeam = await getMyTeam();
        setTeam(myTeam);
        setRenameValue(myTeam.name);
      }

      const unassignedUsers = await getUnassignedUsers();
      setUnassigned(unassignedUsers);
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadSelectedTeam() {
      if (!isAdmin || !selectedTeamId) return;
      try {
        const detail = await getTeamDetail(selectedTeamId);
        setTeam(detail);
        setRenameValue(detail.name);
      } catch (err) {
        setError(err.friendlyMessage);
      }
    }
    loadSelectedTeam();
  }, [selectedTeamId, isAdmin]);

  async function refreshTeamAndUnassigned() {
    try {
      const unassignedUsers = await getUnassignedUsers();
      setUnassigned(unassignedUsers);

      if (isAdmin && selectedTeamId) {
        const detail = await getTeamDetail(selectedTeamId);
        setTeam(detail);
      } else if (!isAdmin) {
        const myTeam = await getMyTeam();
        setTeam(myTeam);
      }
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  async function handleAddMember(userId) {
    try {
      await addUserToTeam(userId, team.id);
      refreshTeamAndUnassigned();
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  async function handleRemoveMember(userId) {
    try {
      await removeUserFromTeam(userId);
      refreshTeamAndUnassigned();
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  async function handleCreateTeam(event) {
    event.preventDefault();
    try {
      const created = await createTeam(newTeamName, null);
      setNewTeamName("");
      setShowNewTeamForm(false);
      const teams = await getAllTeams();
      setAllTeams(teams);
      setSelectedTeamId(created.id);
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  async function handleRename(event) {
    event.preventDefault();
    try {
      await updateTeam(team.id, { name: renameValue });
      const teams = await getAllTeams();
      setAllTeams(teams);
      refreshTeamAndUnassigned();
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }
  async function handleSetManager(managerId) {
    try {
        await updateTeam(team.id, { manager_id: managerId });
        refreshTeamAndUnassigned();
    } catch (err) {
        setError(err.friendlyMessage);
    }
    }
    async function handleDeleteTeam() {
  if (!window.confirm(`Delete "${team.name}" permanently? Members will be unassigned, not deleted.`)) {
    return;
  }
  try {
    await deleteTeam(team.id);
    const teams = await getAllTeams();
    setAllTeams(teams);
    setTeam(null);
    setSelectedTeamId(teams.length > 0 ? teams[0].id : null);
  } catch (err) {
    setError(err.friendlyMessage);
  }
}   

  if (!currentUser && !error) {
    return <p style={{ padding: 40, color: "var(--line)" }}>Loading...</p>;
  }

  return (
    <div className="decision-detail-page">
      <AppHeader backTo="/dashboard" backLabel="Back to Dashboard" />

      {error && (
        <p className="form-error" style={{ textAlign: "center", padding: "12px 0", margin: 0 }}>
          {error}
        </p>
      )}

      <div className="decision-detail-container">

        {isAdmin && (
          <div className="record-card">
            <p className="record-card__eyebrow">Administrator View</p>
            <h1 className="record-card__title">Manage Teams</h1>

            <div className="form-group">
              <label>Select a Team</label>
              <select
                value={selectedTeamId || ""}
                onChange={(e) => setSelectedTeamId(Number(e.target.value))}
              >
                {allTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {!showNewTeamForm && (
              <button className="btn-ghost-light" onClick={() => setShowNewTeamForm(true)}>
                + Create New Team
              </button>
            )}

            {showNewTeamForm && (
              <form onSubmit={handleCreateTeam} style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label>New Team Name</label>
                  <input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: "auto", padding: "10px 24px" }}>
                  Create
                </button>
              </form>
            )}
          </div>
        )}

        {team && (
          <section className="detail-section">
            <h2 className="detail-section__title">{team.name}</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>
              Manager: {team.manager_name || "Unassigned"}
            </p>

            {isAdmin && (
              <form onSubmit={handleRename} className="alt-form">
                <div className="form-group">
                  <label>Rename Team</label>
                  <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn-primary" style={{ width: "auto", padding: "10px 24px" }}>
                  Save Name
                </button>
                <button type="button" className="btn-reject" onClick={handleDeleteTeam}>
                  Delete Team
                </button>
              </div>
              </form>
            )}
            {isAdmin && (
            <div className="form-group" style={{ marginTop: 16 }}>
                <label>Assign Manager</label>
                <select
                value={team.manager_id || ""}
                onChange={(e) => handleSetManager(Number(e.target.value) || null)}
                >
                <option value="">— None —</option>
                {team.members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                ))}
                </select>
            </div>
            )}

            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, margin: "20px 0 10px" }}>
              Members ({team.members.length})
            </h3>
            <div className="mini-decision-list">
              {team.members.length === 0 && (
                <p className="detail-section__empty">No members yet.</p>
              )}
              {team.members.map((m) => (
                <div className="mini-decision-card" key={m.id} style={{ cursor: "default" }}>
                  <span className="mini-decision-card__title">{m.name}</span>
                  <RoleStamp role={m.role} />
                  <button
                    className="attachment-remove-button"
                    onClick={() => handleRemoveMember(m.id)}
                    title="Remove from team"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {team && (
          <section className="detail-section">
            <h2 className="detail-section__title">Available Users</h2>
            {unassigned.length === 0 && (
              <p className="detail-section__empty">No unassigned users available right now.</p>
            )}
            <div className="mini-decision-list">
              {unassigned.map((u) => (
                <div className="mini-decision-card" key={u.id} style={{ cursor: "default" }}>
                  <span className="mini-decision-card__title">{u.name}</span>
                  <RoleStamp role={u.role} />
                  <button
                    className="btn-ghost-light"
                    onClick={() => handleAddMember(u.id)}
                  >
                    + Add to Team
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

export default TeamManagement;