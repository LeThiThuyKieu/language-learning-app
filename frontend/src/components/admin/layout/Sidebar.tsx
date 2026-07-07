import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Medal,
    BarChart2,
    MessagesSquare,
    ClipboardList,
    BookOpen,
    Mail,
    MessageCircle,
    Headphones,
    Bot,
    HelpCircle,
    ChevronDown,
    LogOut,
    TrendingUp,
    BookOpenText,
    BookMarked,
    RotateCcw,
    GraduationCap,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore.ts";
import ConfirmModal from "@/components/user/layout/ConfirmModal";

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuthStore();

    const isSupportActive  = location.pathname.startsWith("/admin/support-management");
    const isLearningActive = location.pathname.startsWith("/admin/learning") || location.pathname.startsWith("/admin/learn-progress");
    const isRevisionActive = location.pathname.startsWith("/admin/general-revision-progress") || location.pathname.startsWith("/admin/review-topics") || location.pathname.startsWith("/admin/revision-management");

    const [supportOpen,      setSupportOpen]      = useState(isSupportActive);
    const [learningOpen,     setLearningOpen]     = useState(isLearningActive);
    const [revisionOpen,     setRevisionOpen]     = useState(isRevisionActive);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        if (!location.pathname.startsWith("/admin/support-management")) setSupportOpen(false);
    }, [location.pathname]);

    if (!isAuthenticated) return null;

    const handleLogout = () => { logout(); navigate("/login"); };

    const navLink = (path: string, Icon: React.ElementType, label: string) => {
        const isActive = location.pathname === path || location.pathname.startsWith(path + "/");
        return (
            <Link key={path} to={path}
                className={["flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-sm font-medium",
                    isActive ? "bg-white shadow-md text-orange-500 font-semibold"
                             : "text-slate-500 hover:bg-white/60 hover:text-slate-700"].join(" ")}>
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-orange-500" : "text-slate-400"}`} strokeWidth={1.8} />
                <span>{label}</span>
            </Link>
        );
    };

    const subLink = (path: string, Icon: React.ElementType, label: string) => {
        const isActive = location.pathname === path || location.pathname.startsWith(path + "/");
        return (
            <Link key={path} to={path}
                className={["flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-sm font-medium",
                    isActive ? "bg-white shadow-sm text-orange-500 font-semibold"
                             : "text-slate-500 hover:bg-white/60 hover:text-slate-700"].join(" ")}>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-orange-500" : "text-slate-400"}`} strokeWidth={1.8} />
                <span>{label}</span>
            </Link>
        );
    };

    const groupBtn = (label: string, Icon: React.ElementType, isActive: boolean, open: boolean, toggle: () => void) => (
        <button onClick={toggle}
            className={["w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-sm font-medium",
                isActive ? "bg-white shadow-md text-orange-500 font-semibold"
                         : "text-slate-500 hover:bg-white/60 hover:text-slate-700"].join(" ")}>
            <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-orange-500" : "text-slate-400"}`} strokeWidth={1.8} />
            <span className="flex-1 text-left">{label}</span>
            <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${isActive ? "text-orange-400" : "text-slate-400"}`}
                strokeWidth={2}
            />
        </button>
    );

    return (
        <>
            <aside className="w-56 bg-gray-50 border-r border-gray-100 h-full flex flex-col shrink-0">
                <div className="flex-1 px-3 py-4 overflow-y-auto">
                    <nav className="space-y-1">
                        {navLink("/admin/dashboard",       LayoutDashboard, "Dashboard")}
                        {navLink("/admin/user-management", Users,           "User Management")}

                        {/* ── Learning group ── */}
                        <div>
                            {groupBtn("Learning", BookOpenText, isLearningActive, learningOpen, () => setLearningOpen(v => !v))}
                            {learningOpen && (
                                <div className="mt-1 ml-4 pl-3 border-l-2 border-orange-100 space-y-1">
                                    {subLink("/admin/learning",       BookMarked, "Questions")}
                                    {subLink("/admin/learn-progress", TrendingUp, "Progress")}
                                </div>
                            )}
                        </div>

                        {/* ── Revision group ── */}
                        <div>
                            {groupBtn("Revision", RotateCcw, isRevisionActive, revisionOpen, () => setRevisionOpen(v => !v))}
                            {revisionOpen && (
                                <div className="mt-1 ml-4 pl-3 border-l-2 border-orange-100 space-y-1">
                                    {subLink("/admin/general-revision-progress",        BookOpen,  "Progress")}
                                    {subLink("/admin/revision-management/topics",       BookMarked, "Topics")}
                                </div>
                            )}
                        </div>

                        {/* ── Support group ── */}
                        <div>
                            {groupBtn("Support", Headphones, isSupportActive, supportOpen, () => setSupportOpen(v => !v))}
                            {supportOpen && (
                                <div className="mt-1 ml-4 pl-3 border-l-2 border-orange-100 space-y-1">
                                    {subLink("/admin/support-management/email-support", Mail,          "Email")}
                                    {subLink("/admin/support-management/chat-support",  MessageCircle, "Chat")}
                                    {subLink("/admin/support-management/chatbot-rules", Bot,           "Chatbot Rules")}
                                    {subLink("/admin/support-management/faq",           HelpCircle,    "FAQ")}
                                </div>
                            )}
                        </div>

                        {navLink("/admin/exam-management",           GraduationCap, "Exam Tests")}
                        {navLink("/admin/badges",                    Medal,         "Badge")}
                        {navLink("/admin/placement-test-management", ClipboardList, "Placement Tests")}
                        {navLink("/admin/feedback",                  MessagesSquare,"Feedback")}
                        {navLink("/admin/reports",                   BarChart2,     "Reports")}
                    </nav>
                </div>

                <div className="px-3 py-4 border-t border-gray-100">
                    <button onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all">
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
