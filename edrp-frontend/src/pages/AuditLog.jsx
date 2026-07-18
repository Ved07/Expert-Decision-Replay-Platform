import { useState, useEffect } from "react";
import { getAuditLogs } from "../services/api";
import AppHeader from "../components/AppHeader";
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

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await getAuditLogs();
        setLogs(data);
      } catch (err) {
        setError(err.friendlyMessage);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="decision-detail-page">
      <AppHeader backTo="/dashboard" backLabel="Back to Dashboard" />

      <div className="decision-detail-container">
        <div className="record-card">
          <p className="record-card__eyebrow">System Record</p>
          <h1 className="record-card__title">Audit Log</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            The 200 most recent actions recorded across the system.
          </p>
        </div>

        {error && <p className="form-error" style={{ textAlign: "center" }}>{error}</p>}

        {!error && (
          <section className="detail-section">
            {logs.length === 0 && (
              <p className="detail-section__empty">No activity recorded yet.</p>
            )}
            <div className="audit-log-list">
              {logs.map((log) => (
                <div className="audit-log-entry" key={log.id}>
                  <div className="audit-log-entry__top">
                    <span className="audit-log-entry__action">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                    <span className="audit-log-entry__date">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="audit-log-entry__meta">
                    <strong>{log.actor_name}</strong> · {log.entity_type} #{log.entity_id}
                  </p>
                  {log.details && (
                    <p className="audit-log-entry__details">{log.details}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default AuditLog;