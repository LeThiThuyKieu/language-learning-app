import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    GitBranch,
    BarChart2,
    MessageSquare,
    LogOut,
    Trophy,
    ClipboardList,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore.ts";

const menuItems = [
    { path: "/admin/dashboard",      icon: LayoutDashboard, label: "Dashboard",            iconBg: "bg-orange-100",  iconColor: "text-orange-500" },
    { path: "/admin/users",          icon: Users,           label: "Quản lý người dùng",   iconBg: "bg-blue-100",    iconColor: "text-blue-500" },
    { path: "/admin/skill-trees",    icon: GitBranch,       label: "Skill Trees",           iconBg: "bg-green-100",   iconColor: "text-green-600" },
    { path: "/admin/lessons",        icon: BookOpen,        label: "Bài học",               iconBg: "bg-purple-100",  iconColor: "text-purple-500" },
    { path: "/admin/placement-tests",icon: ClipboardList,   label: "Placement Tests",       iconBg: "bg-cyan-100",    iconColor: "text-cyan-600" },
    { path: "/admin/leaderboard",    icon: Trophy,          label: "Bảng xếp hạng",         iconBg: "bg-yellow-100",  iconColor: "text-yellow-500" },
    { path: "/admin/feedback",       icon: MessageSquare,   label: "Phản hồi",              iconBg: "bg-pink-100",    iconColor: "text-pink-500" },
    { path: "/admin/reports",        icon: BarChart2,       label: "Báo cáo",               iconBg: "bg-indigo-100",  iconColor: "text-indigo-500" },
];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuthStore();

    if (!isAuthenticated) return null;

    function handleLogout() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <aside className="w-64 bg-white border-r border-gray-100 min-h-screen flex flex-col">
            {/* Menu */}
            <div className="flex-1 px-4 py-5 overflow-y-auto">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
                    Quản trị
                </p>
                <nav className="space-y-0.5">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={[
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium",
                                    isActive
                                        ? "bg-primary-50 text-primary-700 font-semibold"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                ].join(" ")}
                            >
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.iconBg}`}>
                                    <Icon className={`w-4 h-4 ${isActive ? "text-primary-600" : item.iconColor}`}/>
                                </span>
                                <span>{item.label}</span>
                                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"/>}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Logout */}
            <div className="px-4 py-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-all text-sm font-medium"
                >
                    <LogOut className="w-4 h-4 shrink-0"/>
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
}
