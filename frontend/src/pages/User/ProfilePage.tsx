import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserProfileCard from "@/components/user/profile/UserProfileCard.tsx";
import Stats from "../../components/user/profile/Stats";
import BadgesGrid from "../../components/user/profile/BadgesGrid";
import Activity from "../../components/user/profile/Activity";
import AvatarSelection from "../../components/user/profile/AvatarSelection";
import AccuracyStats from "../../components/user/profile/AccuracyStats";
import PersonalBest from "../../components/user/profile/PersonalBest";
import BadgeProgress from "../../components/user/profile/BadgeProgress";
import { profileService, UserProfileDetail } from "@/services/profileService";
import ProfileSkeleton from "@/components/user/profile/ProfileSkeleton";
import { useAuthStore } from "@/store/authStore";
import GuestProfilePrompt from "@/components/user/GuestPrompt";
import { DEFAULT_AVATAR_URL } from "@/constants/avatarOptions";
import { authService } from "@/services/authService";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

const formatNumber = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

export default function ProfilePage() {
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfileDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingAvatar, setIsSavingAvatar] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);
    const [nameDraft, setNameDraft] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Thông tin auth của user (hasPassword, authProvider) — lấy thẳng từ profile
    const hasPassword = profile?.hasPassword ?? null;
    const authProvider = profile?.authProvider ?? null;

    // Password modal state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            setErrorMessage(null);
            const data = await profileService.getMyProfile();
            console.log("[ProfilePage] profile data:", JSON.stringify({ hasPassword: data.hasPassword, authProvider: data.authProvider }));
            setProfile(data);
        } catch {
            setErrorMessage("Không thể tải dữ liệu hồ sơ. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            setIsLoading(false);
            setProfile(null);
            return;
        }
        void fetchProfile();
    }, [isAuthenticated]);

    const openPasswordModal = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsPasswordModalOpen(true);
    };

    const handleSavePassword = async () => {
        if (newPassword.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }
        setIsSavingPassword(true);
        try {
            if (hasPassword) {
                if (!currentPassword) { toast.error("Vui lòng nhập mật khẩu hiện tại"); setIsSavingPassword(false); return; }
                await authService.changePassword({ currentPassword, newPassword, confirmNewPassword: confirmPassword });
                toast.success("Đổi mật khẩu thành công!");
            } else {
                await authService.setPassword(newPassword, confirmPassword);
                toast.success("Tạo mật khẩu thành công! Bạn có thể đăng nhập bằng email từ bây giờ.");
                // Cập nhật profile state để UI phản ánh ngay
                setProfile((prev) => prev ? { ...prev, hasPassword: true } : prev);
            }
            setIsPasswordModalOpen(false);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                toast.error(err.response?.data?.message || "Thao tác thất bại");
            } else {
                toast.error("Thao tác thất bại");
            }
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleUpdateAvatar = async (newUrl: string) => {
        if (!profile) return;

        try {
            setIsSavingAvatar(true);
            const updated = await profileService.updateMyProfile({ avatarUrl: newUrl });
            setProfile(updated);
            setIsModalOpen(false);
        } catch {
            setErrorMessage("Cập nhật ảnh đại diện thất bại. Vui lòng thử lại.");
        } finally {
            setIsSavingAvatar(false);
        }
    };

    const displayName = profile?.fullName?.trim() || profile?.email || "Người dùng";
    const isLevelUndefined = !profile?.currentLevelCefr && !profile?.currentLevelName;
    const levelDisplay = isLevelUndefined
        ? "Bạn thuộc cấp độ nào? Cùng khám phá nhé!"
        :  profile?.currentLevelName + "";
    const avatarUrl = profile?.avatarUrl || DEFAULT_AVATAR_URL;

    const openEditNameModal = () => {
        setNameDraft(profile?.fullName?.trim() || "");
        setIsNameModalOpen(true);
    };

    const handleUpdateName = async () => {
        if (!profile) return;

        const trimmedName = nameDraft.trim();
        if (!trimmedName) {
            setErrorMessage("Tên không được để trống.");
            return;
        }

        try {
            setIsSavingName(true);
            setErrorMessage(null);
            const updated = await profileService.updateMyProfile({ fullName: trimmedName });
            setProfile(updated);
            setIsNameModalOpen(false);
        } catch {
            setErrorMessage("Cập nhật tên thất bại. Vui lòng thử lại.");
        } finally {
            setIsSavingName(false);
        }
    };

    // 🔥 LOCK SCROLL khi mở modal
    useEffect(() => {
        if (isModalOpen || isNameModalOpen || isPasswordModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [isModalOpen, isNameModalOpen, isPasswordModalOpen]);

    if (isLoading) {
        return (
            <div className="bg-primary-50/30 min-h-screen">
                <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-10">
                    <ProfileSkeleton />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <GuestProfilePrompt />;
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-primary-50/30 flex items-center justify-center px-6">
                <div className="text-center">
                    <p className="text-red-600 font-bold mb-3">{errorMessage || "Không có dữ liệu hồ sơ."}</p>
                    <button
                        onClick={() => void fetchProfile()}
                        className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold"
                    >
                        Tải lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ================= MAIN PAGE ================= */}
            <div className="bg-primary-50/30 min-h-screen flex flex-col font-sans">
                <div className="flex-1">
                    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-10 pt-0">

                        <div className="bg-white rounded-none sm:rounded-3xl shadow-sm border-b sm:border border-primary-100 overflow-hidden mb-0 sm:mb-7">
                            <UserProfileCard
                                name={displayName}
                                level={levelDisplay}
                                showLevelLabel={!isLevelUndefined}
                                avatarUrl={avatarUrl}
                                onAvatarClick={() => setIsModalOpen(true)}
                                onEditNameClick={openEditNameModal}
                                onLevelClick={isLevelUndefined ? () => navigate("/welcome") : undefined}
                            />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-0 sm:gap-7 items-start">

                            <div className="xl:col-span-2 space-y-5 sm:space-y-7">
                                <div className="rounded-none sm:rounded-3xl border-b sm:border border-primary-100 shadow-sm">
                                    <Stats
                                        streak={profile.streakCount}
                                        xp={formatNumber(profile.totalXp)}
                                        rank={profile.rankPosition ?? "--"}
                                    />
                                </div>

                                <div className="px-4 sm:px-0 space-y-5 sm:space-y-7">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                                        <AccuracyStats percent={profile.completionRate} />
                                        <PersonalBest
                                            highestStreak={profile.streakCount}
                                            totalXp={profile.totalXp}
                                            totalLessons={profile.completedNodes}
                                        />
                                    </div>

                                    <BadgesGrid badges={profile.badges} />

                                    {/* ── Mật khẩu & Bảo mật ── */}
                                    <div className="rounded-3xl border border-primary-100 bg-white shadow-sm p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center">
                                                <Lock className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-sm">Mật khẩu & Bảo mật</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {authProvider === "GOOGLE" && "Tài khoản Google"}
                                                    {authProvider === "FACEBOOK" && "Tài khoản Facebook"}
                                                    {authProvider === "LOCAL" && "Tài khoản email"}
                                                </p>
                                            </div>
                                        </div>

                                        {hasPassword === null ? (
                                            // Đang tải thông tin
                                            <div className="h-12 bg-gray-100 rounded-2xl animate-pulse" />
                                        ) : hasPassword === false ? (
                                            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-800">Bạn chưa đặt mật khẩu</p>
                                                    <p className="text-xs text-amber-600 mt-0.5">Tạo mật khẩu để đăng nhập bằng email</p>
                                                </div>
                                                <button
                                                    onClick={openPasswordModal}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shrink-0 ml-3"
                                                >
                                                    <KeyRound className="w-3.5 h-3.5" />
                                                    Tạo mật khẩu
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">Mật khẩu đã được thiết lập</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Cập nhật định kỳ để bảo vệ tài khoản</p>
                                                </div>
                                                <button
                                                    onClick={openPasswordModal}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold transition shrink-0 ml-3"
                                                >
                                                    <KeyRound className="w-3.5 h-3.5" />
                                                    Đổi mật khẩu
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="xl:col-span-1 px-4 sm:px-0 mt-5 sm:mt-0">
                                <div className="xl:sticky xl:top-6 space-y-5 sm:space-y-7">
                                    <BadgeProgress
                                        completionRate={profile.completionRate}
                                        completedNodes={profile.completedNodes}
                                        totalNodes={profile.totalNodes}
                                    />
                                    <Activity
                                        weeklyData={profile.weeklyActivityXp}
                                        todayXp={profile.todayXp}
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ================= MODAL ================= */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center sm:p-4">

                        {/* MOBILE: full screen | DESKTOP: modal */}
                        <div className="
                        fixed inset-0
                        w-screen h-[100dvh]
                        bg-white
                        flex flex-col

                        sm:relative sm:inset-auto sm:w-full
                        sm:max-w-2xl sm:h-auto
                        sm:rounded-3xl
                        sm:shadow-2xl sm:max-h-[92dvh]
                    ">

                            {/* HEADER */}
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="font-bold text-lg">Chọn ảnh đại diện</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 text-2xl"
                                    disabled={isSavingAvatar}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* CONTENT */}
                            <div className="p-4 sm:p-6">
                                <AvatarSelection
                                    onSelect={handleUpdateAvatar}
                                    currentValue={avatarUrl}
                                />
                            </div>
                        </div>
                    </div>

                )}
                {isNameModalOpen && (
                    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
                        <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-6">
                            <h3 className="text-lg font-black text-[#1f1a17]">Đổi tên hiển thị</h3>
                            <p className="text-sm text-slate-600 mt-1">Tên mới sẽ được lưu vào hồ sơ của bạn.</p>

                            <input
                                value={nameDraft}
                                onChange={(e) => setNameDraft(e.target.value)}
                                maxLength={100}
                                placeholder="Nhập tên mới"
                                className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-primary-500"
                            />

                            <div className="mt-5 flex justify-end gap-2">
                                <button
                                    onClick={() => setIsNameModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-700"
                                    disabled={isSavingName}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => void handleUpdateName()}
                                    className="px-4 py-2 rounded-xl bg-primary-600 font-semibold text-white disabled:opacity-60"
                                    disabled={isSavingName}
                                >
                                    {isSavingName ? "Đang lưu..." : "Lưu tên"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Password Modal ── */}
                {isPasswordModalOpen && (
                    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
                        <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-6">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center">
                                    <KeyRound className="w-4 h-4 text-orange-500" />
                                </div>
                                <h3 className="text-lg font-black text-[#1f1a17]">
                                    {hasPassword ? "Đổi mật khẩu" : "Tạo mật khẩu"}
                                </h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-5">
                                {hasPassword
                                    ? "Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật."
                                    : "Tạo mật khẩu để có thể đăng nhập bằng email/mật khẩu."}
                            </p>

                            <div className="space-y-3">
                                {/* Mật khẩu hiện tại — chỉ hiện khi đã có password */}
                                {hasPassword && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Mật khẩu hiện tại</label>
                                        <div className="relative">
                                            <input
                                                type={showCurrent ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="Nhập mật khẩu hiện tại"
                                                className="w-full px-4 py-3 pr-11 bg-gray-50 rounded-2xl border border-gray-200 outline-none focus:border-orange-400 transition text-sm"
                                            />
                                            <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Mật khẩu mới */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Mật khẩu mới</label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Ít nhất 6 ký tự"
                                            className="w-full px-4 py-3 pr-11 bg-gray-50 rounded-2xl border border-gray-200 outline-none focus:border-orange-400 transition text-sm"
                                        />
                                        <button type="button" onClick={() => setShowNew(!showNew)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Xác nhận mật khẩu */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Xác nhận mật khẩu mới</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Nhập lại mật khẩu mới"
                                            className="w-full px-4 py-3 pr-11 bg-gray-50 rounded-2xl border border-gray-200 outline-none focus:border-orange-400 transition text-sm"
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-xs text-rose-500 ml-1">Mật khẩu không khớp</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                                <button
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-700 text-sm"
                                    disabled={isSavingPassword}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => void handleSavePassword()}
                                    disabled={isSavingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                                    className="px-5 py-2 rounded-xl bg-[#D84315] hover:bg-[#BF360C] font-semibold text-white text-sm disabled:opacity-50 transition"
                                >
                                    {isSavingPassword ? "Đang lưu..." : hasPassword ? "Đổi mật khẩu" : "Tạo mật khẩu"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {errorMessage && (
                    <div className="fixed bottom-4 right-4 z-[10000] bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">
                        {errorMessage}
                    </div>
                )}
            </div>
        </>
    );
}