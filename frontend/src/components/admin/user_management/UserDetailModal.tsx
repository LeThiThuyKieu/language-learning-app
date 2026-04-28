import { createPortal } from "react-dom";
import { useState } from "react";
import { X, Mail, Flame, ShieldCheck, ArrowRight, TrendingUp } from "lucide-react";
import type { AdminUser } from "@/pages/Admin/UserManagementPage";
import ActivityLogModal from "./ActivityLogModal";

interface Props {
    user: AdminUser;
    onClose: () => void;
    onEdit: (user: AdminUser) => void;
}

export default function UserDetailModal({ user, onClose, onEdit }: Props) {
    const [showActivity, setShowActivity] = useState(false);
    const maxXp = (user.level ?? 12) * 150;
    const xpPercent = Math.min((user.xp / maxXp) * 100, 100);

    const modal = createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Banner cam */}
                <div className="h-28 bg-gradient-to-r from-orange-500 to-orange-600 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-1.5 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 -mt-14 pb-0">
                    {/* Avatar */}
                    <div className="relative w-fit">
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
                    </div>

                    {/* Tên + thông tin */}
                    <div className="mt-4">
                        <h3 className="text-xl font-extrabold text-gray-900">{user.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-400">
                                {user.role === "Admin" ? "Quản trị viên hệ thống" : "Thành viên"}
                            </p>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <p className="text-sm text-gray-400">Tham gia {user.joinedDate ?? "Tháng 8/2023"}</p>
                        </div>
                    </div>

                    {/* Tiến trình cấp độ */}
                    <div className="mt-6 p-4 bg-orange-50/40 rounded-2xl border border-orange-100/60">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-500/30">
                                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                                </div>
                                <p className="text-sm font-bold text-gray-800">Cấp {user.level ?? 12}</p>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                                {user.xp.toLocaleString()} / {maxXp.toLocaleString()} XP
                            </p>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-orange-500 rounded-full transition-all duration-700"
                                style={{ width: `${xpPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Chỉ số */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Chuỗi ngày</p>
                                <p className="text-lg font-extrabold text-gray-800">{user.streak} ngày</p>
                            </div>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Tổng XP</p>
                                <p className="text-lg font-extrabold text-gray-800">{user.xp.toLocaleString()} XP</p>
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="mt-5 space-y-3">
                        <div className="flex items-center gap-3 text-gray-500">
                            <Mail className="w-4 h-4 shrink-0" />
                            <span className="text-sm">{user.email}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                        onClick={() => onEdit(user)}
                        className="text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors"
                    >
                        Chỉnh sửa hồ sơ
                    </button>
                    <button
                        onClick={() => setShowActivity(true)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors"
                    >
                        Xem lịch sử hoạt động
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );

    return (
        <>
            {modal}
            {showActivity && (
                <ActivityLogModal user={user} onClose={() => setShowActivity(false)} />
            )}
        </>
    );
}
