import { createPortal } from "react-dom";
import { useState } from "react";
import { X, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { AdminUser } from "@/pages/Admin/UserManagementPage";
import { userManagementService } from "@/services/admin/userManagementService";

interface Props {
    user: AdminUser;
    onClose: () => void;
    onSaved: (updated: AdminUser) => void;
}

export default function EditUserModal({ user, onClose, onSaved }: Props) {
    const [fullName, setFullName] = useState(user.name);
    const [role, setRole] = useState(user.role);
    const [status, setStatus] = useState(user.status);
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        try {
            const updated = await userManagementService.updateUser(user.id, {
                fullName,
                role: role.toUpperCase(),
                status: status.toLowerCase(),
            });
            toast.success("Cập nhật người dùng thành công!");
            onSaved(updated);
        } catch {
            toast.error("Lưu thất bại, vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-extrabold text-gray-900">Chỉnh sửa người dùng</h2>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Họ tên
                        </label>
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            autoComplete="off"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Vai trò
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as AdminUser["role"])}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
                        >
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    {/* Trạng thái */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Trạng thái
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as AdminUser["status"])}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
                        >
                            <option value="Active">Hoạt động</option>
                            <option value="Banned">Bị cấm</option>
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition disabled:opacity-60"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
