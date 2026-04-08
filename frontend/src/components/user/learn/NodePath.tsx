import {useEffect, useRef, useState} from "react";
import type {SkillTreeNodeQuestionsData} from "@/types";

type NodeStatus = "active" | "locked" | "completed";

const NODE_PATH_OFFSETS = [0, 64, 18, -44, 28] as const;

export type NodeAccentKey = "orange" | "blue" | "purple" | "teal" | "rose";

const ACCENTS: Record<
  NodeAccentKey,
  {
    bubbleContainer: string; // includes bg/text/border
    bubbleTail: string; // includes border-color and bg
    bubbleButtonText: string; // includes text color
    nodeActiveOuterBg: string;
    nodeActiveInnerBgBorder: string; // includes bg and border
  }
> = {
  orange: {
    bubbleContainer: "bg-primary-500 text-white border-primary-500",
    bubbleTail: "border-primary-500 bg-primary-500",
    bubbleButtonText: "text-primary-600",
    nodeActiveOuterBg: "bg-primary-100",
    nodeActiveInnerBgBorder: "bg-primary-500 border-primary-600",
  },
  blue: {
    bubbleContainer: "bg-blue-500 text-white border-blue-500",
    bubbleTail: "border-blue-500 bg-blue-500",
    bubbleButtonText: "text-blue-600",
    nodeActiveOuterBg: "bg-blue-100",
    nodeActiveInnerBgBorder: "bg-blue-500 border-blue-600",
  },
  purple: {
    bubbleContainer: "bg-purple-500 text-white border-purple-500",
    bubbleTail: "border-purple-500 bg-purple-500",
    bubbleButtonText: "text-purple-600",
    nodeActiveOuterBg: "bg-purple-100",
    nodeActiveInnerBgBorder: "bg-purple-500 border-purple-600",
  },
  teal: {
    bubbleContainer: "bg-teal-500 text-white border-teal-500",
    bubbleTail: "border-teal-500 bg-teal-500",
    bubbleButtonText: "text-teal-600",
    nodeActiveOuterBg: "bg-teal-100",
    nodeActiveInnerBgBorder: "bg-teal-500 border-teal-600",
  },
  rose: {
    bubbleContainer: "bg-rose-500 text-white border-rose-500",
    bubbleTail: "border-rose-500 bg-rose-500",
    bubbleButtonText: "text-rose-600",
    nodeActiveOuterBg: "bg-rose-100",
    nodeActiveInnerBgBorder: "bg-rose-500 border-rose-600",
  },
};

const FALLBACK_PATH_NODES: SkillTreeNodeQuestionsData[] = [
    {nodeId: 0, title: "Học từ vựng", nodeType: "VOCAB", questions: []},
    {nodeId: 0, title: "Luyện nghe", nodeType: "LISTENING", questions: []},
    {nodeId: 0, title: "Luyện nói", nodeType: "SPEAKING", questions: []},
    {nodeId: 0, title: "Nối từ", nodeType: "MATCHING", questions: []},
    {nodeId: 0, title: "Ôn tập tổng hợp", nodeType: "REVIEW", questions: []},
];

function nodeTypeToKind(
    nodeType: string
): "vocabulary" | "listening" | "speaking" | "puzzle" | "review" {
    switch (nodeType) {
        case "VOCAB":
            return "vocabulary";
        case "LISTENING":
            return "listening";
        case "SPEAKING":
            return "speaking";
        case "MATCHING":
            return "puzzle";
        case "REVIEW":
            return "review";
        default:
            return "vocabulary";
    }
}

function getNodeMeta(nodeType: string) {
    switch (nodeType) {
        case "VOCAB":
            return {
                title: "Từ vựng & Giới từ",
                description: "Chọn đáp án đúng nhất",
                button: "BẮT ĐẦU +10 KN",
            };
        case "LISTENING":
            return {
                title: "Nghe & Điền từ",
                description: "Hoàn thành đoạn hội thoại",
                button: "BẮT ĐẦU +10 KN",
            };
        case "SPEAKING":
            return {
                title: "Phản xạ giao tiếp",
                description: "Luyện nói theo mẫu câu",
                button: "BẮT ĐẦU +10 KN",
            };
        case "MATCHING":
            return {
                title: "Thử thách nối từ",
                description: "Nối từ với định nghĩa đúng",
                button: "BẮT ĐẦU +10 KN",
            };
        case "REVIEW":
            return {
                title: "Tổng ôn kiến thức",
                description: "Kiểm tra lại toàn bộ bài học",
                button: "BẮT ĐẦU +20 KN",
            };
        default:
            return {
                title: "",
                description: "",
                button: "BẮT ĐẦU",
            };
    }
}

