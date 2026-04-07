interface ActivityProps {
    data?: number[]; // Dùng ? để linh hoạt nếu chưa có data từ BE
}

export default function Activity({ data }: ActivityProps) {
    // Dữ liệu Test (Sau này thay mảng này bằng dữ liệu từ API)
    const mockData = [40, 65, 30, 85, 50, 100, 45];

    // Ưu tiên lấy data từ props, nếu không có thì lấy mockData
    const chartData = data && data.length > 0 ? data : mockData;

    // Tìm max value để tính tỉ lệ
    const maxValue = Math.max(...chartData);
    const safeMaxValue = maxValue > 0 ? maxValue : 1;

    return (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl border border-primary-200/30">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black uppercase tracking-widest text-xs text-slate-500">
                    Hoạt động tuần này
                </h3>
                <span className="text-[10px] text-primary-300  px-3 py-1 rounded-full font-black">
                    XP Hôm nay: 150
                </span>
            </div>

            <div className="flex items-end justify-between h-40 gap-3">
                {chartData.map((value, i) => {
                    const heightPercent = Math.max((value / safeMaxValue) * 100, value > 0 ? 8 : 0);
                    return (
                        <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-3 group min-w-0">
                            {/* Tooltip hiện value khi hover */}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-primary-400 mb-1">
                                {value} XP
                            </span>

                            {/* Background bar */}
                            <div className="relative w-full h-28 rounded-t-lg bg-slate-800 overflow-hidden border border-primary-200/15">
                                <div
                                    className="absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ease-out bg-gradient-to-t from-[#f97316] via-[#fb923c] to-[#3ddad7] shadow-[0_0_14px_rgba(249,115,22,0.45)] group-hover:brightness-110 group-hover:shadow-[0_0_18px_rgba(61,218,215,0.45)]"
                                    style={{ height: `${heightPercent}%` }}
                                ></div>
                            </div>

                            {/* Label Thứ */}
                            <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-slate-200 transition-colors mt-1">
                                {i === 6 ? "CN" : `T${i + 2}`}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}