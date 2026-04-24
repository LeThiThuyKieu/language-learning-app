import { useState } from "react";
import { UserPlus } from "lucide-react";
import UserStatsCard from "@/components/admin/user_management/UserStatsCard";
import UserTable from "@/components/admin/user_management/UserTable";
import UserDetailModal from "@/components/admin/user_management/UserDetailModal";
import AddUserModal, { type AddUserForm } from "@/components/admin/user_management/AddUserModal";

// Types
type UserStatus = "Active" | "Inactive" | "Banned";
type AuthProvider = "LOCAL" | "GOOGLE" | "FACEBOOK";

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

export type StatMetric = {
    label: string;
    value: string;
    icon: string;
    color: "orange" | "blue" | "red" | "green";
    change: string;
    trend?: "up" | "down";
    pulsing?: boolean;
};

const stats: StatMetric[] = [
    { label: "Tổng người dùng", value: "12,482", icon: "Users",    color: "orange", change: "+12% so với tháng trước", trend: "up" },
    { label: "Đang hoạt động",  value: "842",    icon: "Zap",      color: "blue",   change: "Theo dõi thời gian thực", pulsing: true },
    { label: "Bị cấm",          value: "156",    icon: "Ban",      color: "red",    change: "24 đang chờ xét duyệt",   trend: "down" },
    { label: "Người dùng mới",  value: "1,024",  icon: "UserPlus", color: "green",  change: "+42 hôm nay",             trend: "up" },
];

const mockUsers: AdminUser[] = [
    {
        id: 1,
        name: "Nguyễn Văn An",
        email: "an.nguyen@example.com",
        avatar: "https://i.pravatar.cc/150?img=12",
        role: "Admin",
        status: "Active",
        authProvider: "GOOGLE",
        xp: 2450,
        streak: 14,
        lastLogin: "2 phút trước",
        level: 12,
        accuracy: 98.4,
        phone: "+84 901 234 567",
        location: "Hồ Chí Minh, Việt Nam",
        joinedDate: "Tháng 6/2023",
    },
    {
        id: 2,
        name: "Trần Thị Bình",
        email: "binh.tran@provider.net",
        avatar: "https://i.pravatar.cc/150?img=33",
        role: "User",
        status: "Inactive",
        authProvider: "LOCAL",
        xp: 1120,
        streak: 0,
        lastLogin: "3 giờ trước",
        level: 8,
        accuracy: 92.1,
        phone: "+84 912 345 678",
        location: "Hà Nội, Việt Nam",
        joinedDate: "Tháng 8/2023",
    },
    {
        id: 3,
        name: "Lê Minh Cường",
        email: "cuong.le@studio.com",
        avatar: "https://i.pravatar.cc/150?img=68",
        role: "User",
        status: "Banned",
        authProvider: "FACEBOOK",
        xp: 450,
        streak: 0,
        lastLogin: "2 ngày trước",
        level: 4,
        accuracy: 76.3,
        phone: "+84 923 456 789",
        location: "Đà Nẵng, Việt Nam",
        joinedDate: "Tháng 10/2023",
    },
    {
        id: 4,
        name: "Phạm Thị Dung",
        email: "dung.pham@future.io",
        avatar: "https://i.pravatar.cc/150?img=45",
        role: "User",
        status: "Active",
        authProvider: "GOOGLE",
        xp: 8920,
        streak: 42,
        lastLogin: "Vừa xong",
        level: 18,
        accuracy: 99.2,
        phone: "+84 934 567 890",
        location: "Cần Thơ, Việt Nam",
        joinedDate: "Tháng 1/2023",
    },
];

export default function UserManagementPage() {
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    function handleAddUser(data: AddUserForm) {
        // Sau này: gọi API tạo user ở đây
        console.log("Thêm người dùng:", data);
        setShowAddModal(false);
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
                    <UserStatsCard key={stat.label} metric={stat} />
                ))}
            </div>

            {/* Bảng người dùng */}
            <UserTable users={mockUsers} onUserSelect={setSelectedUser} />

            {/* Modal chi tiết */}
            {selectedUser && (
                <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
            )}

            {/* Modal thêm người dùng */}
            {showAddModal && (
                <AddUserModal onClose={() => setShowAddModal(false)} onSubmit={handleAddUser} />
            )}
        </div>
    );
}
