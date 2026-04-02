import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  percentage: number;
  isIncrease: boolean;
  icon?: React.ReactNode;
  chart?: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  percentage,
  isIncrease,
  icon,
  chart,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-xs border border-gray-50 hover:shadow-sm hover:border-gray-100 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        {icon && <div className="text-3xl opacity-60 group-hover:opacity-80 transition-opacity">{icon}</div>}
      </div>

      {chart && <div className="mb-3">{chart}</div>}

      <div
        className={`flex items-center gap-1 text-xs font-semibold ${
          isIncrease ? "text-emerald-600" : "text-rose-600"
        }`}
      >
        {isIncrease ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span>
          {isIncrease ? "+" : "-"}
          {Math.abs(percentage)}%
        </span>
      </div>
    </div>
  );
}


