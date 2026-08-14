import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";

function DecisionCard({ decision }) {
  return (
    <div className="decision-card">

      <h3>{decision.title}</h3>

      <p>{decision.description}</p>

      <p>
        <strong>Category :</strong>{" "}
        {decision.category_name}
      </p>

      <p>
        <strong>Owner :</strong>{" "}
        {decision.owner_name}
      </p>

      <StatusBadge status={decision.status} />


      <div className="card-actions">

        <Link to={`/decisions/${decision.id}`}>
          <button className="view-btn">
            View
          </button>
        </Link>


        <Link to={`/decisions/${decision.id}/edit`}>
          <button className="edit-btn">
            Edit
          </button>
        </Link>


      </div>

    </div>
  );
}

export default DecisionCard;