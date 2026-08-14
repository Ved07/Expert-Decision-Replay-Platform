import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";

import DashboardLayout from "../../components/layout/DashboardLayout";
import DecisionTable from "../../components/decision/DecisionTable";
import DecisionCard from "../../components/decision/DecisionCard";

import "../../styles/decision.css";

function DecisionList() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {

        try {

            const userResponse = await api.get("/users/me");
            setUser(userResponse.data);

            const decisionResponse = await api.get("/decisions");
            setDecisions(decisionResponse.data);

        } catch (err) {

            console.error(err);

            if (err.response?.status === 401) {

                localStorage.removeItem("access_token");
                navigate("/login");

            }

        } finally {

            setLoading(false);

        }

    };

    const deleteDecision = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this decision?"
        );

        if (!confirmDelete) return;

        try {

            await api.delete(`/decisions/${id}`);

            alert("Decision deleted successfully.");

            loadData();

        } catch (err) {

            console.error(err);

            alert(
                err.response?.data?.detail ||
                "Unable to delete decision."
            );

        }

    };

    if (loading) {

        return <h2>Loading...</h2>;

    }

    return (

        <DashboardLayout user={user}>

            <div className="page-header">

                <h2>
                    Decision Management
                </h2>

                <Link to="/decisions/create">

                    <button className="primary-btn">

                        + Create Decision

                    </button>

                </Link>

            </div>

            {/* Desktop */}

            <div className="desktop-view">

                <DecisionTable

                    decisions={decisions}

                    onDelete={deleteDecision}

                />

            </div>

            {/* Mobile */}

            <div className="mobile-view">

                {

                    decisions.map((decision) => (

                        <DecisionCard

                            key={decision.id}

                            decision={decision}

                        />

                    ))

                }

            </div>

        </DashboardLayout>

    );

}

export default DecisionList;