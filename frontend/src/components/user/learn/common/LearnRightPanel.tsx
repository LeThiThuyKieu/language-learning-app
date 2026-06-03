import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Flame, Medal, Star, Zap } from "lucide-react";
import { profileService } from "@/services/profileService.ts";
import LeaderboardCard from "@/components/user/common/LeaderboardCard.tsx";

interface LearnRightPanelProps {
  onCreateProfile: () => void;
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

function DailyCard() {
  const currentKn = 0;
  const targetKn = 20;
  const percent = (currentKn / targetKn) * 100;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[120px]">
      <div className="flex items-center justify-between">
        <div className="text-gray-900 font-extrabold text-basic">
          Nhiệm vụ hằng ngày
        </div>
        <button className="text-primary-600 font-semibold text-sm uppercase tracking-wide">
          Xem tất cả
        </button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <img
          src="/icons/learn/lightning.svg"
          alt=""
          className="h-10 w-10 object-contain shrink-0"
        />
        <div className="flex-1">
          <div className="text-gray-700 font-semibold text-sm mb-2">
            Kiếm {targetKn} KN
          </div>
          <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full"
              style={{ width: `${percent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-gray-500">
              {currentKn} / {targetKn}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ onCreateProfile }: { onCreateProfile: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[120px]">
      <div className="text-gray-900 font-extrabold text-basic mb-1.5">
        Tạo hồ sơ lưu tiến trình của bạn!
      </div>
      <button
        onClick={onCreateProfile}
        className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl transition"
      >
        Tạo hồ sơ
      </button>
    </div>
  );
}

export default function LearnRightPanel({ onCreateProfile }: LearnRightPanelProps) {
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
        <DailyCard />
        <ProfileCard onCreateProfile={onCreateProfile} />
      </div>
    </div>
  );
}
