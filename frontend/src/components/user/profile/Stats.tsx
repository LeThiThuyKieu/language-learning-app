interface StatsProps {
    streak: number;
    xp: string | number; // Có thể là số hoặc chuỗi
    rank: string | number;
}

export default function Stats({ streak, xp, rank }: StatsProps) {
    const statsData = [
        {
            label: "STREAK",
            value: streak,
            icon: "/profile/streak.gif",
            borderColor: "hover:border-primary-300"
        },
        {
            label: "TỔNG XP",
            value: xp,
            icon: "/profile/growth.gif",
            borderColor: "hover:border-primary-400"
        },
        {
            label: "HẠNG",
            value: rank,
            icon: "/profile/top ranking.gif",
            borderColor: "hover:border-primary-500"
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {statsData.map((s, i) => (
                <div
                    key={i}
                    className={`group p-3 sm:p-4 rounded-2xl border-2 border-slate-200 flex flex-col items-center 
                               transition-all duration-200 cursor-default bg-white ${s.borderColor}
                               shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:shadow-none active:translate-y-[2px]`}
                >
                    {/* Icon */}
                    <div className="mb-2 w-16 h-16 flex items-center justify-center transition-transform group-hover:scale-110 duration-200 rounded-full bg-white shadow-sm">
                        <img
                            src={s.icon}
                            alt={s.label}
                            className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                        />
                    </div>

                    {/* Giá trị số - Lấy từ Props */}
                    <span className="text-lg sm:text-xl font-black text-primary-900 leading-none mt-1">
                        {s.value}
                    </span>

                    {/* Nhãn */}
                    <span className="text-[9px] sm:text-[10px] font-extrabold text-primary-600 mt-1 uppercase tracking-wider text-center">
                        {s.label}
                    </span>
                </div>
            ))}
        </div>
    );
}