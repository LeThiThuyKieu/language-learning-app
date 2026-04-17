import { DEFAULT_AVATAR_URL } from "@/constants/avatarOptions";
// 1. Định nghĩa Interface (Props)
interface UserProfileProps {
    name: string;
    level: string;
    showLevelLabel?: boolean;
    avatarUrl?: string; // Thêm dấu ? để báo hiệu avatar có thể bị trống
    onAvatarClick: () => void;
    onEditNameClick: () => void;
    onLevelClick?: () => void;
}

export default function UserProfileCard({ name, level, showLevelLabel = true, avatarUrl, onAvatarClick, onEditNameClick, onLevelClick }: UserProfileProps) {


    return (
        <div className="flex items-center justify-between p-10 border-b-2 border-slate-200 mb-7 bg-white">
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-4xl font-black text-primary-900 leading-tight">
                        {name}
                    </h1>

                    <button
                        onClick={onEditNameClick}
                        className="w-8 h-8 flex items-center justify-center
                           rounded-full
                           hover:bg-primary-100
                           hover:text-primary-600
                           transition"
                    >
                        <i className="fa-solid fa-pencil text-sm"></i>
                    </button>
                </div>
                <button
                    type="button"
                    onClick={onLevelClick}
                    disabled={!onLevelClick}
                    className={`text-left text-[#1f1a17] font-bold text-xl ${onLevelClick ? "hover:text-primary-700 transition cursor-pointer" : "cursor-default"}`}
                >
                    {showLevelLabel ? `Trình độ: ${level}` : level}
                </button>

                <div className="flex gap-2 mt-[10px]">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600  rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                        Anh Văn
                    </span>
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-green-100">
                        Active
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
                        src={avatarUrl || DEFAULT_AVATAR_URL}
                        className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-md transition-all duration-200 group-hover:border-primary-400 object-cover"
                        alt="User Avatar"
                    />

                    <div className="absolute inset-0 bg-primary-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-primary-50 text-[10px] font-black uppercase">
                        Đổi ảnh
                    </div>

                    {/* Chấm xanh online */}
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#22c55e] border-4 border-white rounded-full"></div>
                </div>
            </div>
        </div>
    );
}