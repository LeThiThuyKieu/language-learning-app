import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
    MessageCircle,
    Headphones,
    ChevronDown,
    LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore.ts";
import ConfirmModal from "@/components/user/layout/ConfirmModal";

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuthStore();

    const isSupportActive = location.pathname.startsWith("/admin/support-management");
    const [supportOpen, setSupportOpen] = useState(isSupportActive);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Đóng group Support khi navigate sang trang khác
    useEffect(() => {
        if (!location.pathname.startsWith("/admin/support-management")) {
            setSupportOpen(false);
        }
    }, [location.pathname]);

    if (!isAuthenticated) return null;

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navLink = (path: string, Icon: React.ElementType, label: string) => {
        const isActive = location.pathname === path || location.pathname.startsWith(path + "/");
        return (
            <Link
                key={path}
                to={path}
                className={[
                    "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-sm font-medium",
                    isActive
                        ? "bg-white shadow-md text-orange-500 font-semibold"
                        : "text-slate-500 hover:bg-white/60 hover:text-slate-700",
                ].join(" ")}
            >
                <Icon
                    className={`w-5 h-5 shrink-0 ${isActive ? "text-orange-500" : "text-slate-400"}`}
                    strokeWidth={1.8}
                />
                <span>{label}</span>
            </Link>
        );
    };

    return (
        <>
            <aside className="w-56 bg-gray-50 border-r border-gray-100 h-full flex flex-col shrink-0">
                <div className="flex-1 px-3 py-4 overflow-y-auto">
                    <nav className="space-y-1">
                        {navLink("/admin/dashboard",                 LayoutDashboard, "Dashboard")}
                        {navLink("/admin/user-management",           Users,           "User Management")}

                        {/* ── Support group ── */}
                        <div>
                            <button
                                onClick={() => setSupportOpen((v) => !v)}
                                className={[
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-sm font-medium",
                                    isSupportActive
                                        ? "bg-white shadow-md text-orange-500 font-semibold"
                                        : "text-slate-500 hover:bg-white/60 hover:text-slate-700",
                                ].join(" ")}
                            >
                                <Headphones
                                    className={`w-5 h-5 shrink-0 ${isSupportActive ? "text-orange-500" : "text-slate-400"}`}
                                    strokeWidth={1.8}
                                />
                                <span className="flex-1 text-left">Support</span>
                                <ChevronDown
                                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${supportOpen ? "rotate-180" : ""} ${isSupportActive ? "text-orange-400" : "text-slate-400"}`}
                                    strokeWidth={2}
                                />
                            </button>

                            {supportOpen && (
                                <div className="mt-1 ml-4 pl-3 border-l-2 border-orange-100 space-y-1">
                                    {[
                                        { path: "/admin/support-management/email-support", icon: Mail,          label: "Email" },
                                        { path: "/admin/support-management/chat-support",  icon: MessageCircle, label: "Chat" },
                                    ].map(({ path, icon: Icon, label }) => {
                                        const isActive = location.pathname === path || location.pathname.startsWith(path + "/");
                                        return (
                                            <Link
                                                key={path}
                                                to={path}
                                                className={[
                                                    "flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-sm font-medium",
                                                    isActive
                                                        ? "bg-white shadow-sm text-orange-500 font-semibold"
                                                        : "text-slate-500 hover:bg-white/60 hover:text-slate-700",
                                                ].join(" ")}
                                            >
                                                <Icon
                                                    className={`w-4 h-4 shrink-0 ${isActive ? "text-orange-500" : "text-slate-400"}`}
                                                    strokeWidth={1.8}
                                                />
                                                <span>{label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {navLink("/admin/skill-trees",               GitBranch,       "Skill Trees")}
                        {navLink("/admin/lessons",                   BookOpen,        "Lessons")}
                        {navLink("/admin/placement-test-management", ClipboardList,   "Placement Tests")}
                        {navLink("/admin/leaderboard",               Trophy,          "Rankings")}
                        {navLink("/admin/feedback",                  MessageSquare,   "Feedback")}
                        {navLink("/admin/reports",                   BarChart2,       "Reports")}
                    </nav>
                </div>

                {/* Logout */}
                <div className="px-3 py-4 border-t border-gray-100">
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                        <LogOut className="w-5 h-5 shrink-0 text-slate-400" strokeWidth={1.8} />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                message="Bạn có chắc chắn muốn đăng xuất không?"
            />
        </>
    );
}
