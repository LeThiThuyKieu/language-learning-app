interface ActivityProps {
    weeklyData?: number[];
    todayXp?: number;
}

export default function Activity({ weeklyData, todayXp = 0 }: ActivityProps) {
    const chartData = weeklyData && weeklyData.length === 7 ? weeklyData : [];

    // Logic tính toán hiển thị
    const hasActivity = chartData.some((value) => value > 0);
    const maxValue = chartData.length > 0 ? Math.max(...chartData) : 0;
    const safeMaxValue = maxValue > 0 ? maxValue : 1;
    const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    return (
        <div className="p-6 rounded-3xl bg-white border border-primary-100 shadow-sm overflow-hidden">

            {/* Header:*/}
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary-900">
                    Hoạt động tuần này
                </h3>

                {/* Badge XP hôm nay:  */}
                <span className="text-[10px] font-black text-primary-600 uppercase">
                                    HÔM NAY: {todayXp} XP
                </span>
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
                <div className="flex items-end justify-between h-36 gap-2 sm:gap-3">
                    {chartData.map((value, i) => {
                        // Tính toán chiều cao cột (tối thiểu 5% để vẫn thấy vạch nếu là 0)
                        const heightPercent = (value / safeMaxValue) * 100;

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center group">
                                {/* Value hiện lên khi hover */}
                                <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-[10px] font-black text-primary-600 mb-1 transform translate-y-2 group-hover:translate-y-0">
                                    {value}
                                </span>

                                {/* Cột biểu đồ */}
                                <div className="relative w-full h-24 bg-primary-50/50 rounded-t-xl overflow-hidden border border-primary-100/50">
                                    <div
                                        className="absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ease-out group-hover:shadow-[0_-2px_10px_rgba(254,77,1,0.2)]"
                                        style={{
                                            height: `${heightPercent}%`,
                                            background: 'linear-gradient(to top, #3b82f6, #f97316)'
                                        }}
                                    >
                                        {/* Hiệu ứng ánh sáng nhẹ trên đỉnh cột */}
                                        <div className="w-full h-1 bg-white/20 absolute top-0"></div>
                                    </div>
                                </div>

                                {/* Thứ */}
                                <span className="mt-3 text-[10px] font-black text-primary-900 uppercase group-hover:text-primary-700 transition-colors">
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