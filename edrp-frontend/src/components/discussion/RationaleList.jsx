import { useEffect, useState } from "react";
import api from "../../services/api";

function RationaleList({ decisionId }) {

    const [rationales, setRationales] = useState([]);

    useEffect(() => {
        loadRationales();
    }, [decisionId]);

    const loadRationales = async () => {

        try {

            const response = await api.get(
                `/decisions/${decisionId}/rationale`
            );

            setRationales(response.data);

        } catch (error) {

            console.error(error);

        }

    };

    const handleAddRationale = async () => {

        const rationale = prompt("Enter Decision Rationale");

        if (!rationale) return;

        try {

            await api.post(
                `/decisions/${decisionId}/rationale`,
                {
                    rationale
                }
            );

           await loadRationales();

        } catch (error) {

            console.error(error);

            alert("Failed to add rationale");

        }

    };

    return (

        <div>

            <div className="section-header">

                <h2>Decision Rationale</h2>

                <button
                    className="approve-btn"
                    onClick={handleAddRationale}
                >
                    + Add Rationale
                </button>

            </div>

            <div className="profile-card">

                {

                    rationales.length > 0 ?

                    rationales.map((item) => (

                        <div
                            key={item.id}
                            className="discussion-item"
                        >

                            <p>{item.rationale}</p>

                            <p>

                                <strong>Created By :</strong>

                                {item.created_by}

                            </p>

                            <small>

                                {

                                    new Date(
                                        item.created_at
                                    ).toLocaleString()

                                }

                            </small>

                            <hr />

                        </div>

                    ))

                    :

                    <p>No Rationale Found</p>

                }

            </div>

        </div>

    );

}

export default RationaleList;