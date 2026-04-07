interface Badge {
    id: number;
    name: string;
    icon: string;
    isLocked: boolean;
    color: string; // Màu nền nhẹ cho vòng tròn icon
}

export default function BadgesGrid() {
    const myBadges: Badge[] = [
        { id: 1, name: "SIÊU CẤP", icon: "🏆", isLocked: false, color: "bg-yellow-100" },
        { id: 2, name: "LỬA ĐỎ", icon: "🔥", isLocked: false, color: "bg-orange-100" },
        { id: 3, name: "HÀN LÂM", icon: "🎓", isLocked: false, color: "bg-blue-100" },
        { id: 4, name: "VÔ ĐỊCH", icon: "🥇", isLocked: true, color: "bg-slate-100" },
        { id: 5, name: "CHUYÊN CẦN", icon: "📚", isLocked: true, color: "bg-slate-100" },
        { id: 6, name: "SÁNG TẠO", icon: "💡", isLocked: true, color: "bg-slate-100" },
    ];

    return (
        <div className="bg-white rounded-[2rem] border border-primary-100 shadow-sm p-6">
            {/* UserProfileCard đúng style hình vẽ */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-black italic uppercase tracking-tighter text-primary-900">
                    Bảng vàng thành tích
                </h2>
                <button className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-800 transition-colors">
                    Xem tất cả
                </button>
            </div>

            {/* Grid Huy hiệu */}
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-y-8 gap-x-4">
                {myBadges.map((badge) => (
                    <div
                        key={badge.id}
                        className={`flex flex-col items-center group transition-all duration-300 ${badge.isLocked ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:scale-110 cursor-pointer'}`}
                    >
                        {/* Vòng tròn chứa Icon */}
                        <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 shadow-inner border-4 border-white ${badge.isLocked ? 'bg-slate-200' : badge.color}`}>

              <span className="text-3xl sm:text-4xl drop-shadow-sm">
                {badge.icon}
              </span>

                            {/* Nếu khóa thì hiện icon ổ khóa nhỏ */}
                            {badge.isLocked && (
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-slate-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}

                            {/* Hiệu ứng tia sáng khi hover vào huy hiệu đã mở */}
                            {!badge.isLocked && (
                                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            )}
                        </div>

                        {/* Tên huy hiệu */}
                        <span className={`text-[10px] font-black text-center uppercase tracking-tighter leading-tight ${badge.isLocked ? 'text-slate-400' : 'text-primary-800 group-hover:text-primary-600'}`}>
              {badge.name}
            </span>
                    </div>
                ))}
            </div>
        </div>
    );
}