import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface LineChartComponentProps {
  data: any[];
  height?: number;
}

export function IncomeOutcomeChart({ data, height = 300 }: LineChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="outcomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1f2937" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#1f2937" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="time" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#fbbf24"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#incomeGradient)"
        />
        <Area
          type="monotone"
          dataKey="outcome"
          stroke="#1f2937"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#outcomeGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({ data, height = 300 }: LineChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#fbbf24"
          strokeWidth={0}
          fillOpacity={0.6}
          fill="url(#barGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}


