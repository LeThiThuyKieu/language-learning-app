import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
    CheckCircle2, XCircle, Clock, Zap, AlertTriangle,
    TrendingUp, Lightbulb, ArrowRight, RotateCcw, BookOpen,
    Star, PartyPopper, Frown, Meh, HelpCircle, FlaskConical,
    ClipboardList,
} from "lucide-react";
import ReviewAnswerSheet from "@/components/user/learn/ReviewAnswerSheet.tsx";
import type { AttemptItem } from "@/services/learningService";
import type { SkillTreeEnrichedQuestion } from "@/types";

export type ReviewOutcome =
    | "FAST_TRACKER"
    | "STEADY"
    | "SLOW_PASS"
    | "FAIL"
    | "CARELESS";

interface Props {
    accuracy: number;
    correctCount: number;
    totalCount: number;
    elapsedSeconds: number;
    totalSeconds: number;
    timedOut: boolean;
    outcome: ReviewOutcome;
    /** Danh sách attempts để hiển thị "Xem lại bài làm" (chỉ pass cases) */
    attempts?: AttemptItem[];
    /** Danh sách câu hỏi gốc để ghép với attempts */
    questions?: SkillTreeEnrichedQuestion[];
    onContinue: () => void;
    onRetry: () => void;
    /** Chỉ dùng cho FAST_TRACKER: navigate sang skip-test */
    onSkipTest?: () => void;
}

// Confetti
interface Particle {
    id: number; x: number; y: number; color: string; size: number;
    speedX: number; speedY: number; rotation: number; rotationSpeed: number; opacity: number;
}
const CONFETTI_COLORS = ["#fe4d01","#f97316","#fbbf24","#34d399","#60a5fa","#a78bfa","#f472b6"];

function useConfetti(active: boolean) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        if (!active) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        particlesRef.current = Array.from({ length: 80 }, (_, i) => ({
            id: i,
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * 200,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            size: 6 + Math.random() * 8,
            speedX: (Math.random() - 0.5) * 3,
            speedY: 2 + Math.random() * 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 8,
            opacity: 1,
        }));

        function draw() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particlesRef.current = particlesRef.current.filter(p => p.opacity > 0.05);
            for (const p of particlesRef.current) {
                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
                ctx.restore();
                p.x += p.speedX; p.y += p.speedY; p.rotation += p.rotationSpeed;
                if (p.y > canvas.height * 0.7) p.opacity -= 0.02;
            }
            if (particlesRef.current.length > 0) rafRef.current = requestAnimationFrame(draw);
        }
        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
    }, [active]);

    return canvasRef;
}

