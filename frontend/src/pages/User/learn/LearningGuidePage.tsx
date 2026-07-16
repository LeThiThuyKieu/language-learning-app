import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
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
    ArrowLeft,
    Loader2,
} from "lucide-react";
import LearnSidebar from "@/components/user/learn/common/LearnSidebar.tsx";
import LearnRightPanel from "@/components/user/learn/common/LearnRightPanel.tsx";
import { useAuthStore } from "@/store/authStore";
import { getGeneralRevisionUnlocked } from "@/utils/generalRevisionAccess";
import { learningService } from "@/services/learningService";

/* ─── Accordion Section ──────────────────────────────────────────── */

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
                <span className="flex-1 text-base font-extrabold text-gray-800 uppercase tracking-wide">
                    {title}
                </span>
                {open ? (
                    <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                )}
            </button>
            {open && (
                <div className="px-5 pb-5 text-base text-gray-600 leading-relaxed border-t border-gray-100">
                    {children}
                </div>
            )}
        </div>
    );
}

/* ─── Static data ────────────────────────────────────────────────── */

const NODE_TYPES = [
    {
        icon: <BookOpen className="h-4 w-4 text-orange-500" />,
        bg: "bg-orange-50 border-orange-200",
        label: "Từ vựng (VOCAB)",
        desc: "Học và ghi nhớ từ mới, kèm phiên âm và nghĩa của từ.",
    },
    {
        icon: <Headphones className="h-4 w-4 text-blue-500" />,
        bg: "bg-blue-50 border-blue-200",
        label: "Luyện nghe (LISTENING)",
        desc: "Nghe audio và điền vào chỗ trống để cải thiện kỹ năng nghe.",
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
        label: "Nối từ (MATCHING)",
        desc: "Nối hai câu có liên quan với nhau.",
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
    },
    {
        id: 2,
        name: "Intermediate",
        color: "bg-primary-500",
        light: "bg-primary-50",
        border: "border-primary-200",
        text: "text-primary-700",
        desc: "Mở rộng vốn từ, luyện câu phức tạp, hội thoại thực tế.",
    },
    {
        id: 3,
        name: "Advanced",
        color: "bg-purple-500",
        light: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-700",
        desc: "Tinh chỉnh phát âm, luyện nghe nâng cao, sử dụng tiếng Anh như ngôn ngữ thứ hai.",
    },
];

