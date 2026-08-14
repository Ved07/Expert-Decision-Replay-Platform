import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";

function DecisionTable({ decisions, onDelete }) {

    return (

        <div className="table-container">

            <table className="decision-table">

                <thead>

                    <tr>

                        <th>Title</th>

                        <th>Status</th>

                        <th>Owner ID</th>

                        <th>Created</th>

                        <th>Updated</th>

                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        decisions.length > 0 ? (

                            decisions.map((decision) => (

                                <tr key={decision.id}>

                                    <td>
                                        {decision.title}
                                    </td>

                                    <td>
                                        <StatusBadge
                                            status={decision.status}
                                        />
                                    </td>

                                    <td>
                                        {decision.owner_id}
                                    </td>

                                    <td>
                                        {
                                            decision.created_at
                                                ? new Date(
                                                      decision.created_at
                                                  ).toLocaleDateString()
                                                : "-"
                                        }
                                    </td>

                                    <td>
                                        {
                                            decision.updated_at
                                                ? new Date(
                                                      decision.updated_at
                                                  ).toLocaleDateString()
                                                : "-"
                                        }
                                    </td>

                                    <td className="actions">

                                        <Link
                                            to={`/decisions/${decision.id}`}
                                        >

                                            <button className="view-btn">
                                                View
                                            </button>

                                        </Link>

                                        <Link
                                            to={`/decisions/${decision.id}/edit`}
                                        >

                                            <button className="edit-btn">
                                                Edit
                                            </button>

                                        </Link>

                                        <button
                                            className="delete-btn"
                                            onClick={() =>
                                                onDelete(decision.id)
                                            }
                                        >
                                            Delete
                                        </button>

                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td
                                    colSpan="6"
                                    style={{
                                        textAlign: "center",
                                        padding: "20px"
                                    }}
                                >
                                    No Decisions Found
                                </td>

                            </tr>

                        )

                    }

                </tbody>

            </table>

        </div>

    );

}

export default DecisionTable;