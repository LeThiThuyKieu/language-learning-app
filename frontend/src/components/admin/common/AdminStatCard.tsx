import { TrendingUp, TrendingDown } from "lucide-react";

export type AdminStatCardProps = {
    label: string;
    value: string;
    icon: React.ReactNode;
    iconBg: string;
    iconText: string;
    borderColor: string;
    change?: string;
    trend?: "up" | "down";
    pulsing?: boolean;
};

/**
 * Stat card dùng chung cho Dashboard và User Management và các trang khác
 */
export default function AdminStatCard({ label, value, icon, iconBg, iconText, borderColor, change, trend, pulsing }: AdminStatCardProps) {
    return (
        <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 ${borderColor}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <span className={iconText}>{icon}</span>
                </div>
            </div>

            {change && (
                <div className="mt-4 flex items-center gap-2">
                    {pulsing ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-500">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                            </span>
                            {change}
                        </div>
                    ) : (
                        <div className={`flex items-center gap-1 text-xs font-bold ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
                            {trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {change}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
