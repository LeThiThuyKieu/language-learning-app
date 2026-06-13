import { useState, useEffect } from "react";
import {
    Camera, Pencil, Lock, ShieldAlert,
    Eye, EyeOff, KeyRound, Check, X,
} from "lucide-react";
import { profileService } from "@/services/profileService";
import { authService } from "@/services/authService";
import { DEFAULT_AVATAR_URL } from "@/constants/avatarOptions";
import AvatarSelection from "@/components/user/profile/AvatarSelection";
import { toast } from "react-hot-toast";
import axios from "axios";

interface AdminProfile {
    userId: number;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
    hasPassword: boolean;
    createdAt: string;
    lastLogin: string | null;
}

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return "—";
    const [day, month, year] = dateStr.split("-");
    return `${day}/${month}/${year}`;
}

function formatLastLogin(iso: string | null | undefined) {
    if (!iso) return "—";
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    return isToday ? `Hôm nay, ${time}` : `${formatDate(iso)}, ${time}`;
}

export default function AdminProfilePage() {
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Inline edit name
    const [editingName, setEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState("");
    const [savingName, setSavingName] = useState(false);

    // Avatar picker modal
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    // Password modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        profileService.getMyProfile()
            .then((p) => setProfile({
                userId: p.userId,
                fullName: p.fullName,
                email: p.email,
                avatarUrl: p.avatarUrl,
                hasPassword: p.hasPassword,
                createdAt: p.createdAt,
                lastLogin: p.lastLogin ?? null,
            }))
            .catch(() => toast.error("Không thể tải thông tin hồ sơ"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        document.body.style.overflow = showAvatarPicker ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [showAvatarPicker]);

    const avatarUrl = profile?.avatarUrl || DEFAULT_AVATAR_URL;
    const displayName = profile?.fullName?.trim() || profile?.email || "Admin";

    const handleSaveName = async () => {
        const trimmed = nameDraft.trim();
        if (!trimmed) { toast.error("Tên không được để trống"); return; }
        setSavingName(true);
        try {
            const updated = await profileService.updateMyProfile({ fullName: trimmed });
            setProfile((prev) => prev ? { ...prev, fullName: updated.fullName } : prev);
            setEditingName(false);
            toast.success("Đã cập nhật tên");
        } catch {
            toast.error("Cập nhật tên thất bại");
        } finally {
            setSavingName(false);
        }
    };

    // Called by AvatarSelection when user picks a preset or uploads a custom image
    const handleAvatarSelected = async (url: string) => {
        try {
            const updated = await profileService.updateMyProfile({ avatarUrl: url });
            setProfile((prev) => prev ? { ...prev, avatarUrl: updated.avatarUrl } : prev);
            setShowAvatarPicker(false);
            toast.success("Đã cập nhật ảnh đại diện");
        } catch {
            toast.error("Cập nhật ảnh đại diện thất bại");
        }
    };

    const resetPasswordFields = () => {
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        setShowCurrent(false); setShowNew(false); setShowConfirm(false);
    };

    const handleSavePassword = async () => {
        if (newPassword.length < 6) { toast.error("Mật khẩu phải có ít nhất 6 ký tự"); return; }
        if (newPassword !== confirmPassword) { toast.error("Mật khẩu xác nhận không khớp"); return; }
        setSavingPassword(true);
        try {
            if (profile?.hasPassword) {
                if (!currentPassword) { toast.error("Vui lòng nhập mật khẩu hiện tại"); return; }
                await authService.changePassword({ currentPassword, newPassword, confirmNewPassword: confirmPassword });
                toast.success("Đổi mật khẩu thành công!");
            } else {
                await authService.setPassword(newPassword, confirmPassword);
                setProfile((prev) => prev ? { ...prev, hasPassword: true } : prev);
                toast.success("Tạo mật khẩu thành công!");
            }
            setShowPasswordModal(false);
            resetPasswordFields();
        } catch (err) {
            toast.error(axios.isAxiosError(err) ? (err.response?.data?.message || "Thao tác thất bại") : "Thao tác thất bại");
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 p-6 animate-pulse">
                <div className="h-8 w-48 rounded-xl bg-gray-200" />
                <div className="h-64 rounded-2xl bg-gray-100" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6" style={{ zoom: 1.1 }}>
            {/* Title */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Hồ sơ cá nhân</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left column ── */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
                        <div className="flex gap-10" style={{ zoom: 1.1 }}>
                            {/* Avatar */}
                            <div className="relative shrink-0 group w-24 h-24">
                                <img
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="w-24 h-24 rounded-full object-cover border border-orange-50 shadow"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAvatarPicker(true)}
                                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Đổi ảnh đại diện"
                                >
                                    <Camera className="w-5 h-5 text-white" />
                                </button>
                                <p className="mt-3 text-center text-sm font-bold text-slate-700 leading-tight">
                                    Quản trị viên
                                </p>
                            </div>

                            {/* Fields */}
                            <div className="flex-1 space-y-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Thông tin cơ bản</p>

                                {/* Họ và tên */}
                                <div>
                                    <p className="text-xs text-slate-400 mb-0.5">Họ và tên</p>
                                    {editingName ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                value={nameDraft}
                                                onChange={(e) => setNameDraft(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") void handleSaveName();
                                                    if (e.key === "Escape") setEditingName(false);
                                                }}
                                                autoFocus
                                                maxLength={100}
                                                className="flex-1 border border-orange-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-orange-500 bg-white"
                                            />
                                            <button onClick={() => void handleSaveName()} disabled={savingName}
                                                className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition disabled:opacity-50">
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => setEditingName(false)}
                                                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-bold text-slate-800">{displayName}</span>
                                            <button onClick={() => { setNameDraft(profile?.fullName?.trim() || ""); setEditingName(true); }}
                                                className="text-slate-400 hover:text-orange-500 transition">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <p className="text-xs text-slate-400 mb-0.5">Email</p>
                                    <span className="text-sm font-semibold text-slate-800">{profile?.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="mt-5 grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 pt-4">
                            <div className="pr-4">
                                <p className="text-xs text-slate-400 mb-1">Ngày tham gia</p>
                                <p className="text-sm font-bold text-slate-800">{formatDate(profile?.createdAt)}</p>
                            </div>
                            <div className="px-4">
                                <p className="text-xs text-slate-400 mb-1">Lần cuối đăng nhập</p>
                                <p className="text-sm font-bold text-slate-800">{formatLastLogin(profile?.lastLogin)}</p>
                            </div>
                            <div className="pl-4">
                                <p className="text-xs text-slate-400 mb-1">Trạng thái</p>
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                    Hoạt động
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right column ── */}
                <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-orange-500" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Đổi mật khẩu</h3>
                        </div>

                        {!showPasswordModal ? (
                            <>
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-orange-400 text-orange-500 hover:bg-orange-50 px-4 py-2.5 text-sm font-semibold transition"
                                >
                                    <KeyRound className="w-4 h-4" />
                                    {profile?.hasPassword ? "Đổi mật khẩu" : "Tạo mật khẩu"}
                                </button>

                                <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                                        <p className="text-xs font-bold text-slate-600">Bảo mật tài khoản</p>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Đảm bảo bạn sử dụng mật khẩu mạnh và không chia sẻ tài khoản cho bất kỳ ai khác.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3">
                                {profile?.hasPassword && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mật khẩu hiện tại</label>
                                        <div className="relative">
                                            <input
                                                type={showCurrent ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="Nhập mật khẩu hiện tại"
                                                className="w-full px-4 py-2.5 pr-11 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-orange-400 text-sm transition"
                                            />
                                            <button type="button" onClick={() => setShowCurrent((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mật khẩu mới</label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Ít nhất 6 ký tự"
                                            className="w-full px-4 py-2.5 pr-11 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-orange-400 text-sm transition"
                                        />
                                        <button type="button" onClick={() => setShowNew((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Xác nhận mật khẩu mới</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Nhập lại mật khẩu mới"
                                            className="w-full px-4 py-2.5 pr-11 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-orange-400 text-sm transition"
                                        />
                                        <button type="button" onClick={() => setShowConfirm((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-xs text-rose-500 ml-1">Mật khẩu không khớp</p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => { setShowPasswordModal(false); resetPasswordFields(); }}
                                        disabled={savingPassword}
                                        className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-slate-700 transition"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={() => void handleSavePassword()}
                                        disabled={savingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                                        className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-sm font-bold text-white transition disabled:opacity-50"
                                    >
                                        {savingPassword ? "Đang lưu..." : profile?.hasPassword ? "Đổi" : "Tạo"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Avatar picker modal — dùng AvatarSelection y chang user ── */}
            {showAvatarPicker && (
                <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center sm:p-4">
                    <div className="
                        fixed inset-0
                        w-screen h-[100dvh]
                        bg-white
                        flex flex-col
                        sm:relative sm:inset-auto sm:w-full
                        sm:max-w-2xl sm:h-auto
                        sm:rounded-3xl
                        sm:shadow-2xl sm:max-h-[92dvh]
                        overflow-y-auto
                    ">
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="font-bold text-lg">Chọn ảnh đại diện</h3>
                            <button
                                onClick={() => setShowAvatarPicker(false)}
                                className="p-2 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-6">
                            <AvatarSelection
                                onSelect={(url) => void handleAvatarSelected(url)}
                                currentValue={avatarUrl}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
