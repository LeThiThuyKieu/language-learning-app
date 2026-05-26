import {useEffect, useMemo, useState} from "react";
import type {SkillTreeNodeQuestionsData} from "@/types";
import LessonTopBar from "@/components/user/learn/LessonTopBar.tsx";
import LessonExitModal from "@/components/user/learn/LessonExitModal.tsx";
import type {AttemptItem} from "@/services/learningService";
import {cn} from "@/utils/cn.ts";

type Pair = {
    id: string;
    left: string;
    right: string;
};

type Card = { id: string; text: string };

type LockedPair = {
    leftId: string;
    rightId: string;
    pairNo: number;
    isCorrect: boolean;
};

function shuffle<T>(arr: T[]) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const PAIR_CORRECT = "border-emerald-400 bg-emerald-50 text-gray-900";
const PAIR_WRONG   = "border-red-400 bg-red-50 text-gray-900";

/**
 * Review matching — kiểu PlacementMatchingLock:
 * Chọn trái → chọn phải → khóa ngay (không gỡ được).
 * Đủ tất cả cặp → tự động gọi onComplete với kết quả đúng/sai.
 */
export default function ReviewMatchingView({
    node,
    onLeaveLesson,
    onComplete,
}: {
    node: SkillTreeNodeQuestionsData;
    onLeaveLesson: () => void;
    onComplete: (attempts: AttemptItem[]) => void;
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

    const leftCards: Card[] = useMemo(() => pairs.map((p) => ({id: p.id, text: p.left})), [pairs]);
    const rightCards: Card[] = useMemo(() => shuffle(pairs.map((p) => ({id: p.id, text: p.right}))), [pairs]);

    // Map leftId → rightId (đúng)
    const correctMap = useMemo(() => {
        const m = new Map<string, string>();
        pairs.forEach((p) => m.set(p.id, p.id)); // leftId === rightId (cùng pair id)
        return m;
    }, [pairs]);

    const leftOrder = useMemo(() => {
        const m = new Map<string, number>();
        leftCards.forEach((c, idx) => m.set(c.id, idx + 1));
        return m;
    }, [leftCards]);

    const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
    const [locked, setLocked] = useState<LockedPair[]>([]);
    const [exitOpen, setExitOpen] = useState(false);

    useEffect(() => {
        setSelectedLeftId(null);
        setLocked([]);
    }, [node.nodeId]);

    // Khi đủ cặp → gọi onComplete
    useEffect(() => {
        if (locked.length === pairs.length && pairs.length > 0) {
            const attempts: AttemptItem[] = locked.map((lp) => {
                const q = node.questions?.find((q) => String(q.id) === lp.leftId);
                const rightCard = rightCards.find((r) => r.id === lp.rightId);
                return {
                    mongoQuestionId: (q as {mongoQuestionId?: string})?.mongoQuestionId ?? String(q?.id ?? lp.leftId),
                    userAnswer: rightCard?.text ?? lp.rightId,
                    correct: lp.isCorrect,
                };
            });
            // Delay nhỏ để user thấy cặp cuối được khóa
            window.setTimeout(() => onComplete(attempts), 600);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locked.length, pairs.length]);

    const lockedLeftIds  = useMemo(() => new Set(locked.map((l) => l.leftId)),  [locked]);
    const lockedRightIds = useMemo(() => new Set(locked.map((l) => l.rightId)), [locked]);

    function handlePickLeft(id: string) {
        if (lockedLeftIds.has(id)) return;
        setSelectedLeftId((prev) => (prev === id ? null : id));
    }

    function handlePickRight(rightId: string) {
        if (!selectedLeftId) return;
        if (lockedRightIds.has(rightId)) return;

        const isCorrect = correctMap.get(selectedLeftId) === rightId;
        const pairNo = leftOrder.get(selectedLeftId) ?? (locked.length + 1);

        setLocked((prev) => [
            ...prev,
            {leftId: selectedLeftId, rightId, pairNo, isCorrect},
        ]);
        setSelectedLeftId(null);
    }

    function pairForLeft(id: string)  { return locked.find((l) => l.leftId  === id); }
    function pairForRight(id: string) { return locked.find((l) => l.rightId === id); }

    const matchPct   = pairs.length === 0 ? 0 : (locked.length / pairs.length) * 100;
    const matchLabel = `${locked.length}/${pairs.length}`;

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
                            <p className="mt-1 text-sm text-gray-500">
                                Chọn một từ bên trái rồi chọn nghĩa tương ứng bên phải. Đã ghép thì không thay đổi được.
                            </p>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Cột trái */}
                            <div className="space-y-3">
                                {leftCards.map((c, idx) => {
                                    const lp       = pairForLeft(c.id);
                                    const isLocked = lp != null;
                                    const isSel    = selectedLeftId === c.id && !isLocked;

                                    return (
                                        <button
                                            key={`L-${c.id}`}
                                            type="button"
                                            disabled={isLocked}
                                            onClick={() => handlePickLeft(c.id)}
                                            className={cn(
                                                "relative flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left shadow-sm transition-all duration-200",
                                                isLocked && "pointer-events-none opacity-70",
                                                !isLocked && !isSel && "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                                                isSel && "border-primary-500 bg-primary-50 ring-2 ring-primary-200 shadow-md",
                                                isLocked && lp?.isCorrect  && PAIR_CORRECT,
                                                isLocked && !lp?.isCorrect && PAIR_WRONG,
                                            )}
                                        >
                                            <span className={cn(
                                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold",
                                                isSel    ? "border-primary-200 bg-white text-primary-600" : "",
                                                isLocked && lp?.isCorrect  ? "border-emerald-300 bg-white text-emerald-700" : "",
                                                isLocked && !lp?.isCorrect ? "border-red-300 bg-white text-red-700" : "",
                                                !isSel && !isLocked ? "border-gray-100 bg-gray-50 text-gray-400" : "",
                                            )}>
                                                {isLocked ? lp!.pairNo : idx + 1}
                                            </span>
                                            <span className="min-w-0 flex-1 text-base font-semibold text-gray-800">
                                                {c.text}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Cột phải */}
                            <div className="space-y-3">
                                {rightCards.map((r) => {
                                    const lp       = pairForRight(r.id);
                                    const isLocked = lp != null;

                                    return (
                                        <button
                                            key={`R-${r.id}`}
                                            type="button"
                                            disabled={isLocked || !selectedLeftId}
                                            onClick={() => handlePickRight(r.id)}
                                            className={cn(
                                                "relative flex w-full items-center justify-between gap-4 rounded-2xl border-2 p-4 text-left shadow-sm transition-all duration-200",
                                                isLocked && "pointer-events-none opacity-70",
                                                !isLocked && selectedLeftId  && "border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-50 cursor-pointer",
                                                !isLocked && !selectedLeftId && "border-gray-200 bg-white cursor-default",
                                                isLocked && lp?.isCorrect  && PAIR_CORRECT,
                                                isLocked && !lp?.isCorrect && PAIR_WRONG,
                                            )}
                                        >
                                            <span className="min-w-0 flex-1 text-base font-semibold text-gray-800">
                                                {r.text}
                                            </span>
                                            {isLocked && (
                                                <span className={cn(
                                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold",
                                                    lp?.isCorrect  ? "border-emerald-300 bg-white text-emerald-700" : "border-red-300 bg-white text-red-700",
                                                )}>
                                                    {lp!.pairNo}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

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
