import { useState } from "react";
import Header from "../../components/profile/Header";
import Stats from "../../components/profile/Stats";
import Badges from "../../components/profile/Badges";
import Activity from "../../components/profile/Activity";
import AvatarSelection from "../../components/profile/AvatarSelection";

// --- IMPORT CÁC COMPONENT MỚI ---
import AccuracyStats from "../../components/profile/AccuracyStats";
import PersonalBest from "../../components/profile/PersonalBest";
import BadgeProgress from "../../components/profile/BadgeProgress";
import LeagueStatus from "../../components/profile/LeagueStatus";

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
    nextBadge: { name: "Hàn Lâm II", target: 1500, icon: "/badges/scholar.png" },
    league: { name: "Silver", trend: "up" as const }
};

export default function ProfilePage() {
    const [user, setUser] = useState(INITIAL_USER);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleUpdateAvatar = (newUrl: string) => {
        setUser((prev) => ({ ...prev, avatar: newUrl }));
        setIsModalOpen(false);
    };

    return (
        <div className="bg-slate-50 min-h-screen relative font-sans">
            <div className="max-w-2xl mx-auto bg-white min-h-screen pb-20 shadow-sm border-x border-slate-100">

                <Header
                    name={user.fullName}
                    level={user.level}
                    avatarUrl={user.avatar}
                    onAvatarClick={() => setIsModalOpen(true)}
                />

                <div className="px-6 space-y-6 mt-4">
                    {/* 1. Chỉ số cơ bản */}
                    <Stats
                        streak={user.streak}
                        xp={user.xp}
                        rank={user.rank}
                    />

                    {/* 2. Hàng ngang: Độ chính xác & Kỷ lục cá nhân */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AccuracyStats percent={user.accuracy} />
                        <PersonalBest
                            highestStreak={user.bestStreak}
                            maxDayXp={user.maxDayXp}
                            totalLessons={user.totalLessons}
                        />
                    </div>

                    {/* 3. Trạng thái giải đấu (League) */}
                    <LeagueStatus
                        rank={user.rank}
                        trend={user.league.trend}
                        leagueName={user.league.name}
                    />

                    {/* 4. Tiến trình đạt Huy hiệu tiếp theo */}
                    <BadgeProgress
                        nextBadgeName={user.nextBadge.name}
                        currentXp={parseInt(user.xp.replace(',', ''))}
                        targetXp={user.nextBadge.target}
                        badgeIcon={user.nextBadge.icon}
                    />

                    {/* 5. Danh sách Huy hiệu đã đạt được */}
                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-slate-800 uppercase text-sm italic">Thành tích</h3>
                            <button className="text-blue-500 font-bold text-xs uppercase hover:underline">Xem thêm</button>
                        </div>
                        <Badges />
                    </div>

                    {/* 6. Biểu đồ hoạt động */}
                    <div className="pt-4 border-t border-slate-100">
                        <h3 className="font-black text-slate-800 uppercase text-sm italic mb-4">Hoạt động tuần này</h3>
                        <Activity data={user.activityData} />
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