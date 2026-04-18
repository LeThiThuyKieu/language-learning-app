import {useEffect, useMemo, useState} from "react";
import type {SkillTreeNodeQuestionsData} from "@/types";
import LessonTopBar from "@/components/user/learn/LessonTopBar.tsx";
import LessonExitModal from "@/components/user/learn/LessonExitModal.tsx";
import {Sparkles} from "lucide-react";

type Pair = {
    id: string;
    left: string;
    right: string;
};

function shuffle<T>(arr: T[]) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function CorrectPairSparkles() {
    const spots: {className: string; delay: string}[] = [
        {className: "left-[10%] top-[20%]", delay: "0ms"},
        {className: "right-[12%] top-[24%]", delay: "70ms"},
        {className: "left-[18%] bottom-[22%]", delay: "130ms"},
        {className: "right-[16%] bottom-[20%]", delay: "45ms"},
        {className: "left-1/2 top-[10%] -translate-x-1/2", delay: "90ms"},
        {className: "left-[42%] bottom-[12%]", delay: "20ms"},
    ];
    return (
        <span
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
            aria-hidden
        >
            {spots.map((s, i) => (
                <Sparkles
                    key={i}
                    className={`match-sparkle-icon absolute h-3.5 w-3.5 text-emerald-500 drop-shadow-sm ${s.className}`}
                    strokeWidth={2.4}
                    style={{animationDelay: s.delay}}
                />
            ))}
        </span>
    );
}

/**
 * UI y chang `MatchingLessonView` (match trực tiếp, đúng/sai tô màu + mờ cặp đúng),
 * nhưng không hiện `LessonCompleteView`. Match xong sẽ gọi `onComplete()`.
 */
