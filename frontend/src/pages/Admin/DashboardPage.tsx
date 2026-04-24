import ChartCard from "@/components/admin/dashboard/ChartCard.tsx";
import DataTable from "@/components/admin/dashboard/DataTable.tsx";
import { IncomeOutcomeChart } from "@/components/admin/dashboard/Charts.tsx";
import StatusPieChart from "@/components/admin/dashboard/PieChart.tsx";
import {
    Users, Flame, Star, BookOpen,
    CheckCircle2, Clock, Users2, GraduationCap,
    TrendingUp, Rocket, FileBarChart2, Sparkles,
} from "lucide-react";

// Types
type StatItem = {
    label: string;
    value: string;
    pct: string;
    up: boolean;
    icon: React.ReactNode;
    iconBg: string;
    bar: string;
};

type LearnerRow = {
    id: string;
    customer: string;
    date: string;
    amount: string;
    status: string;
    tracking: string;
    avatar: string;
};

// Data
const statsRow1: StatItem[] = [
    { label: "Tổng người dùng",   value: "2,543",   pct: "+12%", up: true, icon: <Users size={20} className="text-orange-500" />,    iconBg: "bg-orange-50",  bar: "bg-orange-500" },
    { label: "Đang học",          value: "1,842",   pct: "+18%", up: true, icon: <Flame size={20} className="text-blue-500" />,      iconBg: "bg-blue-50",    bar: "bg-blue-500" },
    { label: "Tổng XP tích lũy",  value: "125,432", pct: "+25%", up: true, icon: <Star size={20} className="text-yellow-500" />,     iconBg: "bg-yellow-50",  bar: "bg-yellow-400" },
    { label: "Tiến độ bài học",   value: "68.5%",   pct: "+15%", up: true, icon: <BookOpen size={20} className="text-green-600" />,  iconBg: "bg-green-50",   bar: "bg-green-500" },
];

const statsRow2: StatItem[] = [
    { label: "Tỉ lệ hoàn thành",  value: "72.3%",   pct: "+8%",  up: true, icon: <CheckCircle2 size={20} className="text-purple-500" />,  iconBg: "bg-purple-50",  bar: "bg-purple-500" },
    { label: "Thời gian học TB",  value: "45 phút", pct: "+22%", up: true, icon: <Clock size={20} className="text-indigo-500" />,          iconBg: "bg-indigo-50",  bar: "bg-indigo-500" },
    { label: "Hoạt động hôm nay", value: "892",     pct: "+15%", up: true, icon: <Users2 size={20} className="text-pink-500" />,           iconBg: "bg-pink-50",    bar: "bg-pink-500" },
    { label: "Tỉ lệ chứng chỉ",  value: "38.2%",   pct: "+9%",  up: true, icon: <GraduationCap size={20} className="text-teal-600" />,   iconBg: "bg-teal-50",    bar: "bg-teal-500" },
];

const incomeOutcomeData = [
    { time: "00:00", income: 30, outcome: 20 },
    { time: "03:00", income: 50, outcome: 35 },
    { time: "06:00", income: 95, outcome: 50 },
    { time: "09:00", income: 110, outcome: 60 },
    { time: "12:00", income: 130, outcome: 75 },
    { time: "15:00", income: 115, outcome: 65 },
    { time: "18:00", income: 140, outcome: 80 },
    { time: "21:00", income: 120, outcome: 70 },
];

const statusData = [
    { name: "Not Started", value: 253,  fill: "#fe4d01" },
    { name: "In Progress",  value: 1732, fill: "#fbbf24" },
    { name: "Completed",    value: 50,   fill: "#10b981" },
];

