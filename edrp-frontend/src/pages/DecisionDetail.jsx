import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDecision, getAlternatives, getAttachments, getComments,
  postComment, uploadAttachment, downloadAttachment,
  createAlternative, deleteAttachment,
  getApprovals, submitApproval, getCurrentUser,
  updateDecision, getDecisionVersions,
} from "../services/api";
import StatusStamp from "../components/StatusStamp";
import AppHeader from "../components/AppHeader";
import "./DecisionDetail.css";

const APPROVAL_LEVELS = ["Reviewer", "Manager", "Administrator"];

function DecisionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [decision, setDecision] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [showAltForm, setShowAltForm] = useState(false);
  const [altTitle, setAltTitle] = useState("");
  const [altPros, setAltPros] = useState("");
  const [altCons, setAltCons] = useState("");
  const [altCost, setAltCost] = useState("");
  const [altFeasibility, setAltFeasibility] = useState("");
  const [altRisk, setAltRisk] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [approvals, setApprovals] = useState([]);
  const [approvalComment, setApprovalComment] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");

  // Editing + version history
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editProblem, setEditProblem] = useState("");
  const [versions, setVersions] = useState([]);

  async function loadEverything() {
    try {
      const [decisionData, altData, attachData, commentData, approvalData, userData, versionData] =
        await Promise.all([
          getDecision(id),
          getAlternatives(id),
          getAttachments(id),
          getComments(id),
          getApprovals(id),
          getCurrentUser(),
          getDecisionVersions(id),
        ]);
      setDecision(decisionData);
      setEditTitle(decisionData.title);
      setEditProblem(decisionData.problem_statement);
      setAlternatives(altData);
      setAttachments(attachData);
      setComments(commentData);
      setApprovals(approvalData);
      setCurrentUser(userData);
      setVersions(versionData);
      setError("");
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  useEffect(() => {
    loadEverything();
  }, [id]);

  function getNextRequiredRole() {
    if (approvals.some((a) => a.outcome === "Rejected")) return null;
    if (approvals.length >= APPROVAL_LEVELS.length) return null;
    return APPROVAL_LEVELS[approvals.length];
  }

  const nextRole = getNextRequiredRole();
  const isMyTurn = currentUser && nextRole === currentUser.role;

  const canEdit =
    currentUser &&
    decision &&
    (currentUser.id === decision.created_by || currentUser.role === "Administrator");

  async function handleApprovalAction(outcome) {
    try {
      await submitApproval(id, outcome, approvalComment);
      setApprovalComment("");
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    try {
      await updateDecision(id, { title: editTitle, problem_statement: editProblem });
      setIsEditing(false);
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  async function handleAddAlternative(event) {
    event.preventDefault();
    try {
      await createAlternative(id, {
        title: altTitle,
        pros: altPros || null,
        cons: altCons || null,
        estimated_cost: altCost || null,
        feasibility_notes: altFeasibility || null,
        risk_notes: altRisk || null,
      });
      setAltTitle("");
      setAltPros("");
      setAltCons("");
      setAltCost("");
      setAltFeasibility("");
      setAltRisk("");
      setShowAltForm(false);
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  async function handleDeleteAttachment(attachmentId) {
    try {
      await deleteAttachment(attachmentId);
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();
    if (!newComment.trim()) return;
    try {
      await postComment(id, newComment);
      setNewComment("");
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      await uploadAttachment(id, file);
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
    }
  }

  if (!decision && !error) {
    return <p style={{ padding: 40, color: "var(--line)" }}>Loading case file...</p>;
  }

  return (
    <div className="decision-detail-page">
      <AppHeader backTo="/decisions" backLabel="Back to Decisions" />

      {error && (
        <p className="form-error" style={{ textAlign: "center", padding: "12px 0", margin: 0 }}>
          {error}
        </p>
      )}

      {decision && (
        <div className="decision-detail-container">

          {/* ---- Main decision card (view or edit mode) ---- */}
          <div className="record-card">
            <div className="decision-detail__top">
              <p className="record-card__eyebrow">File #{decision.id}</p>
              <StatusStamp value={decision.status} />
            </div>

            {!isEditing ? (
              <>
                <h1 className="record-card__title">{decision.title}</h1>
                <p className="decision-detail__problem">{decision.problem_statement}</p>
                {canEdit && (
                  <button
                    className="btn-ghost-light"
                    onClick={() => setIsEditing(true)}
                    style={{ marginTop: 12 }}
                  >
                    Edit Decision
                  </button>
                )}
              </>
            ) : (
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Problem Statement</label>
                  <textarea
                    value={editProblem}
                    onChange={(e) => setEditProblem(e.target.value)}
                    rows={5}
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: "auto", padding: "10px 24px" }}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn-ghost-light"
                    onClick={() => {
                      setIsEditing(false);
                      setEditTitle(decision.title);
                      setEditProblem(decision.problem_statement);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ---- Version History ---- */}
          {versions.length > 0 && (
            <section className="detail-section">
              <h2 className="detail-section__title">Version History</h2>
              <div className="approval-timeline">
                {versions.map((v) => (
                  <div className="approval-entry" key={v.id}>
                    <span className="record-field__label" style={{ flexShrink: 0 }}>
                      v{v.version_number}
                    </span>
                    <div className="approval-entry__body">
                      <p className="approval-entry__meta">
                        <strong>{v.changed_by_name}</strong> ·{" "}
                        {new Date(v.created_at).toLocaleString()}
                      </p>
                      <p className="approval-entry__comment">
                        "{v.title}" — {v.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ---- Approval History ---- */}
          <section className="detail-section">
            <h2 className="detail-section__title">Approval History</h2>

            {approvals.length === 0 && (
              <p className="detail-section__empty">No reviews yet.</p>
            )}

            <div className="approval-timeline">
              {approvals.map((a) => (
                <div className="approval-entry" key={a.id}>
                  <StatusStamp value={a.outcome} />
                  <div className="approval-entry__body">
                    <p className="approval-entry__meta">
                      <strong>{a.reviewer_name}</strong> · {new Date(a.reviewed_at).toLocaleString()}
                    </p>
                    {a.comments && <p className="approval-entry__comment">{a.comments}</p>}
                  </div>
                </div>
              ))}
            </div>

            {isMyTurn && (
              <div className="approval-action-box">
                <p className="approval-action-box__prompt">
                  This decision is awaiting your review as <strong>{currentUser.role}</strong>.
                </p>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Add a note about your decision (optional)..."
                  rows={2}
                />
                <div className="approval-action-box__buttons">
                  <button className="btn-primary" onClick={() => handleApprovalAction("Approved")}>
                    Approve
                  </button>
                  <button className="btn-reject" onClick={() => handleApprovalAction("Rejected")}>
                    Reject
                  </button>
                  <button className="btn-ghost-light" onClick={() => handleApprovalAction("Escalated")}>
                    Escalate
                  </button>
                </div>
              </div>
            )}

            {!isMyTurn && nextRole && (
              <p className="detail-section__empty">
                Awaiting review by: <strong>{nextRole}</strong>
              </p>
            )}
          </section>

          {/* ---- Alternatives ---- */}
          <section className="detail-section">
            <div className="detail-section__header">
              <h2 className="detail-section__title" style={{ border: "none", margin: 0, padding: 0 }}>
                Alternatives Considered
              </h2>
              <button className="btn-ghost-light" onClick={() => setShowAltForm(!showAltForm)}>
                {showAltForm ? "Cancel" : "+ Add Alternative"}
              </button>
            </div>

            {showAltForm && (
              <form onSubmit={handleAddAlternative} className="alt-form">
                <div className="form-group">
                  <label>Title</label>
                  <input value={altTitle} onChange={(e) => setAltTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Pros</label>
                  <input value={altPros} onChange={(e) => setAltPros(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Cons</label>
                  <input value={altCons} onChange={(e) => setAltCons(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Estimated Cost</label>
                  <input value={altCost} onChange={(e) => setAltCost(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Feasibility Notes</label>
                  <input value={altFeasibility} onChange={(e) => setAltFeasibility(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Risk Notes</label>
                  <input value={altRisk} onChange={(e) => setAltRisk(e.target.value)} />
                </div>
                <button type="submit" className="btn-primary" style={{ width: "auto", padding: "10px 24px" }}>
                  Save Alternative
                </button>
              </form>
            )}

            {alternatives.length === 0 && !showAltForm && (
              <p className="detail-section__empty">No alternatives recorded yet.</p>
            )}

            <div className="alternatives-grid">
              {alternatives.map((alt) => (
                <div className="exhibit-card" key={alt.id}>
                  <h3 className="exhibit-card__title">{alt.title}</h3>
                  {alt.pros && <p><strong>Pros:</strong> {alt.pros}</p>}
                  {alt.cons && <p><strong>Cons:</strong> {alt.cons}</p>}
                  {alt.estimated_cost && <p><strong>Cost:</strong> {alt.estimated_cost}</p>}
                  {alt.feasibility_notes && <p><strong>Feasibility:</strong> {alt.feasibility_notes}</p>}
                  {alt.risk_notes && <p><strong>Risk:</strong> {alt.risk_notes}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* ---- Attachments ---- */}
          <section className="detail-section">
            <h2 className="detail-section__title">Attachments</h2>

            {attachments.length === 0 && (
              <p className="detail-section__empty">No files attached yet.</p>
            )}

            <ul className="attachment-list">
              {attachments.map((a) => (
                <li key={a.id} className="attachment-list__item">
                  <button
                    className="attachment-link-button"
                    onClick={() => downloadAttachment(a.id, a.original_filename)}
                  >
                    {a.original_filename}
                  </button>
                  <button
                    className="attachment-remove-button"
                    onClick={() => handleDeleteAttachment(a.id)}
                    title="Remove attachment"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <label className="btn-ghost-light">
              + Attach File
              <input type="file" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
          </section>

          {/* ---- Comments ---- */}
          <section className="detail-section">
            <h2 className="detail-section__title">Discussion</h2>
            <div className="comment-thread">
              {comments.length === 0 && (
                <p className="detail-section__empty">No comments yet — start the discussion.</p>
              )}
              {comments.map((c) => (
                <div className="comment" key={c.id}>
                  <div className="comment__meta">
                    <span className="comment__author">{c.author_name}</span>
                    <span className="comment__date">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="comment__content">{c.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleCommentSubmit} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
              />
              <button type="submit" className="btn-primary" style={{ width: "auto", padding: "10px 24px" }}>
                Post
              </button>
            </form>
          </section>

        </div>
      )}
    </div>
  );
}

export default DecisionDetail;