function LessonBubble({
                          status,
                          title,
                          description,
                          buttonLabel,
                          onStart,
                          accentKey,
                      }: {
    status: NodeStatus;
    title: string;
    description: string;
    buttonLabel: string;
    onStart?: () => void;
    accentKey: NodeAccentKey;
}) {
    const isLocked = status === "locked";
    const accent = ACCENTS[accentKey];

    const containerColor = isLocked
        ? "bg-gray-100 text-gray-700 border-gray-200"
        : accent.bubbleContainer;
    const subtitleColor = isLocked ? "text-gray-600" : "text-white/90";
    const buttonColor = isLocked
        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
        : `bg-white ${accent.bubbleButtonText} hover:bg-white/90`;

    const finalTitle = title || (isLocked ? "Bài học đang khóa" : "Bài học hiện tại");
    const finalDescription =
        description ||
        (isLocked
            ? "Hãy hoàn thành tất cả các cấp độ phía trên để mở khóa!"
            : "Bắt đầu để nhận thêm kinh nghiệm.");

    return (
        <div className="absolute top-[100px] left-1/2 -translate-x-1/2 z-20">
            <div className="relative">
                <div
                    className={`rounded-2xl border px-5 py-3.5 shadow-lg min-w-[230px] max-w-[280px] ${containerColor}`}
                >
                    <div className="text-[15px] font-extrabold leading-snug line-clamp-2">
                        {finalTitle}
                    </div>
                    <div className={`mt-1 text-xs leading-snug ${subtitleColor}`}>
                        {finalDescription}
                    </div>
                    <button
                        type="button"
                        disabled={isLocked || !onStart}
                        className={`mt-3 w-full rounded-2xl px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide transition ${buttonColor}`}
                        onClick={() => {
                            if (!isLocked && onStart) {
                                onStart();
                            }
                        }}
                    >
                        {isLocked ? "KHÓA" : buttonLabel}
                    </button>
                </div>
                <div
                    className={`absolute left-1/2 -top-[7px] h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t ${isLocked ? "border-gray-200 bg-gray-100" : accent.bubbleTail}`}
                />
            </div>
        </div>
    );
}

