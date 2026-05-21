import {useEffect, useMemo, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {learningService} from "@/services/learningService.ts";
import type {AttemptItem, BadgeInfo} from "@/services/learningService.ts";
import type {SkillTreeNodeQuestionsData, SkillTreeQuestionsData} from "@/types";
import LessonCompleteView from "@/components/user/learn/LessonCompleteView.tsx";
import ReviewVocabView from "@/components/user/learn/question_type/review/ReviewVocabView.tsx";
import {bumpLearnTreeUnlocked, completeNodeAndSave, unlockNextTree} from "@/utils/learnTreeProgress.ts";
import ReviewListeningView from "@/components/user/learn/question_type/review/ReviewListeningView.tsx";
import ReviewSpeakingView from "@/components/user/learn/question_type/review/ReviewSpeakingView.tsx";
import ReviewMatchingView from "@/components/user/learn/question_type/review/ReviewMatchingView.tsx";
import ReviewTimerBubble from "@/components/user/learn/ReviewTimerBubble.tsx";
import ReviewResultView, {type ReviewOutcome} from "@/components/user/learn/ReviewResultView.tsx";
import FeedbackModal from "@/components/user/learn/FeedbackModal.tsx";
import {toast} from "react-hot-toast";
import { AlertTriangle, Clock, Timer } from "lucide-react";

type Stage = "VOCAB" | "LISTENING" | "SPEAKING" | "MATCHING" | "RESULT" | "COMPLETE";

type LocationState = {
    treeId?: number;
    node?: SkillTreeNodeQuestionsData;
};

function pickByType(node: SkillTreeNodeQuestionsData | null, type: string, limit: number) {
    const qs = node?.questions ?? [];
    return qs.filter((q) => q.questionType === type).slice(0, limit);
}

/** Tính tổng số câu hỏi trong review node */
function countTotalQuestions(node: SkillTreeNodeQuestionsData | null): number {
    if (!node) return 0;
    return (
        pickByType(node, "VOCAB", 4).length +
        pickByType(node, "LISTENING", 1).length +
        pickByType(node, "SPEAKING", 1).length +
        pickByType(node, "MATCHING", 4).length
    );
}

const REVIEW_TOTAL_SECONDS = 20 * 60; // 20 phút

/** Xác định outcome dựa trên accuracy và thời gian */
function calcOutcome(accuracy: number, elapsedSeconds: number, timedOut: boolean): ReviewOutcome {
    const fast = elapsedSeconds < 10 * 60; // < 10 phút
    if (accuracy >= 90 && fast) return "FAST_TRACKER";
    if (accuracy < 70 && fast) return "CARELESS";
    if (accuracy >= 70 && (timedOut || elapsedSeconds > 15 * 60)) return "SLOW_PASS";
    if (accuracy >= 70) return "STEADY"; // tức 10-15p
    return "FAIL";
}

export default function ReviewLessonPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state ?? {}) as LocationState;

    const treeId = Number(state.treeId ?? 1);
    const [treeData, setTreeData] = useState<SkillTreeQuestionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stage, setStage] = useState<Stage>("VOCAB");
    const [allAttempts, setAllAttempts] = useState<AttemptItem[]>([]);
    const [reviewBadges, setReviewBadges] = useState<BadgeInfo[]>([]);
    const completingRef = useRef(false);

    // Feedback state
    const [showFeedback, setShowFeedback] = useState(false);

    // Timer state
    const startTimeRef = useRef<number>(Date.now());
    const [timedOut, setTimedOut] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Result state
    const [resultAccuracy, setResultAccuracy] = useState(0);
    const [resultCorrect, setResultCorrect] = useState(0);
    const [resultTotal, setResultTotal] = useState(0);
    const [resultOutcome, setResultOutcome] = useState<ReviewOutcome>("STEADY");

    useEffect(() => {
        if (state.node && state.node.nodeType === "REVIEW") {
            // Data đã có sẵn, bắt đầu tính giờ ngay
            startTimeRef.current = Date.now();
            setLoading(false);
            return;
        }

        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await learningService.getTreeQuestions(treeId);
                if (!cancelled) {
                    setTreeData(data);
                    // Reset timer sau khi data load xong, user bắt đầu làm bài
                    startTimeRef.current = Date.now();
                }
            } catch (e: unknown) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "Không tải được dữ liệu REVIEW");
                    setTreeData(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [treeId, state.node]);

    const reviewNode = useMemo(() => {
        if (state.node && state.node.nodeType === "REVIEW") return state.node;
        const nodes = treeData?.nodes ?? [];
        return nodes.find((n) => n.nodeType === "REVIEW") ?? null;
    }, [state.node, treeData]);

    const vocabNode = useMemo(() => reviewNode ? {
        nodeId: reviewNode.nodeId, title: "Review - Vocab", nodeType: "VOCAB",
        questions: pickByType(reviewNode, "VOCAB", 4),
    } : null, [reviewNode]);

    const listeningNode = useMemo(() => reviewNode ? {
        nodeId: reviewNode.nodeId, title: "Review - Listening", nodeType: "LISTENING",
        questions: pickByType(reviewNode, "LISTENING", 1),
    } : null, [reviewNode]);

    const speakingNode = useMemo(() => reviewNode ? {
        nodeId: reviewNode.nodeId, title: "Review - Speaking", nodeType: "SPEAKING",
        questions: pickByType(reviewNode, "SPEAKING", 1),
    } : null, [reviewNode]);

    const matchingNode = useMemo(() => reviewNode ? {
        nodeId: reviewNode.nodeId, title: "Review - Matching", nodeType: "MATCHING",
        questions: pickByType(reviewNode, "MATCHING", 4),
    } : null, [reviewNode]);

    /** Xử lý khi hoàn thành tất cả stages (hoặc hết giờ) */
    async function finishReview(finalAttempts: AttemptItem[], isTimedOut: boolean, totalQs: number) {
        if (completingRef.current) return;
        completingRef.current = true;

        const elapsed = Math.min(
            Math.round((Date.now() - startTimeRef.current) / 1000),
            REVIEW_TOTAL_SECONDS
        );
        setElapsedSeconds(elapsed);

        // Câu chưa làm → tính là sai
        const pendingCount = Math.max(0, totalQs - finalAttempts.length);
        const penaltyAttempts: AttemptItem[] = Array.from({ length: pendingCount }, () => ({
            mongoQuestionId: "timeout-penalty",
            userAnswer: "",
            correct: false,
        }));
        const allFinal = [...finalAttempts, ...penaltyAttempts];

        const correctCount = allFinal.filter(a => a.correct).length;
        const accuracy = allFinal.length > 0 ? Math.round((correctCount / allFinal.length) * 100) : 0;
        const outcome = calcOutcome(accuracy, elapsed, isTimedOut);

        setResultAccuracy(accuracy);
        setResultCorrect(correctCount);
        setResultTotal(allFinal.length);
        setResultOutcome(outcome);

        // Nếu pass → gọi API complete node
        const canPass = outcome !== "FAIL" && outcome !== "CARELESS";
        if (canPass && reviewNode) {
            try {
                const result = await completeNodeAndSave(
                    reviewNode.nodeId,
                    treeId,
                    undefined,
                    0,
                    allFinal,
                    { elapsedSeconds: elapsed, timedOut: isTimedOut, outcome }
                );
                bumpLearnTreeUnlocked(treeId, result.unlockedCount);
                setReviewBadges(result.newBadges);
            } catch {
                // ignore — vẫn hiện result
            }
        } else if (reviewNode) {
            // Fail/Careless: vẫn lưu attempts để thống kê, nhưng không complete node
            try {
                await completeNodeAndSave(
                    reviewNode.nodeId,
                    treeId,
                    undefined,
                    0,
                    allFinal,
                    { elapsedSeconds: elapsed, timedOut: isTimedOut, outcome }
                );
            } catch { /* ignore */ }
        }

        setStage("RESULT");
    }

    /** Hết giờ — auto submit với attempts hiện tại */
    function handleTimeUp() {
        if (completingRef.current) return;
        setTimedOut(true);
        toast("Hết giờ! Hệ thống đang ghi nhận kết quả...", { duration: 3000, icon: <Clock className="w-4 h-4 text-red-600" /> });
        const totalQs = countTotalQuestions(reviewNode);
        void finishReview(allAttempts, true, totalQs);
    }

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center text-gray-500">
                Đang tải bài học…
            </div>
        );
    }

    if (error || !reviewNode) {
        return (
            <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="text-gray-900 font-extrabold mb-2">Không tải được bài REVIEW</div>
                    <div className="text-gray-600 text-sm">{error ?? "Thiếu dữ liệu node REVIEW"}</div>
                    <button type="button" onClick={() => navigate("/learn")}
                        className="mt-4 w-full rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 transition">
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    // Màn hình kết quả adaptive
    if (stage === "RESULT") {
        return (
            <ReviewResultView
                accuracy={resultAccuracy}
                correctCount={resultCorrect}
                totalCount={resultTotal}
                elapsedSeconds={elapsedSeconds}
                totalSeconds={REVIEW_TOTAL_SECONDS}
                timedOut={timedOut}
                outcome={resultOutcome}
                attempts={allAttempts}
                questions={reviewNode?.questions ?? []}
                onContinue={() => setStage("COMPLETE")}
                onRetry={() => {
                    // Reset để làm lại
                    completingRef.current = false;
                    startTimeRef.current = Date.now();
                    setAllAttempts([]);
                    setTimedOut(false);
                    setStage("VOCAB");
                }}
            />
        );
    }

    // Màn hình hoàn thành (chỉ hiện khi pass)
    if (stage === "COMPLETE") {
        return (
            <div className="min-h-screen w-full bg-gray-50">
                <LessonCompleteView
                    knGained={20}
                    accuracy={resultAccuracy}
                    newBadges={reviewBadges}
                    onContinue={() => setShowFeedback(true)}
                />
                {/* Feedback modal — hiện sau khi user nhấn Tiếp tục */}
                {showFeedback && (
                    <FeedbackModal
                        treeId={treeId}
                        onDone={() => {
                            // Unlock node 1 của tree tiếp theo ngay lập tức (optimistic)
                            unlockNextTree(treeId + 1);
                            navigate("/learn", { state: { treeId } });
                        }}
                    />
                )}
            </div>
        );
    }

    const totalQs = countTotalQuestions(reviewNode);

    return (
        <div className="min-h-screen w-full bg-gray-50">
            {/* Timer bubble — chỉ hiện khi đang làm bài */}
            {!timedOut && (
                <ReviewTimerBubble
                    totalSeconds={REVIEW_TOTAL_SECONDS}
                    onWarning={(level) => {
                        if (level === "5min") toast("Còn 5 phút! Hãy tập trung hoàn thành bài.", { duration: 4000, icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> });
                        if (level === "1min") toast("Còn 1 phút! Nhanh lên!", { duration: 4000, style: { background: "#fee2e2", color: "#991b1b" }, icon: <Timer className="w-4 h-4 text-red-600" /> });
                    }}
                    onTimeUp={handleTimeUp}
                />
            )}

            {stage === "VOCAB" && vocabNode && (
                <ReviewVocabView
                    node={vocabNode}
                    onLeaveLesson={() => navigate("/learn")}
                    onComplete={(attempts) => {
                        const next = [...allAttempts, ...attempts];
                        setAllAttempts(next);
                        setStage("LISTENING");
                    }}
                />
            )}
            {stage === "LISTENING" && listeningNode && (
                <ReviewListeningView
                    node={listeningNode}
                    onLeaveLesson={() => navigate("/learn")}
                    onComplete={(attempts) => {
                        const next = [...allAttempts, ...attempts];
                        setAllAttempts(next);
                        setStage("SPEAKING");
                    }}
                />
            )}
            {stage === "SPEAKING" && speakingNode && (
                <ReviewSpeakingView
                    node={speakingNode}
                    onLeaveLesson={() => navigate("/learn")}
                    onComplete={(attempts) => {
                        const next = [...allAttempts, ...attempts];
                        setAllAttempts(next);
                        setStage("MATCHING");
                    }}
                />
            )}
            {stage === "MATCHING" && matchingNode && (
                <ReviewMatchingView
                    node={matchingNode}
                    onLeaveLesson={() => navigate("/learn")}
                    onComplete={async (attempts) => {
                        const finalAttempts = [...allAttempts, ...attempts];
                        setAllAttempts(finalAttempts);
                        await finishReview(finalAttempts, false, totalQs);
                    }}
                />
            )}
        </div>
    );
}
