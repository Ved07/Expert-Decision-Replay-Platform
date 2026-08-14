import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDecision, getAlternatives, getAttachments, getComments,
  postComment, uploadAttachment, downloadAttachment,
  createAlternative, deleteAttachment,
  getApprovals, submitApproval, getCurrentUser,
  updateDecision, getDecisionVersions,
  getRatings, rateDecision,
  exportDecisionPDF, deleteDecision,
  deleteComment, restoreDecisionVersion
} from "../services/api";
import StatusStamp from "../components/StatusStamp";
import AppHeader from "../components/AppHeader";
import StarRating from "../components/StarRating";
import SkeletonLoader from "../components/SkeletonLoader";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmModalContext";
import "./DecisionDetail.css";

const APPROVAL_LEVELS = ["Reviewer", "Manager", "Administrator"];

function DecisionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

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
  const [loading, setLoading] = useState(true);

  // Ratings
  const [ratings, setRatings] = useState({ average: 0, count: 0, my_rating: null });
  const [ratingError, setRatingError] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  
  // Editing + version history
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editProblem, setEditProblem] = useState("");
  const [versions, setVersions] = useState([]);

  // Collapsible sections
  const [showVersions, setShowVersions] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(true);

  async function loadEverything() {
    try {
      const [decisionData, altData, attachData, commentData, approvalData, userData, versionData, ratingData] =
        await Promise.all([
          getDecision(id),
          getAlternatives(id),
          getAttachments(id),
          getComments(id),
          getApprovals(id),
          getCurrentUser(),
          getDecisionVersions(id),
          getRatings(id),
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
      setRatings(ratingData);
      setError("");

      // Publish active decision context for Copilot
      window.__EDRP_ACTIVE_DECISION__ = {
        decisionId: decisionData.id,
        decisionTitle: decisionData.title,
        decisionStatus: decisionData.status,
        decisionCategory: decisionData.category,
        decisionDescription: decisionData.problem_statement,
      };
      window.dispatchEvent(new CustomEvent("edrp-context-change"));
    } catch (err) {
      setError(err.friendlyMessage || "Error loading case file details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEverything();

    return () => {
      window.__EDRP_ACTIVE_DECISION__ = null;
      window.dispatchEvent(new CustomEvent("edrp-context-change"));
    };
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
      toast.success(`Approval outcome '${outcome}' submitted successfully.`);
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to submit approval review.");
    }
  }

  async function handleRate(stars) {
    if (ratings.my_rating || submittingRating) return;

    setSubmittingRating(true);
    setRatingError("");

    setRatings((prev) => ({ ...prev, my_rating: stars }));

    try {
      const summary = await rateDecision(id, stars);
      setRatings(summary);
      toast.success("Thank you for your rating!");
    } catch (err) {
      setRatings((prev) => ({ ...prev, my_rating: null }));
      setRatingError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Could not submit rating.");
    } finally {
      setSubmittingRating(false);
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    try {
      await updateDecision(id, { title: editTitle, problem_statement: editProblem });
      setIsEditing(false);
      toast.success("Decision changes saved successfully.");
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to save changes.");
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
      toast.success("Alternative option added.");
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to add alternative.");
    }
  }

  async function handleDeleteAttachment(attachmentId) {
    const ok = await confirm({
      title: "Remove Attachment",
      message: "Are you sure you want to remove this attached file?",
      confirmText: "Remove",
      isDanger: true,
    });
    if (!ok) return;

    try {
      await deleteAttachment(attachmentId);
      toast.success("Attachment removed.");
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to remove attachment.");
    }
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();
    if (!newComment.trim()) return;
    try {
      await postComment(id, newComment);
      setNewComment("");
      toast.success("Comment posted.");
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to post comment.");
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      await uploadAttachment(id, file);
      toast.success("File attached successfully.");
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to upload attachment.");
    }
  }

  async function handleDeleteDecision() {
    const ok = await confirm({
      title: "Delete Decision Permanently",
      message: "Are you sure you want to delete this decision? All alternatives, attachments, and approvals will be removed permanently.",
      confirmText: "Delete Decision",
      isDanger: true,
    });
    if (!ok) return;

    try {
      await deleteDecision(id);
      toast.success("Decision deleted successfully.");
      navigate("/decisions");
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to delete decision.");
    }
  }

  async function handleDeleteComment(commentId) {
    const ok = await confirm({
      title: "Delete Comment",
      message: "Are you sure you want to remove this comment?",
      confirmText: "Delete",
      isDanger: true,
    });
    if (!ok) return;

    try {
      await deleteComment(commentId);
      toast.success("Comment deleted.");
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to delete comment.");
    }
  }

  async function handleRestoreVersion(versionId, versionNumber) {
    const ok = await confirm({
      title: `Restore Version ${versionNumber}`,
      message: `Restore this decision to version ${versionNumber}? The current content will be saved as a new version first.`,
      confirmText: "Restore Version",
      isDanger: false,
    });
    if (!ok) return;

    try {
      await restoreDecisionVersion(id, versionId);
      toast.success(`Decision reverted to version ${versionNumber}.`);
      loadEverything();
    } catch (err) {
      setError(err.friendlyMessage);
      toast.error(err.friendlyMessage || "Failed to restore version.");
    }
  }

  async function handleExportPDF() {
    try {
      await exportDecisionPDF(decision.id, decision.title);
      toast.success("PDF document downloaded.");
    } catch (err) {
      toast.error("Failed to export PDF.");
    }
  }

  if (loading) {
    return (
      <div className="decision-detail-page">
        <AppHeader backTo="/decisions" backLabel="Back to Decisions" />
        <div className="decision-detail-container">
          <SkeletonLoader variant="card" count={1} />
          <SkeletonLoader variant="list" count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="decision-detail-page">
      <AppHeader backTo="/decisions" backLabel="Back to Decisions" />

      {error && (
        <div className="auth-error-banner" style={{ maxWidth: 860, margin: "20px auto 0" }}>
          <p className="auth-error-banner__text">{error}</p>
        </div>
      )}

      {decision && (
        <div className="decision-detail-container animate-fade-in">

          {/* ---- Main decision card (view or edit mode) ---- */}
          <div className="record-card decision-detail-card">
            <div className="decision-detail__top">
              <p className="record-card__eyebrow">File #{decision.id}</p>
              <StatusStamp value={decision.status} />
            </div>

            {!isEditing ? (
              <>
                <h1 className="record-card__title">{decision.title}</h1>
                <div className="decision-detail-author-line">
                  <span>Authored by <strong>{decision.creator_name}</strong></span>
                  {decision.created_at && (
                    <span> &bull; Recorded on {new Date(decision.created_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="decision-detail__problem-wrapper">
                  <h3 className="decision-detail__subheading">Problem Statement &amp; Context</h3>
                  <p className="decision-detail__problem">{decision.problem_statement}</p>
                </div>
                
                <div className="decision-detail-actions-row">
                  {canEdit && (
                    <>
                      <button className="btn-ghost-light" onClick={() => setIsEditing(true)}>
                        Edit Decision
                      </button>
                      <button className="btn-reject" onClick={handleDeleteDecision}>
                        Delete Record
                      </button>
                    </>
                  )}
                  <button
                    className="btn-ghost-light"
                    onClick={handleExportPDF}
                  >
                    Export PDF
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleEditSubmit} className="decision-edit-form">
                <div className="form-group">
                  <label htmlFor="edit-title">Title</label>
                  <input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-problem">Problem Statement</label>
                  <textarea
                    id="edit-problem"
                    value={editProblem}
                    onChange={(e) => setEditProblem(e.target.value)}
                    rows={6}
                    required
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

          {/* ---- Version History (Collapsible) ---- */}
          {versions.length > 0 && (
            <section className="detail-section">
              <div className="detail-section__header" style={{ marginBottom: showVersions ? 16 : 0, borderBottom: showVersions ? '1px solid var(--line)' : 'none' }}>
                <h2 className="detail-section__title" style={{ border: "none", margin: 0, padding: 0 }}>
                  Version History ({versions.length})
                </h2>
                <button className="btn-ghost-light" onClick={() => setShowVersions(!showVersions)}>
                  {showVersions ? "Hide Versions ▲" : "Show Versions ▼"}
                </button>
              </div>

              {showVersions && (
                <div className="approval-timeline">
                  {versions.map((v) => (
                    <div className="approval-entry" key={v.id}>
                      <span className="version-badge">v{v.version_number}</span>
                      <div className="approval-entry__body">
                        <p className="approval-entry__meta">
                          <strong>{v.changed_by_name}</strong> &bull; {new Date(v.created_at).toLocaleString()}
                        </p>
                        <p className="approval-entry__comment">
                          &ldquo;{v.title}&rdquo; &bull; Status: {v.status}
                        </p>
                        {canEdit && (
                          <button
                            className="attachment-remove-button"
                            onClick={() => handleRestoreVersion(v.id, v.version_number)}
                            style={{ marginTop: 6, display: "inline-block" }}
                          >
                            Restore this version
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ---- Approval History ---- */}
          <section className="detail-section">
            <h2 className="detail-section__title">Approval Routing &amp; Governance</h2>

            {approvals.length === 0 && (
              <p className="detail-section__empty">No approval reviews recorded yet.</p>
            )}

            <div className="approval-timeline">
              {approvals.map((a) => (
                <div className="approval-entry" key={a.id}>
                  <StatusStamp value={a.outcome} />
                  <div className="approval-entry__body">
                    <p className="approval-entry__meta">
                      <strong>{a.reviewer_name}</strong> &bull; {new Date(a.reviewed_at).toLocaleString()}
                    </p>
                    {a.comments && <p className="approval-entry__comment">&ldquo;{a.comments}&rdquo;</p>}
                  </div>
                </div>
              ))}
            </div>

            {isMyTurn && (
              <div className="approval-action-box">
                <p className="approval-action-box__prompt">
                  Action required: Awaiting your approval review as <strong>{currentUser.role}</strong>.
                </p>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Add a review note explaining your rationale (optional)..."
                  rows={3}
                />
                <div className="approval-action-box__buttons">
                  <button className="btn-primary" onClick={() => handleApprovalAction("Approved")}>
                    Approve Decision
                  </button>
                  <button className="btn-reject" onClick={() => handleApprovalAction("Rejected")}>
                    Reject Decision
                  </button>
                </div>
              </div>
            )}

            {!isMyTurn && nextRole && (
              <p className="detail-section__empty" style={{ marginTop: 16 }}>
                Currently awaiting review step by: <strong>{nextRole}</strong>
              </p>
            )}
          </section>

          {/* ---- Rating ---- */}
          <section className="detail-section">
            <h2 className="detail-section__title">Impact &amp; Quality Rating</h2>

            <div className="rating-summary">
              <StarRating value={ratings.average} readOnly size="large" />
              <span className="rating-summary__text">
                <strong>{ratings.average.toFixed(1)}</strong> / 5
                {" "}({ratings.count} {ratings.count === 1 ? "rating" : "ratings"})
              </span>
            </div>

            {ratingError && (
              <p className="form-error" style={{ marginTop: 8 }}>{ratingError}</p>
            )}

            {currentUser && decision.created_by === currentUser.id && (
              <p className="detail-section__empty" style={{ marginTop: 12 }}>
                You are the author of this decision record, so rating is restricted.
              </p>
            )}

            {currentUser && decision.created_by !== currentUser.id && (
              ratings.my_rating ? (
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "var(--text-dark)" }}>Your rating:</span>
                  <StarRating value={ratings.my_rating} readOnly />
                </div>
              ) : (
                <div style={{ marginTop: 14 }}>
                  <p className="approval-action-box__prompt" style={{ marginBottom: 8, fontSize: 13 }}>
                    Rate this decision record:
                  </p>
                  <StarRating value={0} onRate={handleRate} size="large" />
                </div>
              )
            )}
          </section>

          {/* ---- Alternatives ---- */}
          <section className="detail-section">
            <div className="detail-section__header">
              <h2 className="detail-section__title" style={{ border: "none", margin: 0, padding: 0 }}>
                Alternatives Considered ({alternatives.length})
              </h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost-light" onClick={() => setShowAlternatives(!showAlternatives)}>
                  {showAlternatives ? "Collapse" : "Expand"}
                </button>
                <button className="btn-ghost-light" onClick={() => { setShowAltForm(!showAltForm); setShowAlternatives(true); }}>
                  {showAltForm ? "Cancel" : "+ Add Alternative"}
                </button>
              </div>
            </div>

            {showAltForm && (
              <form onSubmit={handleAddAlternative} className="alt-form">
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, margin: "0 0 14px" }}>New Alternative Option</h3>
                <div className="form-group">
                  <label>Option Title</label>
                  <input value={altTitle} onChange={(e) => setAltTitle(e.target.value)} placeholder="e.g., Option B: Managed Cloud Service" required />
                </div>
                <div className="form-group">
                  <label>Pros</label>
                  <input value={altPros} onChange={(e) => setAltPros(e.target.value)} placeholder="Key advantages..." />
                </div>
                <div className="form-group">
                  <label>Cons</label>
                  <input value={altCons} onChange={(e) => setAltCons(e.target.value)} placeholder="Trade-offs and limitations..." />
                </div>
                <div className="form-group">
                  <label>Estimated Cost</label>
                  <input value={altCost} onChange={(e) => setAltCost(e.target.value)} placeholder="e.g., $5,000 / month" />
                </div>
                <div className="form-group">
                  <label>Feasibility Notes</label>
                  <input value={altFeasibility} onChange={(e) => setAltFeasibility(e.target.value)} placeholder="Technical feasibility assessment..." />
                </div>
                <div className="form-group">
                  <label>Risk Notes</label>
                  <input value={altRisk} onChange={(e) => setAltRisk(e.target.value)} placeholder="Identified operational risks..." />
                </div>
                <button type="submit" className="btn-primary" style={{ width: "auto", padding: "10px 24px" }}>
                  Save Alternative Option
                </button>
              </form>
            )}

            {showAlternatives && (
              <>
                {alternatives.length === 0 && !showAltForm && (
                  <p className="detail-section__empty">No alternative options recorded yet.</p>
                )}

                <div className="alternatives-grid">
                  {alternatives.map((alt) => (
                    <div className="exhibit-card" key={alt.id}>
                      <h3 className="exhibit-card__title">{alt.title}</h3>
                      {alt.pros && <p><strong>Pros:</strong> {alt.pros}</p>}
                      {alt.cons && <p><strong>Cons:</strong> {alt.cons}</p>}
                      {alt.estimated_cost && <p><strong>Est. Cost:</strong> {alt.estimated_cost}</p>}
                      {alt.feasibility_notes && <p><strong>Feasibility:</strong> {alt.feasibility_notes}</p>}
                      {alt.risk_notes && <p><strong>Risks:</strong> {alt.risk_notes}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* ---- Attachments ---- */}
          <section className="detail-section">
            <h2 className="detail-section__title">Supporting Attachments</h2>

            {attachments.length === 0 && (
              <p className="detail-section__empty">No files attached to this case file yet.</p>
            )}

            <ul className="attachment-list">
              {attachments.map((a) => (
                <li key={a.id} className="attachment-list__item">
                  <button
                    className="attachment-link-button"
                    onClick={() => downloadAttachment(a.id, a.original_filename)}
                  >
                    ⎘ {a.original_filename}
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

            <label className="btn-ghost-light" style={{ cursor: "pointer" }}>
              + Attach File
              <input type="file" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
          </section>

          {/* ---- Comments ---- */}
          <section className="detail-section">
            <h2 className="detail-section__title">Discussion &amp; Notes</h2>
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
                  {c.content !== "[deleted]" &&
                    (c.author_id === currentUser?.id || currentUser?.role === "Administrator") && (
                      <button
                        className="attachment-remove-button"
                        onClick={() => handleDeleteComment(c.id)}
                        title="Delete comment"
                        style={{ marginTop: 4, display: "inline-block" }}
                      >
                        Delete comment
                      </button>
                    )}
                </div>
              ))}
            </div>

            <form onSubmit={handleCommentSubmit} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment or decision rationale note..."
                rows={3}
              />
              <button type="submit" className="btn-primary" style={{ width: "auto", padding: "10px 24px" }} disabled={!newComment.trim()}>
                Post Comment
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default DecisionDetail;