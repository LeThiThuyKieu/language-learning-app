import { useState } from "react";
import BadgeUnlockPopup from "@/components/user/learn/BadgeUnlockPopup";
import type { BadgeInfo } from "@/services/learningService";

export default function LessonCompleteView({
                                              knGained,
                                              accuracy,
                                              newBadges = [],
                                              onContinue,
                                          }: {
    knGained: number;
    accuracy?: number;
    newBadges?: BadgeInfo[];
    onContinue: () => void;
}) {
    const [badgeQueue, setBadgeQueue] = useState<BadgeInfo[]>(newBadges);

    function handleBadgeClose() {
        setBadgeQueue((prev) => prev.slice(1));
    }
    return (
        <div className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white flex flex-col">
            {/* Popup badge — hiện từng cái một */}
            {badgeQueue.length > 0 && (
                <BadgeUnlockPopup badgeQueue={badgeQueue} onClose={handleBadgeClose} />
            )}
            <div className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-xl text-center">
                    <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-primary-50 flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-extrabold text-3xl">
                            ✓
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-primary-600 mb-3">
                        Hoàn thành bài học!
                    </h1>
                    <div className={`mx-auto mt-6 grid gap-4 max-w-md ${accuracy !== undefined ? "grid-cols-2" : "grid-cols-1"}`}>
                        <div className="rounded-2xl border-2 border-primary-300 overflow-hidden">
                            <div className="bg-primary-500 text-white text-xs font-extrabold uppercase tracking-wide py-2">
                                Tổng điểm KN
                            </div>
                            <div className="py-5 font-extrabold text-gray-900 text-xl">
                                +{knGained}
                            </div>
                        </div>
                        {accuracy !== undefined && (
                            <div className="rounded-2xl border-2 border-emerald-300 overflow-hidden">
                                <div className="bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wide py-2">
                                    Chính xác
                                </div>
                                <div className="py-5 font-extrabold text-gray-900 text-xl">
                                    {accuracy}%
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur border-t border-gray-200">
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={onContinue}
                        className="min-w-[170px] rounded-2xl bg-primary-600 px-6 py-3 text-base font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:bg-primary-700"
                    >
                        TIẾP TỤC
                    </button>
                </div>
            </div>
        </div>
    );
}