export default function LearningGuidePage() {
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();
    const isAllLevelsCompleted = getGeneralRevisionUnlocked(user?.id);

    // Đếm số trees thực tế từng level — dùng lại cache của learningService
    const [treeCounts, setTreeCounts] = useState<Record<number, number>>({});
    const [loadingCounts, setLoadingCounts] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingCounts(true);
            try {
                // Gọi song song cả 3 level — dùng cache sessionStorage nếu đã có
                const results = await Promise.allSettled(
                    LEVELS.map((lv) => learningService.getLevelQuestions(lv.id))
                );
                if (cancelled) return;
                const counts: Record<number, number> = {};
                results.forEach((r, i) => {
                    counts[LEVELS[i].id] = r.status === "fulfilled" ? r.value.length : 0;
                });
                setTreeCounts(counts);
            } catch {
                // ignore — sẽ hiện "—" nếu không lấy được
            } finally {
                if (!cancelled) setLoadingCounts(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white -mt-8">
            <div className="w-full px-4 pb-8 pt-5 md:px-8 md:pt-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* ── Sidebar (giữ nguyên) ── */}
                    <LearnSidebar
                        isAllLevelsCompleted={isAllLevelsCompleted}
                        showGeneralRevision={false}
                        onToggleGeneralRevision={() => navigate("/general-revision")}
                        onNavigate={(path) => navigate(path)}
                        onLogout={() => {
                            logout();
                            navigate("/login", { replace: true });
                        }}
                        activeItem="learn"
                    />

                    {/* ── Main ── */}
                    <main className="col-span-12 md:col-span-9 lg:col-span-9">
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">

                                {/* Banner header — cùng style với LearningPage */}
                                <div className="sticky top-20 z-[45]">
                                    <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
                                        <div className="h-2 w-full bg-white pointer-events-none" aria-hidden />
                                        <div className="bg-primary-500 text-white px-6 py-4 flex flex-col gap-1">
                                            {/* Back to learning */}
                                            <button
                                                type="button"
                                                onClick={() => navigate("/learn")}
                                                className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-extrabold uppercase tracking-widest transition w-fit"
                                            >
                                                <ArrowLeft className="h-3.5 w-3.5" />
                                                Lộ trình học
                                            </button>
                                            <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight">
                                                Hướng dẫn học
                                            </h1>
                                            <p className="text-sm text-white/80 leading-relaxed mt-0.5">
                                                Lộ trình học được chia thành{" "}
                                                <strong className="text-white">3 level</strong>. Mỗi level có nhiều{" "}
                                                <strong className="text-white">cây kỹ năng (Tree)</strong>, mỗi cây gồm{" "}
                                                <strong className="text-white">5 node</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Content ── */}
                                <div className="flex flex-col gap-3 pb-6">

                                    {/* 3 levels */}
                                    <AccordionSection
                                        title="3 cấp độ học"
                                        icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                                        iconBg="bg-emerald-50"
                                        defaultOpen
                                    >
                                        <div className="flex flex-col gap-2 mt-3">
                                            {LEVELS.map((lv) => {
                                                const treeCount = treeCounts[lv.id];
                                                const treeLabel = loadingCounts
                                                    ? null
                                                    : treeCount
                                                    ? `${treeCount} cây kỹ năng × 5 node`
                                                    : null;
                                                return (
                                                <div
                                                    key={lv.id}
                                                    className={`flex items-start gap-3 rounded-xl border ${lv.border} ${lv.light} p-3`}
                                                >
                                                    <span
                                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${lv.color} text-white text-xs font-extrabold mt-0.5`}
                                                    >
                                                        {lv.id}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className={`font-extrabold text-base ${lv.text}`}>
                                                            Level {lv.id}: {lv.name}
                                                            {loadingCounts ? (
                                                                <span className="ml-2 inline-flex items-center gap-1 font-normal text-sm text-gray-400">
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                    đang tải...
                                                                </span>
                                                            ) : treeLabel ? (
                                                                <span className="ml-2 font-normal text-sm text-gray-400">
                                                                    ({treeLabel})
                                                                </span>
                                                            ) : null}
                                                        </p>
                                                        <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                                                            {lv.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                                );
                                            })}
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
                                                        <p className="font-extrabold text-sm text-gray-700">
                                                            {n.label}
                                                        </p>
                                                        <p className="text-sm text-gray-500 mt-0.5">{n.desc}</p>
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
                                                "Hoàn thành lần lượt từng node trong cây kỹ năng hiện tại.",
                                                "Đối với node review phải đạt ngưỡng 70% thì mới hoàn thành",
                                                "Khi hoàn thành tất cả cây trong level, hệ thống tự động mở khoá level tiếp theo.",
                                                "Bạn sẽ nhận thông báo chúc mừng và có thể bắt đầu level mới ngay.",
                                                "Sau khi hoàn thành cả 3 level, phần Ôn tập tổng hợp sẽ được mở khoá.",
                                            ].map((text, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-sm font-extrabold mt-0.5">
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-sm text-gray-600 leading-snug">{text}</span>
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
                                        <ol className="mt-3 flex flex-col gap-2.5 list-none">
                                            {[
                                                <>Nếu bạn đã có kiến thức sẵn, vào <strong>Tổng quan</strong> (nút ở góc trên bên trái của banner).</>,
                                                <>Chọn level muốn học vượt, nhấn <strong>Học vượt</strong> hoặc <strong>Thử thách ngay</strong>.</>,
                                                <>Hoàn thành bài kiểm tra để xác nhận năng lực và mở khoá level đó.</>,
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-sm font-extrabold mt-0.5">
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-sm text-gray-600 leading-snug">{item}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </AccordionSection>

                                    {/* Tips */}
                                    <AccordionSection
                                        title="Mẹo học hiệu quả"
                                        icon={<Zap className="h-5 w-5 text-primary-500" />}
                                        iconBg="bg-primary-50"
                                    >
                                        <ul className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
                                            {[
                                                "Học đều đặn mỗi ngày để duy trì chuỗi streak và nhận thưởng KN.",
                                                "Hoàn thành node Ôn tập (REVIEW) trước khi chuyển sang cây kỹ năng tiếp theo.",
                                                "Dùng phần Chữ cái trong sidebar để luyện phát âm từng âm IPA.",
                                                "Vào Bảng xếp hạng để cạnh tranh điểm KN, XP cùng cộng đồng.",
                                                "Sau khi hoàn thành cả 3 level, đừng bỏ qua phần Ôn tập tổng hợp!",
                                                "Ngoài ra, bạn cũng có thể tham gia luyện thi ở mục Thi."
                                            ].map((tip, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="mt-0.5 text-primary-400 font-bold shrink-0">✦</span>
                                                    <span>{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </AccordionSection>

                                    {/* CTA */}
                                    <button
                                        type="button"
                                        onClick={() => navigate("/learn")}
                                        className="w-full rounded-2xl bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-extrabold py-3.5 text-base uppercase tracking-widest transition-all shadow-md"
                                    >
                                        Bắt đầu học thôi! →
                                    </button>
                                </div>
                            </div>

                            {/* ── Right panel (giữ nguyên) ── */}
                            <LearnRightPanel onViewProfile={() => navigate("/profile")} />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
