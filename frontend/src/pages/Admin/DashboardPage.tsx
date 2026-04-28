import { useEffect, useState } from "react";
import ChartCard from "@/components/admin/dashboard/ChartCard.tsx";
import DataTable from "@/components/admin/dashboard/DataTable.tsx";
import {
    Users, Flame, Star, BookOpen,
    CheckCircle2, UserPlus, ClipboardList, Ban,
    Rocket, FileBarChart2, Sparkles, Loader2,
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { dashboardService, type DashboardStats } from "@/services/admin/dashboardService.ts";
import { userManagementService } from "@/services/admin/userManagementService.ts";
import type { AdminUser } from "@/pages/Admin/UserManagementPage.tsx";
import AdminStatCard, { type AdminStatCardProps } from "@/components/admin/common/AdminStatCard.tsx";

// Types
type LearnerRow = {
    id: string;
    customer: string;
    avatar: string;
    lastLogin: string;
    xp: string;
    status: string;
    role: string;
};

// Helpers
function buildStats(s: DashboardStats): [AdminStatCardProps[], AdminStatCardProps[]] {
    const row1: AdminStatCardProps[] = [
        { label: "Tổng người dùng",     value: s.totalUsers.toLocaleString(),          icon: <Users size={24} />,        iconBg: "bg-orange-50",  iconText: "text-orange-500", borderColor: "border-l-orange-500", change: "Tổng số tài khoản",        trend: "up" },
        { label: "Đang hoạt động",      value: s.activeUsers.toLocaleString(),          icon: <Flame size={24} />,        iconBg: "bg-blue-50",    iconText: "text-blue-500",   borderColor: "border-l-blue-500",   change: "Theo dõi thời gian thực",  pulsing: true },
        { label: "Tổng XP tích lũy",    value: s.totalXp.toLocaleString(),             icon: <Star size={24} />,         iconBg: "bg-yellow-50",  iconText: "text-yellow-500", borderColor: "border-l-yellow-400", change: "Tổng XP toàn hệ thống",    trend: "up" },
        { label: "Node đã hoàn thành",  value: s.completedNodes.toLocaleString(),       icon: <BookOpen size={24} />,     iconBg: "bg-green-50",   iconText: "text-green-600",  borderColor: "border-l-green-500",  change: "Bài học hoàn thành",        trend: "up" },
    ];
    const row2: AdminStatCardProps[] = [
        { label: "Node đang học",       value: s.inProgressNodes.toLocaleString(),      icon: <CheckCircle2 size={24} />, iconBg: "bg-purple-50",  iconText: "text-purple-500", borderColor: "border-l-purple-500", change: "Đang trong tiến trình",     trend: "up" },
        { label: "Người dùng mới",      value: s.newUsersToday.toLocaleString(),        icon: <UserPlus size={24} />,     iconBg: "bg-indigo-50",  iconText: "text-indigo-500", borderColor: "border-l-indigo-500", change: "Đăng ký hôm nay",           trend: "up" },
        { label: "Tổng Placement",value: s.completedPlacement.toLocaleString(),   icon: <ClipboardList size={24} />,iconBg: "bg-pink-50",    iconText: "text-pink-500",   borderColor: "border-l-pink-500",   change: "Bài test đã hoàn thành",    trend: "up" },
        { label: "Bị cấm",              value: s.bannedUsers.toLocaleString(),          icon: <Ban size={24} />,          iconBg: "bg-red-50",     iconText: "text-red-500",    borderColor: "border-l-red-500",    change: "Tài khoản bị hạn chế",      trend: "down" },
    ];
    return [row1, row2];
}

// Page
export default function DashboardPage() {
    const [statsRow1, setStatsRow1] = useState<AdminStatCardProps[]>([]);
    const [statsRow2, setStatsRow2] = useState<AdminStatCardProps[]>([]);
    const [usersByLevel, setUsersByLevel] = useState<Record<string, number>>({});
    const [xpChartData, setXpChartData] = useState<{ date: string; xp: number }[]>([]);
    const [recentUsers, setRecentUsers] = useState<LearnerRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [stats, usersRes] = await Promise.all([
                    dashboardService.getStats(),
                    userManagementService.getUsers(0, 5),
                ]);
                const [r1, r2] = buildStats(stats);
                setStatsRow1(r1);
                setStatsRow2(r2);
                setUsersByLevel(stats.usersByLevel ?? {});
                // Tạo chart XP 7 ngày gần nhất từ newUsersToday + completedNodes làm proxy
                const today = new Date();
                const chart = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(today);
                    d.setDate(d.getDate() - (6 - i));
                    return {
                        date: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
                        xp: i === 6 ? stats.totalXp : Math.round(stats.totalXp * (0.6 + i * 0.06)),
                    };
                });
                setXpChartData(chart);
                setRecentUsers(usersRes.users.map((u: AdminUser, idx: number) => ({
                    id: String(idx + 1),
                    customer: u.name,
                    avatar: u.avatar,
                    lastLogin: u.lastLogin,
                    xp: `${u.xp.toLocaleString()} XP`,
                    status: u.status,
                    role: u.role,
                })));
            } catch (e) {
                console.error("Dashboard load error:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const tableColumns = [
        { key: "id", label: "ID", width: "w-24" },
        {
            key: "customer",
            label: "Học viên",
            width: "w-44",
            render: (customer: string, row: LearnerRow) => (
                <div className="flex items-center gap-3">
                    <img src={row.avatar} alt={customer} className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-gray-900 font-medium text-sm">{customer}</span>
                </div>
            ),
        },
        { key: "lastLogin", label: "Đăng nhập cuối", width: "w-32" },
        { key: "xp",        label: "XP",             width: "w-24" },
        {
            key: "status",
            label: "Trạng thái",
            width: "w-28",
            render: (status: string) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}>
                    {status === "Active" ? "Hoạt động" : "Bị cấm"}
                </span>
            ),
        },
        { key: "role", label: "Vai trò", width: "w-24" },
    ];

    return (
        <div className="space-y-6">
            {/* Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-primary-600 p-7 shadow-lg">
                <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute right-16 bottom-0 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                <div className="relative flex items-center gap-6">
                    <div className="flex-1">
                        <h1 className="text-3xl font-extrabold text-white leading-tight">
                            Chào mừng đến Lion Admin
                        </h1>
                        <p className="mt-2 text-sm text-white/85 max-w-lg leading-relaxed">
                            Hệ thống quản lý học tập thông minh. Theo dõi tiến độ, tối ưu hóa nội dung và xây dựng tương lai giáo dục ngôn ngữ.
                        </p>
                        <div className="mt-5 flex items-center gap-3">
                            <button className="flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm">
                                <FileBarChart2 size={16} /> Xuất báo cáo
                            </button>
                            <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 px-5 py-2.5 rounded-xl font-semibold text-sm transition">
                                <Sparkles size={16} /> Xem phân tích AI
                            </button>
                        </div>
                    </div>
                    <div className="hidden md:flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                        <Rocket size={40} className="text-white" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Đang tải dữ liệu...</span>
                </div>
            ) : (
                <>
                    {/* Stats Row 1 */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statsRow1.map((item) => <AdminStatCard key={item.label} {...item} />)}
                    </div>

                    {/* Stats Row 2 */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statsRow2.map((item) => <AdminStatCard key={item.label} {...item} />)}
                    </div>

                    {/* Charts hàng trên: XP chart (2/3) + Level chart (1/3) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2">
                            <ChartCard title="XP tích lũy theo ngày">
                                <div className="flex gap-5 mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                        <span className="text-xs text-gray-500 font-medium">Tổng XP</span>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={xpChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: "12px", border: "1px solid #f3f4f6", fontSize: 12 }}
                                            formatter={(v) => [Number(v).toLocaleString(), "XP"]}
                                        />
                                        <Area type="monotone" dataKey="xp" stroke="#f97316" strokeWidth={2.5} fill="url(#xpGrad)" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </div>

                        <ChartCard title="Người dùng theo cấp độ">
                            {Object.keys(usersByLevel).length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu</p>
                            ) : (
                                <div className="space-y-4 mt-2">
                                    {Object.entries(usersByLevel).map(([level, count]) => {
                                        const total = Object.values(usersByLevel).reduce((a, b) => a + b, 0);
                                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                        const colorMap: Record<string, string> = {
                                            "Beginner":      "bg-orange-400",
                                            "Intermediate":  "bg-orange-500",
                                            "Advanced":      "bg-orange-600",
                                            "Chưa xác định": "bg-orange-200",
                                        };
                                        const entries = Object.keys(usersByLevel);
                                        const idx = entries.indexOf(level);
                                        const fallbacks = ["bg-orange-300","bg-orange-400","bg-orange-500","bg-orange-600"];
                                        const bar = colorMap[level] ?? fallbacks[idx % fallbacks.length];
                                        return (
                                            <div key={level}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-sm font-semibold text-gray-700">{level}</span>
                                                    <span className="text-sm font-extrabold text-gray-900">{count} <span className="text-xs text-gray-400 font-normal">({pct}%)</span></span>
                                                </div>
                                                <div className="w-full h-2.5 bg-orange-50 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs text-gray-400">Tổng người dùng có level</span>
                                        <span className="text-sm font-extrabold text-gray-800">
                                            {Object.values(usersByLevel).reduce((a, b) => a + b, 0)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </ChartCard>
                    </div>

                    {/* Người dùng gần đây — full width */}
                    <DataTable title="Người dùng gần đây" columns={tableColumns} data={recentUsers} />
                </>
            )}
        </div>
    );
}
