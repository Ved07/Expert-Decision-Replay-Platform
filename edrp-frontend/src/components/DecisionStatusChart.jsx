import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STATUS_COLORS = {
  Draft: "#6b6355",
  "Under Review": "#b08d57",
  Approved: "#3f6b4a",
  Rejected: "#a3352b",
  Archived: "#8a8378",
};

function DecisionStatusChart({ statusData }) {
  // Convert { "Approved": 2, "Draft": 1 } into [{ name: "Approved", value: 2 }, ...]
  const chartData = Object.entries(statusData).map(([name, value]) => ({ name, value }));

  if (chartData.length === 0) {
    return <p className="detail-section__empty">No decision data to chart yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ name, value }) => `${name}: ${value}`}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#999"} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
          }}
        />
        <Legend
          wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default DecisionStatusChart;

