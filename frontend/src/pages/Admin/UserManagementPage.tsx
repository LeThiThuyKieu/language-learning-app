import { useEffect, useState } from "react";
import { UserPlus, Users, Zap, Ban } from "lucide-react";
import toast from "react-hot-toast";
import AdminStatCard, { type AdminStatCardProps } from "@/components/admin/common/AdminStatCard";
import UserTable from "@/components/admin/user_management/UserTable";
import UserDetailModal from "@/components/admin/user_management/UserDetailModal";
import AddUserModal, { type AddUserForm } from "@/components/admin/user_management/AddUserModal";
import EditUserModal from "@/components/admin/user_management/EditUserModal";
import { userManagementService, type AdminUserStats } from "@/services/admin/userManagementService.ts";

// Types
export type UserStatus = "Active" | "Inactive" | "Banned";
export type AuthProvider = "LOCAL" | "GOOGLE" | "FACEBOOK";

export type AdminUser = {
    id: number;
    name: string;
    email: string;
    avatar: string;
    role: "Admin" | "User";
    status: UserStatus;
    authProvider: AuthProvider;
    xp: number;
    streak: number;
    lastLogin: string;
    level?: number;
    accuracy?: number;
    phone?: string;
    location?: string;
    joinedDate?: string;
};

export type StatMetric = AdminStatCardProps;

function buildStats(s: AdminUserStats): AdminStatCardProps[] {
    return [
        { label: "Tổng người dùng", value: s.totalUsers.toLocaleString(),    icon: <Users size={24} />,   iconBg: "bg-orange-50", iconText: "text-orange-500", borderColor: "border-l-orange-500", change: "Tổng số tài khoản",          trend: "up" },
        { label: "Đang hoạt động",  value: s.activeUsers.toLocaleString(),   icon: <Zap size={24} />,     iconBg: "bg-blue-50",   iconText: "text-blue-500",   borderColor: "border-l-blue-500",   change: "Theo dõi thời gian thực",    pulsing: true },
        { label: "Bị cấm",          value: s.bannedUsers.toLocaleString(),   icon: <Ban size={24} />,     iconBg: "bg-red-50",    iconText: "text-red-500",    borderColor: "border-l-red-500",    change: "Tài khoản bị hạn chế",       trend: "down" },
        { label: "Người dùng mới",  value: s.newUsersToday.toLocaleString(), icon: <UserPlus size={24} />,iconBg: "bg-green-50",  iconText: "text-green-600",  borderColor: "border-l-green-500",  change: "Đăng ký hôm nay",            trend: "up" },
    ];
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [stats, setStats] = useState<AdminStatCardProps[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [editUser, setEditUser] = useState<AdminUser | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    async function fetchData(p = 0) {
        setLoading(true);
        try {
            const [usersRes, statsRes] = await Promise.all([
                userManagementService.getUsers(p, 10),
                userManagementService.getStats(),
            ]);
            setUsers(usersRes.users);
            setTotal(usersRes.total);
            setStats(buildStats(statsRes));
        } catch (e) {
            console.error("Lỗi tải dữ liệu:", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchData(0); }, []);

    async function handleBan(userId: number) {
        try {
            await userManagementService.banUser(userId);
            toast.success("Đã cấm người dùng thành công!");
            fetchData(page);
        } catch {
            toast.error("Cấm người dùng thất bại, vui lòng thử lại.");
        }
    }

    async function handleUnban(userId: number) {
        try {
            await userManagementService.unbanUser(userId);
            toast.success("Đã bỏ cấm người dùng thành công!");
            fetchData(page);
        } catch {
            toast.error("Bỏ cấm thất bại, vui lòng thử lại.");
        }
    }

    function handlePageChange(p: number) {
        setPage(p);
        fetchData(p);
    }

    async function handleAddUser(data: AddUserForm) {
        try {
            await userManagementService.createUser({
                email: data.email,
                password: data.password,
                role: data.role,
                status: data.status,
                authProvider: data.authProvider,
            });
            toast.success("Thêm người dùng thành công!");
            setShowAddModal(false);
            fetchData(page);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Tạo người dùng thất bại";
            toast.error(msg);
        }
    }

    return (
        <div className="space-y-6">
            {/* Tiêu đề trang */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Quản lý người dùng</h1>
                    <p className="text-sm text-gray-500 mt-1">Quản lý và theo dõi tất cả thành viên trên nền tảng.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm"
                >
                    <UserPlus size={16} />
                    Thêm người dùng
                </button>
            </div>

            {/* Thống kê */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((stat) => (
                    <AdminStatCard key={stat.label} {...stat} />
                ))}
            </div>

            {/* Bảng người dùng */}
            <UserTable
                users={users}
                total={total}
                page={page}
                loading={loading}
                onUserSelect={setSelectedUser}
                onEdit={(u) => setEditUser(u)}
                onBan={handleBan}
                onUnban={handleUnban}
                onPageChange={handlePageChange}
            />

            {/* Modal chi tiết */}
            {selectedUser && (
                <UserDetailModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onEdit={(u) => { setSelectedUser(null); setEditUser(u); }}
                />
            )}

            {/* Modal chỉnh sửa */}
            {editUser && (
                <EditUserModal
                    user={editUser}
                    onClose={() => setEditUser(null)}
                    onSaved={() => {
                        setEditUser(null);
                        fetchData(page);
                    }}
                />
            )}

            {/* Modal thêm người dùng */}
            {showAddModal && (
                <AddUserModal onClose={() => setShowAddModal(false)} onSubmit={handleAddUser} />
            )}
        </div>
    );
}
