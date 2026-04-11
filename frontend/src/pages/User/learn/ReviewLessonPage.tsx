import {useEffect, useMemo, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {learningService} from "@/services/learningService.ts";
import type {SkillTreeNodeQuestionsData, SkillTreeQuestionsData} from "@/types";
import LessonCompleteView from "@/components/user/learn/LessonCompleteView.tsx";
import ReviewVocabView from "@/components/user/learn/review/ReviewVocabView.tsx";
import {bumpLearnTreeUnlocked} from "@/utils/learnTreeProgress";
import ReviewListeningView from "@/components/user/learn/review/ReviewListeningView.tsx";
import ReviewSpeakingView from "@/components/user/learn/review/ReviewSpeakingView.tsx";
import ReviewMatchingView from "@/components/user/learn/review/ReviewMatchingView.tsx";

type Stage = "VOCAB" | "LISTENING" | "SPEAKING" | "MATCHING" | "DONE";

type LocationState = {
    treeId?: number;
    node?: SkillTreeNodeQuestionsData;
};

function pickByType(node: SkillTreeNodeQuestionsData | null, type: string, limit: number) {
    const qs = node?.questions ?? [];
    return qs.filter((q) => q.questionType === type).slice(0, limit);
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

    useEffect(() => {
        // Nếu pass node REVIEW từ LearningPage thì khỏi fetch lại
        if (state.node && state.node.nodeType === "REVIEW") {
            setLoading(false);
            return;
        }

        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await learningService.getTreeQuestions(treeId);
                if (!cancelled) setTreeData(data);
            } catch (e: unknown) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "Không tải được dữ liệu REVIEW");
                    setTreeData(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [treeId, state.node]);

    const reviewNode = useMemo(() => {
        if (state.node && state.node.nodeType === "REVIEW") return state.node;
        const nodes = treeData?.nodes ?? [];
        return nodes.find((n) => n.nodeType === "REVIEW") ?? null;
    }, [state.node, treeData]);

    const vocabNode: SkillTreeNodeQuestionsData | null = useMemo(() => {
        if (!reviewNode) return null;
        return {
            nodeId: reviewNode.nodeId,
            title: "Review - Vocab",
            nodeType: "VOCAB",
            questions: pickByType(reviewNode, "VOCAB", 4),
        };
    }, [reviewNode]);

    const listeningNode: SkillTreeNodeQuestionsData | null = useMemo(() => {
        if (!reviewNode) return null;
        return {
            nodeId: reviewNode.nodeId,
            title: "Review - Listening",
            nodeType: "LISTENING",
            questions: pickByType(reviewNode, "LISTENING", 1),
        };
    }, [reviewNode]);

    const speakingNode: SkillTreeNodeQuestionsData | null = useMemo(() => {
        if (!reviewNode) return null;
        return {
            nodeId: reviewNode.nodeId,
            title: "Review - Speaking",
            nodeType: "SPEAKING",
            questions: pickByType(reviewNode, "SPEAKING", 1),
        };
    }, [reviewNode]);

    const matchingNode: SkillTreeNodeQuestionsData | null = useMemo(() => {
        if (!reviewNode) return null;
        return {
            nodeId: reviewNode.nodeId,
            title: "Review - Matching",
            nodeType: "MATCHING",
            questions: pickByType(reviewNode, "MATCHING", 4),
        };
    }, [reviewNode]);

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
                    <button
                        type="button"
                        onClick={() => navigate("/learn")}
                        className="mt-4 w-full rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 transition"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (stage === "DONE") {
        return (
            <div className="min-h-screen w-full bg-gray-50">
                <LessonCompleteView
                    knGained={20}
                    onContinue={() => {
                        const next = bumpLearnTreeUnlocked(treeId, 5);
                        navigate("/learn", {state: {treeId, unlockedCount: next}});
                    }}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gray-50">
            {stage === "VOCAB" && vocabNode && (
                <ReviewVocabView
                    node={vocabNode}
                    onLeaveLesson={() => navigate("/learn")}
                    onComplete={() => setStage("LISTENING")}
                />
            )}
            {stage === "LISTENING" && listeningNode && (
                <ReviewListeningView
                    node={listeningNode}
                    onLeaveLesson={() => navigate("/learn")}
                    onComplete={() => setStage("SPEAKING")}
                />
            )}
            {stage === "SPEAKING" && speakingNode && (
                <ReviewSpeakingView
                    node={speakingNode}
                    onLeaveLesson={() => navigate("/learn")}
                    onComplete={() => setStage("MATCHING")}
                />
            )}
            {stage === "MATCHING" && matchingNode && (
                <ReviewMatchingView
                    node={matchingNode}
                    onLeaveLesson={() => navigate("/learn")}
                    onComplete={() => setStage("DONE")}
                />
            )}
        </div>
    );
}

