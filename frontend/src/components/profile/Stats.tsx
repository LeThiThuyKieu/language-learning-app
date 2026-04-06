// 1. Định nghĩa "cổng" nhận dữ liệu cho Stats
interface StatsProps {
    streak: number;
    xp: string | number; // Có thể là số hoặc chuỗi đã format (vD: "1,250")
    rank: number;
}

export default function Stats({ streak, xp, rank }: StatsProps) {
    // 2. Chuyển mảng stats thành dữ liệu động dựa trên Props nhận được
    const statsData = [
        {
            label: "STREAK",
            value: streak,
            icon: "/icons/streak.svg",
            borderColor: "hover:border-orange-200"
        },
        {
            label: "TỔNG XP",
            value: xp,
            icon: "/icons/xp.svg",
            borderColor: "hover:border-yellow-200"
        },
        {
            label: "HẠNG",
            value: rank,
            icon: "/icons/rank.svg",
            borderColor: "hover:border-blue-200"
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {statsData.map((s, i) => (
                <div
                    key={i}
                    className={`group p-3 sm:p-4 rounded-2xl border-2 border-slate-200 flex flex-col items-center 
                               transition-all duration-200 cursor-default bg-white ${s.borderColor}
                               shadow-[0_4px_0_0_rgba(226,232,240,1)] active:shadow-none active:translate-y-[2px]`}
                >
                    {/* Icon */}
                    <div className="mb-1 transition-transform group-hover:scale-110 duration-200">
                        <img
                            src={s.icon}
                            alt={s.label}
                            className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                        />
                    </div>

                    {/* Giá trị số - Lấy từ Props */}
                    <span className="text-lg sm:text-xl font-black text-slate-800 leading-none mt-1">
                        {s.value}
                    </span>

                    {/* Nhãn */}
                    <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 mt-1 uppercase tracking-wider text-center">
                        {s.label}
                    </span>
                </div>
            ))}
        </div>
    );
}