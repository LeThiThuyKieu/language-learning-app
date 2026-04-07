interface BestProps {
    highestStreak: number;
    maxDayXp: number;
    totalLessons: number;
}

export default function PersonalBest({ highestStreak, maxDayXp, totalLessons }: BestProps) {
    const bests = [
        { label: "KỶ LỤC CHUỖI", value: `${highestStreak} ngày`, icon: "🏆", color: "text-orange-500", bg: "bg-orange-50" },
        { label: "XP CAO NHẤT/NGÀY", value: `${maxDayXp} XP`, icon: "🔥", color: "text-red-500", bg: "bg-rose-50" },
        { label: "BÀI ĐÃ HỌC", value: totalLessons, icon: "📚", color: "text-blue-500", bg: "bg-blue-50" },
    ];

    return (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-[0_4px_0_0_rgba(226,232,240,1)] min-h-full">
            <h3 className="text-slate-800 font-black text-sm mb-4 uppercase tracking-tight">Kỷ lục cá nhân</h3>
            <div className="space-y-2.5">
                {bests.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <span className={`w-9 h-9 rounded-full grid place-items-center text-lg ${item.bg}`}>{item.icon}</span>
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">{item.label}</span>
                        </div>
                        <span className={`font-black text-sm ${item.color}`}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}