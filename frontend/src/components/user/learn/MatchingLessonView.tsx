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
    const [justMatchedIds, setJustMatchedIds] = useState<Set<string>>(new Set());
    const [wrongPair, setWrongPair] = useState<{ leftId: string; rightId: string } | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        setSelectedLeftId(null);
        setSelectedRightId(null);
        setMatchedIds(new Set());
        setJustMatchedIds(new Set());
        setWrongPair(null);
        setIsFinished(false);
    }, [node.nodeId]);

    function tryResolve(nextLeftId: string | null, nextRightId: string | null) {
        if (!nextLeftId || !nextRightId) return;
        if (matchedIds.has(nextLeftId) || justMatchedIds.has(nextLeftId)) return;

        const isCorrect = correctRightByLeftId.get(nextLeftId) === nextRightId;

        if (isCorrect) {
            // Hiệu ứng chọn đúng (Xanh lá)
            const nextJust = new Set(justMatchedIds);
            nextJust.add(nextLeftId);
            setJustMatchedIds(nextJust);

            setSelectedLeftId(null);
            setSelectedRightId(null);
            setWrongPair(null);

            // Sau 600ms thì mờ dần và mất tương tác
            window.setTimeout(() => {
                setMatchedIds((prev) => new Set(prev).add(nextLeftId));
                setJustMatchedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(nextLeftId);
                    return next;
                });

                if (matchedIds.size + 1 === pairs.length && pairs.length > 0) {
                    window.setTimeout(() => setIsFinished(true), 400);
                }
            },  600);
        } else {
            // Hiệu ứng chọn sai (Đỏ)
            setWrongPair({leftId: nextLeftId, rightId: nextRightId});
            window.setTimeout(() => {
                setSelectedLeftId(null);
                setSelectedRightId(null);
                setWrongPair(null);
            }, 650);
        }
    }

    if (isFinished) {
        return <LessonCompleteView knGained={10} onContinue={onComplete}/>;
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Header */}
            <div className="w-full bg-white sticky top-0 z-30 border-b border-gray-100">
                <div className="w-full max-w-4xl mx-auto flex items-center justify-between px-4 md:px-8 py-3">
                    <button
                        type="button"
                        onClick={onExit}
                        className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition"
                    >
                        <span className="text-2xl leading-none">&times;</span>
                    </button>
                    <div className="text-sm font-bold text-primary-600 uppercase tracking-widest">
                        Tiến độ: {matchedIds.size} / {pairs.length}
                    </div>
                </div>
            </div>

            <main className="flex-1 w-full">
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pt-10 pb-28">
                    <div className="max-w-2xl mb-10">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2">
                            Matching Game
                        </p>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                            Chọn cặp từ tương ứng
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cột trái */}
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
                                            const next = selectedLeftId === p.id ? null : p.id;
                                            setSelectedLeftId(next);
                                            tryResolve(next, selectedRightId);
                                        }}
                                        className={[
                                            "w-full flex items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-200 shadow-sm",
                                            "bg-white border-gray-200",
                                            !isMatched && !isJustMatched && !isWrong && !isSelected ? "hover:border-gray-300 hover:bg-gray-50 active:translate-y-0.5" : "",
                                            // Đang chọn (Màu cam chủ đạo)
                                            isSelected && !isWrong && !isJustMatched ? "border-primary-500 bg-primary-100 ring-2 ring-primary-100 shadow-md" : "",
                                            // Chọn sai (Đỏ)
                                            isWrong ? "border-red-500 bg-red-100 animate-[shake_0.3s_ease-in-out]" : "",
                                            // Chọn đúng (Xanh lá)
                                            isJustMatched ? "border-green-500 bg-green-150" : "",
                                            // Đã xong (Nhạt dần)
                                            isMatched ? "opacity-20 border-gray-200 bg-gray-50 pointer-events-none shadow-none" : "",
                                        ].join(" ")}
                                    >
                    <span
                        className={`h-8 w-8 shrink-0 rounded-lg border flex items-center justify-center text-xs font-bold transition-colors ${
                            isSelected ? "bg-white border-primary-200 text-primary-600" : "bg-gray-50 border-gray-100 text-gray-400"
                        }`}>
                      {idx + 1}
                    </span>
                                        <span
                                            className={`font-bold text-lg ${isMatched ? "text-gray-400" : "text-gray-700"}`}>
                      {p.left}
                    </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Cột phải */}
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
                                            const next = selectedRightId === r.id ? null : r.id;
                                            setSelectedRightId(next);
                                            tryResolve(selectedLeftId, next);
                                        }}
                                        className={[
                                            "w-full flex items-center justify-between gap-4 rounded-2xl border-2 p-4 transition-all duration-200 shadow-sm",
                                            "bg-white border-gray-200", // Mặc định
                                            !isMatched && !isJustMatched && !isWrong && !isSelected ? "hover:border-gray-300 hover:bg-gray-50 active:translate-y-0.5" : "",
                                            // Đang chọn (Màu cam chủ đạo)
                                            isSelected && !isWrong && !isJustMatched ? "border-primary-500 bg-primary-400 ring-2 ring-primary-100 shadow-md" : "",
                                            // Chọn sai (Đỏ)
                                            isWrong ? "border-red-500 bg-red-100 animate-[shake_0.3s_ease-in-out]" : "",
                                            // Chọn đúng (Xanh lá)
                                            isJustMatched ? "border-green-500 bg-green-150" : "",
                                            // Đã xong (Nhạt dần)
                                            isMatched ? "opacity-20 border-gray-200 bg-gray-50 pointer-events-none shadow-none" : "",
                                        ].join(" ")}
                                    >
                    <span className={`font-bold text-lg ${isMatched ? "text-gray-400" : "text-gray-700"}`}>
                      {r.text}
                    </span>
                                        <span
                                            className="h-8 w-8 shrink-0 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
                      {idx + 1}
                    </span>
                                    </button>
                                );
                            })}
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
      `}</style>
        </div>
    );
}