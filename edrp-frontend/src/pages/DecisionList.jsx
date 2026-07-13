import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDecisions } from "../services/api";
import StatusStamp from "../components/StatusStamp";
import AppHeader from "../components/AppHeader";
import "./DecisionList.css";

function DecisionList() {
  const [decisions, setDecisions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDecisions() {
      try {
        const data = await getDecisions();
        setDecisions(data);
      } catch (err) {
        setError(err.friendlyMessage || "Could not load decisions.");
      }
    }
    fetchDecisions();
  }, []);

  return (
    <div className="decision-list-page">
      <AppHeader />

      <div className="decision-list-container">
        <div className="decision-list-header-row">
          <div>
            <p className="decision-list-eyebrow">Case Files</p>
            <h1 className="decision-list-title">Decisions</h1>
          </div>
          <Link to="/decisions/new" className="new-decision-btn">
            + New Decision
          </Link>
        </div>

        {error && <p className="form-error">{error}</p>}

        {!error && decisions.length === 0 && (
          <p style={{ color: "var(--line)" }}>No decisions recorded yet.</p>
        )}

        <div className="decision-cards">
          {decisions.map((d) => (
            <Link to={`/decisions/${d.id}`} key={d.id} className="decision-card">
              <div className="decision-card__top">
                <span className="decision-card__id">FILE #{d.id}</span>
                <StatusStamp value={d.status} />
              </div>
              <h2 className="decision-card__title">{d.title}</h2>
              <p className="decision-card__excerpt">
                {d.problem_statement.length > 140
                  ? d.problem_statement.slice(0, 140) + "..."
                  : d.problem_statement}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DecisionList;