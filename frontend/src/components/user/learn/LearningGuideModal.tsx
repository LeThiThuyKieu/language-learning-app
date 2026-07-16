import { createPortal } from "react-dom";
import {
    X,
    BookOpen,
    Headphones,
    Mic,
    Shuffle,
    RotateCcw,
    CheckCircle2,
    Lock,
    Zap,
    ChevronDown,
    ChevronUp,
    Info,
} from "lucide-react";
import { useState } from "react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

interface SectionProps {
    title: string;
    icon: React.ReactNode;
    iconBg: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

function AccordionSection({ title, icon, iconBg, children, defaultOpen = false }: SectionProps) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition"
            >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                    {icon}
                </span>
                <span className="flex-1 text-sm font-extrabold text-gray-800 uppercase tracking-wide">
                    {title}
                </span>
                {open ? (
                    <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                )}
            </button>
            {open && (
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                    {children}
                </div>
            )}
        </div>
    );
}

const NODE_TYPES = [
    {
        icon: <BookOpen className="h-4 w-4 text-orange-500" />,
        bg: "bg-orange-50 border-orange-200",
        label: "Từ vựng (VOCAB)",
        desc: "Học và ghi nhớ từ mới theo chủ đề, kèm phiên âm và ví dụ.",
    },
    {
        icon: <Headphones className="h-4 w-4 text-blue-500" />,
        bg: "bg-blue-50 border-blue-200",
        label: "Luyện nghe (LISTENING)",
        desc: "Nghe audio và trả lời câu hỏi để cải thiện kỹ năng nghe.",
    },
    {
        icon: <Mic className="h-4 w-4 text-purple-500" />,
        bg: "bg-purple-50 border-purple-200",
        label: "Luyện nói (SPEAKING)",
        desc: "Đọc to câu mẫu và thu âm để luyện phát âm chuẩn.",
    },
    {
        icon: <Shuffle className="h-4 w-4 text-teal-500" />,
        bg: "bg-teal-50 border-teal-200",
        label: "Ghép đôi (MATCHING)",
        desc: "Kéo-thả hoặc nối từ — nghĩa để kiểm tra vốn từ nhanh.",
    },
    {
        icon: <RotateCcw className="h-4 w-4 text-rose-500" />,
        bg: "bg-rose-50 border-rose-200",
        label: "Ôn tập (REVIEW)",
        desc: "Ôn lại toàn bộ nội dung của cây kỹ năng trước khi kết thúc.",
    },
];

const LEVELS = [
    {
        id: 1,
        name: "Beginner",
        color: "bg-emerald-500",
        light: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        desc: "Xây dựng nền tảng: bảng chữ cái phiên âm, từ vựng cơ bản, mẫu câu hằng ngày.",
        trees: "3 cây kỹ năng × 5 node",
    },
    {
        id: 2,
        name: "Intermediate",
        color: "bg-primary-500",
        light: "bg-primary-50",
        border: "border-primary-200",
        text: "text-primary-700",
        desc: "Mở rộng vốn từ, luyện câu phức tạp, hội thoại thực tế.",
        trees: "3 cây kỹ năng × 5 node",
    },
    {
        id: 3,
        name: "Advanced",
        color: "bg-purple-500",
        light: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-700",
        desc: "Tinh chỉnh phát âm, luyện nghe nâng cao, sử dụng tiếng Anh như ngôn ngữ thứ hai.",
        trees: "3 cây kỹ năng × 5 node",
    },
];

