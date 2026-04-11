import {useEffect, useMemo, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {learningService} from "@/services/learningService.ts";
import type {SkillTreeNodeQuestionsData, SkillTreeQuestionsData} from "@/types";
import VocabLessonView from "@/components/user/learn/VocabLessonView.tsx";

type LocationState = {
    treeId?: number;
    node?: SkillTreeNodeQuestionsData;
};

export default function VocabLessonPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state ?? {}) as LocationState;

    const treeId = Number(state.treeId ?? 1);
    const [treeData, setTreeData] = useState<SkillTreeQuestionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Nếu đã pass node từ LearningPage thì khỏi fetch lại
        if (state.node && state.node.nodeType === "VOCAB") {
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
                    setError(e instanceof Error ? e.message : "Không tải được dữ liệu VOCAB");
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

    const vocabNode = useMemo(() => {
        if (state.node && state.node.nodeType === "VOCAB") return state.node;
        const nodes = treeData?.nodes ?? [];
        return nodes.find((n) => n.nodeType === "VOCAB") ?? null;
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

    if (error || !vocabNode) {
        return (
            <div
                className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white flex items-center justify-center px-4"
            >
                <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="text-gray-900 font-extrabold mb-2">Không tải được bài VOCAB</div>
                    <div className="text-gray-600 text-sm">{error ?? "Thiếu dữ liệu node VOCAB"}</div>
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
            <VocabLessonView
                node={vocabNode}
                onLeaveLesson={() => navigate("/learn")}
                onComplete={() => {
                    // Hoàn thành VOCAB → +10 KN, mở khóa node 2 (LISTENING) và quay về /learn
                    try {
                        sessionStorage.setItem(`learn_tree_${treeId}_unlocked`, "2");
                    } catch {
                        // ignore
                    }
                    navigate("/learn", {state: {treeId, unlockedCount: 2}});
                }}
            />
        </div>
    );
}

