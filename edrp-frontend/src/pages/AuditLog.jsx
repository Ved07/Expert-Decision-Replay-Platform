import { useState, useEffect } from "react";
import { getAuditLogs } from "../services/api";
import AppHeader from "../components/AppHeader";
import SkeletonLoader from "../components/SkeletonLoader";
import "./AuditLog.css";

const ACTION_LABELS = {
  role_changed: "Role Changed",
  decision_reviewed: "Decision Reviewed",
  decision_created: "Decision Created",
  comment_deleted: "Comment Deleted",
};

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const data = await getAuditLogs();
        setLogs(data);
        setError("");
      } catch (err) {
        setError(err.friendlyMessage || "Failed to load audit logs.");
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const actionLabel = ACTION_LABELS[log.action] || log.action;
    return (
      actionLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="decision-detail-page">
      <AppHeader backTo="/dashboard" backLabel="Back to Dashboard" />

      <div className="decision-detail-container animate-fade-in">
        <div className="record-card">
          <p className="record-card__eyebrow">System Governance</p>
          <h1 className="record-card__title">Audit Trail &amp; Activity Log</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 16px" }}>
            Immutable timeline of the 200 most recent system events, role updates, and decision approvals.
          </p>

          <div className="user-search-wrapper">
            <input
              type="text"
              placeholder="Search audit trail by actor, action type, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="decision-filters__search"
              aria-label="Filter audit logs"
            />
          </div>
        </div>

        {error && <p className="form-error" style={{ textAlign: "center" }}>{error}</p>}

        {loading ? (
          <section className="detail-section">
            <SkeletonLoader variant="list" count={4} />
          </section>
        ) : (
          <section className="detail-section">
            <div className="detail-section__header">
              <h2 className="detail-section__title" style={{ border: "none", margin: 0, padding: 0 }}>
                Logged Actions
              </h2>
              <span className="detail-section__badge">{filteredLogs.length} events</span>
            </div>

            {filteredLogs.length === 0 ? (
              <p className="detail-section__empty">No activity recorded matching &ldquo;{searchTerm}&rdquo;.</p>
            ) : (
              <div className="audit-log-list">
                {filteredLogs.map((log) => (
                  <div className={`audit-log-entry audit-log-entry--${log.action}`} key={log.id}>
                    <div className="audit-log-entry__top">
                      <span className="audit-log-entry__action">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      <span className="audit-log-entry__date">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="audit-log-entry__meta">
                      Actor: <strong>{log.actor_name}</strong> &bull; Target: {log.entity_type} #{log.entity_id}
                    </p>
                    {log.details && (
                      <p className="audit-log-entry__details">&ldquo;{log.details}&rdquo;</p>
                    )}
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

export default AuditLog;