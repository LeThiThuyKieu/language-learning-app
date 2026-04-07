interface BadgeStepProps {
    completionRate: number;
    completedNodes: number;
    totalNodes: number;
}

export default function BadgeProgress({ completionRate, completedNodes, totalNodes }: BadgeStepProps) {
    const progress = Math.max(0, Math.min(completionRate, 100));
    const remainingNodes = Math.max(totalNodes - completedNodes, 0);

    return (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-5">
                <img src="/profile/analytics.gif" className="w-14 h-14" alt="learning progress" />
                <div className="flex-1">
                    <p className="text-xl font-black italic uppercase tracking-tighter text-primary-900">Tiến trình học tập</p>
                    <p className="text-base font-black uppercase">
                        <span className="text-primary-900">{completedNodes}/{totalNodes}</span>
                        <span className="text-[#1f1a17]"> node hoàn thành</span>
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-2.5 h-3.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                            className="h-full bg-gradient-to-r from-primary-300 to-primary-600 transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-[11px] font-bold mt-1.5">
                        <span className="text-[#1f1a17]">Còn </span>
                        <span className="text-primary-700">{remainingNodes}</span>
                        <span className="text-[#1f1a17]"> node để hoàn tất 100% lộ trình hiện tại.</span>
                    </p>
                </div>
            </div>
        </div>
    );
}