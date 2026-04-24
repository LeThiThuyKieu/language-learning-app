import { Users, Zap, Ban, UserPlus, TrendingUp, TrendingDown } from "lucide-react";

type StatMetric = {
    label: string;
    value: string;
    icon: string;
    color: "orange" | "blue" | "red" | "green";
    change: string;
    trend?: "up" | "down";
    pulsing?: boolean;
};

const iconMap: Record<string, React.ElementType> = { Users, Zap, Ban, UserPlus };

const colorMap: Record<string, { border: string; iconBg: string; iconText: string }> = {
    orange: { border: "border-l-orange-500", iconBg: "bg-orange-50",  iconText: "text-orange-500" },
    blue:   { border: "border-l-blue-500",   iconBg: "bg-blue-50",    iconText: "text-blue-500" },
    red:    { border: "border-l-red-500",     iconBg: "bg-red-50",     iconText: "text-red-500" },
    green:  { border: "border-l-green-500",   iconBg: "bg-green-50",   iconText: "text-green-500" },
};

export default function UserStatsCard({ metric }: { metric: StatMetric }) {
    const Icon = iconMap[metric.icon];
    const c = colorMap[metric.color];

    return (
        <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 ${c.border}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{metric.label}</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{metric.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                    <Icon className={`w-6 h-6 ${c.iconText}`} />
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                {metric.pulsing ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                        </span>
                        {metric.change}
                    </div>
                ) : (
                    <div className={`flex items-center gap-1 text-xs font-bold ${metric.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                        {metric.trend === "up"
                            ? <TrendingUp className="w-4 h-4" />
                            : <TrendingDown className="w-4 h-4" />
                        }
                        {metric.change}
                    </div>
                )}
            </div>
        </div>
    );
}
