interface AccuracyProps {
    percent: number; // Ví dụ: 92
}

export default function AccuracyStats({ percent }: AccuracyProps) {
    const progress = Math.max(0, Math.min(percent, 100));

    return (
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-5 text-white shadow-[0_8px_20px_-4px_rgba(254,77,1,0.4)] border border-primary-600 min-h-full flex flex-col justify-between">
            <div>
                <span className="text-[10px] font-black opacity-80 uppercase tracking-[0.2em]">Độ chính xác</span>
                <div className="mt-3 flex items-end justify-between gap-3">
                    <span className="text-5xl font-black italic leading-none">{progress}%</span>
                    <span className="text-xs font-bold uppercase bg-primary-50/20 px-3 py-1 rounded-full">Top Form</span>
                </div>
            </div>

            <div className="mt-5 space-y-2">
                <div className="h-2.5 rounded-full bg-primary-200/50 overflow-hidden">
                    <div className="h-full rounded-full bg-primary-50" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[11px] font-medium leading-tight opacity-95">
                    {progress > 90 ? "Bạn đang duy trì phong độ rất tốt." : "Cố thêm một chút để chạm mốc 100%."}
                </p>
            </div>

            <p className="text-[10px] uppercase tracking-wider opacity-80 mt-3">
                Chính xác cao = XP thưởng tốt hơn
            </p>
        </div>
    );
}