// Outcome config
const OUTCOME_CONFIG: Record<ReviewOutcome, {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    tip: string;
    showPlacementBtn: boolean;
    canPass: boolean;
    gradient: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    lionMood: "celebrate" | "happy" | "thinking" | "sad" | "worried";
    label: string;
    labelColor: string;
}> = {
    FAST_TRACKER: {
        icon: <Zap className="w-5 h-5" />,
        title: "Xuất sắc! Bạn hoàn thành rất nhanh!",
        subtitle: "Bạn nắm kiến thức rất vững. Hệ thống ghi nhận bạn là Fast-Tracker!",
        tip: "Bạn học rất nhanh! Hãy thử học vượt lên Level cao hơn để thử thách bản thân nhé.",
        showPlacementBtn: true,
        canPass: true,
        gradient: "from-amber-400 via-orange-400 to-primary-600",
        badgeBg: "bg-amber-50",
        badgeText: "text-amber-700",
        badgeBorder: "border-amber-300",
        lionMood: "celebrate",
        label: "FAST TRACKER",
        labelColor: "bg-amber-400 text-white",
    },
    STEADY: {
        icon: <CheckCircle2 className="w-5 h-5" />,
        title: "Hoàn thành tốt!",
        subtitle: "Bạn nắm kiến thức đúng lộ trình. Tiếp tục sang Tree tiếp theo nhé!",
        tip: "Hãy cố gắng cải thiện tốc độ phản xạ ở bài sau.",
        showPlacementBtn: false,
        canPass: true,
        gradient: "from-emerald-400 via-teal-400 to-cyan-500",
        badgeBg: "bg-emerald-50",
        badgeText: "text-emerald-700",
        badgeBorder: "border-emerald-300",
        lionMood: "happy",
        label: "STEADY",
        labelColor: "bg-emerald-500 text-white",
    },
    SLOW_PASS: {
        icon: <Clock className="w-5 h-5" />,
        title: "Đạt — nhưng cần cải thiện tốc độ!",
        subtitle: "Bạn trả lời đúng nhưng mất nhiều thời gian. Hãy luyện tập thêm.",
        tip: "Bạn cần cải thiện tốc độ xử lý kiến thức.",
        showPlacementBtn: false,
        canPass: true,
        gradient: "from-amber-300 via-yellow-400 to-orange-400",
        badgeBg: "bg-amber-50",
        badgeText: "text-amber-700",
        badgeBorder: "border-amber-300",
        lionMood: "thinking",
        label: "SLOW PASS",
        labelColor: "bg-amber-500 text-white",
    },
    FAIL: {
        icon: <XCircle className="w-5 h-5" />,
        title: "Chưa đạt — Cần ôn lại!",
        subtitle: "Bạn cần nắm vững hơn kiến thức ở 4 node trước khi hoàn tất Tree này.",
        tip: "Hãy xem lại các bài học VOCAB, LISTENING, SPEAKING, MATCHING rồi thử lại.",
        showPlacementBtn: false,
        canPass: false,
        gradient: "from-red-400 via-rose-500 to-pink-500",
        badgeBg: "bg-red-50",
        badgeText: "text-red-700",
        badgeBorder: "border-red-300",
        lionMood: "sad",
        label: "FAIL",
        labelColor: "bg-red-500 text-white",
    },
    CARELESS: {
        icon: <AlertTriangle className="w-5 h-5" />,
        title: "Làm nhanh nhưng chưa chính xác!",
        subtitle: "Bạn hoàn thành rất nhanh nhưng tỷ lệ đúng thấp. Hãy đọc kỹ câu hỏi hơn nhé.",
        tip: "Đừng vội — hãy đọc kỹ từng câu trước khi trả lời.",
        showPlacementBtn: false,
        canPass: false,
        gradient: "from-orange-400 via-amber-500 to-yellow-500",
        badgeBg: "bg-orange-50",
        badgeText: "text-orange-700",
        badgeBorder: "border-orange-300",
        lionMood: "worried",
        label: "CARELESS",
        labelColor: "bg-orange-500 text-white",
    },
};

// Lion mascot
function LionMascot({ mood }: { mood: "celebrate" | "happy" | "thinking" | "sad" | "worried" }) {
    const animClass = {
        celebrate: "animate-lion-celebrate",
        happy:     "animate-lion-bounce",
        thinking:  "animate-lion-sway",
        sad:       "animate-lion-droop",
        worried:   "animate-lion-shake",
    }[mood];

    const MoodIcon: Record<typeof mood, React.ReactNode> = {
        celebrate: <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />,
        happy:     <PartyPopper className="w-4 h-4 text-emerald-500" />,
        thinking:  <HelpCircle className="w-4 h-4 text-amber-500" />,
        sad:       <Frown className="w-4 h-4 text-red-400" />,
        worried:   <Meh className="w-4 h-4 text-orange-400" />,
    };

    return (
        <div className={`relative flex items-center justify-center ${animClass}`}>
            <img
                src="/logo/lion.png"
                alt="Lion mascot"
                className="w-28 h-28 object-contain drop-shadow-xl select-none"
                draggable={false}
            />
            {/* Mood icon badge */}
            <span className="absolute -top-1 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-100">
                {MoodIcon[mood]}
            </span>
            {/* Extra sparkles cho celebrate */}
            {mood === "celebrate" && (
                <>
                    <span className="absolute -top-3 left-1 animate-ping-slow">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-300" />
                    </span>
                    <span className="absolute -bottom-1 -left-3 animate-ping-slow delay-300">
                        <Zap className="w-3 h-3 text-primary-500" />
                    </span>
                </>
            )}
        </div>
    );
}

