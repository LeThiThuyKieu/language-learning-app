import {useCallback, useEffect, useRef, useState} from "react";
import {Pause, Play} from "lucide-react";

function formatTime(sec: number): string {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
    src: string;
    disabled?: boolean;
    /** Gọi khi đổi file audio */
    trackKey?: string;
    /** Force pause audio (khi mic đang ghi âm) */
    forcePause?: boolean;
};

export default function LessonAudioPlayer({src, disabled, trackKey, forcePause}: Props) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);

    const resetState = useCallback(() => {
        setPlaying(false);
        setCurrent(0);
        setDuration(0);
    }, []);

    useEffect(() => {
        resetState();
        const el = audioRef.current;
        if (!el) return;

        const onLoaded = () => {
            const d = el.duration;
            setDuration(Number.isFinite(d) ? d : 0);
        };
        const onTime = () => setCurrent(el.currentTime);
        const onEnd = () => {
            setPlaying(false);
            setCurrent(el.duration || 0);
        };
        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);

        el.addEventListener("loadedmetadata", onLoaded);
        el.addEventListener("durationchange", onLoaded);
        el.addEventListener("timeupdate", onTime);
        el.addEventListener("ended", onEnd);
        el.addEventListener("play", onPlay);
        el.addEventListener("pause", onPause);

        el.load();

        return () => {
            el.removeEventListener("loadedmetadata", onLoaded);
            el.removeEventListener("durationchange", onLoaded);
            el.removeEventListener("timeupdate", onTime);
            el.removeEventListener("ended", onEnd);
            el.removeEventListener("play", onPlay);
            el.removeEventListener("pause", onPause);
        };
    }, [src, trackKey, resetState]);

    // Pause audio khi mic đang ghi âm
    useEffect(() => {
        if (forcePause) {
            const el = audioRef.current;
            if (el && !el.paused) el.pause();
        }
    }, [forcePause]);

    function toggle() {
        const el = audioRef.current;
        if (!el || !src || disabled || forcePause) return;
        if (el.paused) void el.play();
        else el.pause();
    }

    function onSeekPct(pct: number) {
        const el = audioRef.current;
        if (!el || !duration) return;
        const t = (pct / 100) * duration;
        el.currentTime = t;
        setCurrent(t);
    }

    const pct = duration > 0 ? (current / duration) * 100 : 0;
    const canUse = Boolean(src) && !disabled && !forcePause;

    return (
        <div
            className={[
                "rounded-2xl border-2 border-gray-200 bg-gradient-to-b from-white to-gray-50/80 p-4 md:p-5 shadow-sm",
                !canUse ? "opacity-60" : "",
            ].join(" ")}
        >
            <audio ref={audioRef} src={src || undefined} preload="metadata"/>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <button
                    type="button"
                    onClick={toggle}
                    disabled={!canUse}
                    className={[
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 shadow-md transition",
                        canUse
                            ? "border-primary-400 bg-primary-500 text-white hover:bg-primary-600 hover:shadow-lg"
                            : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed",
                    ].join(" ")}
                    aria-label={playing ? "Tạm dừng" : "Phát"}
                >
                    {playing ? <Pause className="h-7 w-7" fill="currentColor"/> : <Play className="h-7 w-7 ml-0.5" fill="currentColor"/>}
                </button>

                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={0.05}
                            value={pct}
                            disabled={!canUse || !duration}
                            onChange={(e) => onSeekPct(Number(e.target.value))}
                            className="h-2 w-full flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-primary-600 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:shadow-md"
                            aria-label="Tiến độ audio"
                        />
                    </div>
                    <div className="flex justify-between text-xs font-semibold tabular-nums text-gray-500">
                        <span>{formatTime(current)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
                {forcePause ? "Audio tạm dừng khi đang ghi âm." : canUse ? "Kéo thanh để tua tới đoạn cần nghe." : "Chưa có audio cho bài này."}
            </p>
        </div>
    );
}
