import {useState, useEffect} from "react";
import {Link, useLocation} from "react-router-dom";
import {Menu, X, LogOut, ChevronRight} from "lucide-react";
import {useAuthStore} from "@/store/authStore";
import ConfirmModal from "./ConfirmModal";

export default function Header() {
    const {user, logout, isAuthenticated} = useAuthStore();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();
    const [showConfirm, setShowConfirm] = useState(false);

    // Hiệu ứng đổi màu nền UserProfileCard khi cuộn trang
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        {name: "Trang chủ", path: "/"},
        {name: "Khóa học", path: "/learn"},
        {name: "Hồ sơ", path: "/profile"},
    ];

    const handleLogout = () => setShowConfirm(true);
    const confirmLogout = () => {
        logout();
        setMobileMenuOpen(false);
        setShowConfirm(false);
    };

    return (
        <header className={`sticky top-0 z-50 transition-all duration-300 ${
            isScrolled
                ? "bg-gray-900/90 backdrop-blur-md shadow-lg py-2"
                : "bg-gray-900 py-4"
        }`}>
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link to="/" className="group flex items-center gap-2">
                        {/* 1. Hình sư tử */}
                        <div
                            className="relative w-14 h-14 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                            <img
                                src="/logo/lion.png"
                                alt="Lion Logo"
                                className="w-full h-full object-contain drop-shadow-xl"
                            />
                        </div>
                        {/* 2. Tên web */}
                        <div className="relative">
                        <span
                            className="text-4xl font-black tracking-tighter text-white transition-all group-hover:tracking-normal">
                            L<span className="text-primary-500 italic">i</span>on
                        </span>
                            {/* Dấu gạch chân trang trí dưới Logo */}
                            <div
                                className="absolute -bottom-1 left-0 w-0 h-1 bg-gradient-to-r from-primary-600 to-orange-400 transition-all duration-300 group-hover:w-full rounded-full"></div>
                        </div>
                    </Link>

                    {/* menu */}
                    <div className="hidden md:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`relative text-base font-bold uppercase transition-colors hover:text-primary-400 ${
                                    location.pathname === link.path ? "text-primary-500" : "text-gray-300"
                                } group`}
                            >
                                {link.name}
                                {/* Line chạy dưới chân khi active hoặc hover */}
                                <span
                                    className={`absolute -bottom-2 left-0 h-[2px] bg-primary-500 transition-all duration-300 ${
                                        location.pathname === link.path ? "w-full" : "w-0 group-hover:w-full"
                                    }`}></span>
                            </Link>
                        ))}
                    </div>

                    {/* infomation */}
                    <div className="hidden md:flex items-center gap-6">
                        {isAuthenticated ? (
                            <div
                                className="flex items-center gap-4 bg-gray-800/50 p-1 pr-4 rounded-full border border-gray-700">
                                <div
                                    className="w-9 h-9 bg-gradient-to-br from-primary-500 to-orange-500 rounded-full flex items-center justify-center font-black text-white shadow-lg">
                                    {user?.email?.charAt(0).toUpperCase() || "L"}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center w-9 h-9 rounded-full
                                    bg-gray-700/50 hover:bg-red-500/20
                                    text-gray-400 hover:text-red-400
                                    transition-all duration-300
                                    border border-gray-600 hover:border-red-400
                                    shadow-sm hover:shadow-md"
                                >
                                    <LogOut className="w-4 h-4"/>
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                            >
                                Đăng nhập
                            </Link>
                        )}
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg bg-gray-800 text-primary-500 border border-gray-700 shadow-inner"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
                    </button>
                </div>
            </nav>

            {/* Mobile menu (responsive) */}
            <div className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${
                mobileMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            }`}>
                <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-xl pt-24 px-6">
                    <div className="flex flex-col gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex justify-between items-center text-2xl font-black text-white hover:text-primary-500 transition-colors border-b border-gray-800 pb-4"
                            >
                                {link.name}
                                <ChevronRight className="text-gray-600"/>
                            </Link>
                        ))}

                        <div className="mt-8">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => {
                                        logout();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center justify-center gap-3 py-4 bg-red-600/10 text-red-500 rounded-2xl font-bold border border-red-500/20 shadow-lg"
                                >
                                    <LogOut className="w-5 h-5"/>
                                    Đăng xuất hệ thống
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block py-5 bg-gradient-to-r from-primary-600 to-orange-500 text-white rounded-2xl text-center text-xl font-bold shadow-xl shadow-primary-900/40"
                                >
                                    Bắt đầu học ngay
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmLogout}
                message="Bạn có chắc chắn muốn đăng xuất không?"
            />
        </header>
    );
}

