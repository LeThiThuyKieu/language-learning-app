import { MoreVertical } from "lucide-react";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-xs border border-gray-50 hover:shadow-sm hover:border-gray-100 transition-all duration-300">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-50">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      <div>{children}</div>
    </div>
  );
}


