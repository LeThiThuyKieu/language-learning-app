interface ActivityProps {
    weeklyData?: number[];
    todayXp?: number;
}

export default function Activity({ weeklyData, todayXp = 0 }: ActivityProps) {
    const chartData = weeklyData && weeklyData.length === 7 ? weeklyData : Array(7).fill(0);
    const hasActivity = chartData.some((v) => v > 0);
    const maxValue = Math.max(...chartData);
    const safeMax = maxValue > 0 ? maxValue : 1;
    const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const totalWeekXp = chartData.reduce((a, b) => a + b, 0);

    return (
        <div className="p-6 rounded-3xl bg-white border border-primary-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-black italic uppercase tracking-tighter text-primary-900">
                    Hoạt động tuần này
                </h3>
                <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-black text-primary-600 uppercase">
                        Hôm nay: {todayXp} XP
                    </span>
                    {hasActivity && (
                        <span className="text-[9px] font-semibold text-gray-400 uppercase">
                            Tuần: {totalWeekXp} XP
                        </span>
                    )}
                </div>
            </div>

            {!hasActivity ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Bạn chưa có hoạt động học tập
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">
                        Học ngay một bài để xem tiến độ của bạn nhé!
                    </p>
                </div>
            ) : (
                <div className="flex items-end justify-between h-36 gap-1.5 sm:gap-2">
                    {chartData.map((value, i) => {
                        const heightPercent = value > 0 ? Math.max((value / safeMax) * 100, 8) : 0;
                        const isToday = i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6);

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center group">
                                {/* XP label on hover */}
                                <span className={`opacity-0 group-hover:opacity-100 transition-all duration-200 text-[10px] font-black mb-1 ${value > 0 ? "text-primary-600" : "text-gray-300"}`}>
                                    {value > 0 ? value : ""}
                                </span>

                                {/* Bar container */}
                                <div className="relative w-full h-24 bg-primary-50/60 rounded-xl overflow-hidden border border-primary-100/40">
                                    {value > 0 && (
                                        <div
                                            className="absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ease-out"
                                            style={{
                                                height: `${heightPercent}%`,
                                                background: isToday
                                                    ? "linear-gradient(to top, #f97316, #fb923c)"
                                                    : "linear-gradient(to top, #3b82f6, #f97316)",
                                            }}
                                        >
                                            <div className="w-full h-1 bg-white/20 absolute top-0 rounded-t" />
                                        </div>
                                    )}
                                </div>

                                {/* Day label */}
                                <span className={`mt-2 text-[10px] font-black uppercase transition-colors ${isToday ? "text-primary-600" : "text-primary-900/60"}`}>
                                    {dayLabels[i]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