function CircleNode({
                        kind,
                        label,
                        status = "locked",
                        onClick,
                        accentKey,
                    }: {
    kind: "vocabulary" | "listening" | "speaking" | "puzzle" | "review";
    status?: NodeStatus;
    label?: string;
    onClick?: () => void;
    accentKey: NodeAccentKey;
}) {
    const isActive = status === "active";
    const isCompleted = status === "completed";
    const accent = ACCENTS[accentKey];

    return (
        <button
            type="button"
            aria-label={label ?? "Node"}
            className="relative flex items-center justify-center w-[92px] h-[92px]"
            onClick={onClick}
        >
            <span
                aria-hidden="true"
                className={`absolute inset-0 rounded-full ${
                    isActive ? accent.nodeActiveOuterBg : isCompleted ? "bg-emerald-100" : "bg-gray-200"
                }`}
            />
            <span aria-hidden="true" className="absolute inset-[7px] rounded-full bg-white"/>
            <span
                aria-hidden="true"
                className={`absolute inset-[14px] rounded-full flex items-center justify-center border ${
                    isActive
                        ? accent.nodeActiveInnerBgBorder
                        : isCompleted
                            ? "bg-emerald-500 border-emerald-600"
                            : "bg-gray-100 border-gray-200"
                }`}
            >
        {kind === "vocabulary" && (
            <svg
                viewBox="0 0 24 24"
                className={`h-8 w-8 ${isActive ? "text-white" : "text-gray-500"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M4 19a2 2 0 0 0 2 2h12"/>
                <path d="M6 17V5a2 2 0 0 1 2-2h10v14H8a2 2 0 0 0-2 2z"/>
            </svg>
        )}
                {kind === "listening" && (
                    <svg
                        viewBox="0 0 24 24"
                        className={`h-8 w-8 ${isActive ? "text-white" : "text-gray-500"}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M4 13v-1a8 8 0 0 1 16 0v1"/>
                        <path d="M6 13v3a2 2 0 0 0 2 2h1v-7H8a2 2 0 0 0-2 2z"/>
                        <path d="M18 13v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2z"/>
                    </svg>
                )}
                {kind === "speaking" && (
                    <svg
                        viewBox="0 0 24 24"
                        className={`h-8 w-8 ${isActive ? "text-white" : "text-gray-500"}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
                        <path d="M8 9h9"/>
                        <path d="M8 13h6"/>
                    </svg>
                )}
                {kind === "puzzle" && (
                    <svg
                        viewBox="0 0 24 24"
                        className={`h-8 w-8 ${isActive ? "text-white" : "text-gray-500"}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M8 7a2 2 0 1 1 4 0v1h1a2 2 0 0 1 2 2v1h1a2 2 0 1 1 0 4h-1v1a2 2 0 0 1-2 2h-1v1a2 2 0 1 1-4 0v-1H7a2 2 0 0 1-2-2v-1H4a2 2 0 1 1 0-4h1V10a2 2 0 0 1 2-2h1z"/>
                    </svg>
                )}
                {kind === "review" && (
                    <svg
                        viewBox="0 0 24 24"
                        className={`h-8 w-8 ${isActive ? "text-white" : "text-gray-500"}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 12a9 9 0 1 1-3-6.7"/>
                        <path d="M21 3v6h-6"/>
                    </svg>
                )}
      </span>
        </button>
    );
}

export default function NodePath({
                                     apiNodes,
                                     unlockedCount = 1,
                                     accentKey = "orange",
                                     onStartVocab,
                                     onStartListening,
                                     onStartSpeaking,
                                     onStartMatching,
                                     onStartReview,
                                 }: {
    apiNodes: SkillTreeNodeQuestionsData[] | null;
    unlockedCount?: number; // 1..5
    accentKey?: NodeAccentKey;
    onStartVocab: (node: SkillTreeNodeQuestionsData) => void;
    onStartListening: (node: SkillTreeNodeQuestionsData) => void;
    onStartSpeaking: (node: SkillTreeNodeQuestionsData) => void;
    onStartMatching: (node: SkillTreeNodeQuestionsData) => void;
    onStartReview: (node: SkillTreeNodeQuestionsData) => void;
}) {
    const nodes = apiNodes?.length ? apiNodes : FALLBACK_PATH_NODES;
    const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const el = containerRef.current;
            if (!el) return;
            if (selectedIndex === null) return;
            if (!el.contains(event.target as Node)) {
                setSelectedIndex(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [selectedIndex]);

    return (
        <div
            ref={containerRef}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    setSelectedIndex(null);
                }
            }}
            className="flex flex-col items-center gap-5 py-3 pt-7 mt-4"
        >
            {nodes.map((n, idx) => {
                const x = NODE_PATH_OFFSETS[idx % NODE_PATH_OFFSETS.length] ?? 0;
                const kind = nodeTypeToKind(n.nodeType);
                const order = idx + 1;
                const status: NodeStatus =
                    order < unlockedCount ? "completed" : order === unlockedCount ? "active" : "locked";
                const isSelected = selectedIndex === idx;
                const label = n.title || FALLBACK_PATH_NODES[idx]?.title;
                const meta = getNodeMeta(n.nodeType);

                return (
                    <div
                        key={`${n.nodeId}-${n.nodeType}-${idx}`}
                        className={`relative ${isSelected ? "z-30" : "z-0"}`}
                        style={{transform: `translateX(${x}px)`}}
                    >
                        {isSelected && (
                            <LessonBubble
                                status={status}
                                title={meta.title || label || ""}
                                description={meta.description}
                                buttonLabel={meta.button}
                                onStart={
                                    status === "active" && n.nodeType === "VOCAB"
                                        ? () => onStartVocab(n)
                                        : status === "active" && n.nodeType === "LISTENING"
                                            ? () => onStartListening(n)
                                            : status === "active" && n.nodeType === "SPEAKING"
                                                ? () => onStartSpeaking(n)
                                                : status === "active" && n.nodeType === "MATCHING"
                                                    ? () => onStartMatching(n)
                                                    : status === "active" && n.nodeType === "REVIEW"
                                                        ? () => onStartReview(n)
                                            : undefined
                                }
                                accentKey={accentKey}
                            />
                        )}
                        <CircleNode
                            kind={kind}
                            status={status}
                            label={label}
                            onClick={() => setSelectedIndex(idx)}
                            accentKey={accentKey}
                        />
                    </div>
                );
            })}
        </div>
    );
}

