import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, ChevronDown, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { profileService } from "@/services/profileService";
import ConfirmModal from "./ConfirmModal";

const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/thumbs/svg?seed=Bear";

export default function Header() {
    const { user, logout, isAuthenticated } = useAuthStore();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    // 1. Xử lý Scroll hiệu quả hơn
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // 2. Fix lỗi Click Outside bằng useRef (Chuẩn React)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 3. Đóng mobile menu khi chuyển trang
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!isAuthenticated) {
            setAvatarUrl(DEFAULT_AVATAR);
            return;
        }

        let isMounted = true;

        const loadAvatar = async () => {
            try {
                const profile = await profileService.getMyProfile();
                if (isMounted) {
                    setAvatarUrl(profile.avatarUrl || DEFAULT_AVATAR);
                }
            } catch {
                if (isMounted) {
                    setAvatarUrl(DEFAULT_AVATAR);
                }
            }
        };

        void loadAvatar();

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated]);

    const navLinks = [
        { name: "Trang chủ", path: "/" },
        { name: "Khóa học", path: "/learn" },
        { name: "Hồ sơ", path: "/profile" },
    ];

    const confirmLogout = () => {
        logout();
        setMobileMenuOpen(false);
        setShowConfirm(false);
        setDropdownOpen(false);
    };

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${
                isScrolled
                    ? "bg-gray-900/95 backdrop-blur-md shadow-xl py-2"
                    : "bg-gray-900 py-4"
            }`}
        >
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link to="/" className="group flex items-center gap-2">
                        <div className="w-12 h-12 transition-transform group-hover:scale-110">
                            <img src="/logo/lion.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-3xl font-black text-white tracking-tighter">
                            L<span className="text-orange-500 italic">i</span>on
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-orange-500 ${
                                    location.pathname === link.path ? "text-orange-500" : "text-gray-300"
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* User Area */}
                    <div className="hidden md:flex items-center gap-4">
                        {isAuthenticated ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 p-1 pr-3 rounded-full transition-all"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden border bg-primary-50 ">
                                        <img
                                            src={avatarUrl}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="px-4 py-3 bg-gray-750 border-b border-gray-700">
                                            <p className="text-xs text-gray-500 truncate">Đang đăng nhập với</p>
                                            <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                                        </div>
                                        <Link to="/profile" className="flex items-center gap-2 px-4 py-3 text-gray-300 hover:bg-gray-700 transition">
                                            <User size={16} /> Hồ sơ của tôi
                                        </Link>
                                        <button
                                            onClick={() => setShowConfirm(true)}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 transition"
                                        >
                                            <LogOut size={16} /> Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-orange-900/20">
                                ĐĂNG NHẬP
                            </Link>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-gray-300 hover:bg-gray-800 rounded-lg transition"
                    >
                        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-gray-900 border-t border-gray-800 shadow-2xl p-4 space-y-2 animate-in slide-in-from-top duration-300">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`block p-3 rounded-lg font-semibold ${
                                location.pathname === link.path ? "bg-orange-500/10 text-orange-500" : "text-gray-300"
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                    {!isAuthenticated && (
                        <Link to="/login" className="block p-3 text-center bg-orange-600 text-white rounded-lg font-bold">
                            Đăng nhập
                        </Link>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmLogout}
                message="Bạn có chắc chắn muốn đăng xuất không?"
            />
        </header>
    );
}