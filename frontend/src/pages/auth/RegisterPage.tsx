import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import toast from "react-hot-toast";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { Home } from "lucide-react";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }

        setLoading(true);

        try {
            await authService.register({ email, password, fullName });

            toast.success(
                "Đăng ký thành công! Vui lòng kiểm tra email để xác thực",
                { id: "verify-sent" }
            );

            navigate(`/verify-email?email=${encodeURIComponent(email)}`);
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
        <div className="h-[100dvh] w-full overflow-hidden bg-[#FFF8F1] font-sans lg:flex">

            {/* LEFT */}
            <div className="hidden lg:block lg:w-1/2 h-full relative bg-[#FEEED8]">
                <img
                    src="/auth/background.jpg"
                    alt="Lion Banner"
                    className="h-full w-full object-cover"
                />
            </div>

            {/* RIGHT */}
            <div className="relative flex h-full w-full items-center justify-center bg-white px-4 sm:px-6 lg:w-1/2 lg:px-10">

                <div className="relative w-full max-w-md pt-4 lg:max-w-lg">

                    {/* Home */}
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="absolute right-0 z-10 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm transition hover:bg-[#FFE0B2]"
                        style={{ top: -10 }}
                    >
                        <Home className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">
                            Trang chủ
                        </span>
                    </button>

                    {/* Title */}
                    <div className="mb-6 text-center">
                        <h2 className="text-3xl sm:text-4xl font-black text-[#1F2937] tracking-tight">
                            Đăng ký
                        </h2>
                    </div>

                    <form
                        className="space-y-4"
                        onSubmit={handleSubmit}
                    >
                        <div className="space-y-3">

                            {/* Fullname */}
                            <div className="space-y-1.5">
                                <label className="text-[14px] font-bold text-gray-700 ml-1">
                                    Họ và tên
                                </label>

                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) =>
                                        setFullName(e.target.value)
                                    }
                                    placeholder="Nguyễn Văn A"
                                    className="w-full px-4 py-3 bg-[#F3F4F6] rounded-[18px] focus:ring-2 focus:ring-[#FE4D01] outline-none font-medium"
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-[14px] font-bold text-gray-700 ml-1">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    placeholder="Email"
                                    className="w-full px-4 py-3 bg-[#F3F4F6] rounded-[18px] focus:ring-2 focus:ring-[#FE4D01] outline-none font-medium"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-[14px] font-bold text-gray-700 ml-1">
                                    Mật khẩu
                                </label>

                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Mật khẩu"
                                    className="w-full px-4 py-3 bg-[#F3F4F6] rounded-[18px] focus:ring-2 focus:ring-[#FE4D01] outline-none font-medium"
                                />
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label className="text-[14px] font-bold text-gray-700 ml-1">
                                    Nhập lại mật khẩu
                                </label>

                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu"
                                    className="w-full px-4 py-3 bg-[#F3F4F6] rounded-[18px] focus:ring-2 focus:ring-[#FE4D01] outline-none font-medium"
                                />

                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-xs font-medium ml-1 text-red-500">
                                        Mật khẩu xác nhận không khớp
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-full text-base font-semibold
                                text-orange-100
                                bg-[#D84315] hover:bg-[#BF360C]
                                shadow-md shadow-black/20
                                active:scale-[0.97]
                                transition-all
                                disabled:opacity-50"
                            >
                                {loading ? "Đang xử lý..." : "Đăng ký"}
                            </button>
                        </div>

                        {/* Login link */}
                        <div className="text-center">
                            <p className="text-gray-500 text-sm font-medium">
                                Đã có tài khoản?{" "}
                                <Link
                                    to="/login"
                                    className="font-bold text-[#FE4D01] hover:underline"
                                >
                                    Đăng nhập ngay
                                </Link>
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center my-4">
                            <div className="flex-1 h-px bg-gray-300"></div>

                            <span className="px-4 text-sm text-gray-400 font-medium">
                                Hoặc
                            </span>

                            <div className="flex-1 h-px bg-gray-300"></div>
                        </div>

                        {/* Social */}
                        <div className="flex justify-center gap-5">
                            <button
                                type="button"
                                title="Google"
                                className="group w-12 h-12 flex items-center justify-center rounded-full transition hover:shadow-md"
                            >
                                <FcGoogle
                                    size={34}
                                    className="group-hover:scale-110 transition"
                                />
                            </button>

                            <button
                                type="button"
                                title="Facebook"
                                className="group w-12 h-12 flex items-center justify-center rounded-full transition hover:shadow-md"
                            >
                                <FaFacebook
                                    size={32}
                                    className="text-[#1877F2] group-hover:scale-110 transition"
                                />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}