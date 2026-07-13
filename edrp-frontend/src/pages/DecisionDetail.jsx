import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDecision, getAlternatives, getAttachments, getComments,
  postComment, uploadAttachment, downloadAttachment,
  createAlternative, deleteAttachment,
} from "../services/api";
import StatusStamp from "../components/StatusStamp";
import "./DecisionDetail.css";

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
  const [error, setError] = useState("");

async function loadEverything() {
  try {
    const [decisionData, altData, attachData, commentData] = await Promise.all([
      getDecision(id), getAlternatives(id), getAttachments(id), getComments(id),
    ]);
    setDecision(decisionData);
    setAlternatives(altData);
    setAttachments(attachData);
    setComments(commentData);
    setError(""); // clear any previous error on a successful reload
  } catch (err) {
    setError(err.friendlyMessage);
  }
}

  useEffect(() => {
    loadEverything();
  }, [id]);



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

if (!decision && !error) return <p style={{ padding: 40, color: "var(--line)" }}>Loading case file...</p>;

  return (
    <div className="decision-detail-page">
      <header className="dashboard-header">
        <span className="dashboard-header__brand">Expert Decision Replay Platform</span>
        <button className="btn-ghost" onClick={() => navigate("/decisions")}>
          Back to Decisions
        </button>
      </header>
      {error && (
          <p className="form-error" style={{ textAlign: "center", padding: "12px 0", margin: 0 }}>
            {error}
          </p>
        )}
      {decision && (
      <div className="decision-detail-container">

        {/* ---- Main decision card ---- */}
        <div className="record-card">
          <div className="decision-detail__top">
            <p className="record-card__eyebrow">File #{decision.id}</p>
            <StatusStamp value={decision.status} />
          </div>
          <h1 className="record-card__title">{decision.title}</h1>
          <p className="decision-detail__problem">{decision.problem_statement}</p>
        </div>
        
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