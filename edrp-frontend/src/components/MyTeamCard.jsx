import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyTeam } from "../services/api";
import RoleStamp from "./RoleStamp";

function MyTeamCard({ userRole }) {
  const [team, setTeam] = useState(null);
  const [notInTeam, setNotInTeam] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      try {
        const data = await getMyTeam();
        setTeam(data);
      } catch (err) {
        setNotInTeam(true);
      }
    }
    loadTeam();
  }, []);

  const canManage = userRole === "Manager" || userRole === "Administrator";

  return (
    <section className="detail-section">
      <div className="detail-section__header">
        <h2 className="detail-section__title" style={{ border: "none", margin: 0, padding: 0 }}>
          My Team
        </h2>
        {canManage && (
          <Link to="/team" className="btn-ghost-light">Manage Team</Link>
        )}
      </div>

      {notInTeam && (
        <p className="detail-section__empty">You are not assigned to a team yet.</p>
      )}

      {team && (
        <>
          <p style={{ fontSize: 14, color: "var(--text-dark)", marginBottom: 12 }}>
            <strong>{team.name}</strong>
            {team.manager_name && <> — managed by {team.manager_name}</>}
          </p>
          <div className="mini-decision-list">
            {team.members.map((m) => (
              <div className="mini-decision-card" key={m.id} style={{ cursor: "default" }}>
                <span className="mini-decision-card__title">{m.name}</span>
                <RoleStamp role={m.role} />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default MyTeamCard;