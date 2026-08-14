import "./AuthCard.css";

function AuthCard({ title, children, footer }) {
  return (
    <div className="auth-page">
      {/* Decorative background rings */}
      <div className="auth-page__ring auth-page__ring--1" aria-hidden="true" />
      <div className="auth-page__ring auth-page__ring--2" aria-hidden="true" />

      <div className="auth-card">
        {/* Corner notch */}
        <div className="auth-card__notch" aria-hidden="true" />

        {/* Brass accent rule */}
        <div className="auth-card__accent-bar" aria-hidden="true" />

        <p className="auth-card__eyebrow">Expert Decision Replay Platform</p>
        <h1 className="auth-card__title">{title}</h1>
        {children}
        {footer && <div className="auth-card__footer">{footer}</div>}
      </div>
    </div>
  );
}

export default AuthCard;