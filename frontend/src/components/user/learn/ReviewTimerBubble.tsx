import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

interface Props {
    totalSeconds: number;       // tổng thời gian (1200 = 20 phút)
    onWarning?: (level: "5min" | "1min") => void;
    onTimeUp: () => void;
}

export default function ReviewTimerBubble({ totalSeconds, onWarning, onTimeUp }: Props) {
    const [remaining, setRemaining] = useState(totalSeconds);
    const warned5 = useRef(false);
    const warned1 = useRef(false);
    const onTimeUpRef = useRef(onTimeUp);
    const onWarningRef = useRef(onWarning);
    onTimeUpRef.current = onTimeUp;
    onWarningRef.current = onWarning;

    useEffect(() => {
        const id = setInterval(() => {
            setRemaining((prev) => {
                const next = prev - 1;
                if (next <= 300 && !warned5.current) {
                    warned5.current = true;
                    onWarningRef.current?.("5min");
                }
                if (next <= 60 && !warned1.current) {
                    warned1.current = true;
                    onWarningRef.current?.("1min");
                }
                if (next <= 0) {
                    clearInterval(id);
                    setTimeout(() => onTimeUpRef.current(), 0);
                    return 0;
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const pct = (remaining / totalSeconds) * 100;

    const color =
        remaining <= 60 ? "text-red-600 border-red-400 bg-red-50"
        : remaining <= 300 ? "text-amber-600 border-amber-400 bg-amber-50"
        : "text-primary-600 border-primary-300 bg-white";

    const ringColor =
        remaining <= 60 ? "stroke-red-500"
        : remaining <= 300 ? "stroke-amber-400"
        : "stroke-primary-500";

    const r = 20;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;

    return (
        <div className={`fixed bottom-24 right-3 sm:bottom-6 sm:right-6 z-50 flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border-2 px-2 py-1.5 sm:px-3 sm:py-2 shadow-lg transition-all ${color}`}>
            {/* Vòng tròn đếm ngược */}
            <div className="relative w-9 h-9 sm:w-12 sm:h-12 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
                    <circle
                        cx="24" cy="24" r={r}
                        fill="none" strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={offset}
                        className={`${ringColor} transition-all duration-1000`}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                </div>
            </div>
            {/* Thời gian */}
            <div className="text-center">
                <div className="text-sm sm:text-lg font-extrabold leading-none tabular-nums">
                    {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </div>
                <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wide opacity-70">còn lại</div>
            </div>
        </div>
    );
}
