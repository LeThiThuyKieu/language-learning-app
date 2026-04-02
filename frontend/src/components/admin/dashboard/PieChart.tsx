import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface PieChartComponentProps {
  data: any[];
  height?: number;
}

export default function StatusPieChart({
  data,
  height = 300,
}: PieChartComponentProps) {
  const COLORS = ["#ef4444", "#fbbf24", "#1f2937"];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `${value}`}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}



