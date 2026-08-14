import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/dashboard.css";

function KnowledgeList({ decisionId }) {

    const [knowledge, setKnowledge] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadKnowledge();
    }, [decisionId]);

    const loadKnowledge = async () => {

        try {

            const response = await api.get(
                `/decisions/${decisionId}/knowledge`
            );

            setKnowledge(response.data);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    };

    if (loading) {

        return <h3>Loading Knowledge...</h3>;

    }

    return (

        <div className="dashboard-section">

            <h2>Knowledge Base</h2>

            <table className="decision-table">

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>Content</th>
                        <th>Source</th>
                        <th>Added At</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        knowledge.length > 0 ? (

                            knowledge.map((item) => (

                                <tr key={item.id}>

                                    <td>{item.id}</td>

                                    <td>{item.content}</td>

                                    <td>{item.source || "-"}</td>

                                    <td>
                                        {
                                            item.added_at
                                                ? new Date(
                                                      item.added_at
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
                                    No Knowledge Found
                                </td>

                            </tr>

                        )

                    }

                </tbody>

            </table>

        </div>

    );

}

export default KnowledgeList;