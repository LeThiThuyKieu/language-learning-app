import { createPortal } from "react-dom";
import { useRef, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import type { AdminUser } from "@/pages/Admin/UserManagementPage";

interface Props {
    users: AdminUser[];
    onClose: () => void;
}

const statusLabel: Record<string, string> = {
    Active: "Hoạt động",
    Banned: "Bị cấm",
    Inactive: "Không hoạt động",
};

const authLabel: Record<string, string> = {
    GOOGLE: "Google",
    FACEBOOK: "Facebook",
    LOCAL: "Email",
};

export default function ExportImageModal({ users, onClose }: Props) {
    const tableRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    async function handleDownload() {
        if (!tableRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(tableRef.current, {
                scale: 2,
                backgroundColor: "#ffffff",
                useCORS: true,
            });
            const link = document.createElement("a");
            link.download = `users_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } finally {
            setDownloading(false);
        }
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-base font-extrabold text-gray-900">Xuất danh sách người dùng</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition disabled:opacity-60"
                        >
                            {downloading
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Download className="w-4 h-4" />
                            }
                            {downloading ? "Đang tải..." : "Tải ảnh PNG"}
                        </button>
                        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Preview (scrollable) */}
                <div className="flex-1 overflow-auto p-6">
                    <div ref={tableRef} className="bg-white p-6 rounded-xl">
                        {/* Title */}
                        <div className="mb-5">
                            <h3 className="text-lg font-extrabold text-gray-900">Danh sách người dùng</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Xuất ngày {new Date().toLocaleDateString("vi-VN")} · Tổng {users.length} người dùng
                            </p>
                        </div>

                        {/* Table */}
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    {["#", "Họ tên", "Email", "Vai trò", "Trạng thái", "Đăng nhập qua", "XP", "Streak", "Tham gia"].map((h) => (
                                        <th key={h} className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u, i) => (
                                    <tr key={u.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                                        <td className="px-3 py-2.5 text-xs text-gray-400">{i + 1}</td>
                                        <td className="px-3 py-2.5 text-sm font-semibold text-gray-800">{u.name}</td>
                                        <td className="px-3 py-2.5 text-xs text-gray-500">{u.email}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === "Admin" ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={`text-xs font-bold ${u.status === "Active" ? "text-green-600" : "text-red-500"}`}>
                                                {statusLabel[u.status]}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-xs text-gray-500">{authLabel[u.authProvider]}</td>
                                        <td className="px-3 py-2.5 text-xs font-bold text-gray-700">{u.xp.toLocaleString()}</td>
                                        <td className="px-3 py-2.5 text-xs text-gray-500">{u.streak} ngày</td>
                                        <td className="px-3 py-2.5 text-xs text-gray-400">{u.joinedDate ?? "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
