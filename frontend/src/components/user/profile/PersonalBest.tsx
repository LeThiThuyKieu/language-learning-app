interface BestProps {
    highestStreak: number;
    totalXp: number;
    totalLessons: number;
}

export default function PersonalBest({ highestStreak, totalXp, totalLessons }: BestProps) {

    const bests = [
        { label: "KỶ LỤC CHUỖI", value: `${highestStreak} ngày`, icon: "/profile/trophy.gif" },
        { label: "TỔNG XP", value: `${totalXp} XP`, icon: "/profile/fire.gif" },
        { label: "BÀI ĐÃ HỌC", value: totalLessons, icon: "/profile/book.gif" },
    ];

    return (
        <div className="bg-white p-4 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.06)]">

            {/* Title */}
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary-900 mb-5">
                Kỷ lục cá nhân
            </h3>

            <div className="space-y-3">
                {bests.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-2xl
                                   hover:bg-slate-50 transition-all duration-200"
                    >
                        <div className="flex items-center gap-4">

                            {/* ICON */}
                            <div className="flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-sm">
                                <img
                                    src={item.icon}
                                    alt={item.label}
                                    className="w-14 h-14 object-contain"
                                />
                            </div>

                            {/* LABEL */}
                            <span className="text-xs font-black text-[#1f1a17] uppercase tracking-wide">
                                {item.label}
                            </span>
                        </div>

                        {/* VALUE */}
                        <span className="font-black text-base text-primary-600">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}