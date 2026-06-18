import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import ConfirmModal from "@/components/user/layout/ConfirmModal.tsx";
import { useAuthStore } from "@/store/authStore.ts";
import { getGeneralRevisionUnlocked } from "@/utils/generalRevisionAccess.ts";

interface LearnSidebarProps {
  isAllLevelsCompleted: boolean;
  showGeneralRevision: boolean;
  onToggleGeneralRevision: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  /** Item đang active trong sidebar. Mặc định là "learn" */
  activeItem?: "learn" | "leaderboard" | "phonetic" | "revision" | "grammar";
}

function SidebarItem({
  label,
  active = false,
  icon,
  onClick,
}: {
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm transition ${
        active
          ? "border-primary-300 bg-primary-50 font-bold text-primary-700 shadow-sm"
          : "border-transparent font-semibold text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon && (
        <span className="flex shrink-0 items-center justify-center">{icon}</span>
      )}
      <span className="uppercase tracking-wide">{label}</span>
    </button>
  );
}

function MoreItem({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition"
    >
      {label}
    </button>
  );
}

function ReviewSidebarItem({
  isUnlocked,
  isActive,
  onClick,
}: {
  isUnlocked: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative w-full group">
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm transition ${
          isActive
            ? "border-primary-300 bg-primary-50 font-bold text-primary-700 shadow-sm"
            : "border-transparent font-semibold text-gray-600 hover:bg-gray-100"
        }`}
      >
        {/* Icon — luôn hiển thị đầy đủ dù locked hay không */}
        <span className="flex shrink-0 items-center justify-center">
          <img
            src="/icons/learn/general_revision.svg"
            alt=""
            className="h-8 w-8 shrink-0 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </span>
        <span className="uppercase tracking-wide">Ôn tập</span>
        {isUnlocked && (
          <span className="ml-auto shrink-0 rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-extrabold text-primary-600">
            MỚI
          </span>
        )}
      </button>

      {/* Tooltip — hiện khi hover bất kể locked hay unlocked */}
      {!isUnlocked && (
        <div
          className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 z-50
            hidden group-hover:flex
            items-center gap-1.5
            whitespace-nowrap rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white shadow-lg
            before:absolute before:right-full before:top-1/2 before:-translate-y-1/2
            before:border-4 before:border-transparent before:border-r-gray-900 before:content-['']"
        >
          <Lock className="w-3 h-3 text-gray-300 shrink-0" />
          Hoàn thành các level để mở khoá
        </div>
      )}
    </div>
  );
}

export default function LearnSidebar({
  isAllLevelsCompleted,
  showGeneralRevision,
  onToggleGeneralRevision,
  onNavigate,
  onLogout,
  activeItem = "learn",
}: LearnSidebarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user } = useAuthStore();

  // Đọc từ localStorage ngay khi mount — không cần chờ LearningPage load trees
  const [persistedUnlocked, setPersistedUnlocked] = useState(() =>
    getGeneralRevisionUnlocked(user?.id)
  );

  // Cập nhật khi prop thay đổi (khi LearningPage vừa xác nhận đủ điều kiện)
  useEffect(() => {
    if (isAllLevelsCompleted) {
      setPersistedUnlocked(true);
    }
  }, [isAllLevelsCompleted]);

  // Giá trị cuối: true nếu localStorage đã lưu HOẶC LearningPage xác nhận
  const revisionUnlocked = persistedUnlocked || isAllLevelsCompleted;

  return (
    <>
      <aside className="col-span-12 md:col-span-3 lg:col-span-3 md:border-r md:border-gray-200 md:pr-3 md:pl-0 lg:pr-6">
        <div className="md:sticky md:top-24">
          <nav className="mt-1 flex w-full max-w-[16.5rem] flex-col gap-1">
            <SidebarItem
              label="Học"
              active={activeItem === "learn"}
              onClick={() => onNavigate("/learn")}
              icon={
                <img
                  src="/icons/learn/hoc.svg"
                  alt=""
                  className="h-8 w-8 shrink-0 object-contain"
                />
              }
            />
            <SidebarItem
              label="Bảng xếp hạng"
              active={activeItem === "leaderboard"}
              onClick={() => onNavigate("/leaderboard")}
              icon={
                <img
                  src="/icons/learn/bxh.svg"
                  alt=""
                  className="h-8 w-8 shrink-0 object-contain"
                />
              }
            />
            <SidebarItem
              label="Chữ cái"
              active={activeItem === "phonetic"}
              onClick={() => onNavigate("/phonetic")}
              icon={
                <img
                  src="/icons/learn/phonetic.svg"
                  alt=""
                  className="h-8 w-8 shrink-0 object-contain"
                />
              }
            />
            <SidebarItem
              label="Ngữ pháp"
              active={activeItem === "grammar"}
              onClick={() => onNavigate("/grammar")}
              icon={
                <img
                  src="/icons/learn/grammar.png"
                  alt=""
                  className="h-8 w-8 shrink-0 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              }
            />
            {/* Ôn tập — locked until all 3 levels done */}
            <ReviewSidebarItem
              isUnlocked={revisionUnlocked}
              isActive={showGeneralRevision}
              onClick={() => {
                if (revisionUnlocked) {
                  onToggleGeneralRevision();
                }
              }}
            />
            <div className="relative w-full pt-0.5">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-transparent px-4 py-3 text-left text-gray-600 transition hover:bg-gray-100"
              >
                <span className="flex items-center gap-3">
                  <img
                    src="/icons/learn/more-info.svg"
                    alt=""
                    className="h-8 w-8 shrink-0 object-contain"
                  />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    Xem thêm
                  </span>
                </span>
                <svg
                  className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                    moreOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {moreOpen && (
                <div className="mt-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
                  <MoreItem
                    label="Hồ sơ"
                    onClick={() => onNavigate("/profile")}
                  />
                  <MoreItem
                    label="Cài đặt"
                    onClick={() => onNavigate("/settings")}
                  />
                  <MoreItem
                    label="Đăng xuất"
                    onClick={() => setShowLogoutConfirm(true)}
                  />
                </div>
              )}
            </div>
          </nav>
        </div>
      </aside>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          onLogout();
          setShowLogoutConfirm(false);
        }}
        message="Bạn có chắc chắn muốn đăng xuất không?"
      />
    </>
  );
}
