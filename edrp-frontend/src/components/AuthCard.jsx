import "./AuthCard.css";

function AuthCard({ title, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__notch" />
        <p className="auth-card__eyebrow">Expert Decision Replay Platform</p>
        <h1 className="auth-card__title">{title}</h1>
        {children}
        {footer && <div className="auth-card__footer">{footer}</div>}
      </div>
    </div>
  );
}

export default AuthCard;