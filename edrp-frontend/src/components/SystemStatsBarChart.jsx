import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function SystemStatsBarChart({ totalUsers, totalTeams, totalDecisions }) {
  const data = [
    { name: "Users", value: totalUsers, fill: "#12181f" },
    { name: "Teams", value: totalTeams, fill: "#b08d57" },
    { name: "Decisions", value: totalDecisions, fill: "#3f6b4a" },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#6b6355" }}
          axisLine={{ stroke: "#c9bfa8" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#6b6355" }}
          axisLine={{ stroke: "#c9bfa8" }}
          tickLine={false}
        />
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
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default SystemStatsBarChart;