import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    GitBranch,
    BarChart2,
    MessageSquare,
    Trophy,
    ClipboardList,
    Mail,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore.ts";

const menuItems = [
    { path: "/admin/dashboard",       icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/user_management", icon: Users,           label: "User Management" },
    { path: "/admin/support-management/email-support", icon: Mail, label: "Email Support" },
    { path: "/admin/skill-trees",     icon: GitBranch,       label: "Skill Trees" },
    { path: "/admin/lessons",         icon: BookOpen,        label: "Lessons" },
    { path: "/admin/placement-tests", icon: ClipboardList,   label: "Placement Tests" },
    { path: "/admin/leaderboard",     icon: Trophy,          label: "Rankings" },
    { path: "/admin/feedback",        icon: MessageSquare,   label: "Feedback" },
    { path: "/admin/reports",         icon: BarChart2,       label: "Reports" },
];

export default function Sidebar() {
    const location = useLocation();
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) return null;

    return (
        <aside className="w-56 bg-gray-50 border-r border-gray-100 min-h-screen flex flex-col shrink-0">
            <div className="flex-1 px-3 py-4 overflow-y-auto">
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            location.pathname === item.path ||
                            location.pathname.startsWith(item.path + "/");

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={[
                                    "relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-sm font-medium overflow-hidden",
                                    isActive
                                        ? "bg-white shadow-md text-orange-500 font-semibold"
                                        : "text-slate-500 hover:bg-white/60 hover:text-slate-700",
                                ].join(" ")}
                            >
                                {/* Active: icon màu cam | Inactive: icon trần màu slate */}
                                {isActive ? (
                                    <Icon
                                        className="w-5 h-5 shrink-0 text-orange-500"
                                        strokeWidth={1.8}
                                    />
                                ) : (
                                    <Icon className="w-5 h-5 shrink-0 text-slate-400" strokeWidth={1.8} />
                                )}

                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
