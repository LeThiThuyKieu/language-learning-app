import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X, Loader2, LogIn, BookOpen, UserPlus } from "lucide-react";
import type { AdminUser } from "@/pages/Admin/UserManagementPage";
import { userManagementService, type ActivityLog } from "@/services/admin/userManagementService";

interface Props {
    user: AdminUser;
    onClose: () => void;
}

const actionIcon: Record<string, React.ReactNode> = {
    "Đăng nhập":         <LogIn className="w-4 h-4 text-blue-500" />,
    "Đăng ký tài khoản": <UserPlus className="w-4 h-4 text-green-500" />,
    "Hoàn thành bài học":<BookOpen className="w-4 h-4 text-orange-500" />,
};

const actionColor: Record<string, string> = {
    "Đăng nhập":         "bg-blue-50",
    "Đăng ký tài khoản": "bg-green-50",
    "Hoàn thành bài học":"bg-orange-50",
};

function formatTime(ts: string) {
    const d = new Date(ts);
    return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

export default function ActivityLogModal({ user, onClose }: Props) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        userManagementService.getActivityLog(user.id)
            .then(setLogs)
            .finally(() => setLoading(false));
    }, [user.id]);

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-base font-extrabold text-gray-900">Lịch sử hoạt động</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{user.name} · {user.email}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Đang tải...</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-12">Chưa có hoạt động nào</p>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${actionColor[log.action] ?? "bg-gray-50"}`}>
                                        {actionIcon[log.action] ?? <BookOpen className="w-4 h-4 text-gray-400" />}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800">{log.action}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{log.detail}</p>
                                    </div>
                                    {/* Time */}
                                    <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">
                                        {formatTime(log.timestamp)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
