import {X} from "lucide-react";

type Props = {
    onClosePress: () => void;
    progressPercent: number;
    rightLabel: string;
};

export default function LessonTopBar({onClosePress, progressPercent, rightLabel}: Props) {
    const pct = Math.min(100, Math.max(0, progressPercent));

    return (
        <header className="w-full bg-white/95 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-100 shadow-sm">
            <div className="w-full max-w-4xl mx-auto flex items-center gap-3 px-4 md:px-8 py-3">
                <button
                    type="button"
                    onClick={onClosePress}
                    className="h-12 w-12 shrink-0 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700 transition"
                    aria-label="Đóng bài học"
                >
                    <X className="h-8 w-8" strokeWidth={2.75}/>
                </button>
                <div className="flex-1 min-w-0">
                    <div className="h-3.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-500 rounded-full transition-all duration-300 ease-out"
                            style={{width: `${pct}%`}}
                        />
                    </div>
                </div>
                <div
                    className="shrink-0 text-[15px] font-bold tabular-nums tracking-tight text-gray-800 whitespace-nowrap"
                    aria-live="polite"
                >
                    {rightLabel.includes("/") ? (
                        <>
                            <span className="text-gray-900">{rightLabel.split("/")[0]}</span>
                            <span className="text-gray-400 font-semibold mx-0.5">/</span>
                            <span className="text-gray-500 font-semibold">{rightLabel.split("/")[1]}</span>
                        </>
                    ) : (
                        rightLabel
                    )}
                </div>
            </div>
        </header>
    );
}
