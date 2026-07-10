import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDecision } from "../services/api";
import "../styles/forms.css";
import "./CreateDecision.css";

function CreateDecision() {
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const decision = await createDecision(title, problemStatement);
      navigate(`/decisions/${decision.id}`);
    } catch (err) {
      setError("Could not create decision. Please try again.");
    }
  }

  return (
    <div className="create-decision-page">
      <header className="dashboard-header">
        <span className="dashboard-header__brand">Expert Decision Replay Platform</span>
        <button className="btn-ghost" onClick={() => navigate("/decisions")}>
          Cancel
        </button>
      </header>

      <div className="create-decision-container">
        <div className="record-card">
          <p className="record-card__eyebrow">New Case File</p>
          <h1 className="record-card__title">Open a New Decision</h1>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Switch cloud provider"
                required
              />
            </div>

            <div className="form-group">
              <label>Problem Statement</label>
              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="Describe the problem this decision needs to address..."
                rows={6}
                required
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="btn-primary">
              Create Decision
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateDecision;