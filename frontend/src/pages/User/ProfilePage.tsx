import { useState, useEffect } from "react";
import UserProfileCard from "@/components/user/profile/UserProfileCard.tsx";
import Stats from "../../components/user/profile/Stats";
import BadgesGrid from "../../components/user/profile/BadgesGrid";
import Activity from "../../components/user/profile/Activity";
import AvatarSelection from "../../components/user/profile/AvatarSelection";
import AccuracyStats from "../../components/user/profile/AccuracyStats";
import PersonalBest from "../../components/user/profile/PersonalBest";
import BadgeProgress from "../../components/user/profile/BadgeProgress";
import { profileService, UserProfileDetail } from "@/services/profileService";
import ProfileSkeleton from "@/components/user/profile/ProfileSkeleton";

const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/thumbs/svg?seed=Bear";

const formatNumber = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfileDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingAvatar, setIsSavingAvatar] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);
    const [nameDraft, setNameDraft] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            setErrorMessage(null);
            const data = await profileService.getMyProfile();
            setProfile(data);
        } catch {
            setErrorMessage("Không thể tải dữ liệu hồ sơ. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchProfile();
    }, []);

    const handleUpdateAvatar = async (newUrl: string) => {
        if (!profile) return;

        try {
            setIsSavingAvatar(true);
            const updated = await profileService.updateMyProfile({ avatarUrl: newUrl });
            setProfile(updated);
            setIsModalOpen(false);
        } catch {
            setErrorMessage("Cập nhật ảnh đại diện thất bại. Vui lòng thử lại.");
        } finally {
            setIsSavingAvatar(false);
        }
    };

    const displayName = profile?.fullName?.trim() || profile?.email || "Người dùng";
    const levelDisplay = [profile?.currentLevelCefr, profile?.currentLevelName]
        .filter(Boolean)
        .join(" - ") || "Beginner";
    const avatarUrl = profile?.avatarUrl || DEFAULT_AVATAR;

    const openEditNameModal = () => {
        setNameDraft(profile?.fullName?.trim() || "");
        setIsNameModalOpen(true);
    };

    const handleUpdateName = async () => {
        if (!profile) return;

        const trimmedName = nameDraft.trim();
        if (!trimmedName) {
            setErrorMessage("Tên không được để trống.");
            return;
        }

        try {
            setIsSavingName(true);
            setErrorMessage(null);
            const updated = await profileService.updateMyProfile({ fullName: trimmedName });
            setProfile(updated);
            setIsNameModalOpen(false);
        } catch {
            setErrorMessage("Cập nhật tên thất bại. Vui lòng thử lại.");
        } finally {
            setIsSavingName(false);
        }
    };

    // 🔥 LOCK SCROLL khi mở modal
    useEffect(() => {
        if (isModalOpen || isNameModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [isModalOpen, isNameModalOpen]);

    if (isLoading) {
        return (
            <div className="bg-primary-50/30 min-h-screen">
                <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-10">
                    <ProfileSkeleton />
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-primary-50/30 flex items-center justify-center px-6">
                <div className="text-center">
                    <p className="text-red-600 font-bold mb-3">{errorMessage || "Không có dữ liệu hồ sơ."}</p>
                    <button
                        onClick={() => void fetchProfile()}
                        className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold"
                    >
                        Tải lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ================= MAIN PAGE ================= */}
            <div className="bg-primary-50/30 min-h-screen flex flex-col font-sans">
                <div className="flex-1">
                    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-10 pt-0">

                        <div className="bg-white rounded-none sm:rounded-3xl shadow-sm border-b sm:border border-primary-100 overflow-hidden mb-0 sm:mb-7">
                            <UserProfileCard
                                name={displayName}
                                level={levelDisplay}
                                avatarUrl={avatarUrl}
                                onAvatarClick={() => setIsModalOpen(true)}
                                onEditNameClick={openEditNameModal}
                            />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-0 sm:gap-7 items-start">

                            <div className="xl:col-span-2 space-y-5 sm:space-y-7">
                                <div className="rounded-none sm:rounded-3xl border-b sm:border border-primary-100 shadow-sm">
                                    <Stats
                                        streak={profile.streakCount}
                                        xp={formatNumber(profile.totalXp)}
                                        rank={profile.rankPosition ?? "--"}
                                    />
                                </div>

                                <div className="px-4 sm:px-0 space-y-5 sm:space-y-7">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                                        <AccuracyStats percent={profile.completionRate} />
                                        <PersonalBest
                                            highestStreak={profile.streakCount}
                                            totalXp={profile.totalXp}
                                            totalLessons={profile.completedNodes}
                                        />
                                    </div>

                                    <BadgesGrid badges={profile.badges} />
                                </div>
                            </div>

                            <div className="xl:col-span-1 px-4 sm:px-0 mt-5 sm:mt-0">
                                <div className="xl:sticky xl:top-6 space-y-5 sm:space-y-7">
                                    <BadgeProgress
                                        completionRate={profile.completionRate}
                                        completedNodes={profile.completedNodes}
                                        totalNodes={profile.totalNodes}
                                    />
                                    <Activity
                                        weeklyData={profile.weeklyActivityXp}
                                        todayXp={profile.todayXp}
                                    />
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
                                    disabled={isSavingAvatar}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* CONTENT */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <AvatarSelection
                                    onSelect={handleUpdateAvatar}
                                    currentValue={avatarUrl}
                                />
                            </div>
                        </div>
                    </div>

                )}
                {isNameModalOpen && (
                    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
                        <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-6">
                            <h3 className="text-lg font-black text-[#1f1a17]">Đổi tên hiển thị</h3>
                            <p className="text-sm text-slate-600 mt-1">Tên mới sẽ được lưu vào hồ sơ của bạn.</p>

                            <input
                                value={nameDraft}
                                onChange={(e) => setNameDraft(e.target.value)}
                                maxLength={100}
                                placeholder="Nhập tên mới"
                                className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-primary-500"
                            />

                            <div className="mt-5 flex justify-end gap-2">
                                <button
                                    onClick={() => setIsNameModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-700"
                                    disabled={isSavingName}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => void handleUpdateName()}
                                    className="px-4 py-2 rounded-xl bg-primary-600 font-semibold text-white disabled:opacity-60"
                                    disabled={isSavingName}
                                >
                                    {isSavingName ? "Đang lưu..." : "Lưu tên"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {errorMessage && (
                    <div className="fixed bottom-4 right-4 z-[10000] bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">
                        {errorMessage}
                    </div>
                )}
            </div>
        </>
    );
}