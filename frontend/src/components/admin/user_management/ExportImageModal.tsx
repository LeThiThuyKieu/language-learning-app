/**
 * Re-export từ common để giữ backward compatibility với các import cũ.
 * Dùng ExportImageModal generic từ @/components/admin/common/ExportImageModal
 * với columns được định nghĩa sẵn cho AdminUser.
 */
import ExportImageModalGeneric, { type ExportColumn } from "@/components/admin/common/ExportImageModal";
import type { AdminUser } from "@/pages/Admin/UserManagementPage";

const statusLabel: Record<string, string> = {
    Active: "Hoạt động",
    Banned: "Bị cấm",
};

const authLabel: Record<string, string> = {
    GOOGLE: "Google",
    FACEBOOK: "Facebook",
    LOCAL: "Email",
};

const USER_COLUMNS: ExportColumn<AdminUser>[] = [
    {
        header: "#",
        render: (_, i) => <span className="text-xs text-gray-400">{i + 1}</span>,
    },
    {
        header: "Họ tên",
        render: (u) => <span className="text-sm font-semibold text-gray-800">{u.name}</span>,
    },
    {
        header: "Email",
        render: (u) => <span className="text-xs text-gray-500">{u.email}</span>,
    },
    {
        header: "Vai trò",
        render: (u) => (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                u.role === "Admin" ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
            }`}>
                {u.role}
            </span>
        ),
    },
    {
        header: "Trạng thái",
        render: (u) => (
            <span className={`text-xs font-bold ${u.status === "Active" ? "text-green-600" : "text-red-500"}`}>
                {statusLabel[u.status]}
            </span>
        ),
    },
    {
        header: "Đăng nhập qua",
        render: (u) => <span className="text-xs text-gray-500">{authLabel[u.authProvider]}</span>,
    },
    {
        header: "XP",
        render: (u) => <span className="text-xs font-bold text-gray-700">{u.xp.toLocaleString()}</span>,
    },
    {
        header: "Streak",
        render: (u) => <span className="text-xs text-gray-500">{u.streak} ngày</span>,
    },
    {
        header: "Tham gia",
        render: (u) => <span className="text-xs text-gray-400">{u.joinedDate ?? "—"}</span>,
    },
];

interface Props {
    users: AdminUser[];
    onClose: () => void;
}

export default function ExportImageModal({ users, onClose }: Props) {
    return (
        <ExportImageModalGeneric
            title="Danh sách người dùng"
            subtitle={`Xuất ngày ${new Date().toLocaleDateString("vi-VN")} · Tổng ${users.length} người dùng`}
            rows={users}
            columns={USER_COLUMNS}
            filename={`users_${new Date().toISOString().slice(0, 10)}.png`}
            onClose={onClose}
        />
    );
}
