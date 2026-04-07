import { useState } from "react";
import Header from "../../components/user/profile/Header";
import Stats from "../../components/user/profile/Stats";
import Badges from "../../components/user/profile/Badges";
import Activity from "../../components/user/profile/Activity";
import AvatarSelection from "../../components/user/profile/AvatarSelection";
import AccuracyStats from "../../components/user/profile/AccuracyStats";
import PersonalBest from "../../components/user/profile/PersonalBest";
import BadgeProgress from "../../components/user/profile/BadgeProgress";

const INITIAL_USER = {
    fullName: "Lê Văn Học",
    level: "B1 - Intermediate",
    streak: 15,
    xp: "1,250",
    rank: 12,
    avatar: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sky",
    activityData: [20, 50, 40, 90, 100, 60, 30],
    // Dữ liệu giả lập cho các phần mới (Lấy từ DB db.sql của bạn)
    accuracy: 95,
    bestStreak: 20,
    maxDayXp: 350,
    totalLessons: 48,
    nextBadge: { name: "Hàn Lâm II", target: 1500, icon: "/badges/scholar.png" }
};

export default function ProfilePage() {
    const [user, setUser] = useState(INITIAL_USER);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleUpdateAvatar = (newUrl: string) => {
        setUser((prev) => ({ ...prev, avatar: newUrl }));
        setIsModalOpen(false);
    };

    return (
        <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen relative font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20">
                <div className="bg-white rounded-3xl shadow-[0_18px_40px_-20px_rgba(15,23,42,0.25)] border border-slate-200 overflow-hidden">

                    <Header
                        name={user.fullName}
                        level={user.level}
                        avatarUrl={user.avatar}
                        onAvatarClick={() => setIsModalOpen(true)}
                    />

                    <div className="px-6 md:px-8 py-6">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <div className="xl:col-span-2 space-y-6">
                                {/* 1. Chỉ số cơ bản */}
                                <Stats
                                    streak={user.streak}
                                    xp={user.xp}
                                    rank={user.rank}
                                />

                                {/* 2. Độ chính xác & Kỷ lục cá nhân */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                                    <AccuracyStats percent={user.accuracy} />
                                    <PersonalBest
                                        highestStreak={user.bestStreak}
                                        maxDayXp={user.maxDayXp}
                                        totalLessons={user.totalLessons}
                                    />
                                </div>

                                {/* 3. Danh sách Huy hiệu đã đạt được */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-black text-slate-800 uppercase text-sm italic">Thành tích</h3>
                                        <button className="text-blue-500 font-bold text-xs uppercase hover:underline">Xem thêm</button>
                                    </div>
                                    <Badges />
                                </div>

                                {/* 4. Biểu đồ hoạt động */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h3 className="font-black text-slate-800 uppercase text-sm italic mb-4">Hoạt động tuần này</h3>
                                    <Activity data={user.activityData} />
                                </div>
                            </div>

                            <div className="xl:col-span-1">
                                <div className="sticky top-6">
                                    <BadgeProgress
                                        nextBadgeName={user.nextBadge.name}
                                        currentXp={parseInt(user.xp.replace(',', ''))}
                                        targetXp={user.nextBadge.target}
                                        badgeIcon={user.nextBadge.icon}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL CHỌN AVATAR --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsModalOpen(false)}
                    />
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