import {Link, useNavigate} from "react-router-dom";
import {
    ArrowLeft,
    BookOpen,
    Headphones,
    Infinity as InfinityIcon,
    Layers,
    ListChecks,
    Mic,
    Puzzle,
} from "lucide-react";
import {cn} from "@/utils/cn.ts";

// Data detail
const detailItems = [
    {
        icon: "📖",
        title: "Vocab:",
        text: "15 câu (Trắc nghiệm chọn từ và ý nghĩa).",
    },
    {
        icon: "🎧",
        title: "Listening:",
        text: "3 câu (Nghe hiểu hội thoại theo các cấp độ khó tăng dần).",
    },
    {
        icon: "🗣️",
        title: "Speaking:",
        text: "3 bài (mỗi cấp 1 bài; mỗi bài nhiều dòng — chấm theo từng dòng).",
    },
    {
        icon: "🧩",
        title: "Matching:",
        text: "15 câu (Ghép nối từ vựng và hình ảnh/định nghĩa tương ứng).",
    },
    {
        icon: "⏳",
        title: "Thời gian:",
        text: "Không giới hạn. Bạn hãy cứ thong thả làm bài để đạt kết quả chính xác nhất.",
    },
    {
        icon: "⚙️",
        title: "Cơ chế Thích nghi (Adaptive):",
        text: "Hệ thống sẽ tự động điều chỉnh độ khó dựa trên câu trả lời của bạn.",
    },
    {
        icon: "🏆",
        title: "Kết quả:",
        text: "Xếp lớp ngay lập tức vào một trong ba cấp độ: Beginner, Intermediate, hoặc Advanced.",
    },
] as const;

export default function PlacementTestPage() {
    const navigate = useNavigate();

    const handleStart = () => {
        navigate("/placement-test/session");
    };

    return (
        <div className="min-h-screen bg-[#0a192f] text-white relative overflow-x-hidden">
            <div
                className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 w-[min(90vw,520px)] h-[min(90vw,520px)] bg-primary-500/15 blur-[120px] rounded-full"/>
            <div
                className="pointer-events-none absolute bottom-0 right-0 w-72 h-72 bg-primary-600/10 blur-[100px] rounded-full"/>
            {/* Content */}
            <div className="relative z-10 max-w-3xl mx-auto px-5 pt-8 pb-32 md:pb-28 md:px-8">
                <Link
                    to="/level-select"
                    className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4"/>
                    Quay lại chọn trình độ
                </Link>

                {/* Header */}
                <header className="text-center mb-10">
                    <div className="relative inline-block mb-5">
                        <div className="absolute inset-0 bg-primary-500/25 blur-3xl rounded-full scale-125"/>
                        <img
                            src="/logo/lion.png"
                            alt="Lion"
                            className="relative w-24 h-24 md:w-28 md:h-28 object-contain mx-auto drop-shadow-lg opacity-95"
                        />
                    </div>
                    <p className="text-xs md:text-sm font-semibold tracking-wide text-primary-300/90 uppercase mb-2">
                        Lion · Kiểm tra đầu vào
                    </p>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-4">
                        Kiểm tra Năng lực Tiếng Anh Đầu vào
                    </h1>
                    <p className="text-sm md:text-base text-white/85 leading-relaxed max-w-2xl mx-auto">
                        Chào mừng bạn! Bài test này giúp hệ thống xác định chính xác trình độ của bạn để cá nhân
                        hóa lộ trình học tập hiệu quả nhất.
                    </p>
                </header>

                {/* Detail */}
                <section className="mb-10">
                    <h2 className="text-lg font-bold text-primary-200 mb-4">Nội dung chi tiết</h2>
                    <ul className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.06] p-5 md:p-6 backdrop-blur-sm">
                        {detailItems.map((row) => (
                            <li key={row.title} className="flex gap-3 text-sm md:text-base leading-relaxed">
                                <span className="shrink-0 text-lg leading-6" aria-hidden>
                                  {row.icon}
                                </span>
                                <span>
                                  <span className="font-semibold text-white">{row.title}</span>{" "}<span className="text-white/85">{row.text}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Overview */}
                <section className="mb-10">
                    <h2 className="text-lg font-bold text-primary-200 mb-4">Tổng quan nhanh</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoCard
                            title="Đánh giá kỹ năng toàn diện"
                            subtitle="Vocab · Listening · Speaking · Matching"
                            icon={
                                <div className="flex gap-1.5 text-primary-300">
                                    <BookOpen className="w-5 h-5" strokeWidth={2}/>
                                    <Headphones className="w-5 h-5" strokeWidth={2}/>
                                    <Mic className="w-5 h-5" strokeWidth={2}/>
                                    <Puzzle className="w-5 h-5" strokeWidth={2}/>
                                </div>
                            }
                        />
                        <InfoCard
                            title="45+ câu hỏi"
                            subtitle="15 Vocab, 3 Listening, 3 Speaking, 15 cặp Matching"
                            icon={<ListChecks className="w-8 h-8 text-primary-300" strokeWidth={1.75}/>}
                        />
                        <InfoCard
                            title="Không giới hạn thời gian"
                            subtitle="Làm chậm, chính xác — không bị giới hạn giờ"
                            icon={<InfinityIcon className="w-8 h-8 text-primary-300" strokeWidth={1.75}/>}
                        />
                        <InfoCard
                            title="3 cấp độ thành thạo"
                            subtitle="Beginner, Intermediate, Advanced"
                            icon={<Layers className="w-8 h-8 text-primary-300" strokeWidth={1.75}/>}
                        />
                    </div>
                </section>

                {/* Take note */}
                <aside className="rounded-2xl border-l-4 border-primary-500 bg-primary-900/25 px-4 py-4 md:px-5 text-sm md:text-base text-white/90 leading-relaxed" role="note">
                    <span className="font-semibold text-primary-100">Lưu ý: </span>Vui lòng thực hiện bài test trung thực, chọn nơi yên tĩnh và kiểm tra Micro/Loa trước khi bắt đầu.
                </aside>
            </div>

            {/* Button Bắt đầu Test */}
            <div
                className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[#0a192f]/90 backdrop-blur-md px-5 py-4 md:py-5 flex justify-center">
                <button
                    type="button"
                    onClick={handleStart}
                    className={cn(
                        "w-full max-w-md rounded-full px-8 py-3.5 md:py-4 text-base md:text-lg font-semibold",
                        "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-900/40",
                        "transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a192f]"
                    )}
                >
                    Bắt đầu Test
                </button>
            </div>
        </div>
    );
}

type InfoCardProps = {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
};

function InfoCard({title, subtitle, icon}: InfoCardProps) {
    return (
        <div
            className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm transition-colors hover:border-primary-400/35 hover:bg-white/[0.08]">
            <div className="mb-3">{icon}</div>
            <div className="text-base font-bold text-white leading-snug">{title}</div>
            <div className="mt-1.5 text-sm text-white/70 leading-relaxed">{subtitle}</div>
        </div>
    );
}