export default function ReviewMatchingView({
                                              node,
                                              onLeaveLesson,
                                              onComplete,
                                          }: {
    node: SkillTreeNodeQuestionsData;
    onLeaveLesson: () => void;
    onComplete: () => void;
}) {
    const pairs: Pair[] = useMemo(() => {
        const qs = node.questions ?? [];
        return qs
            .filter((q) => (q.questionText ?? "").trim() && (q.correctAnswer ?? "").trim())
            .map((q, idx) => ({
                id: String(q.id ?? `${node.nodeId}-${idx}`),
                left: String(q.questionText ?? "").replace(/\\n/g, "\n").trim(),
                right: String(q.correctAnswer ?? "").replace(/\\n/g, "\n").trim(),
            }));
    }, [node.nodeId, node.questions]);

    const rightItems = useMemo(() => shuffle(pairs.map((p) => ({id: p.id, text: p.right}))), [pairs]);

    const correctRightByLeftId = useMemo(() => {
        const m = new Map<string, string>();
        pairs.forEach((p) => m.set(p.id, p.id));
        return m;
    }, [pairs]);

    const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
    const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
    const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
    const [justMatchedIds, setJustMatchedIds] = useState<Set<string>>(new Set());
    const [wrongPair, setWrongPair] = useState<{leftId: string; rightId: string} | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [exitOpen, setExitOpen] = useState(false);

    useEffect(() => {
        setSelectedLeftId(null);
        setSelectedRightId(null);
        setMatchedIds(new Set());
        setJustMatchedIds(new Set());
        setWrongPair(null);
        setIsFinished(false);
    }, [node.nodeId]);

    useEffect(() => {
        if (isFinished) onComplete();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFinished]);

    function clearSelectionSoon() {
        window.setTimeout(() => {
            setSelectedLeftId(null);
            setSelectedRightId(null);
            setWrongPair(null);
        }, 650);
    }

    function tryResolve(nextLeftId: string | null, nextRightId: string | null) {
        if (!nextLeftId || !nextRightId) return;
        if (matchedIds.has(nextLeftId) || justMatchedIds.has(nextLeftId)) return;

        const isCorrect = correctRightByLeftId.get(nextLeftId) === nextRightId;
        if (isCorrect) {
            setJustMatchedIds((prev) => new Set(prev).add(nextLeftId));
            setSelectedLeftId(null);
            setSelectedRightId(null);
            setWrongPair(null);

            window.setTimeout(() => {
                setMatchedIds((prev) => {
                    const next = new Set(prev).add(nextLeftId);
                    if (next.size === pairs.length && pairs.length > 0) {
                        window.setTimeout(() => setIsFinished(true), 400);
                    }
                    return next;
                });
                setJustMatchedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(nextLeftId);
                    return next;
                });
            }, 600);
        } else {
            setWrongPair({leftId: nextLeftId, rightId: nextRightId});
            clearSelectionSoon();
        }
    }

    if (isFinished) return null;

    const matchPct = pairs.length === 0 ? 0 : (matchedIds.size / pairs.length) * 100;
    const matchLabel = `${matchedIds.size}/${pairs.length}`;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <LessonTopBar
                onClosePress={() => setExitOpen(true)}
                progressPercent={matchPct}
                rightLabel={matchLabel}
            />

            <main className="flex-1 w-full">
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-28">
                    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                        <div className="max-w-2xl">
                            <p className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
                                Nối từ
                            </p>
                            <h1 className="text-2xl font-extrabold leading-snug text-gray-900 md:text-3xl">
                                Chọn cặp từ tương ứng
                            </h1>
                        </div>

                    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                            {pairs.map((p, idx) => {
                                const isMatched = matchedIds.has(p.id);
                                const isJustMatched = justMatchedIds.has(p.id);
                                const isSelected = selectedLeftId === p.id;
                                const isWrong = wrongPair?.leftId === p.id;

                                return (
                                    <button
                                        key={`L-${p.id}`}
                                        type="button"
                                        disabled={isMatched || isJustMatched}
                                        onClick={() => {
                                            if (isMatched || isJustMatched) return;
                                            const next = selectedLeftId === p.id ? null : p.id;
                                            setSelectedLeftId(next);
                                            tryResolve(next, selectedRightId);
                                        }}
                                        className={[
                                            "relative flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left shadow-sm",
                                            "transition-all duration-300 ease-out",
                                            "bg-white border-gray-200",
                                            "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200",
                                            !isMatched && !isJustMatched && !isWrong && !isSelected
                                                ? "hover:border-gray-300 hover:bg-gray-50 active:translate-y-0.5 hover:-translate-y-0.5 hover:shadow-md"
                                                : "",
                                            isSelected && !isWrong && !isJustMatched
                                                ? "border-primary-500 bg-primary-100 ring-2 ring-primary-300/70 shadow-md"
                                                : "",
                                            isWrong ? "border-red-500 bg-red-100 animate-[shake_0.3s_ease-in-out]" : "",
                                            isJustMatched
                                                ? "z-[1] border-emerald-500 bg-emerald-100 ring-2 ring-emerald-300/80 shadow-md animate-[match-pop_0.45s_ease-out]"
                                                : "",
                                            isMatched
                                                ? "pointer-events-none border-gray-200 bg-gray-50 opacity-25 shadow-none duration-500"
                                                : "",
                                        ].join(" ")}
                                    >
                                        {isJustMatched && <CorrectPairSparkles/>}
                                        <span
                                            className={`relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors ${
                                                isSelected
                                                    ? "border-primary-200 bg-white text-primary-600"
                                                    : "border-gray-100 bg-gray-50 text-gray-400"
                                            }`}
                                        >
                                            {idx + 1}
                                        </span>
                                        <span
                                            className={`relative z-[1] min-w-0 flex-1 text-base font-semibold ${isMatched ? "text-gray-400" : "text-gray-800"}`}
                                        >
                                            {p.left}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="space-y-3">
                            {rightItems.map((r, idx) => {
                                const isMatched = matchedIds.has(r.id);
                                const isJustMatched = justMatchedIds.has(r.id);
                                const isSelected = selectedRightId === r.id;
                                const isWrong = wrongPair?.rightId === r.id;

                                return (
                                    <button
                                        key={`R-${r.id}-${idx}`}
                                        type="button"
                                        disabled={isMatched || isJustMatched}
                                        onClick={() => {
                                            if (isMatched || isJustMatched) return;
                                            const next = selectedRightId === r.id ? null : r.id;
                                            setSelectedRightId(next);
                                            tryResolve(selectedLeftId, next);
                                        }}
                                        className={[
                                            "relative flex w-full items-center justify-between gap-4 rounded-2xl border-2 p-4 text-left shadow-sm",
                                            "transition-all duration-300 ease-out",
                                            "bg-white border-gray-200",
                                            "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200",
                                            !isMatched && !isJustMatched && !isWrong && !isSelected
                                                ? "hover:border-gray-300 hover:bg-gray-50 active:translate-y-0.5 hover:-translate-y-0.5 hover:shadow-md"
                                                : "",
                                            isSelected && !isWrong && !isJustMatched
                                                ? "border-primary-500 bg-primary-100 ring-2 ring-primary-300/70 shadow-md"
                                                : "",
                                            isWrong ? "border-red-500 bg-red-100 animate-[shake_0.3s_ease-in-out]" : "",
                                            isJustMatched
                                                ? "z-[1] border-emerald-500 bg-emerald-100 ring-2 ring-emerald-300/80 shadow-md animate-[match-pop_0.45s_ease-out]"
                                                : "",
                                            isMatched
                                                ? "pointer-events-none border-gray-200 bg-gray-50 opacity-25 shadow-none duration-500"
                                                : "",
                                        ].join(" ")}
                                    >
                                        {isJustMatched && <CorrectPairSparkles/>}
                                        <span
                                            className={`relative z-[1] min-w-0 flex-1 text-base font-semibold ${isMatched ? "text-gray-400" : "text-gray-800"}`}
                                        >
                                            {r.text}
                                        </span>
                                        <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-xs font-bold text-gray-400">
                                            {idx + 1}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    </div>
                </div>
            </main>

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes match-pop {
          0% { transform: scale(1); }
          35% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        @keyframes match-sparkle-float {
          0% { opacity: 0; transform: scale(0.35) rotate(-12deg) translateY(6px); }
          30% { opacity: 1; transform: scale(1.1) rotate(0deg) translateY(0); }
          55% { opacity: 0.95; transform: scale(1) rotate(6deg) translateY(-2px); }
          100% { opacity: 0; transform: scale(0.5) rotate(18deg) translateY(-14px); }
        }
        .match-sparkle-icon {
          animation: match-sparkle-float 0.88s ease-out forwards;
        }
      `}</style>

            <LessonExitModal
                open={exitOpen}
                onContinue={() => setExitOpen(false)}
                onExit={() => {
                    setExitOpen(false);
                    onLeaveLesson();
                }}
            />
        </div>
    );
}