const recentOrders: LearnerRow[] = [
    { id: "#USR001", customer: "Nguyễn Văn A", date: "10 Jan 2026", amount: "45/100 XP",  status: "In Progress", tracking: "LESSON-01", avatar: "https://i.pravatar.cc/150?img=1" },
    { id: "#USR002", customer: "Trần Thị B",   date: "08 Jan 2026", amount: "89/100 XP",  status: "Completed",   tracking: "LESSON-02", avatar: "https://i.pravatar.cc/150?img=2" },
    { id: "#USR003", customer: "Phạm Minh C",  date: "05 Jan 2026", amount: "23/100 XP",  status: "In Progress", tracking: "LESSON-03", avatar: "https://i.pravatar.cc/150?img=3" },
    { id: "#USR004", customer: "Lê Hồng D",    date: "20 Dec 2025", amount: "0/100 XP",   status: "Not Started", tracking: "LESSON-04", avatar: "https://i.pravatar.cc/150?img=4" },
    { id: "#USR005", customer: "Đỗ Anh E",     date: "16 Dec 2025", amount: "78/100 XP",  status: "Completed",   tracking: "LESSON-05", avatar: "https://i.pravatar.cc/150?img=5" },
];

// Sub-components
function StatCard({ item }: { item: StatItem }) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[160px]">
            {/* Top row: label + icon */}
            <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-slate-400">{item.label}</span>
                {/* Icon: filled, trong rounded square màu nhạt */}
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg}`}>
                    {item.icon}
                </span>
            </div>

            {/* Value + % */}
            <div className="flex items-end gap-2 mt-2">
                <span className="text-3xl font-extrabold text-[#1a2332] leading-none">{item.value}</span>
                <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-500 mb-1">
                    <TrendingUp size={11} />
                    {item.pct}
                </span>
            </div>

            {/* Bottom progress bar: nền xám + thanh màu */}
            <div className="mt-4 w-full h-2 rounded-full bg-gray-100">
                <div className={`h-2 w-3/5 rounded-full ${item.bar}`} />
            </div>
        </div>
    );
}

// Page
export default function DashboardPage() {
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
        { key: "date",     label: "Hoạt động cuối", width: "w-28" },
        { key: "amount",   label: "Tiến độ XP",     width: "w-28" },
        {
            key: "status",
            label: "Trạng thái",
            width: "w-32",
            render: (status: string) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    status === "Completed"   ? "bg-emerald-100 text-emerald-700" :
                    status === "In Progress" ? "bg-amber-100 text-amber-700"    :
                                              "bg-rose-100 text-rose-700"
                }`}>
                    {status === "Completed" ? "Hoàn thành" : status === "In Progress" ? "Đang học" : "Chưa bắt đầu"}
                </span>
            ),
        },
        { key: "tracking", label: "Mã bài học", width: "w-28" },
    ];

    return (
        <div className="space-y-6">
            {/* Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-primary-600 p-7 shadow-lg">
                {/* decorative circle */}
                <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute right-16 bottom-0 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />

                <div className="relative flex items-center gap-6">
                    <div className="flex-1">
                        <h1 className="text-3xl md:text-3xl font-extrabold text-white leading-tight">
                            Chào mừng đến Lion Admin
                        </h1>
                        <p className="mt-2 text-basic text-white/85 max-w-lg leading-relaxed">
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

            {/* Stats Row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsRow1.map((item) => <StatCard key={item.label} item={item} />)}
            </div>

            {/* Stats Row 2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsRow2.map((item) => <StatCard key={item.label} item={item} />)}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                    <ChartCard title="Hoạt động học tập hàng ngày">
                        <div className="flex gap-5 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                <span className="text-xs text-gray-500 font-medium">Thời gian học (phút)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                                <span className="text-xs text-gray-500 font-medium">XP tích lũy</span>
                            </div>
                        </div>
                        <IncomeOutcomeChart data={incomeOutcomeData} height={260} />
                    </ChartCard>
                </div>

                <ChartCard title="Trạng thái bài học">
                    <StatusPieChart data={statusData} height={220} />
                    <div className="mt-4 space-y-2.5">
                        {[
                            { label: "Chưa bắt đầu", count: "253",   dot: "bg-orange-500" },
                            { label: "Đang học",      count: "1,732", dot: "bg-amber-400" },
                            { label: "Hoàn thành",    count: "50",    dot: "bg-emerald-500" },
                        ].map((s) => (
                            <div key={s.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                                    <span className="text-xs text-gray-500 font-medium">{s.label}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-800">{s.count}</span>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </div>

            {/* Table */}
            <DataTable title="Tiến độ học tập của học viên" columns={tableColumns} data={recentOrders} />
        </div>
    );
}
