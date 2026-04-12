import {useEffect, useMemo, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {learningService} from "@/services/learningService.ts";
import type {SkillTreeNodeQuestionsData, SkillTreeQuestionsData} from "@/types";
import MatchingLessonView from "@/components/user/learn/question_type/matching/MatchingLessonView.tsx";
import {bumpLearnTreeUnlocked} from "@/utils/learnTreeProgress.ts";

type LocationState = {
    treeId?: number;
    node?: SkillTreeNodeQuestionsData;
};

export default function MatchingLessonPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state ?? {}) as LocationState;

    const treeId = Number(state.treeId ?? 1);
    const [treeData, setTreeData] = useState<SkillTreeQuestionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (state.node && state.node.nodeType === "MATCHING") {
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
                    setError(e instanceof Error ? e.message : "Không tải được dữ liệu MATCHING");
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

    const matchingNode = useMemo(() => {
        if (state.node && state.node.nodeType === "MATCHING") return state.node;
        const nodes = treeData?.nodes ?? [];
        return nodes.find((n) => n.nodeType === "MATCHING") ?? null;
    }, [state.node, treeData]);

    if (loading) {
        return (
            <div
                className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white flex items-center justify-center text-gray-500"
            >
                Đang tải bài học…
            </div>
        );
    }

    if (error || !matchingNode) {
        return (
            <div
                className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white flex items-center justify-center px-4"
            >
                <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="text-gray-900 font-extrabold mb-2">Không tải được bài MATCHING</div>
                    <div className="text-gray-600 text-sm">{error ?? "Thiếu dữ liệu node MATCHING"}</div>
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

    return (
        <div className="min-h-screen w-full bg-gray-50">
            <MatchingLessonView
                node={matchingNode}
                onLeaveLesson={() => navigate("/learn")}
                onComplete={() => {
                    const next = bumpLearnTreeUnlocked(treeId, 5);
                    navigate("/learn", {state: {treeId, unlockedCount: next}});
                }}
            />
        </div>
    );
}