import {useEffect, useMemo, useState} from "react";
import type {SkillTreeNodeQuestionsData} from "@/types";
import LessonCompleteView from "@/components/user/learn/LessonCompleteView";

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

export default function MatchingLessonView({
                                              node,
                                              onExit,
                                              onComplete,
                                          }: {
    node: SkillTreeNodeQuestionsData;
    onExit: () => void;
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
    const [wrongPair, setWrongPair] = useState<{leftId: string; rightId: string} | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        setSelectedLeftId(null);
        setSelectedRightId(null);
        setMatchedIds(new Set());
        setWrongPair(null);
        setIsFinished(false);
    }, [node.nodeId]);

    function clearSelectionSoon() {
        window.setTimeout(() => {
            setSelectedLeftId(null);
            setSelectedRightId(null);
            setWrongPair(null);
        }, 650);
    }

    function tryResolve(nextLeftId: string | null, nextRightId: string | null) {
        if (!nextLeftId || !nextRightId) return;
        if (matchedIds.has(nextLeftId)) return;

        const isCorrect = correctRightByLeftId.get(nextLeftId) === nextRightId;
        if (isCorrect) {
            const next = new Set(matchedIds);
            next.add(nextLeftId);
            setMatchedIds(next);
            setSelectedLeftId(null);
            setSelectedRightId(null);
            setWrongPair(null);

            if (next.size === pairs.length && pairs.length > 0) {
                window.setTimeout(() => setIsFinished(true), 250);
            }
        } else {
            setWrongPair({leftId: nextLeftId, rightId: nextRightId});
            clearSelectionSoon();
        }
    }

    if (isFinished) {
        return <LessonCompleteView knGained={10} onContinue={onComplete}/>;
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <div className="w-full bg-white sticky top-0 z-30">
                <div className="w-full max-w-4xl mx-auto flex items-center justify-between px-4 md:px-8 py-3">
                    <button
                        type="button"
                        onClick={onExit}
                        className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition"
                        aria-label="Thoát bài học"
                    >
                        <span className="text-2xl leading-none">&times;</span>
                    </button>
                    <div className="text-sm font-semibold text-gray-700">
                        {pairs.length} cặp
                    </div>
                </div>
            </div>

            <main className="flex-1 w-full">
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pt-10 pb-28">
                    <div className="max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 mb-2">
                            Matching
                        </p>
                        <h1 className="min-h-[70px] text-3xl md:text-4xl font-extrabold text-gray-900 leading-[1.18]">
                            Chọn cặp từ
                        </h1>
                    </div>

                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left column */}
                        <div className="space-y-3">
                            {pairs.map((p, idx) => {
                                const isMatched = matchedIds.has(p.id);
                                const isSelected = selectedLeftId === p.id && !isMatched;
                                const isWrong = wrongPair?.leftId === p.id;
                                const isRightNowCorrect =
                                    selectedRightId && correctRightByLeftId.get(p.id) === selectedRightId;
                                const showCorrect = Boolean(isMatched) || (isRightNowCorrect && Boolean(selectedLeftId) && !wrongPair);

                                return (
                                    <button
                                        key={`L-${p.id}`}
                                        type="button"
                                        disabled={isMatched}
                                        onClick={() => {
                                            if (isMatched) return;
                                            const next = selectedLeftId === p.id ? null : p.id;
                                            setSelectedLeftId(next);
                                            tryResolve(next, selectedRightId);
                                        }}
                                        className={[
                                            "w-full text-left rounded-2xl border-2 px-4 py-4 shadow-sm transition",
                                            "bg-white",
                                            "hover:-translate-y-0.5 hover:shadow-md",
                                            "active:translate-y-0",
                                            "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200",
                                            isMatched ? "opacity-40 pointer-events-none" : "",
                                            isSelected ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200" : "border-gray-200",
                                            isWrong ? "border-red-500 bg-red-50" : "",
                                            showCorrect && isMatched ? "border-emerald-500 bg-emerald-50" : "",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {idx + 1}
                                            </span>
                                            <span className="font-semibold text-gray-900 whitespace-pre-wrap">
                                                {p.left}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right column */}
                        <div className="space-y-3">
                            {rightItems.map((r, idx) => {
                                const isMatched = matchedIds.has(r.id);
                                const isSelected = selectedRightId === r.id && !isMatched;
                                const isWrong = wrongPair?.rightId === r.id;
                                const isRightNowCorrect =
                                    selectedLeftId && correctRightByLeftId.get(selectedLeftId) === r.id;
                                const showCorrect = Boolean(isMatched) || (isRightNowCorrect && Boolean(selectedRightId) && !wrongPair);

                                return (
                                    <button
                                        key={`R-${r.id}-${idx}`}
                                        type="button"
                                        disabled={isMatched}
                                        onClick={() => {
                                            if (isMatched) return;
                                            const next = selectedRightId === r.id ? null : r.id;
                                            setSelectedRightId(next);
                                            tryResolve(selectedLeftId, next);
                                        }}
                                        className={[
                                            "w-full text-left rounded-2xl border-2 px-4 py-4 shadow-sm transition",
                                            "bg-white",
                                            "hover:-translate-y-0.5 hover:shadow-md",
                                            "active:translate-y-0",
                                            "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200",
                                            isMatched ? "opacity-40 pointer-events-none" : "",
                                            isSelected ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200" : "border-gray-200",
                                            isWrong ? "border-red-500 bg-red-50" : "",
                                            showCorrect && isMatched ? "border-emerald-500 bg-emerald-50" : "",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-center gap-3 justify-between">
                                            <span className="font-semibold text-gray-900 whitespace-pre-wrap">
                                                {r.text}
                                            </span>
                                            <span className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                                                {idx + 1}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

