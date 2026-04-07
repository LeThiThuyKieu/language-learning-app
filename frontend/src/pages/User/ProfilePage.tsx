import { useState, useEffect } from "react";
import UserProfileCard from "@/components/user/profile/UserProfileCard.tsx";
import Stats from "../../components/user/profile/Stats";
import BadgesGrid from "../../components/user/profile/BadgesGrid";
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
    accuracy: 95,
    bestStreak: 20,
    maxDayXp: 350,
    totalLessons: 48,
    nextBadge: { name: "Hàn Lâm II", target: 1500, icon: "/profile/scholar.gif" }
};

export default function ProfilePage() {
    const [user, setUser] = useState(INITIAL_USER);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const currentXp = parseInt(user.xp.replace(',', ''));

    const handleUpdateAvatar = (newUrl: string) => {
        setUser((prev) => ({ ...prev, avatar: newUrl }));
        setIsModalOpen(false);
    };

    // 🔥 LOCK SCROLL khi mở modal
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [isModalOpen]);

    return (
        <>
            {/* ================= MAIN PAGE ================= */}
            <div className="bg-primary-50/30 min-h-screen flex flex-col font-sans">
                <div className="flex-1">
                <div className="max-w-6xl mx-auto px-0 sm:px-6 lg:px-8 pt-0">

                    <div className="bg-white rounded-none sm:rounded-3xl shadow-sm border-b sm:border border-primary-100 overflow-hidden mb-0 sm:mb-6">
                        <UserProfileCard
                            name={user.fullName}
                            level={user.level}
                            avatarUrl={user.avatar}
                            onAvatarClick={() => setIsModalOpen(true)}
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-0 sm:gap-6 items-start">

                        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                            <div className="rounded-none sm:rounded-3xl border-b sm:border border-primary-100 shadow-sm">
                                <Stats streak={user.streak} xp={user.xp} rank={user.rank} />
                            </div>

                            <div className="px-4 sm:px-0 space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                                    <AccuracyStats percent={user.accuracy} />
                                    <PersonalBest
                                        highestStreak={user.bestStreak}
                                        maxDayXp={user.maxDayXp}
                                        totalLessons={user.totalLessons}
                                    />
                                </div>

                                <BadgesGrid />
                            </div>
                        </div>

                        <div className="xl:col-span-1 px-4 sm:px-0 mt-4 sm:mt-0">
                            <div className="xl:sticky xl:top-6 space-y-4 sm:space-y-6">
                                <BadgeProgress
                                    nextBadgeName={user.nextBadge.name}
                                    currentXp={currentXp}
                                    targetXp={user.nextBadge.target}
                                    badgeIcon={user.nextBadge.icon}
                                />
                                <Activity data={user.activityData} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ================= MODAL ================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] bg-black/50">

                    {/* MOBILE: full screen | DESKTOP: modal */}
                    <div className="
                        fixed inset-0
                        w-screen h-[100dvh]
                        bg-white
                        flex flex-col

                        sm:relative sm:inset-auto
                        sm:max-w-md sm:h-[600px]
                        sm:mx-auto sm:mt-20
                        sm:rounded-3xl
                        sm:shadow-2xl
                    ">

                        {/* HEADER */}
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Chọn ảnh đại diện</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <AvatarSelection
                                onSelect={handleUpdateAvatar}
                                currentValue={user.avatar}
                            />
                        </div>
                    </div>
                </div>

            )}
            </div>
        </>
    );
}