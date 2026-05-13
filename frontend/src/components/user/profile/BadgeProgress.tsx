import { useState } from "react";

interface BadgeStepProps {
    completedTrees: number;
    totalTrees: number;
    currentProgressLabel: string | null; // "Tree X - Node Y/Z"
}

export default function BadgeProgress({ completedTrees, totalTrees, currentProgressLabel }: BadgeStepProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const progress = totalTrees > 0 ? Math.round((completedTrees / totalTrees) * 100) : 0;
    const remainingTrees = Math.max(totalTrees - completedTrees, 0);

    return (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-5">
                <img src="/profile/analytics.gif" className="w-14 h-14" alt="learning progress" />
                <div className="flex-1">
                    <p className="text-xl font-black italic uppercase tracking-tighter text-primary-900">Tiến trình học tập</p>
                    <p className="text-base font-black uppercase">
                        <span className="text-primary-900">{completedTrees}/{totalTrees}</span>
                        <span className="text-[#1f1a17]"> Tree đã hoàn thành</span>
                    </p>

                    {/* Progress Bar với tooltip */}
                    <div
                        className="relative mt-2.5"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 cursor-pointer">
                            <div
                                className="h-full bg-gradient-to-r from-primary-300 to-primary-600 transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Tooltip */}
                        {showTooltip && currentProgressLabel && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10">
                                <div className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg">
                                    Đang học: {currentProgressLabel}
                                </div>
                                <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                            </div>
                        )}
                    </div>

                    <p className="text-[11px] font-bold mt-1.5">
                        <span className="text-[#1f1a17]">Còn </span>
                        <span className="text-primary-700">{remainingTrees}</span>
                        <span className="text-[#1f1a17]"> tree để hoàn tất 100% lộ trình hiện tại.</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
