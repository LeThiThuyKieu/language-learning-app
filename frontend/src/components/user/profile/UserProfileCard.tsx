import { DEFAULT_AVATAR_URL } from "@/constants/avatarOptions";

interface UserProfileProps {
    name: string;
    level: string;
    showLevelLabel?: boolean;
    avatarUrl?: string;
    createdAt?: string;
    onAvatarClick: () => void;
    onEditNameClick: () => void;
    onLevelClick?: () => void;
}
const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa rõ";

    console.log("[formatDate] input:", dateString);

    // Nếu backend gửi về dạng dd-MM-yyyy, convert thành dd/MM/yyyy
    if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const formatted = dateString.replace(/-/g, "/");
        console.log("[formatDate] converted from dd-MM-yyyy to:", formatted);
        return formatted;
    }

    // Nếu đã là dd/MM/yyyy thì return luôn
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        console.log("[formatDate] already dd/MM/yyyy format:", dateString);
        return dateString;
    }

    try {
        // Parse ISO datetime string: "2026-05-14T10:30:00"
        let date: Date;

        if (dateString.includes("T")) {
            // ISO format from backend
            date = new Date(dateString);
        } else if (dateString.includes("-")) {
            // Possible other datetime format
            date = new Date(dateString);
        } else {
            // Try parsing as is
            date = new Date(dateString);
        }

        if (isNaN(date.getTime())) {
            console.warn("[formatDate] Invalid date:", dateString);
            return "Chưa rõ";
        }

        // Lấy ngày, tháng, năm từ local time
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        const result = `${day}/${month}/${year}`;
        console.log("[formatDate] parsed and formatted to:", result);
        return result;
    } catch (error) {
        console.error("[formatDate] Error:", error, "input:", dateString);
        return "Chưa rõ";
    }
};
export default function UserProfileCard({
                                            name,
                                            level,
                                            // showLevelLabel = true,
                                            avatarUrl,
                                            createdAt,
                                            onAvatarClick,
                                            onEditNameClick,
                                            onLevelClick
                                        }: UserProfileProps) {

    // Debug log
    console.log("[UserProfileCard] createdAt:", createdAt);
    const formattedDate = formatDate(createdAt);
    console.log("[UserProfileCard] formattedDate:", formattedDate);

    return (
        <div className="flex items-center justify-between px-10 py-8 mb-7 bg-white border border-slate-200 rounded-3xl shadow-sm">

            {/* LEFT CONTENT */}
            <div className="flex flex-col gap-3">

                {/* NAME */}
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                        {name}
                    </h1>

                    <button
                        onClick={onEditNameClick}
                        className="
                            w-9 h-9
                            flex items-center justify-center
                            rounded-full
                            bg-slate-100
                            text-slate-500
                            hover:bg-primary-100
                            hover:text-primary-600
                            transition-all duration-200
                        "
                    >
                        <i className="fa-solid fa-pen text-sm"></i>
                    </button>
                </div>

                {/* LEVEL */}
                <div className="flex items-center gap-2">
    <span className="text-sm font-medium text-slate-500">
        Trình độ:
    </span>

                    <button
                        type="button"
                        onClick={onLevelClick}
                        disabled={!onLevelClick}
                        className={`
            text-base font-semibold text-primary-700
            transition
            ${onLevelClick
                            ? "hover:text-primary-800 cursor-pointer"
                            : "cursor-default"}
        `}
                    >
                        {level}
                    </button>
                </div>

                {/* CREATED DATE */}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <i className="fa-regular fa-calendar"></i>

                    <span>
                            Tham gia từ:{" "}
                        <span className="font-medium text-slate-700">
                             {formattedDate}
                        </span>
                    </span>
                </div>
            </div>

            {/* AVATAR */}
            <div
                className="relative cursor-pointer group select-none"
                onClick={onAvatarClick}
            >
                <img
                    src={avatarUrl || DEFAULT_AVATAR_URL}
                    className="
                        w-28 h-28
                        rounded-full
                        object-cover
                        border-4 border-white
                        shadow-lg
                        transition-all duration-200
                        group-hover:scale-[1.03]
                        group-hover:border-primary-300
                    "
                    alt="User Avatar"
                />

                {/* OVERLAY */}
                <div className="
                    absolute inset-0
                    rounded-full
                    bg-black/30
                    opacity-0
                    group-hover:opacity-100
                    transition
                    flex items-center justify-center
                ">
                    <span className="text-white text-xs font-bold uppercase tracking-wide">
                        Đổi ảnh
                    </span>
                </div>

                {/* ONLINE DOT */}
                <div className="
                    absolute bottom-1 right-1
                    w-6 h-6
                    bg-green-500
                    border-4 border-white
                    rounded-full
                " />
            </div>
        </div>
    );
}