import { Link } from "react-router-dom";

function DiscussionTable({ discussions }) {

    return (

        <div className="table-container">

            <table className="discussion-table">

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>Title</th>
                        <th>Created By</th>
                        <th>Created At</th>
                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        discussions.length > 0 ?

                        discussions.map((discussion) => (

                            <tr key={discussion.id}>

                                <td>{discussion.id}</td>

                                <td>

                                    <strong>

                                        {discussion.title}

                                    </strong>

                                </td>

                                <td>

                                    {discussion.created_by}

                                </td>

                                <td>

                                    {

                                        new Date(
                                            discussion.created_at
                                        ).toLocaleString()

                                    }

                                </td>

                                <td>

                                   <Link
                                    to={`/decisions/${discussion.decision_id}/discussion/${discussion.id}`}
                                    className="view-btn"
                                >
                                    View
                                </Link>

                                </td>

                            </tr>

                        ))

                        :

                        <tr>

                            <td
                                colSpan="5"
                                className="no-data"
                            >
                                No Discussions Found
                            </td>

                        </tr>

                    }

                </tbody>

            </table>

        </div>

    );

}

export default DiscussionTable;