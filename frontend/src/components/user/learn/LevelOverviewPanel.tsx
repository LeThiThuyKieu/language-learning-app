import { CheckCircle2, Lock, Zap } from "lucide-react";
import type { LevelKey } from "@/utils/learningLevel";

interface LevelMeta {
    id: number;
    key: LevelKey;
    name: string;
    tagline: string;
    color: string;
    lightColor: string;
    borderColor: string;
    textColor: string;
}

const LEVEL_META: LevelMeta[] = [
    {
        id: 1, key: "beginner", name: "Beginner",
        tagline: "Nền tảng vững chắc — bắt đầu hành trình chinh phục tiếng Anh!",
        color: "bg-emerald-500", lightColor: "bg-emerald-50",
        borderColor: "border-emerald-300", textColor: "text-emerald-700",
    },
    {
        id: 2, key: "intermediate", name: "Intermediate",
        tagline: "Tiến xa hơn — luyện tập chuyên sâu để tự tin giao tiếp!",
        color: "bg-primary-500", lightColor: "bg-primary-50",
        borderColor: "border-primary-300", textColor: "text-primary-700",
    },
    {
        id: 3, key: "advanced", name: "Advanced",
        tagline: "Đỉnh cao thành thạo — sử dụng tiếng Anh như ngôn ngữ thứ hai!",
        color: "bg-purple-500", lightColor: "bg-purple-50",
        borderColor: "border-purple-300", textColor: "text-purple-700",
    },
];

export interface LevelOverviewPanelProps {
    currentLevelId: number;
    onReview: (levelId: number) => void;
    onContinue: () => void;
    onSkipTest: (
        targetLevelId: number,
        targetLevelKey: LevelKey,
        targetLevelName: string,
        sourceLevelIds: number[]
    ) => void;
}

export default function LevelOverviewPanel({
    currentLevelId,
    onReview,
    onContinue,
    onSkipTest,
}: LevelOverviewPanelProps) {
    return (
        <div className="flex flex-col gap-3 mt-2 pb-6">
            {LEVEL_META.map((meta) => {
                // Level cũ → Ôn tập
                if (meta.id < currentLevelId) {
                    return (
                        <div
                            key={meta.id}
                            className="rounded-2xl border-2 border-gray-200 bg-white p-5 flex items-center justify-between gap-4"
                            style={{ backgroundImage: "repeating-linear-gradient(135deg,transparent,transparent 10px,rgba(0,0,0,0.025) 10px,rgba(0,0,0,0.025) 20px)" }}
                        >
                            <div className="min-w-0">
                                <h2 className="text-lg font-extrabold text-gray-800 truncate">
                                    Level {meta.id}: {meta.name}
                                </h2>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-600">
                                        Hoàn thành!
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onReview(meta.id)}
                                className="shrink-0 rounded-xl border-2 border-gray-300 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-gray-600 hover:bg-gray-50 active:scale-95 transition"
                            >
                                Ôn tập
                            </button>
                        </div>
                    );
                }

                // Level hiện tại → Tiếp tục
                if (meta.id === currentLevelId) {
                    return (
                        <div
                            key={meta.id}
                            className={`rounded-2xl border-2 ${meta.borderColor} ${meta.lightColor} p-5 flex flex-col gap-4`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className={`inline-block text-[11px] font-extrabold uppercase tracking-widest ${meta.textColor} mb-1`}>
                                        Đang học
                                    </span>
                                    <h2 className={`text-xl font-extrabold ${meta.textColor}`}>
                                        Level {meta.id}: {meta.name}
                                    </h2>
                                </div>
                                <img
                                    src="/logo/lion.png"
                                    alt="Lion mascot"
                                    className="w-16 h-16 object-contain drop-shadow-md select-none shrink-0"
                                    draggable={false}
                                />
                            </div>
                            <p className={`text-sm font-semibold ${meta.textColor} leading-snug`}>
                                {meta.tagline}
                            </p>
                            <button
                                type="button"
                                onClick={onContinue}
                                className={`w-full rounded-2xl ${meta.color} hover:opacity-90 active:scale-95 text-white font-extrabold py-3 text-sm uppercase tracking-widest transition-all shadow-md`}
                            >
                                Tiếp tục
                            </button>
                        </div>
                    );
                }

                // Level cao hơn → Học vượt
                const isSkipTwo = meta.id > currentLevelId + 1;
                const sources = isSkipTwo
                    ? Array.from({ length: meta.id - 1 }, (_, i) => i + 1)
                    : [currentLevelId];

                return (
                    <div
                        key={meta.id}
                        className={`rounded-2xl border-2 ${isSkipTwo ? "border-purple-200 bg-purple-50/40" : "border-gray-200 bg-gray-50"} p-5`}
                    >
                        <div className="mb-3">
                            <span className={`inline-block text-[11px] font-extrabold uppercase tracking-widest mb-1 ${isSkipTwo ? "text-purple-500" : "text-gray-400"}`}>
                                {isSkipTwo ? "Học vượt 2 cấp" : "Kế tiếp"}
                            </span>
                            <div className="flex items-center gap-2">
                                <Lock className={`w-4 h-4 shrink-0 ${isSkipTwo ? "text-purple-400" : "text-gray-400"}`} />
                                <h2 className="text-lg font-extrabold text-gray-700">
                                    Level {meta.id}: {meta.name}
                                </h2>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4">
                            {isSkipTwo
                                ? `Học vượt thẳng lên Level ${meta.id}: ${meta.name} — thử thách bản thân nếu bạn tự tin vào năng lực!`
                                : `Tiếp tục học các bài nâng cao hơn để củng cố vốn từ và kỹ năng nghe — nói của bạn.`
                            }
                        </p>
                        <button
                            type="button"
                            onClick={() => onSkipTest(meta.id, meta.key, meta.name, sources)}
                            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide shadow-sm transition text-white ${
                                isSkipTwo
                                    ? "bg-purple-500 hover:bg-purple-600 active:bg-purple-700"
                                    : "bg-primary-500 hover:bg-primary-600 active:bg-primary-700"
                            }`}
                        >
                            <Zap className="w-4 h-4" />
                            {isSkipTwo ? "Thử thách ngay" : "Học vượt"}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
