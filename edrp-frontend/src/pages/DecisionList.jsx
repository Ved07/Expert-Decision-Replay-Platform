import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getDecisions, exportDecisionsExcel } from "../services/api";
import StatusStamp from "../components/StatusStamp";
import AppHeader from "../components/AppHeader";
import SkeletonLoader from "../components/SkeletonLoader";
import "./DecisionList.css";

function DecisionList() {
  const [decisions, setDecisions] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDecisions() {
      try {
        setLoading(true);
        const data = await getDecisions(searchTerm, statusFilter);
        setDecisions(data);
        setError("");
      } catch (err) {
        setError(err.friendlyMessage || "Could not load decisions.");
      } finally {
        setLoading(false);
      }
    }

    const timeoutId = setTimeout(fetchDecisions, 400);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  return (
    <div className="decision-list-page">
      <AppHeader />

      <div className="decision-list-container animate-fade-in">
        <div className="decision-list-header-row">
          <div>
            <p className="decision-list-eyebrow">Institutional Archive</p>
            <h1 className="decision-list-title">Decision Records</h1>
          </div>
          <div className="decision-list-header-actions">
            <Link to="/decisions/new" className="new-decision-btn">
              + New Decision
            </Link>
            <button className="btn-ghost-light-export" onClick={exportDecisionsExcel} title="Export all decisions to Excel">
              Export Excel
            </button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="decision-filters">
          <div className="decision-filters__search-wrapper">
            <svg className="decision-filters__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by title or problem statement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="decision-filters__search"
              aria-label="Search decisions"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="decision-filters__select"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        {/* ── Status / Count indicator ── */}
        {!loading && !error && (
          <p className="decision-list-count">
            Showing <strong>{decisions.length}</strong> {decisions.length === 1 ? "record" : "records"}
            {statusFilter && <> with status <em>&ldquo;{statusFilter}&rdquo;</em></>}
            {searchTerm && <> matching <em>&ldquo;{searchTerm}&rdquo;</em></>}
          </p>
        )}

        {error && <p className="form-error" style={{ margin: "20px 0" }}>{error}</p>}

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div className="decision-cards-skeleton" style={{ marginTop: 20 }}>
            <SkeletonLoader variant="card" count={3} />
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && decisions.length === 0 && (
          <div className="decision-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--line)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <h3>No Decision Files Found</h3>
            <p>No records matched your search criteria or none have been logged yet.</p>
            <Link to="/decisions/new" className="btn-primary" style={{ width: "auto", display: "inline-block" }}>
              Record First Decision
            </Link>
          </div>
        )}

        {/* ── Decision Cards ── */}
        {!loading && decisions.length > 0 && (
          <div className="decision-cards">
            {decisions.map((d) => (
              <Link to={`/decisions/${d.id}`} key={d.id} className={`decision-card decision-card--status-${d.status.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="decision-card__top">
                  <span className="decision-card__id">FILE #{d.id}</span>
                  <StatusStamp value={d.status} />
                </div>
                <h2 className="decision-card__title">{d.title}</h2>
                <p className="decision-card__meta">
                  Authored by <strong>{d.creator_name}</strong>
                </p>
                <p className="decision-card__excerpt">
                  {d.problem_statement.length > 150
                    ? d.problem_statement.slice(0, 150) + "…"
                    : d.problem_statement}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DecisionList;