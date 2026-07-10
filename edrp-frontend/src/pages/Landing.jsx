import { Link } from "react-router-dom";
import "./Landing.css";

function Landing() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <span className="landing-nav__brand">Expert Decision Replay Platform</span>
        <div className="landing-nav__links">
          <Link to="/login" className="landing-nav__link">Log In</Link>
          <Link to="/register" className="landing-nav__cta">Register</Link>
        </div>
      </nav>

      <section className="landing-hero">
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
          <Link to="/register" className="btn-primary landing-hero__btn">
            Open an Account
          </Link>
          <Link to="/login" className="btn-ghost-light landing-hero__btn">
            Sign In
          </Link>
        </div>

        <div className="landing-stamp">
          <span>RECORDED</span>
        </div>
      </section>

      <section className="landing-ledger">
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
        <span>Expert Decision Replay Platform — Infosys Springboard Internship 7.0</span>
      </footer>
    </div>
  );
}

export default Landing;