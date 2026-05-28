/**
 * SkipTestPage — Trang học vượt level
 *
 * Luồng:
 *  1. INTRO  — giới thiệu bài test, nút "Để sau" + "Tiếp tục"
 *  2. TEST   — làm bài (VOCAB → LISTENING → SPEAKING → MATCHING), giống ReviewLessonPage
 *  3. RESULT — hiện kết quả pass/fail với lion mascot, điểm, xem lại bài làm
 *
 * Pass khi accuracy >= 70% → cập nhật currentLevelId của user → navigate sang level mới.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ClipboardList, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { learningService } from "@/services/learningService";
import { profileService } from "@/services/profileService";
import type { AttemptItem } from "@/services/learningService";
import type { SkillTreeNodeQuestionsData, SkillTreeEnrichedQuestion } from "@/types";
import ReviewVocabView from "@/components/user/learn/question_type/review/ReviewVocabView";
import ReviewListeningView from "@/components/user/learn/question_type/review/ReviewListeningView";
import ReviewSpeakingView from "@/components/user/learn/question_type/review/ReviewSpeakingView";
import ReviewMatchingView from "@/components/user/learn/question_type/review/ReviewMatchingView";
import ReviewAnswerSheet from "@/components/user/learn/ReviewAnswerSheet";

// Types

type Stage = "INTRO" | "VOCAB" | "LISTENING" | "SPEAKING" | "MATCHING" | "RESULT";

interface LocationState {
    nextLevelId?: number;
    nextLevelKey?: string;
    nextLevelName?: string;
}

// Helpers

function pickByType(questions: SkillTreeEnrichedQuestion[], type: string, limit: number) {
    return questions.filter((q) => q.questionType === type).slice(0, limit);
}

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

//  Lion Mascot

function LionMascot({ mood }: { mood: "happy" | "sad" }) {
    const cls = mood === "happy" ? "animate-lion-bounce" : "animate-lion-droop";
    return (
        <div className={`flex items-center justify-center ${cls}`}>
            <img
                src="/logo/lion.png"
                alt="Lion mascot"
                className="w-32 h-32 object-contain drop-shadow-xl select-none"
                draggable={false}
            />
        </div>
    );
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

// Intro Screen

function IntroScreen({
    nextLevelId,
    nextLevelName,
    onSkip,
    onContinue,
}: {
    nextLevelId: number;
    nextLevelName: string;
    onSkip: () => void;
    onContinue: () => void;
}) {
    return (
        <div
            className="min-h-screen flex flex-col px-8 md:px-16 lg:px-32 py-12"
            style={{
                background: "radial-gradient(ellipse at 60% 30%, #1a1035 0%, #0d0820 60%, #060412 100%)",
            }}
        >
            {/* Decorative blobs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary-600/20 blur-3xl" />
                <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] rounded-full bg-primary-500/10 blur-3xl" />
            </div>

            {/* Main content — giãn đều theo chiều dọc */}
            <div className="flex-1 flex flex-col items-center justify-center gap-10 relative z-10">
                {/* Speech bubble */}
                <div className="relative bg-white rounded-3xl px-8 py-5 shadow-2xl max-w-lg w-full text-center">
                    <p className="text-gray-900 font-extrabold text-xl md:text-2xl leading-snug">
                        Vượt qua bài kiểm tra để học vượt lên<br />
                        <span className="text-primary-600">Level {nextLevelId}: {nextLevelName}!</span>
                    </p>
                    {/* Bubble tail */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rotate-45 rounded-sm" />
                </div>

                {/* Lion — lớn hơn */}
                <img
                    src="/logo/lion.png"
                    alt="Lion mascot"
                    className="w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl select-none animate-lion-bounce"
                    draggable={false}
                />

                {/* Sub text */}
                <p className="text-white/60 text-base md:text-lg leading-relaxed text-center max-w-md">
                    Bài test gồm từ vựng, nghe, nói và nối từ.<br />
                    Đạt từ 70% để mở khóa lộ trình mới.
                </p>
            </div>

            {/* Bottom actions */}
            <div className="relative z-10 flex items-center justify-between gap-6 pt-8 max-w-lg mx-auto w-full">
                <button
                    type="button"
                    onClick={onSkip}
                    className="text-base font-bold uppercase tracking-widest text-white/40 hover:text-white/70 transition px-4 py-3"
                >
                    Để sau
                </button>
                <button
                    type="button"
                    onClick={onContinue}
                    className="flex-1 rounded-2xl bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-extrabold py-4 text-base uppercase tracking-widest shadow-lg shadow-primary-500/30 transition flex items-center justify-center gap-2"
                >
                    Tiếp tục <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

// Result Screen

function ResultScreen({
    passed,
    accuracy,
    correctCount,
    totalCount,
    nextLevelId,
    nextLevelName,
    attempts,
    questions,
    onContinue,
    onRetry,
}: {
    passed: boolean;
    accuracy: number;
    correctCount: number;
    totalCount: number;
    nextLevelId: number;
    nextLevelName: string;
    attempts: AttemptItem[];
    questions: SkillTreeEnrichedQuestion[];
    onContinue: () => void;
    onRetry: () => void;
}) {
    const canvasRef = useConfetti(passed);
    const [visible, setVisible] = useState(false);
    const [showSheet, setShowSheet] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    const gradient = passed
        ? "from-emerald-400 via-teal-400 to-cyan-500"
        : "from-red-400 via-rose-500 to-pink-500";
    const badgeBg = passed ? "bg-emerald-50" : "bg-red-50";
    const badgeBorder = passed ? "border-emerald-300" : "border-red-300";
    const badgeText = passed ? "text-emerald-700" : "text-red-700";

    return (
        <div className="relative min-h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* Confetti */}
            {passed && (
                <canvas
                    ref={canvasRef}
                    className="pointer-events-none fixed inset-0 z-50"
                    style={{ width: "100vw", height: "100vh" }}
                />
            )}

            {/* Answer sheet modal */}
            {showSheet && attempts.length > 0 && (
                <ReviewAnswerSheet
                    attempts={attempts}
                    questions={questions}
                    onClose={() => setShowSheet(false)}
                />
            )}

            {/* Gradient strip */}
            <div className={`w-full h-2 bg-gradient-to-r ${gradient}`} />

            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div
                    className={`w-full max-w-xl transition-all duration-500 ${
                        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                    }`}
                >
                    {/* Hero card */}
                    <div className={`relative rounded-3xl border-2 ${badgeBorder} ${badgeBg} overflow-hidden mb-5`}>
                        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`} />
                        <div className={`absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-tr ${gradient} opacity-10 blur-2xl`} />

                        <div className="relative z-10 flex flex-col items-center pt-7 pb-6 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest mb-4 ${passed ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                                {passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {passed ? "ĐẠT" : "CHƯA ĐẠT"}
                            </span>

                            <LionMascot mood={passed ? "happy" : "sad"} />

                            <h1 className={`text-xl font-extrabold ${badgeText} mt-4 mb-1.5 leading-snug`}>
                                {passed
                                    ? `Chúc mừng! Bạn đã mở khóa Level ${nextLevelId}: ${nextLevelName}!`
                                    : `Bạn chưa mở khóa được Level ${nextLevelId}, thử lại sau nhé!`
                                }
                            </h1>
                            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                                {passed
                                    ? "Xuất sắc! Lộ trình học mới đã sẵn sàng cho bạn."
                                    : "Hãy ôn luyện thêm rồi quay lại thử nhé. Bạn làm được!"
                                }
                            </p>
                        </div>
                    </div>

                    {/* Accuracy bar */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Độ chính xác</span>
                            <span className={`text-2xl font-extrabold ${badgeText}`}>
                                <AnimatedNumber target={accuracy} suffix="%" />
                            </span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out`}
                                style={{ width: visible ? `${accuracy}%` : "0%" }}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-gray-400">0%</span>
                            <span className="text-[10px] text-gray-400 font-semibold">Ngưỡng đạt: 70%</span>
                            <span className="text-[10px] text-gray-400">100%</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 mb-4 text-center">
                        <span className="text-2xl font-extrabold text-gray-900">
                            {correctCount}
                            <span className="text-gray-400 text-lg">/{totalCount}</span>
                        </span>
                        <div className="text-[10px] font-bold uppercase text-gray-400 mt-1">Câu đúng</div>
                    </div>

                    {/* Actions */}
                    <div
                        className="transition-all duration-500"
                        style={{ transitionDelay: "350ms", opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)" }}
                    >
                        {passed ? (
                            <div className="flex gap-2 items-stretch">
                                {attempts.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowSheet(true)}
                                        className="flex-1 rounded-2xl border-2 border-gray-200 bg-white text-gray-600 font-bold py-3 text-xs uppercase tracking-wide transition hover:bg-gray-50 active:scale-95 flex flex-col items-center justify-center gap-1.5 min-w-0"
                                    >
                                        <ClipboardList className="w-5 h-5 shrink-0" />
                                        <span className="leading-tight text-center">Xem lại<br />bài làm</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={onContinue}
                                    className={`flex-[2] rounded-2xl bg-gradient-to-r ${gradient} hover:opacity-90 active:scale-95 text-white font-extrabold py-3 text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 min-w-0`}
                                >
                                    Bắt đầu học <ArrowRight className="w-4 h-4 shrink-0" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={onRetry}
                                    className={`w-full rounded-2xl bg-gradient-to-r ${gradient} hover:opacity-90 active:scale-95 text-white font-extrabold py-4 text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2`}
                                >
                                    <RotateCcw className="w-4 h-4" /> Thử lại
                                </button>
                                {attempts.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowSheet(true)}
                                        className="w-full rounded-2xl border-2 border-gray-200 text-gray-600 font-bold py-3.5 text-sm uppercase tracking-wide transition hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <ClipboardList className="w-4 h-4" /> Xem lại bài làm
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main Page

export default function SkipTestPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state ?? {}) as LocationState;

    const nextLevelId = state.nextLevelId ?? 3;
    const nextLevelKey = state.nextLevelKey ?? "advanced";
    const nextLevelName = state.nextLevelName ?? "Advanced";

    const [stage, setStage] = useState<Stage>("INTRO");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Raw questions from API (flat list)
    const [allQuestions, setAllQuestions] = useState<SkillTreeEnrichedQuestion[]>([]);

    // Accumulated attempts
    const [allAttempts, setAllAttempts] = useState<AttemptItem[]>([]);

    // Result
    const [resultAccuracy, setResultAccuracy] = useState(0);
    const [resultCorrect, setResultCorrect] = useState(0);
    const [resultTotal, setResultTotal] = useState(0);
    const [passed, setPassed] = useState(false);

    // Fetch questions when moving from INTRO → VOCAB
    async function loadAndStart() {
        setLoading(true);
        setError(null);
        try {
            const data = await learningService.getSkipTestQuestions(nextLevelId);
            // data is SkillTreeQuestionsData — flatten all questions from all nodes
            const flat: SkillTreeEnrichedQuestion[] = (data.nodes ?? []).flatMap(n => n.questions ?? []);
            setAllQuestions(flat);
            setAllAttempts([]);
            setStage("VOCAB");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Không tải được bài test");
        } finally {
            setLoading(false);
        }
    }

    // Build sub-nodes from flat question list
    const vocabNode = useMemo((): SkillTreeNodeQuestionsData => ({
        nodeId: 0, title: "Skip Test - Vocab", nodeType: "VOCAB",
        questions: pickByType(allQuestions, "VOCAB", 4),
    }), [allQuestions]);

    const listeningNode = useMemo((): SkillTreeNodeQuestionsData => ({
        nodeId: 0, title: "Skip Test - Listening", nodeType: "LISTENING",
        questions: pickByType(allQuestions, "LISTENING", 1),
    }), [allQuestions]);

    const speakingNode = useMemo((): SkillTreeNodeQuestionsData => ({
        nodeId: 0, title: "Skip Test - Speaking", nodeType: "SPEAKING",
        questions: pickByType(allQuestions, "SPEAKING", 1),
    }), [allQuestions]);

    const matchingNode = useMemo((): SkillTreeNodeQuestionsData => ({
        nodeId: 0, title: "Skip Test - Matching", nodeType: "MATCHING",
        questions: pickByType(allQuestions, "MATCHING", 4),
    }), [allQuestions]);

    async function finishTest(finalAttempts: AttemptItem[]) {
        const total = finalAttempts.length;
        const correct = finalAttempts.filter(a => a.correct).length;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        const didPass = accuracy >= 70;

        setResultAccuracy(accuracy);
        setResultCorrect(correct);
        setResultTotal(total);
        setPassed(didPass);

        // Nếu pass → cập nhật level của user
        if (didPass) {
            try {
                await profileService.updateMyProfile({ currentLevelId: nextLevelId });
            } catch {
                // ignore — vẫn hiện kết quả
            }
        }

        setStage("RESULT");
    }

    // INTRO
    if (stage === "INTRO") {
        return (
            <IntroScreen
                nextLevelId={nextLevelId}
                nextLevelName={nextLevelName}
                onSkip={() => navigate("/learn")}
                onContinue={loadAndStart}
            />
        );
    }

    // Loading / Error
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
                Đang tải bài test…
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-center">
                    <p className="text-gray-900 font-extrabold mb-2">Không tải được bài test</p>
                    <p className="text-gray-500 text-sm mb-4">{error}</p>
                    <button
                        type="button"
                        onClick={() => navigate("/learn")}
                        className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 transition"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    // RESULT
    if (stage === "RESULT") {
        return (
            <ResultScreen
                passed={passed}
                accuracy={resultAccuracy}
                correctCount={resultCorrect}
                totalCount={resultTotal}
                nextLevelId={nextLevelId}
                nextLevelName={nextLevelName}
                attempts={allAttempts}
                questions={allQuestions}
                onContinue={() => {
                    // Navigate sang level mới
                    navigate("/learn", { state: { level: nextLevelKey }, replace: true });
                }}
                onRetry={() => {
                    // Reset và load lại bộ câu mới
                    setAllAttempts([]);
                    setAllQuestions([]);
                    loadAndStart();
                }}
            />
        );
    }

    // TEST STAGES
    return (
        <div className="min-h-screen w-full bg-gray-50">
            {stage === "VOCAB" && vocabNode.questions.length > 0 && (
                <ReviewVocabView
                    node={vocabNode}
                    onLeaveLesson={() => navigate("/learn")}
                    onComplete={(attempts) => {
                        const next = [...allAttempts, ...attempts];
                        setAllAttempts(next);
                        // Nếu không có listening → skip
                        if (listeningNode.questions.length > 0) {
                            setStage("LISTENING");
                        } else if (speakingNode.questions.length > 0) {
                            setStage("SPEAKING");
                        } else if (matchingNode.questions.length > 0) {
                            setStage("MATCHING");
                        } else {
                            void finishTest(next);
                        }
                    }}
                />
            )}
            {stage === "LISTENING" && listeningNode.questions.length > 0 && (
                <ReviewListeningView
                    node={listeningNode}
                    onLeaveLesson={() => navigate("/learn")}
                    onComplete={(attempts) => {
                        const next = [...allAttempts, ...attempts];
                        setAllAttempts(next);
                        if (speakingNode.questions.length > 0) {
                            setStage("SPEAKING");
                        } else if (matchingNode.questions.length > 0) {
                            setStage("MATCHING");
                        } else {
                            void finishTest(next);
                        }
                    }}
                />
            )}
            {stage === "SPEAKING" && speakingNode.questions.length > 0 && (
                <ReviewSpeakingView
                    node={speakingNode}
                    onLeaveLesson={() => navigate("/learn")}
                    onComplete={(attempts) => {
                        const next = [...allAttempts, ...attempts];
                        setAllAttempts(next);
                        if (matchingNode.questions.length > 0) {
                            setStage("MATCHING");
                        } else {
                            void finishTest(next);
                        }
                    }}
                />
            )}
            {stage === "MATCHING" && matchingNode.questions.length > 0 && (
                <ReviewMatchingView
                    node={matchingNode}
                    onLeaveLesson={() => navigate("/learn")}
                    onComplete={async (attempts) => {
                        const final = [...allAttempts, ...attempts];
                        setAllAttempts(final);
                        await finishTest(final);
                    }}
                />
            )}
        </div>
    );
}
