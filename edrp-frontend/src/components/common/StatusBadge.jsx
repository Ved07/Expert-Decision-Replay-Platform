function StatusBadge({ status }) {
  const colors = {
    Draft: "#f59e0b",
    "In Review": "#3b82f6",
    Finalized: "#10b981",
  };

  return (
    <span
      style={{
        background: colors[status] || "#6b7280",
        color: "#fff",
        padding: "5px 12px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
      }}
    >
      {status}
    </span>
  );
}

export default StatusBadge;