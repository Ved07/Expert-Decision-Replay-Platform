import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/dashboard.css";

function AlternativeList({ decisionId }) {

    const [alternatives, setAlternatives] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadAlternatives();

    }, [decisionId]);

    const loadAlternatives = async () => {

        try {

            const response = await api.get(
                `/decisions/${decisionId}/alternatives`
            );

            setAlternatives(response.data);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    };

    if (loading) {

        return <h3>Loading Alternatives...</h3>;

    }

    return (

        <div className="dashboard-section">

            <h2>Alternatives</h2>

            <table className="decision-table">

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Score</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        alternatives.length > 0 ? (

                            alternatives.map((item) => (

                                <tr key={item.id}>

                                    <td>{item.id}</td>

                                    <td>{item.title || "-"}</td>

                                    <td>{item.description}</td>

                                    <td>{item.score ?? "-"}</td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td
                                    colSpan="4"
                                    style={{ textAlign: "center" }}
                                >
                                    No Alternatives Found
                                </td>

                            </tr>

                        )

                    }

                </tbody>

            </table>

        </div>

    );

}

export default AlternativeList;