import { useState, useEffect } from "react";
import {
  getCurrentUser, getMyTeam, getAllTeams, getTeamDetail,
  getUnassignedUsers, addUserToTeam, removeUserFromTeam,
  createTeam, updateTeam, deleteTeam
} from "../services/api";
import AppHeader from "../components/AppHeader";
import RoleStamp from "../components/RoleStamp";
import SkeletonLoader from "../components/SkeletonLoader";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmModalContext";
import "./TeamManagement.css";

function TeamManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [team, setTeam] = useState(null);
  const [unassigned, setUnassigned] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [newTeamName, setNewTeamName] = useState("");
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const isAdmin = currentUser && currentUser.role === "Administrator";
  const toast = useToast();
  const confirm = useConfirm();

  async function loadInitial() {
    try {
      setLoading(true);
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
      setError("");
    } catch (err) {
      setError(err.friendlyMessage || "Failed to load team data.");
    } finally {
      setLoading(false);
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

  async function handleAddMember(userId, userName) {
    try {
      await addUserToTeam(userId, team.id);
      toast.success(`${userName} added to the team.`);
      refreshTeamAndUnassigned();
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to add member.");
    }
  }

  async function handleRemoveMember(userId, memberName) {
    const ok = await confirm({
      title: "Remove Team Member",
      message: `Remove ${memberName} from this team? They will be placed back in the unassigned pool.`,
      confirmText: "Remove Member",
      isDanger: true,
    });
    if (!ok) return;

    try {
      await removeUserFromTeam(userId);
      toast.success(`${memberName} removed from the team.`);
      refreshTeamAndUnassigned();
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to remove member.");
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
      toast.success(`Team "${newTeamName}" created successfully.`);
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to create team.");
    }
  }

  async function handleRename(event) {
    event.preventDefault();
    try {
      await updateTeam(team.id, { name: renameValue });
      const teams = await getAllTeams();
      setAllTeams(teams);
      toast.success("Team name updated.");
      refreshTeamAndUnassigned();
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to rename team.");
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
    const ok = await confirm({
      title: `Delete Team "${team.name}"`,
      message: `Delete "${team.name}" permanently? All members will be unassigned but their accounts will not be deleted.`,
      confirmText: "Delete Team",
      isDanger: true,
    });
    if (!ok) return;

    try {
      await deleteTeam(team.id);
      toast.success(`Team "${team.name}" deleted.`);
      const teams = await getAllTeams();
      setAllTeams(teams);
      setTeam(null);
      setSelectedTeamId(teams.length > 0 ? teams[0].id : null);
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to delete team.");
    }
  }

  if (loading) {
    return (
      <div className="decision-detail-page">
        <AppHeader backTo="/dashboard" backLabel="Back to Dashboard" />
        <div className="decision-detail-container">
          <SkeletonLoader variant="card" count={1} />
          <SkeletonLoader variant="list" count={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="decision-detail-page">
      <AppHeader backTo="/dashboard" backLabel="Back to Dashboard" />

      {error && (
        <div className="auth-error-banner" style={{ maxWidth: 860, margin: "20px auto 0" }}>
          <p className="auth-error-banner__text">{error}</p>
        </div>
      )}

      <div className="decision-detail-container animate-fade-in">

        {isAdmin && (
          <div className="record-card">
            <p className="record-card__eyebrow">Administrator Controls</p>
            <h1 className="record-card__title">Team Directory &amp; Allocation</h1>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="team-select">Select Target Team</label>
              <select
                id="team-select"
                value={selectedTeamId || ""}
                onChange={(e) => setSelectedTeamId(Number(e.target.value))}
              >
                {allTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {!showNewTeamForm ? (
              <button className="btn-ghost-light" onClick={() => setShowNewTeamForm(true)}>
                + Create New Team
              </button>
            ) : (
              <form onSubmit={handleCreateTeam} className="alt-form" style={{ marginTop: 16 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, margin: "0 0 10px" }}>Create Team</h3>
                <div className="form-group">
                  <label htmlFor="new-team-name">Team Name</label>
                  <input
                    id="new-team-name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., Infrastructure & Operations"
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" className="btn-primary" style={{ width: "auto", padding: "10px 24px" }}>
                    Create Team
                  </button>
                  <button type="button" className="btn-ghost-light" onClick={() => setShowNewTeamForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {team && (
          <section className="detail-section">
            <div className="detail-section__header">
              <h2 className="detail-section__title" style={{ border: "none", margin: 0, padding: 0 }}>
                {team.name}
              </h2>
              <span className="detail-section__badge">{team.members.length} {team.members.length === 1 ? 'member' : 'members'}</span>
            </div>
            
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>
              Designated Manager: <strong>{team.manager_name || "Unassigned"}</strong>
            </p>

            {isAdmin && (
              <div className="team-admin-controls">
                <form onSubmit={handleRename} className="alt-form">
                  <h4 style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 8px" }}>
                    Team Settings
                  </h4>
                  <div className="form-group">
                    <label htmlFor="rename-team">Rename Team</label>
                    <input id="rename-team" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" className="btn-primary" style={{ width: "auto", padding: "8px 20px" }}>
                      Save Name
                    </button>
                    <button type="button" className="btn-reject" onClick={handleDeleteTeam}>
                      Delete Team
                    </button>
                  </div>
                </form>

                <div className="form-group" style={{ marginTop: 16 }}>
                  <label htmlFor="assign-manager">Assign Team Manager</label>
                  <select
                    id="assign-manager"
                    value={team.manager_id || ""}
                    onChange={(e) => handleSetManager(Number(e.target.value) || null)}
                  >
                    <option value="">— None (Unassigned) —</option>
                    {team.members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, margin: "24px 0 14px" }}>
              Assigned Members
            </h3>
            
            {team.members.length === 0 ? (
              <p className="detail-section__empty">No members assigned to this team yet.</p>
            ) : (
              <div className="mini-decision-list">
                {team.members.map((m) => (
                  <div className="mini-decision-card team-member-card" key={m.id}>
                    <div className="team-member-avatar" aria-hidden="true">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="mini-decision-card__title">{m.name}</span>
                    <RoleStamp role={m.role} />
                    <button
                      className="attachment-remove-button"
                      onClick={() => handleRemoveMember(m.id, m.name)}
                      title="Remove from team"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {team && (
          <section className="detail-section">
            <div className="detail-section__header">
              <h2 className="detail-section__title" style={{ border: "none", margin: 0, padding: 0 }}>
                Unassigned Users Pool
              </h2>
              <span className="detail-section__badge">{unassigned.length} available</span>
            </div>
            
            {unassigned.length === 0 ? (
              <p className="detail-section__empty">All users are currently assigned to teams.</p>
            ) : (
              <div className="mini-decision-list">
                {unassigned.map((u) => (
                  <div className="mini-decision-card team-member-card" key={u.id}>
                    <div className="team-member-avatar" aria-hidden="true">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="mini-decision-card__title">{u.name}</span>
                    <RoleStamp role={u.role} />
                    <button
                       className="btn-ghost-light"
                       onClick={() => handleAddMember(u.id, u.name)}
                     >
                       + Add to Team
                     </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}

export default TeamManagement;