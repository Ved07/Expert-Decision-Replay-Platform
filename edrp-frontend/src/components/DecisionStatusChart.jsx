import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STATUS_COLORS = {
  Draft: "#6b6355",
  "Under Review": "#b08d57",
  Approved: "#3f6b4a",
  Rejected: "#a3352b",
  Archived: "#8a8378",
  Escalated: "#d97706",
};

function DecisionStatusChart({ statusData }) {
  // Convert { "Approved": 2, "Draft": 1 } into [{ name: "Approved", value: 2 }, ...]
  const chartData = Object.entries(statusData || {}).map(([name, value]) => ({ name, value }));

  if (chartData.length === 0) {
    return <p className="detail-section__empty">No decision data to chart yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            innerRadius={45}
            paddingAngle={3}
          >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#999"} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#f6f1e7",
            border: "1px solid #c9bfa8",
            borderRadius: "4px",
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            color: "#2b2621",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        />
        <Legend
          wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: "#6b6355" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default DecisionStatusChart;
