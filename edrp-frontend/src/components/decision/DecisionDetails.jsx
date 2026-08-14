import { useParams } from "react-router-dom";
import { useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import DecisionTabs from "../../components/decision/DecisionTabs";
import StatusBadge from "../../components/common/StatusBadge";

import dummyDecisions from "../../data/dummyDecisions";

import "../../styles/decision.css";

function DecisionDetails() {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("Overview");

  const decision = dummyDecisions.find(
    (item) => item.id === Number(id)
  );

  if (!decision) {
    return (
      <DashboardLayout>
        <h2>Decision Not Found</h2>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <div className="page-header">
        <h2>{decision.title}</h2>

        <StatusBadge status={decision.status} />
      </div>

      <DecisionTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* ---------------- Overview ---------------- */}

      {activeTab === "Overview" && (

        <div className="details-card">

          <h3>Decision Information</h3>

          <p>
            <strong>Description :</strong>
            <br />
            {decision.description}
          </p>

          <p>
            <strong>Owner :</strong>
            {decision.owner_name}
          </p>

          <p>
            <strong>Category :</strong>
            {decision.category_name}
          </p>

          <p>
            <strong>Created :</strong>
            {decision.created_at}
          </p>

          <p>
            <strong>Last Updated :</strong>
            {decision.updated_at}
          </p>

        </div>

      )}

      {/* ---------------- Alternatives ---------------- */}

      {activeTab === "Alternatives" && (
        <div className="details-card">
          <h3>Alternatives</h3>

          <p>
            Alternatives Table will come here.
          </p>
        </div>
      )}

      {/* ---------------- Knowledge ---------------- */}

      {activeTab === "Knowledge" && (
        <div className="details-card">
          <h3>Knowledge Base</h3>

          <p>
            Knowledge list will come here.
          </p>
        </div>
      )}

      {/* ---------------- Attachments ---------------- */}

      {activeTab === "Attachments" && (
        <div className="details-card">
          <h3>Attachments</h3>

          <p>
            Attachment list will come here.
          </p>
        </div>
      )}

      {/* ---------------- Versions ---------------- */}

      {activeTab === "Versions" && (
        <div className="details-card">
          <h3>Version History</h3>

          <p>
            Version History Table will come here.
          </p>
        </div>
      )}

      {/* ---------------- Discussion ---------------- */}

      {activeTab === "Discussion" && (
        <div className="details-card">
          <h3>Discussion</h3>

          <p>
            Comments, Meeting Notes and Rationale
            will come here.
          </p>
        </div>
      )}

    </DashboardLayout>
  );
}

export default DecisionDetails;