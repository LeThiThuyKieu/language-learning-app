import {cn} from "@/utils/cn.ts";
import type {PlacementLevelBand} from "@/pages/User/learn/placement/placementTypes.ts";
import {levelBandEnglish} from "@/pages/User/learn/placement/buildPlacementSteps.ts";

export type PlacementSkillBar = {
    // Chỉ tỷ lệ, ví dụ "1/15"
    ratioLabel: string;
    complete: boolean;
    fillRatio: number;
};

const SEGMENT_ARIA = ["Từ vựng", "Nghe hiểu", "Nói", "Matching"] as const;

type Props = {
    currentLevel: PlacementLevelBand;
    bars: [PlacementSkillBar, PlacementSkillBar, PlacementSkillBar, PlacementSkillBar];
    onClosePress: () => void;
};

/**
 * Một hàng 4 đoạn tiến độ (Vocab · Listening · Speaking · Matching).
 * Hoàn thành → xanh; đang làm → cam (primary).
 */
export default function PlacementHeader({currentLevel, bars, onClosePress}: Props) {
    const levelEn = levelBandEnglish(currentLevel);

    return (
        <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-[#f7f7f8]/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-4xl items-start gap-3 px-4 py-3 md:px-8 md:py-4">

                {/* Button thoát */}
                <button type="button" onClick={onClosePress} className="shrink-0 rounded-xl pt-0.5 outline-none ring-offset-2 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#0a192f]" aria-label="Thoát bài test">
                    <img src="/logo/lion.png" alt="" className="h-10 w-10 object-contain md:h-11 md:w-11"/>
                </button>

                <div className="min-w-0 flex-1">
                    <p className="text-center text-sm font-bold tracking-tight text-[#0a192f] md:text-base">
                        Trình độ: {levelEn} (Level {currentLevel}/3)
                    </p>

                    <div className="mt-3 flex gap-1 md:mt-3.5 md:gap-1.5" role="group"
                         aria-label="Tiến độ theo kỹ năng">
                        {bars.map((bar, i) => (
                            <SegmentColumn
                                key={i}
                                bar={bar}
                                ariaLabel={`${SEGMENT_ARIA[i]}: ${bar.ratioLabel}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </header>
    );
}

function SegmentColumn({bar, ariaLabel}: { bar: PlacementSkillBar; ariaLabel: string }) {
    const pct = Math.round(Math.min(1, Math.max(0, bar.fillRatio)) * 100);
    return (
        <div className="min-w-0 flex-1" aria-label={ariaLabel}>
            <p className="mb-1 text-center text-[10px] font-semibold tabular-nums text-gray-600 md:text-[11px]">
                {bar.ratioLabel}
            </p>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200/95 md:h-3">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        bar.complete ? "bg-emerald-500" : "bg-primary-600"
                    )}
                    style={{width: bar.complete ? "100%" : `${pct}%`}}
                />
            </div>
        </div>
    );
}
