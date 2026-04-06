interface BadgeStepProps {
    nextBadgeName: string;
    currentXp: number;
    targetXp: number;
    badgeIcon: string;
}

export default function BadgeProgress({ nextBadgeName, currentXp, targetXp, badgeIcon }: BadgeStepProps) {
    const progress = Math.min((currentXp / targetXp) * 100, 100);

    return (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-[0_4px_0_0_rgba(226,232,240,1)]">
            <div className="flex items-center gap-4">
                <img src={badgeIcon} className="w-12 h-12 grayscale opacity-50" alt="next badge" />
                <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Huy hiệu tiếp theo</p>
                    <p className="text-sm font-black text-slate-700 uppercase">{nextBadgeName}</p>

                    {/* Progress Bar */}
                    <div className="mt-2 h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">
                        Còn {targetXp - currentXp} XP nữa để mở khóa!
                    </p>
                </div>
            </div>
        </div>
    );
}