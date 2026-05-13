import type { BadgeInfo } from "@/services/learningService";

const FALLBACK_ICON = "/profile/scholar.gif";

interface Props {
    badgeQueue: BadgeInfo[];
    onClose: () => void;
}

/**
 * Popup chúc mừng khi user đạt được huy hiệu mới.
 * Hiển thị badge đầu tiên trong queue, bấm "Tuyệt vời!" để đóng/qua badge tiếp.
 */
export default function BadgeUnlockPopup({ badgeQueue, onClose }: Props) {
    if (badgeQueue.length === 0) return null;

    const badge = badgeQueue[0];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Card */}
            <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 p-8 text-center shadow-2xl">
                {/* Ảnh huy hiệu */}
                <div className="mx-auto mb-4 h-36 w-36 flex items-center justify-center drop-shadow-xl">
                    <img
                        src={badge.iconUrl ?? FALLBACK_ICON}
                        alt={badge.name}
                        className="h-full w-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ICON; }}
                    />
                </div>

                {/* Tiêu đề */}
                <p className="text-xs font-bold uppercase tracking-widest text-white/80 mb-1">
                    Huy hiệu mới!
                </p>
                <h2 className="text-2xl font-extrabold text-white leading-snug mb-3">
                    {badge.name}
                </h2>
                <p className="text-sm text-white/80 leading-relaxed mb-6">
                    Chúc mừng! Bạn đã đạt được huy hiệu này nhờ sự kiên trì học tập. Hãy tiếp tục phát huy nhé!
                </p>

                {/* Nút */}
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-2xl bg-white py-3 text-sm font-extrabold uppercase tracking-wide text-primary-600 shadow-sm transition hover:bg-white/90 active:scale-95"
                >
                    Tuyệt vời!
                </button>
            </div>
        </div>
    );
}
