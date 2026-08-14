import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function SystemStatsBarChart({ totalUsers, totalTeams, totalDecisions }) {
  const data = [
    { name: "Users", value: totalUsers, fill: "#12181F" },
    { name: "Teams", value: totalTeams, fill: "#b08d57" },
    { name: "Decisions", value: totalDecisions, fill: "#3f6b4a" },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
            background: "var(--paper)",
            border: "1px solid var(--line)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
          }}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default SystemStatsBarChart;