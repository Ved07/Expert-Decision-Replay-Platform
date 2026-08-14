import { useState } from "react";
import { createDecision } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/forms.css";
import "./CreateDecision.css";
import AppHeader from "../components/AppHeader";
import { useToast } from "../context/ToastContext";

function CreateDecision() {
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !problemStatement.trim()) return;

    setIsSubmitting(true);
    try {
      const decision = await createDecision(title, problemStatement);
      toast.success("Decision record created successfully!");
      navigate(`/decisions/${decision.id}`);
    } catch (err) {
      setError(err.friendlyMessage || "Could not create decision. Please try again.");
      toast.error(err.friendlyMessage || "Could not create decision. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="create-decision-page">
      <AppHeader backTo="/decisions" backLabel="Cancel" />

      <div className="create-decision-container animate-fade-in">
        <div className="record-card create-decision-card">
          <p className="record-card__eyebrow">New Case File</p>
          <h1 className="record-card__title">Open a New Decision Record</h1>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="auth-error-banner" role="alert">
                <p className="auth-error-banner__text">{error}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="decision-title">Title</label>
              <input
                id="decision-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Switch Primary Database Provider to PostgreSQL"
                required
              />
              <span className="form-help-text">Give your decision record a clear, action-oriented summary title.</span>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="problem-statement">Problem Statement</label>
                <span className="char-count">{problemStatement.length} chars</span>
              </div>
              <textarea
                id="problem-statement"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="Describe the context, problem statement, key constraints, and business drivers..."
                rows={8}
                required
              />
            </div>

            <div className="create-decision-actions">
              <button type="submit" className="btn-primary" disabled={isSubmitting || !title.trim() || !problemStatement.trim()}>
                {isSubmitting ? "Creating Record…" : "Create Decision Record"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateDecision;