// 1. Định nghĩa Interface (Props)
interface HeaderProps {
    name: string;
    level: string;
    avatarUrl?: string; // Thêm dấu ? để báo hiệu avatar có thể bị trống
    onAvatarClick: () => void;
}

export default function Header({ name, level, avatarUrl, onAvatarClick }: HeaderProps) {

    // Link ảnh con gấu mặc định bạn muốn
    const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/thumbs/svg?seed=Bear";

    return (
        <div className="flex items-center justify-between p-8 border-b-2 border-slate-100 mb-6 bg-white">
            <div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight">
                    {name}
                </h1>
                <p className="text-slate-500 font-bold text-lg">
                    Trình độ: {level}
                </p>

                <div className="mt-3 flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                        ANH VĂN
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                        ACTIVE
                    </span>
                </div>
            </div>

            {/* Khu vực Avatar */}
            <div
                className="relative cursor-pointer group select-none"
                onClick={onAvatarClick}
            >
                <div
                    className="relative cursor-pointer group select-none"
                    onClick={onAvatarClick}
                >
                    <img
                        src={avatarUrl || DEFAULT_AVATAR}
                        // Đổi rounded-3xl thành rounded-full
                        className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md transition-all duration-200 group-hover:border-orange-400 object-cover"
                        alt="User Avatar"
                    />

                    {/* Lớp phủ Đổi ảnh cũng phải hình tròn */}
                    <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase">
                        Đổi ảnh
                    </div>

                    {/* Chấm xanh online */}
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                </div>
            </div>
        </div>
    );
}