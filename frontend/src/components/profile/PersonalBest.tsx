interface BestProps {
    highestStreak: number;
    maxDayXp: number;
    totalLessons: number;
}

export default function PersonalBest({ highestStreak, maxDayXp, totalLessons }: BestProps) {
    const bests = [
        { label: "KỶ LỤC CHUỖI", value: `${highestStreak} ngày`, icon: "🏆", color: "text-orange-500" },
        { label: "XP CAO NHẤT/NGÀY", value: `${maxDayXp} XP`, icon: "🔥", color: "text-red-500" },
        { label: "BÀI ĐÃ HỌC", value: totalLessons, icon: "📚", color: "text-blue-500" },
    ];

    return (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-[0_4px_0_0_rgba(226,232,240,1)]">
            <h3 className="text-slate-800 font-black text-sm mb-4 uppercase tracking-tight">Kỷ lục của bạn</h3>
            <div className="space-y-3">
                {bests.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-[11px] font-black text-slate-500 uppercase">{item.label}</span>
                        </div>
                        <span className={`font-black ${item.color}`}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}