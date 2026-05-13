interface AccuracyProps {
    percent: number;
    accuracyByType?: Record<string, number>;
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    VOCAB:     { label: "Từ vựng",   color: "bg-blue-400",   bg: "bg-blue-400/20" },
    LISTENING: { label: "Nghe",      color: "bg-emerald-400", bg: "bg-emerald-400/20" },
    SPEAKING:  { label: "Nói",       color: "bg-yellow-300",  bg: "bg-yellow-300/20" },
    MATCHING:  { label: "Nối từ",    color: "bg-pink-400",    bg: "bg-pink-400/20" },
};

export default function AccuracyStats({ percent, accuracyByType = {} }: AccuracyProps) {
    const progress = Math.max(0, Math.min(percent, 100));
    const hasBreakdown = Object.keys(accuracyByType).length > 0;

    const badge =
        progress >= 90 ? { text: "Top Form 🔥", sub: "Bạn đang duy trì phong độ rất tốt." }
        : progress >= 70 ? { text: "Tốt 👍", sub: "Tiếp tục cố gắng nhé!" }
        : { text: "Cần cải thiện", sub: "Cố thêm một chút để chạm mốc 100%." };

    return (
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-5 text-white shadow-[0_8px_20px_-4px_rgba(254,77,1,0.4)] border border-primary-600 flex flex-col justify-between gap-4">
            {/* Header */}
            <div>
                <span className="text-[10px] font-black opacity-80 uppercase tracking-[0.2em]">Độ chính xác</span>
                <div className="mt-2 flex items-end justify-between gap-3">
                    <span className="text-5xl font-black italic leading-none">{progress}%</span>
                    <span className="text-xs font-bold uppercase bg-white/20 px-3 py-1 rounded-full whitespace-nowrap">
                        {badge.text}
                    </span>
                </div>
            </div>

            {/* Thanh tổng */}
            <div className="space-y-1.5">
                <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                    <div className="h-full rounded-full bg-white/80 transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[11px] font-medium opacity-90">{badge.sub}</p>
            </div>

            {/* Breakdown theo loại */}
            {hasBreakdown && (
                <div className="space-y-2 pt-1 border-t border-white/20">
                    <p className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-2">Chi tiết theo kỹ năng</p>
                    {Object.entries(TYPE_LABELS).map(([type, meta]) => {
                        const val = accuracyByType[type];
                        if (val === undefined) return null;
                        return (
                            <div key={type} className="flex items-center gap-2">
                                <span className="text-[10px] font-bold w-14 shrink-0 opacity-90">{meta.label}</span>
                                <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${meta.color} transition-all duration-700`}
                                        style={{ width: `${val}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-black w-8 text-right opacity-90">{val}%</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {!hasBreakdown && (
                <p className="text-[10px] uppercase tracking-wider opacity-70">
                    Chính xác cao = XP thưởng tốt hơn
                </p>
            )}
        </div>
    );
}
