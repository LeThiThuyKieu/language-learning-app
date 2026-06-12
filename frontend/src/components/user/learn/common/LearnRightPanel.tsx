import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Flame, Medal, Star, Zap } from "lucide-react";
import { profileService } from "@/services/profileService.ts";
import LeaderboardCard from "@/components/user/common/LeaderboardCard.tsx";

interface LearnRightPanelProps {
  onViewProfile: () => void;
}

function TopStats() {
  const location = useLocation();
  const [profile, setProfile] = useState<{
    streakCount: number;
    totalKn: number;
    totalXp: number;
    badgeCount: number;
  } | null>(null);

  useEffect(() => {
    profileService
      .getMyProfile()
      .then((p) =>
        setProfile({
          streakCount: p.streakCount,
          totalKn: p.totalKn ?? 0,
          totalXp: p.totalXp ?? 0,
          badgeCount: p.badges?.filter((b) => b.earned).length ?? 0,
        })
      )
      .catch(() => {
        /* ignore */
      });
  }, [location.key]); // refetch mỗi khi navigate về /learn

  const stats = [
    {
      label: "Streak",
      value: profile?.streakCount ?? "—",
      icon: <Flame className="h-5 w-5 text-orange-500" />,
    },
    {
      label: "Tổng KN",
      value: profile?.totalKn ?? "—",
      icon: <Zap className="h-5 w-5 text-yellow-400" />,
    },
    {
      label: "Tổng XP",
      value: profile?.totalXp ?? "—",
      icon: <Star className="h-5 w-5 text-primary-500" />,
    },
    {
      label: "Badges",
      value: profile?.badgeCount ?? "—",
      icon: <Medal className="h-5 w-5 text-blue-500" />,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm">
      <div className="grid grid-cols-4 gap-2">
        {stats.map((item) => (
          <div key={item.label} className="text-center">
            <div className="flex justify-center mb-0.5">{item.icon}</div>
            <div className="text-lg font-extrabold text-gray-900">
              {item.value}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileCard({ onViewProfile }: { onViewProfile: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[120px]">
      <div className="text-gray-900 font-extrabold text-basic mb-1.5">
        Xem hồ sơ tiến trình của bạn
      </div>
      <button
        onClick={onViewProfile}
        className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl transition"
      >
        Xem hồ sơ
      </button>
    </div>
  );
}

export default function LearnRightPanel({ onViewProfile }: LearnRightPanelProps) {
  return (
    <div className="col-span-12 lg:col-span-4">
      <div className="flex flex-col gap-3 lg:sticky lg:top-24">
        <TopStats />
        <LeaderboardCard
          title="Bảng xếp hạng"
          subtitle="Top 3 tuần này (theo KN)"
          limit={3}
          period="WEEK"
          showViewMore
        />
        <ProfileCard onViewProfile={onViewProfile} />
      </div>
    </div>
  );
}
