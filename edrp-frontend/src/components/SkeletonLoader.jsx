import "./SkeletonLoader.css";

/**
 * Reusable shimmer skeleton loader.
 * variants: "card" | "list" | "row" | "text"
 * count: number of skeleton items to render
 */
function SkeletonLoader({ variant = "card", count = 1 }) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "card") {
    return (
      <div className="skeleton-wrapper">
        {items.map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-line skeleton-line--short" />
            <div className="skeleton-line skeleton-line--long" />
            <div className="skeleton-line skeleton-line--med" />
            <div className="skeleton-line skeleton-line--long" />
            <div className="skeleton-line skeleton-line--short" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="skeleton-wrapper">
        {items.map((i) => (
          <div key={i} className="skeleton-list-item">
            <div className="skeleton-line skeleton-line--short" style={{ width: "60px" }} />
            <div className="skeleton-line skeleton-line--long" style={{ flex: 1 }} />
            <div className="skeleton-badge" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div className="skeleton-wrapper">
        {items.map((i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-line" style={{ flex: 2 }} />
            <div className="skeleton-line" style={{ flex: 3 }} />
            <div className="skeleton-badge" />
            <div className="skeleton-badge" />
          </div>
        ))}
      </div>
    );
  }

  // text variant
  return (
    <div className="skeleton-wrapper">
      {items.map((i) => (
        <div key={i} className={`skeleton-line ${i % 3 === 2 ? "skeleton-line--short" : "skeleton-line--long"}`} />
      ))}
    </div>
  );
}

export default SkeletonLoader;
