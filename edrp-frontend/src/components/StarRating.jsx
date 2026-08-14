import { useState } from "react";
import "./StarRating.css";

/**
 * Reusable star rating component.
 *
 * Two modes:
 * - readOnly: just displays a value (e.g. the average), no interaction
 * - interactive: lets the current user click a star to submit their own rating
 */
function StarRating({ value = 0, readOnly = false, onRate = null, size = "medium" }) {
  const [hovered, setHovered] = useState(0);

  const displayValue = hovered || value;

  function handleClick(starIndex) {
    if (readOnly || !onRate) return;
    onRate(starIndex);
  }

  return (
    <span className={`star-rating star-rating--${size} ${readOnly ? "star-rating--readonly" : ""}`}>
      {[1, 2, 3, 4, 5].map((starIndex) => (
        <span
          key={starIndex}
          className={`star ${starIndex <= Math.round(displayValue) ? "star--filled" : ""}`}
          onClick={() => handleClick(starIndex)}
          onMouseEnter={() => !readOnly && setHovered(starIndex)}
          onMouseLeave={() => !readOnly && setHovered(0)}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default StarRating;