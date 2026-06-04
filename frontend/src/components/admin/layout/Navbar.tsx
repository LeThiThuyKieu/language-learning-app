import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore.ts";
import { LogOut, Settings, User } from "lucide-react";
import ConfirmModal from "@/components/user/layout/ConfirmModal";
import { profileService, UserProfileDetail } from "@/services/profileService";

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [profile, setProfile] = useState<UserProfileDetail | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isAuthenticated) {
            profileService.getMyProfile().then(setProfile).catch(() => {});
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = () => { logout(); navigate("/login"); };

    const displayName = profile?.fullName?.trim() || user?.email || "Admin";
    const avatarLetter = displayName.charAt(0).toUpperCase();

    return (
        <>
            <nav className="bg-white border-b border-gray-100 shadow-xs">
                <div className="px-6 py-3">
                    <div className="flex items-center">
                        <Link
                            to="/admin/dashboard"
                            className="group flex items-center gap-3 shrink-0"
                            style={{ marginLeft: "200px" }}
                        >
                            <div className="relative w-14 h-14 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                                <img src="/logo/lion.png" alt="Lion Logo" className="w-full h-full object-contain drop-shadow-xl" />
                            </div>
                            <div className="relative">
                                <span className="text-5xl font-black tracking-tighter text-gray-900 transition-all group-hover:tracking-normal">
                                    L<span className="text-primary-600 italic">i</span>on
                                </span>
                                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-orange-400 transition-all duration-300 group-hover:w-full rounded-full" />
                            </div>
                        </Link>

                        <div className="flex-1" />

                        {isAuthenticated ? (
                            <div className="flex items-center gap-4 mr-[100px]">
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setMenuOpen((v) => !v)}
                                        className="flex items-center gap-3 text-gray-700 hover:text-primary-600 transition-colors focus:outline-none"
                                    >
                                        {profile?.avatarUrl ? (
                                            <img src={profile.avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover shrink-0 shadow-md" />
                                        ) : (
                                            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md">
                                                {avatarLetter}
                                            </div>
                                        )}
                                        <div className="flex flex-col leading-tight text-left">
                                            <span className="text-base font-semibold text-gray-800 max-w-[200px] truncate">{displayName}</span>
                                            <span className="text-xs font-bold text-primary-600 tracking-widest uppercase">Admin</span>
                                        </div>
                                    </button>

                                    {menuOpen && (
                                        <div className="absolute left-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                                            <Link
                                                to="/admin/profile"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-primary-600 transition-colors"
                                            >
                                                <User className="w-4 h-4 shrink-0" />
                                                Profile
                                            </Link>
                                            <Link
                                                to="/admin/settings"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-primary-600 transition-colors"
                                            >
                                                <Settings className="w-4 h-4 shrink-0" />
                                                Cài đặt
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="text-gray-500 hover:text-rose-500 transition-colors"
                                    title="Đăng xuất"
                                >
                                    <LogOut className="w-6 h-6" />
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-sm">
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                message="Bạn có chắc chắn muốn đăng xuất không?"
            />
        </>
    );
}
