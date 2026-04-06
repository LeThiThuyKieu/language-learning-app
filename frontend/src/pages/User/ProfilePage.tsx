import { useState } from "react";
import Header from "@/components/user/profile/Header";
import Stats from "@/components/user/profile/Stats";
import Badges from "@/components/user/profile/Badges";
import Activity from "@/components/user/profile/Activity";
import AvatarSelection from "@/components/user/profile/AvatarSelection";

// Mock data ban đầu
const INITIAL_USER = {
    fullName: "Lê Văn Học",
    level: "B1 - Intermediate",
    streak: 15,
    xp: "1,250",
    rank: 12,
    avatar: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sky", // Nếu rỗng, Header sẽ tự hiện avatar mặc định
    activityData: [20, 50, 40, 90, 100, 60, 30]
};

export default function ProfilePage() {
    const [user, setUser] = useState(INITIAL_USER);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleUpdateAvatar = (newUrl: string) => {
        // Cập nhật State để Header và Modal đồng bộ ảnh mới ngay lập tức
        setUser((prev) => ({ ...prev, avatar: newUrl }));

        // Đóng modal sau khi chọn (hoặc có thể để người dùng tự đóng)
        setIsModalOpen(false);

    };

    return (
        <div className="bg-slate-50 min-h-screen relative">
            <div className="max-w-2xl mx-auto bg-white min-h-screen pb-20 shadow-sm border-x border-slate-100">

                {/* 1. Header: Nhận dữ liệu user và hàm mở Modal */}
                <Header
                    name={user.fullName}
                    level={user.level}
                    avatarUrl={user.avatar}
                    onAvatarClick={() => setIsModalOpen(true)}
                />

                <div className="px-6 space-y-8">
                    {/* 2. Stats: Các chỉ số */}
                    <Stats
                        streak={user.streak}
                        xp={user.xp}
                        rank={user.rank}
                    />

                    {/* 3. Badges: Huy hiệu */}
                    <Badges />

                    {/* 4. Activity: Biểu đồ */}
                    <Activity data={user.activityData} />
                </div>
            </div>

            {/* --- MODAL CHỌN AVATAR --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Lớp phủ mờ */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Nội dung Modal */}
                    <div className="relative z-10 w-full max-w-sm animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute -top-10 right-0 text-white font-black hover:text-orange-400 transition-colors uppercase text-sm"
                        >
                            Đóng ✕
                        </button>

                        <AvatarSelection
                            onSelect={handleUpdateAvatar}
                            currentValue={user.avatar}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}