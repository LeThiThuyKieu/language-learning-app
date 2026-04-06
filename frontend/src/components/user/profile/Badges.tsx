interface BadgeItem {
    name: string;
    icon: string;
    color: string;
    locked: boolean;
    progress: number;
}

// 2. Định nghĩa Props cho Component Badges
interface BadgesProps {
    badges?: BadgeItem[];
}

export default function Badges({ badges }: BadgesProps) {
    const defaultBadges: BadgeItem[] = [
        {
            name: "Siêu cấp",
            icon: "/profile/trophy.gif",
            color: "bg-yellow-100",
            locked: false,
            progress: 100
        },
        {
            name: "Lửa đỏ",
            icon: "/profile/fire.gif",
            color: "bg-orange-100",
            locked: false,
            progress: 100
        },
        {
            name: "Hàn lâm",
            icon: "/profile/scholar.gif",
            color: "bg-blue-100",
            locked: false,
            progress: 45
        },
    ];

    const displayBadges = badges || defaultBadges;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black italic text-slate-800">Thành tích</h2>
                <button className="text-blue-500 font-black text-xs uppercase hover:text-blue-600 transition-colors">
                    Xem thêm
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {displayBadges.map((b, i) => (
                    <div
                        key={i}
                        className={`flex flex-col items-center transition-all duration-300 
                                   ${b.locked ? 'opacity-40 grayscale' : 'hover:scale-110'}`}
                    >
                        {/* Hình tròn chứa Icon */}
                        <div className={`w-16 h-16 ${b.color} rounded-full flex items-center justify-center mb-2 shadow-inner border-2 border-white`}>
                            <img
                                src={b.icon}
                                alt={b.name}
                                className="w-10 h-10 object-contain"
                                // Fix lỗi hiển thị text icon cũ
                            />
                        </div>

                        {/* Tên huy hiệu */}
                        <span className="text-[10px] font-black text-slate-700 text-center uppercase tracking-tighter leading-tight">
                            {b.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}