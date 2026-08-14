import React from "react";
import "./ErrorBoundary.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unexpected error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-card">
            <div className="error-boundary-icon-wrapper">
              <span className="error-boundary-icon">⚠</span>
            </div>
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-desc">
              The application encountered an unexpected runtime error. We've captured the issue details so you can continue safely.
            </p>

            <div className="error-boundary-actions">
              <button
                className="error-boundary-btn error-boundary-btn--primary"
                onClick={this.handleReload}
                type="button"
              >
                Reload Page
              </button>
              <button
                className="error-boundary-btn error-boundary-btn--secondary"
                onClick={this.handleGoHome}
                type="button"
              >
                Return to Dashboard
              </button>
            </div>

            {this.state.error && (
              <div className="error-boundary-details">
                <button
                  className="error-boundary-details-toggle"
                  onClick={this.toggleDetails}
                  type="button"
                >
                  {this.state.showDetails ? "Hide Error Details ▲" : "Show Error Details ▼"}
                </button>
                {this.state.showDetails && (
                  <pre className="error-boundary-stack">
                    <strong>{this.state.error?.toString()}</strong>
                    <br />
                    {this.state.errorInfo?.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
