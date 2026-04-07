interface BestProps {
    highestStreak: number;
    maxDayXp: number;
    totalLessons: number;
}

export default function PersonalBest({ highestStreak, maxDayXp, totalLessons }: BestProps) {
    const bests = [
        { label: "KỶ LỤC CHUỖI", value: `${highestStreak} ngày`, icon: "🏆", color: "text-primary-700", bg: "bg-primary-100" },
        { label: "XP CAO NHẤT/NGÀY", value: `${maxDayXp} XP`, icon: "🔥", color: "text-primary-600", bg: "bg-primary-200" },
        { label: "BÀI ĐÃ HỌC", value: totalLessons, icon: "📚", color: "text-primary-800", bg: "bg-primary-50" },
    ];

    return (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] min-h-full">
            <h3 className="text-primary-900 font-black text-sm mb-4 uppercase tracking-tight">Kỷ lục cá nhân</h3>
            <div className="space-y-2.5">
                {bests.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <span className={`w-9 h-9 rounded-full grid place-items-center text-lg ${item.bg}`}>{item.icon}</span>
                            <span className="text-[11px] font-black text-primary-700 uppercase tracking-wide">{item.label}</span>
                        </div>
                        <span className={`font-black text-sm ${item.color}`}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}