export default function LearningGuideModal({ isOpen, onClose }: Props) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 py-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal card */}
            <div className="relative w-full max-w-lg rounded-3xl bg-gray-50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Top colour strip */}
                <div className="h-2 w-full bg-gradient-to-r from-orange-400 via-primary-500 to-orange-600 shrink-0" />

                {/* Header */}
                <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-100 shrink-0 bg-white">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50">
                        <Info className="h-5 w-5 text-primary-500" />
                    </span>
                    <div className="flex-1">
                        <h2 className="text-base font-extrabold text-gray-900">Hướng dẫn học</h2>
                        <p className="text-xs text-gray-400 font-medium">Cách hoạt động của lộ trình</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                        aria-label="Đóng"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-3">

                    {/* Quick intro */}
                    <div className="rounded-2xl bg-primary-500 text-white px-5 py-4 flex gap-3 items-start">
                        <img
                            src="/logo/lion.png"
                            alt="mascot"
                            className="h-12 w-12 object-contain shrink-0 drop-shadow"
                            draggable={false}
                        />
                        <div className="text-sm leading-relaxed">
                            <p className="font-extrabold text-base mb-1">Chào mừng bạn! 🎉</p>
                            <p className="text-white/90">
                                Lộ trình học được chia thành <strong>3 level</strong>. Mỗi level có nhiều <strong>cây kỹ năng (Tree)</strong>, mỗi cây gồm <strong>5 node</strong> theo thứ tự từ dễ đến khó.
                            </p>
                        </div>
                    </div>

                    {/* Levels */}
                    <AccordionSection
                        title="3 cấp độ học"
                        icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                        defaultOpen
                    >
                        <div className="flex flex-col gap-2 mt-3">
                            {LEVELS.map((lv) => (
                                <div
                                    key={lv.id}
                                    className={`flex items-start gap-3 rounded-xl border ${lv.border} ${lv.light} p-3`}
                                >
                                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${lv.color} text-white text-xs font-extrabold mt-0.5`}>
                                        {lv.id}
                                    </span>
                                    <div className="min-w-0">
                                        <p className={`font-extrabold text-sm ${lv.text}`}>
                                            Level {lv.id}: {lv.name}
                                            <span className="ml-2 font-normal text-xs text-gray-400">({lv.trees})</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{lv.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionSection>

                    {/* Node types */}
                    <AccordionSection
                        title="5 loại node trong mỗi cây"
                        icon={<BookOpen className="h-5 w-5 text-orange-500" />}
                        iconBg="bg-orange-50"
                    >
                        <div className="flex flex-col gap-2 mt-3">
                            {NODE_TYPES.map((n) => (
                                <div
                                    key={n.label}
                                    className={`flex items-start gap-3 rounded-xl border ${n.bg} p-3`}
                                >
                                    <span className="mt-0.5 shrink-0">{n.icon}</span>
                                    <div>
                                        <p className="font-extrabold text-xs text-gray-700">{n.label}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionSection>

                    {/* How to progress */}
                    <AccordionSection
                        title="Cách lên level & mở khoá"
                        icon={<Lock className="h-5 w-5 text-gray-500" />}
                        iconBg="bg-gray-100"
                    >
                        <ol className="mt-3 flex flex-col gap-2.5 list-none">
                            {[
                                {
                                    step: "1",
                                    text: "Hoàn thành lần lượt từng node trong cây kỹ năng hiện tại.",
                                },
                                {
                                    step: "2",
                                    text: "Khi hoàn thành tất cả cây trong level, hệ thống tự động mở khoá level tiếp theo.",
                                },
                                {
                                    step: "3",
                                    text: "Bạn sẽ nhận thông báo chúc mừng và có thể bắt đầu level mới ngay.",
                                },
                                {
                                    step: "4",
                                    text: "Sau khi hoàn thành cả 3 level, phần Ôn tập tổng hợp sẽ được mở khoá.",
                                },
                            ].map(({ step, text }) => (
                                <li key={step} className="flex items-start gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-xs font-extrabold mt-0.5">
                                        {step}
                                    </span>
                                    <span className="text-xs text-gray-600 leading-snug">{text}</span>
                                </li>
                            ))}
                        </ol>
                    </AccordionSection>

                    {/* Skip level */}
                    <AccordionSection
                        title="Học vượt (Skip level)"
                        icon={<Zap className="h-5 w-5 text-amber-500" />}
                        iconBg="bg-amber-50"
                    >
                        <div className="mt-3 flex flex-col gap-2 text-xs text-gray-600">
                            <p>
                                Nếu bạn đã có kiến thức sẵn, bạn có thể <strong>học vượt</strong> lên level cao hơn mà không cần học tuần tự.
                            </p>
                            <ul className="flex flex-col gap-1.5 mt-1">
                                <li className="flex items-start gap-2">
                                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-bold">→</span>
                                    <span>Vào <strong>Tổng quan</strong> (nút ở góc trên bên trái của banner).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-bold">→</span>
                                    <span>Chọn level muốn học vượt, nhấn <strong>Học vượt</strong> hoặc <strong>Thử thách ngay</strong>.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-bold">→</span>
                                    <span>Hoàn thành bài kiểm tra placement để xác nhận năng lực và mở khoá level đó.</span>
                                </li>
                            </ul>
                        </div>
                    </AccordionSection>

                    {/* Tips */}
                    <AccordionSection
                        title="Mẹo học hiệu quả"
                        icon={<Zap className="h-5 w-5 text-primary-500" />}
                        iconBg="bg-primary-50"
                    >
                        <ul className="mt-3 flex flex-col gap-2 text-xs text-gray-600">
                            {[
                                "Học đều đặn mỗi ngày để duy trì chuỗi streak và nhận thưởng XP.",
                                "Hoàn thành node Ôn tập (REVIEW) trước khi chuyển sang cây kỹ năng tiếp theo.",
                                "Dùng phần Phiên âm trong sidebar để luyện phát âm từng âm IPA.",
                                "Vào Bảng xếp hạng để cạnh tranh điểm XP cùng cộng đồng.",
                                "Sau khi hoàn thành cả 3 level, đừng bỏ qua phần Ôn tập tổng hợp!",
                            ].map((tip, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="mt-0.5 text-primary-400 font-bold shrink-0">✦</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </AccordionSection>

                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-2xl bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-extrabold py-3 text-sm uppercase tracking-widest transition-all shadow-md"
                    >
                        Bắt đầu học thôi!
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
