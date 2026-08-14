import { Link } from "react-router-dom";
import api from "../../services/api";

function AlternativeTable({ alternatives, onDeleted }) {

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this alternative?"
        );

        if (!confirmDelete) return;

        try {

            await api.delete(`/alternatives/${id}`);

            alert("Alternative deleted successfully.");

            if (onDeleted) {
                onDeleted();
            }

        } catch (error) {

            console.error("Delete Error:", error);

            alert("Failed to delete alternative.");

        }

    };

    return (

        <div className="table-container">

            <table className="alternative-table">

                <thead>

                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Pros</th>
                        <th>Cons</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>

                </thead>

                <tbody>

                    {

                        alternatives.length > 0 ?

                        alternatives.map((item) => (

                            <tr key={item.id}>

                                <td>{item.id}</td>

                                <td>
                                    <strong>
                                        {item.title || "-"}
                                    </strong>
                                </td>

                                <td>{item.description}</td>

                                <td>{item.pros || "-"}</td>

                                <td>{item.cons || "-"}</td>

                                <td>{item.score ?? "-"}</td>

                                <td>

                                    <span
                                        className={
                                            item.is_selected
                                                ? "status selected"
                                                : "status pending"
                                        }
                                    >
                                        {
                                            item.is_selected
                                                ? "Selected"
                                                : "Not Selected"
                                        }
                                    </span>

                                </td>

                                <td>

                                    <Link
                                        to={`/alternatives/${item.id}`}
                                        className="view-btn"
                                    >
                                        View
                                    </Link>

                                    <Link
                                        to={`/alternatives/edit/${item.id}`}
                                        className="edit-btn"
                                    >
                                        Edit
                                    </Link>

                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        ))

                        :

                        <tr>

                            <td
                                colSpan="8"
                                className="no-data"
                            >
                                No Alternatives Found
                            </td>

                        </tr>

                    }

                </tbody>

            </table>

        </div>

    );

}

export default AlternativeTable;