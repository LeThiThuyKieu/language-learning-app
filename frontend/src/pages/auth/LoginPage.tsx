import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { profileService } from "@/services/profileService";
import { Eye, EyeOff, ArrowLeft, KeyRound, Mail, ShieldCheck, Lock } from "lucide-react";

const resolveBackendBaseUrl = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
    return apiBaseUrl.replace(/\/api\/?$/, "");
};

// ─── Forgot Password Modal ────────────────────────────────────────────────────
type ForgotStep = "email" | "otp" | "reset";

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState<ForgotStep>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown resend
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        try {
            // TODO: bỏ comment khi BE sẵn sàng
            await authService.forgotPassword(email.trim());
            toast.success("Mã OTP đã được gửi tới email của bạn");
            setStep("otp");
            setCountdown(60);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                toast.error(err.response?.data?.message || "Email không tồn tại trong hệ thống");
            } else {
                toast.error("Không thể gửi OTP, vui lòng thử lại");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        setLoading(true);
        try {
            // TODO: bỏ comment khi BE sẵn sàng
            await authService.forgotPassword(email.trim());
            toast.success("Đã gửi lại mã OTP");
            setCountdown(60);
        } catch {
            toast.error("Không thể gửi lại OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (idx: number, val: string) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[idx] = val;
        setOtp(next);
        if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    };

    const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[idx] && idx > 0) {
            otpRefs.current[idx - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(""));
            otpRefs.current[5]?.focus();
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join("");
        if (code.length < 6) { toast.error("Vui lòng nhập đủ 6 số"); return; }
        setLoading(true);
        try {
            // TODO: bỏ comment khi BE sẵn sàng
            await authService.verifyOtp(email.trim(), code);
            setStep("reset");
        } catch (err) {
            if (axios.isAxiosError(err)) {
                toast.error(err.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn");
            } else {
                toast.error("Xác thực thất bại");
            }
        } finally {
            setLoading(false);
        }
    };

    const hasMinLength = newPassword.length >= 8;
    const hasAlphanumeric = /[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasMinLength || !hasAlphanumeric) { toast.error("Mật khẩu chưa đáp ứng yêu cầu"); return; }
        if (newPassword !== confirmPassword) { toast.error("Mật khẩu xác nhận không khớp"); return; }
        setLoading(true);
        try {
            // TODO: bỏ comment khi BE sẵn sàng
            await authService.resetPassword(email.trim(), otp.join(""), newPassword);
            toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
            onClose();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                toast.error(err.response?.data?.message || "Đặt lại mật khẩu thất bại");
            } else {
                toast.error("Đặt lại mật khẩu thất bại");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        /* Overlay */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* ── BƯỚC 1: Nhập email ── */}
                {step === "email" && (
                    <div className="p-8">
                        {/* Icon */}
                        <div className="flex justify-center mb-5">
                            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                                <Mail className="w-8 h-8 text-[#D84315]" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-center text-[#1F2937] mb-2">Quên mật khẩu?</h2>
                        <p className="text-sm text-gray-500 text-center mb-7">
                            Nhập email của bạn, chúng tôi sẽ gửi mã OTP để xác thực.
                        </p>

                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wide">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Nhập địa chỉ email"
                                    className="w-full px-5 py-4 bg-[#F3F4F6] rounded-[16px] outline-none focus:ring-2 focus:ring-[#FE4D01] transition-all placeholder:text-gray-400 font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-full font-semibold text-orange-100 bg-[#D84315] hover:bg-[#BF360C] shadow-md shadow-black/20 active:scale-[0.97] transition-all disabled:opacity-50 mt-2"
                            >
                                {loading ? "Đang gửi..." : "Gửi mã OTP"}
                            </button>
                        </form>

                        <button
                            onClick={onClose}
                            className="w-full mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-[#FE4D01] hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại đăng nhập
                        </button>
                    </div>
                )}

                {/* ── BƯỚC 2: Nhập OTP ── */}
                {step === "otp" && (
                    <div className="p-8">
                        <div className="flex justify-center mb-5">
                            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                                <ShieldCheck className="w-8 h-8 text-[#D84315]" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-center text-[#1F2937] mb-2">Xác thực mã OTP</h2>
                        <p className="text-sm text-gray-500 text-center mb-1">
                            Vui lòng nhập mã OTP đã được gửi đến email của bạn
                        </p>
                        <p className="text-sm font-semibold text-[#D84315] text-center mb-7">{email}</p>

                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            {/* 6 ô OTP */}
                            <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => { otpRefs.current[idx] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                        className="w-12 h-14 text-center text-xl font-bold bg-[#F3F4F6] rounded-[14px] outline-none focus:ring-2 focus:ring-[#FE4D01] transition-all"
                                    />
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.join("").length < 6}
                                className="w-full py-4 rounded-full font-semibold text-orange-100 bg-[#D84315] hover:bg-[#BF360C] shadow-md shadow-black/20 active:scale-[0.97] transition-all disabled:opacity-50"
                            >
                                {loading ? "Đang xác nhận..." : "Xác nhận"}
                            </button>
                        </form>

                        <div className="text-center mt-5">
                            <p className="text-sm text-gray-500">Bạn chưa nhận được mã?</p>
                            <button
                                onClick={handleResend}
                                disabled={countdown > 0 || loading}
                                className="text-sm font-semibold text-[#FE4D01] hover:underline disabled:text-gray-400 disabled:no-underline mt-1"
                            >
                                {countdown > 0 ? `Gửi lại mã (${countdown}s)` : "Gửi lại mã"}
                            </button>
                        </div>

                        <button
                            onClick={() => setStep("email")}
                            className="w-full mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-[#FE4D01] hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </button>
                    </div>
                )}

                {/* ── BƯỚC 3: Tạo mật khẩu mới ── */}
                {step === "reset" && (
                    <div className="p-8">
                        <div className="flex justify-center mb-5">
                            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                                <KeyRound className="w-8 h-8 text-[#D84315]" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-center text-[#1F2937] mb-2">Tạo mật khẩu mới</h2>
                        <p className="text-sm text-gray-500 text-center mb-7">
                            Hãy thiết lập mật khẩu mới cho tài khoản của bạn
                        </p>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {/* Mật khẩu mới */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wide">Mật khẩu mới</label>
                                <div className="relative">
                                    <input
                                        type={showNew ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Nhập mật khẩu mới"
                                        className="w-full px-5 py-4 pr-12 bg-[#F3F4F6] rounded-[16px] outline-none focus:ring-2 focus:ring-[#FE4D01] transition-all placeholder:text-gray-400 font-medium"
                                    />
                                    <button type="button" onClick={() => setShowNew(!showNew)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Nhập lại */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wide">Nhập lại mật khẩu mới</label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Nhập lại mật khẩu"
                                        className="w-full px-5 py-4 pr-12 bg-[#F3F4F6] rounded-[16px] outline-none focus:ring-2 focus:ring-[#FE4D01] transition-all placeholder:text-gray-400 font-medium"
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Yêu cầu mật khẩu */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                                <p className="text-xs font-bold text-gray-500 mb-1">Yêu cầu mật khẩu:</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasMinLength ? "bg-emerald-500" : "bg-gray-200"}`}>
                                        {hasMinLength && <span className="text-white text-[10px] font-bold">✓</span>}
                                    </div>
                                    <span className={`text-xs font-medium ${hasMinLength ? "text-emerald-600" : "text-gray-500"}`}>
                                        Ít nhất 8 ký tự
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasAlphanumeric ? "bg-emerald-500" : "bg-gray-200"}`}>
                                        {hasAlphanumeric && <span className="text-white text-[10px] font-bold">✓</span>}
                                    </div>
                                    <span className={`text-xs font-medium ${hasAlphanumeric ? "text-emerald-600" : "text-gray-500"}`}>
                                        Bao gồm chữ cái và số
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !hasMinLength || !hasAlphanumeric || newPassword !== confirmPassword}
                                className="w-full py-4 rounded-full font-semibold text-orange-100 bg-[#D84315] hover:bg-[#BF360C] shadow-md shadow-black/20 active:scale-[0.97] transition-all disabled:opacity-50"
                            >
                                {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
                            </button>
                        </form>

                        <div className="flex items-center justify-center mt-4">
                            <Lock className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                            <span className="text-xs text-gray-400">Thông tin được mã hóa và bảo mật</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();

    const socialConfig = useMemo(() => ({ backendBaseUrl: resolveBackendBaseUrl() }), []);

    const navigateAfterLogin = async (roles?: string[]) => {
        if (roles?.includes("ADMIN")) { navigate("/admin/dashboard"); return; }
        try {
            const profile = await profileService.getMyProfile();
            const levelId = profile.currentLevelId;
            if (levelId) {
                const level = levelId === 1 ? "beginner" : levelId === 2 ? "intermediate" : "advanced";
                navigate("/learn", { state: { level } });
            } else {
                navigate("/welcome");
            }
        } catch {
            navigate("/");
        }
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get("token");
        const socialError = queryParams.get("error");
        if (socialError) {
            toast.error("Đăng nhập mạng xã hội không thành công");
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }
        if (!token) return;

        const completeOAuth2Login = async () => {
            setLoading(true);
            try {
                localStorage.setItem("token", token);
                const response = await authService.getCurrentUser();
                setAuth(response, token);
                toast.success("Đăng nhập mạng xã hội thành công!");
                window.history.replaceState({}, document.title, window.location.pathname);
                await navigateAfterLogin(response.roles);
            } catch (error) {
                localStorage.removeItem("token");
                window.history.replaceState({}, document.title, window.location.pathname);
                if (axios.isAxiosError(error)) {
                    toast.error(error.response?.data?.message || "Đăng nhập mạng xã hội thất bại");
                } else {
                    toast.error("Đăng nhập mạng xã hội thất bại");
                }
            } finally {
                setLoading(false);
            }
        };
        void completeOAuth2Login();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await authService.login({ email, password });
            setAuth(response.user, response.token);
            toast.success("Đăng nhập thành công!");
            await navigateAfterLogin(response.user.roles);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Đăng nhập thất bại");
            } else {
                toast.error("Đăng nhập thất bại");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className={`h-screen w-full flex overflow-hidden bg-white font-sans transition-all duration-300 ${showForgot ? "blur-sm brightness-75" : ""}`}>
                {/* BÊN TRÁI */}
                <div className="hidden lg:block lg:w-1/2 h-full relative bg-[#FEEED8]">
                    <img src="/auth/background.jpg" alt="Banner" className="h-full w-full object-cover" />
                </div>

                {/* BÊN PHẢI */}
                <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-white">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-10">
                            <h2 className="text-4xl font-black text-[#1F2937] tracking-tight">Đăng nhập</h2>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-5">
                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-[15px] font-bold text-gray-700 ml-1">Email</label>
                                    <input
                                        type="email" required value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email"
                                        className="w-full px-5 py-4 bg-[#F3F4F6] border-none rounded-[20px] focus:ring-2 focus:ring-[#FE4D01] outline-none transition-all placeholder:text-gray-400 font-medium"
                                    />
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[15px] font-bold text-gray-700">Mật khẩu</label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mật khẩu"
                                            className="w-full px-5 py-4 pr-12 bg-[#F3F4F6] border-none rounded-[20px] focus:ring-2 focus:ring-[#FE4D01] outline-none transition-all placeholder:text-gray-400 font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="flex justify-end pr-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowForgot(true)}
                                            className="text-[13px] font-semibold text-[#FE4D01] hover:underline"
                                        >
                                            Quên mật khẩu?
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit" disabled={loading}
                                    className="w-full py-4 rounded-full text-lg font-semibold text-orange-100 bg-[#D84315] hover:bg-[#BF360C] shadow-md shadow-black/20 active:scale-[0.97] transition-all disabled:opacity-50"
                                >
                                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                                </button>
                            </div>

                            <div className="text-center mt-8">
                                <p className="text-gray-500 font-medium">
                                    Chưa có tài khoản?{" "}
                                    <Link to="/register" className="font-bold text-[#FE4D01] hover:underline transition-colors">
                                        Đăng ký ngay
                                    </Link>
                                </p>
                            </div>

                            <div className="flex items-center my-6">
                                <div className="flex-1 h-px bg-gray-300"></div>
                                <span className="px-4 text-sm text-gray-400 font-medium">Hoặc</span>
                                <div className="flex-1 h-px bg-gray-300"></div>
                            </div>

                            <div className="flex justify-center gap-6">
                                <button type="button" title="Google"
                                    onClick={() => window.location.href = `${socialConfig.backendBaseUrl}/oauth2/authorization/google`}
                                    disabled={loading}
                                    className="group w-14 h-14 flex items-center justify-center rounded-full bg-transparent transition-all duration-200 hover:shadow-md hover:shadow-black/15 active:scale-95 disabled:opacity-50">
                                    <FcGoogle size={40} className="transition-transform duration-200 group-hover:scale-110" />
                                </button>
                                <button type="button" title="Facebook"
                                    onClick={() => window.location.href = `${socialConfig.backendBaseUrl}/oauth2/authorization/facebook`}
                                    disabled={loading}
                                    className="group w-14 h-14 flex items-center justify-center rounded-full bg-transparent transition-all duration-200 hover:shadow-md hover:shadow-black/15 active:scale-95 disabled:opacity-50">
                                    <FaFacebook size={38} className="text-[#1877F2] transition-transform duration-200 group-hover:scale-110" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Modal quên mật khẩu */}
            {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
        </>
    );
}
