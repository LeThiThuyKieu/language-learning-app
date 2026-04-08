import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import toast from "react-hot-toast";
import axios from "axios";
import {FcGoogle} from "react-icons/fc";
import {FaFacebook} from "react-icons/fa";
import { profileService } from "@/services/profileService";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await authService.register({ email, password, fullName });
            setAuth(response.user, response.token);
            toast.success("Đăng ký thành công!");

            try {
                const profile = await profileService.getMyProfile();
                const levelId = profile.currentLevelId;

                if (levelId) {
                    const level =
                        levelId === 1
                            ? "beginner"
                            : levelId === 2
                            ? "intermediate"
                            : "advanced";
                    navigate("/learn", { state: { level } });
                } else {
                    navigate("/welcome");
                }
            } catch {
                navigate("/welcome");
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Đăng ký thất bại");
            } else {
                toast.error("Đăng ký thất bại");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        /* H-SCREEN W-FULL để chiếm toàn bộ trình duyệt */
        <div className="h-screen w-full flex overflow-hidden bg-white font-sans">

            {/* BÊN TRÁI: HÌNH ẢNH FULL MÀN HÌNH */}
            <div className="hidden lg:block lg:w-1/2 h-full relative bg-[#FEEED8]">
                <img
                    src="/auth/background.jpg"
                    alt="Lion Banner"
                    /* - h-full w-full: chiếm hết diện tích bên trái
                       - object-cover: giúp ảnh lấp đầy mà không bị bóp méo
                    */
                    className="h-full w-full object-cover"
                />
            </div>

            {/* BÊN PHẢI: FORM ĐĂNG KÝ */}
            <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-white">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-black text-[#1F2937] tracking-tight">
                            Đăng ký
                        </h2>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            {/* Họ và tên */}
                            <div className="space-y-2">
                                <label className="text-[15px] font-bold text-gray-700 ml-1">Họ và tên</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full px-5 py-4 bg-[#F3F4F6] border-none rounded-[20px] focus:ring-2 focus:ring-[#FE4D01] outline-none transition-all placeholder:text-gray-400 font-medium"
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-[15px] font-bold text-gray-700 ml-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                    className="w-full px-5 py-4 bg-[#F3F4F6] border-none rounded-[20px] focus:ring-2 focus:ring-[#FE4D01] outline-none transition-all placeholder:text-gray-400 font-medium"
                                />
                            </div>

                            {/* Mật khẩu */}
                            <div className="space-y-2">
                                <label className="text-[15px] font-bold text-gray-700 ml-1">Mật khẩu</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mật khẩu"
                                    className="w-full px-5 py-4 bg-[#F3F4F6] border-none rounded-[20px] focus:ring-2 focus:ring-[#FE4D01] outline-none transition-all placeholder:text-gray-400 font-medium"
                                />
                            </div>
                        </div>

                        {/* Nút Đăng ký: Bo góc tròn mạnh như mẫu */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-full text-lg font-semibold
                                text-orange-100
                                bg-[#D84315] hover:bg-[#BF360C]
                                shadow-md shadow-black/20
                                active:scale-[0.97] transition-all disabled:opacity-50"                           >
                                {loading ? "Đang xử lý..." : "Đăng ký"}
                            </button>
                        </div>

                        {/* Link chuyển sang Đăng nhập */}
                        <div className="text-center mt-8">
                            <p className="text-gray-500 font-medium">
                                Đã có tài khoản?{" "}
                                <Link to="/login" className="font-bold text-[#FE4D01] hover:underline transition-colors">
                                    Đăng nhập ngay
                                </Link>
                            </p>
                        </div>
                        {/* Divider */}
                        <div className="flex items-center my-6">
                            <div className="flex-1 h-px bg-gray-300"></div>
                            <span className="px-4 text-sm text-gray-400 font-medium">
                                    Hoặc
                                </span>
                            <div className="flex-1 h-px bg-gray-300"></div>
                        </div>

                        {/* Social login */}
                        <div className="flex justify-center gap-6">

                            {/* Google */}
                            <button
                                type="button"
                                title="Google"
                                className="group w-14 h-14 flex items-center justify-center rounded-full
                                bg-transparent
                                transition-all duration-200 ease-out
                                hover:bg-transparent hover:shadow-md hover:shadow-black/15
                                active:scale-95"
                            >
                                <FcGoogle
                                    size={40}
                                    className="transition-transform duration-200 group-hover:scale-110"
                                />
                            </button>

                            {/* Facebook */}
                            <button
                                type="button"
                                title="Facebook"
                                className="group w-14 h-14 flex items-center justify-center rounded-full
                                bg-transparent
                                transition-all duration-200 ease-out
                                hover:bg-transparent hover:shadow-md hover:shadow-black/15
                                active:scale-95"
                            >
                                <FaFacebook
                                    size={38}
                                    className="text-[#1877F2] transition-transform duration-200 group-hover:scale-110"
                                />
                            </button>

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}