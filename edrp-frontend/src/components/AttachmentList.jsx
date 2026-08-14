import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/dashboard.css";

function AttachmentList({ decisionId }) {

    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadAttachments();

    }, [decisionId]);

    const loadAttachments = async () => {

        try {

            const response = await api.get(
                `/decisions/${decisionId}/attachments`
            );

            setAttachments(response.data);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    };

    if (loading) {

        return <h3>Loading Attachments...</h3>;

    }

    return (

        <div className="dashboard-section">

            <h2>Attachments</h2>

            <table className="decision-table">

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>File Name</th>
                        <th>File Type</th>
                        <th>Uploaded At</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        attachments.length > 0 ? (

                            attachments.map((item) => (

                                <tr key={item.id}>

                                    <td>{item.id}</td>

                                    <td>{item.file_name}</td>

                                    <td>{item.file_type}</td>

                                    <td>
                                        {
                                            item.uploaded_at
                                                ? new Date(
                                                      item.uploaded_at
                                                  ).toLocaleDateString()
                                                : "-"
                                        }
                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td
                                    colSpan="4"
                                    style={{ textAlign: "center" }}
                                >
                                    No Attachments Found
                                </td>

                            </tr>

                        )

                    }

                </tbody>

            </table>

        </div>

    );

}

export default AttachmentList;