// Format time: 500s → "08:20"
function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Animated counter
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        let cur = 0;
        const step = Math.max(1, Math.ceil(target / 30));
        const id = setInterval(() => {
            cur = Math.min(cur + step, target);
            setVal(cur);
            if (cur >= target) clearInterval(id);
        }, 30);
        return () => clearInterval(id);
    }, [target]);
    return <>{val}{suffix}</>;
}

// Main component
export default function ReviewResultView({
    accuracy, correctCount, totalCount, elapsedSeconds, totalSeconds,
    timedOut, outcome, attempts, questions, onContinue, onRetry, onSkipTest,
}: Props) {
    const cfg = OUTCOME_CONFIG[outcome];
    const canvasRef = useConfetti(cfg.canPass);
    const [visible, setVisible] = useState(false);
    const [showSheet, setShowSheet] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="relative min-h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* Confetti canvas */}
            {cfg.canPass && (
                <canvas
                    ref={canvasRef}
                    className="pointer-events-none fixed inset-0 z-50"
                    style={{ width: "100vw", height: "100vh" }}
                />
            )}

            {/* Answer sheet modal — chỉ pass cases */}
            {showSheet && attempts && questions && (
                <ReviewAnswerSheet
                    attempts={attempts}
                    questions={questions}
                    onClose={() => setShowSheet(false)}
                />
            )}

            {/* Gradient header strip */}
            <div className={`w-full h-2 bg-gradient-to-r ${cfg.gradient}`} />

            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div
                    className={`w-full max-w-xl transition-all duration-500 ${
                        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                    }`}
                >
                    {/* Hero card */}
                    <div className={`relative rounded-3xl border-2 ${cfg.badgeBorder} ${cfg.badgeBg} overflow-hidden mb-5`}>
                        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${cfg.gradient} opacity-10 blur-2xl`} />
                        <div className={`absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-tr ${cfg.gradient} opacity-10 blur-2xl`} />

                        <div className="relative z-10 flex flex-col items-center pt-7 pb-6 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest mb-4 ${cfg.labelColor}`}>
                                {cfg.icon}
                                {cfg.label}
                            </span>
                            <LionMascot mood={cfg.lionMood} />
                            <h1 className={`text-xl font-extrabold ${cfg.badgeText} mt-4 mb-1.5 leading-snug`}>
                                {cfg.title}
                            </h1>
                            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                                {cfg.subtitle}
                            </p>
                        </div>
                    </div>

                    {/* Accuracy progress bar */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Độ chính xác</span>
                            <span className={`text-2xl font-extrabold ${cfg.badgeText}`}>
                                <AnimatedNumber target={accuracy} suffix="%" />
                            </span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${cfg.gradient} transition-all duration-1000 ease-out`}
                                style={{ width: visible ? `${accuracy}%` : "0%" }}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-gray-400">0%</span>
                            <span className="text-[10px] text-gray-400 font-semibold">Ngưỡng đạt: 70%</span>
                            <span className="text-[10px] text-gray-400">100%</span>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div
                            className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm transition-all duration-500"
                            style={{ transitionDelay: "150ms", opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)" }}
                        >
                            <div className="text-2xl font-extrabold text-gray-900">
                                {correctCount}<span className="text-gray-400 text-lg">/{totalCount}</span>
                            </div>
                            <div className="text-[10px] font-bold uppercase text-gray-400 mt-1">Câu đúng</div>
                        </div>
                        <div
                            className={`rounded-2xl border p-4 text-center shadow-sm transition-all duration-500 ${
                                timedOut ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"
                            }`}
                            style={{ transitionDelay: "250ms", opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)" }}
                        >
                            <div className={`text-xl font-extrabold tabular-nums ${timedOut ? "text-red-600" : "text-gray-900"}`}>
                                {timedOut ? "Hết giờ" : formatTime(elapsedSeconds)}
                            </div>
                            <div className="text-[10px] font-bold uppercase text-gray-400 mt-1 flex items-center justify-center gap-1">
                                {timedOut && <Clock className="w-3 h-3" />}
                                {timedOut ? "Timeout" : "Thời gian"}
                            </div>
                        </div>
                    </div>

                    {/* Tip box */}
                    <div
                        className="rounded-2xl bg-white border border-gray-200 px-4 py-3 mb-4 flex items-start gap-2.5 shadow-sm transition-all duration-500"
                        style={{ transitionDelay: "350ms", opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)" }}
                    >
                        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 leading-relaxed">{cfg.tip}</p>
                    </div>

                    {/* Threshold info */}
                    <div className="flex items-center gap-2 mb-5 px-1">
                        <TrendingUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-400">
                            Ngưỡng đạt: <span className="font-bold text-gray-600">70%</span>
                            {" · "}Thời gian: <span className="font-bold text-gray-600 tabular-nums">{formatTime(totalSeconds)}</span>
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div
                        className="transition-all duration-500"
                        style={{ transitionDelay: "450ms", opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)" }}
                    >
                        {cfg.canPass ? (
                            /* ── Pass: 3 nút nằm ngang ── */
                            <div className="flex gap-2 items-stretch">
                                {/* Xem lại bài làm */}
                                {attempts && attempts.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowSheet(true)}
                                        className="flex-1 rounded-2xl border-2 border-gray-200 bg-white text-gray-600 font-bold py-3 text-xs uppercase tracking-wide transition hover:bg-gray-50 active:scale-95 flex flex-col items-center justify-center gap-1.5 min-w-0"
                                    >
                                        <ClipboardList className="w-5 h-5 shrink-0" />
                                        <span className="leading-tight text-center">Xem lại<br />bài làm</span>
                                    </button>
                                )}

                                {/* Học vượt level — chỉ FAST_TRACKER */}
                                {cfg.showPlacementBtn && onSkipTest && (
                                    <button
                                        type="button"
                                        onClick={onSkipTest}
                                        className="flex-1 rounded-2xl border-2 border-amber-300 bg-amber-50 text-amber-700 font-bold py-3 text-xs uppercase tracking-wide transition hover:bg-amber-100 active:scale-95 flex flex-col items-center justify-center gap-1.5 min-w-0"
                                    >
                                        <FlaskConical className="w-5 h-5 shrink-0" />
                                        <span className="leading-tight text-center">Học vượt<br />level</span>
                                    </button>
                                )}

                                {/* Tiếp tục — nút chính, rộng hơn */}
                                <button
                                    type="button"
                                    onClick={onContinue}
                                    className={`flex-[2] rounded-2xl bg-gradient-to-r ${cfg.gradient} hover:opacity-90 active:scale-95 text-white font-extrabold py-3 text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 min-w-0`}
                                >
                                    Tiếp tục <ArrowRight className="w-4 h-4 shrink-0" />
                                </button>
                            </div>
                        ) : (
                            /* ── Fail: 2 nút dọc ── */
                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={onRetry}
                                    className={`w-full rounded-2xl bg-gradient-to-r ${cfg.gradient} hover:opacity-90 active:scale-95 text-white font-extrabold py-4 text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2`}
                                >
                                    <RotateCcw className="w-4 h-4" /> Làm lại Node Review
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="w-full rounded-2xl border-2 border-gray-200 text-gray-600 font-bold py-3.5 text-sm uppercase tracking-wide transition hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <BookOpen className="w-4 h-4" /> Ôn lại bài học
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
