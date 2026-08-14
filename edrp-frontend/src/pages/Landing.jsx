import { Link } from "react-router-dom";
import "./Landing.css";

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
      </svg>
    ),
    title: "Role-Based Approvals",
    body: "Multi-level review flow: Reviewer → Manager → Administrator, with a full record of every decision.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: "Full Audit Trail",
    body: "Every role change, approval, and comment is logged automatically. Nothing is hidden.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "Version History",
    body: "Every edit to a decision is saved. Roll back to any prior version with a single click.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Team Collaboration",
    body: "Organise users into teams with dedicated managers. Discuss each decision inline.",
  },
];

function Landing() {
  return (
    <div className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link to="/" className="landing-nav__brand" aria-label="Expert Decision Replay Platform home">
          <span className="landing-nav__brand-icon" aria-hidden="true">⬡</span>
          Expert Decision Replay Platform
        </Link>
        <div className="landing-nav__links">
          <Link to="/login" className="landing-nav__link">Log In</Link>
          <Link to="/register" className="landing-nav__cta">Get Started</Link>
        </div>
      </nav>

      <section className="landing-hero" aria-label="Hero">
        <p className="landing-hero__eyebrow">Institutional Memory, Preserved</p>
        <h1 className="landing-hero__title">
          Every decision<br />leaves a paper trail.
        </h1>
        <p className="landing-hero__subtitle">
          Record the problem, the options considered, and the reasoning behind
          every important call — so your team never has to solve the same
          problem twice.
        </p>
        <div className="landing-hero__actions">
          <Link to="/register" className="btn-primary landing-hero__btn landing-hero__btn--primary">
            Open an Account
          </Link>
          <Link to="/login" className="btn-ghost-light landing-hero__btn">
            Sign In
          </Link>
        </div>

        <div className="landing-stamp" aria-hidden="true">
          <span>RECORDED</span>
        </div>
      </section>

      {/* ── Feature ribbon ── */}
      <section className="landing-features" aria-label="Key features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-tile">
            <span className="feature-tile__icon">{f.icon}</span>
            <h3 className="feature-tile__title">{f.title}</h3>
            <p className="feature-tile__body">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="landing-ledger" aria-label="How it works">
        <div className="ledger-entry">
          <span className="ledger-entry__num">01</span>
          <h3>Document the Decision</h3>
          <p>Capture the problem, stakeholders, and every alternative considered — before the reasoning fades from memory.</p>
        </div>
        <div className="ledger-entry">
          <span className="ledger-entry__num">02</span>
          <h3>Route for Approval</h3>
          <p>Send it through reviewers and managers, with a full record of who approved what, and when.</p>
        </div>
        <div className="ledger-entry">
          <span className="ledger-entry__num">03</span>
          <h3>Search the Archive</h3>
          <p>Every past decision stays searchable — so the next person facing a similar problem starts from experience, not from scratch.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <span>Expert Decision Replay Platform &mdash; Infosys Springboard Internship 7.0</span>
      </footer>
    </div>
  );
}

export default Landing;