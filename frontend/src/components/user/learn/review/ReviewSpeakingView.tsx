import {useEffect, useMemo, useRef, useState} from "react";
import type {SkillTreeNodeQuestionsData} from "@/types";

function splitLines(text?: string): string[] {
    const raw = String(text ?? "").replace(/\\n/g, "\n");
    return raw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
}

export default function ReviewSpeakingView({
                                              node,
                                              onExit,
                                              onComplete,
                                          }: {
    node: SkillTreeNodeQuestionsData;
    onExit: () => void;
    onComplete: () => void;
}) {
    const q = node.questions?.[0];
    const audioUrl = q?.audioUrl ?? "";
    const lines = useMemo(
        () => splitLines((q as any)?.correctAnswer || q?.questionText),
        [q]
    );

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [activeMicIndex, setActiveMicIndex] = useState<number | null>(null);
    const [checked, setChecked] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        setActiveMicIndex(null);
        setChecked(false);
        setIsFinished(false);
    }, [q?.mongoQuestionId]);

    useEffect(() => {
        if (isFinished) onComplete();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFinished]);

    function togglePlay() {
        const el = audioRef.current;
        if (!el || !audioUrl) return;
        if (el.paused) {
            el.play();
            setPlaying(true);
        } else {
            el.pause();
            setPlaying(false);
        }
    }

    function handleCheck() {
        setChecked(true);
    }

    function handleContinue() {
        if (!checked) return;
        setIsFinished(true);
    }

    if (isFinished) return null;

    // Tạm: Review speaking chỉ UI, coi như đúng
    const isCorrect = checked;

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <div className="w-full bg-white sticky top-0 z-30">
                <div className="w-full max-w-4xl mx-auto flex items-center justify-between px-4 md:px-8 py-3">
                    <button
                        type="button"
                        onClick={onExit}
                        className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition"
                        aria-label="Thoát bài học"
                    >
                        <span className="text-2xl leading-none">&times;</span>
                    </button>
                    <div className="text-sm font-semibold text-gray-700">1 bài nói</div>
                </div>
            </div>

            <main className="flex-1 w-full">
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pt-10 pb-28">
                    <div className="max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 mb-2">
                            Luyện nói
                        </p>
                    </div>

                    <div className="mt-8">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={togglePlay}
                                disabled={!audioUrl}
                                className={[
                                    "h-16 w-16 rounded-full flex items-center justify-center border-2 shadow-sm transition",
                                    audioUrl
                                        ? "border-primary-300 bg-primary-50 hover:bg-primary-100 text-primary-700"
                                        : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed",
                                ].join(" ")}
                                aria-label="Phát audio mẫu"
                            >
                                <span className="text-2xl font-extrabold">{playing ? "❚❚" : "▶"}</span>
                            </button>
                            <div className="text-sm text-gray-600">
                                {audioUrl ? "Nghe mẫu, sau đó bấm mic để luyện đọc" : "Chưa có audio"}
                            </div>
                        </div>
                        {audioUrl && (
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                onEnded={() => setPlaying(false)}
                                preload="none"
                            />
                        )}
                    </div>

                    <div className="mt-10 rounded-2xl border-2 border-gray-200 bg-white p-5 md:p-6 shadow-sm">
                        <div className="space-y-3">
                            {(lines.length ? lines : ["(Chưa có danh sách câu)"]).map((line, idx) => {
                                const active = activeMicIndex === idx;
                                return (
                                    <div
                                        key={`${idx}-${line}`}
                                        className={[
                                            "flex items-center justify-between gap-4 rounded-2xl border-2 px-4 py-4",
                                            active && !checked
                                                ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
                                                : "border-gray-200",
                                            checked ? "opacity-80" : "",
                                        ].join(" ")}
                                    >
                                        <div className="text-gray-900 font-semibold whitespace-pre-wrap">
                                            {line}
                                        </div>
                                        <button
                                            type="button"
                                            disabled={checked}
                                            onClick={() => {
                                                if (checked) return;
                                                setActiveMicIndex((cur) => (cur === idx ? null : idx));
                                            }}
                                            className={[
                                                "h-11 w-11 rounded-full flex items-center justify-center border-2 transition",
                                                checked
                                                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    : active
                                                        ? "border-primary-500 bg-primary-100 text-primary-700"
                                                        : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600",
                                            ].join(" ")}
                                            aria-label="Bấm để luyện nói"
                                        >
                                            🎤
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 text-xs text-gray-500">
                            (Review speaking: tạm UI, phần chấm điểm % sẽ làm sau.)
                        </div>
                    </div>
                </div>

                {!checked ? (
                    <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur border-t border-gray-200">
                        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={handleCheck}
                                className="w-[170px] h-12 rounded-2xl bg-primary-600 hover:bg-primary-700 px-6 text-sm font-extrabold uppercase tracking-wide text-white shadow-sm transition"
                            >
                                KIỂM TRA
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className={[
                            "sticky bottom-0 w-full border-t",
                            isCorrect ? "bg-emerald-100 border-emerald-200" : "bg-red-100 border-red-200",
                        ].join(" ")}
                    >
                        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className={[
                                        "h-14 w-14 rounded-full flex items-center justify-center bg-white shadow-sm",
                                        isCorrect ? "text-emerald-600" : "text-red-600",
                                    ].join(" ")}
                                    aria-hidden="true"
                                >
                                    <span className="text-2xl font-extrabold">{isCorrect ? "✓" : "×"}</span>
                                </div>
                                <div>
                                    <div
                                        className={[
                                            "text-lg font-extrabold",
                                            isCorrect ? "text-emerald-700" : "text-red-700",
                                        ].join(" ")}
                                    >
                                        {isCorrect ? "Tuyệt vời!" : "Chưa đúng"}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleContinue}
                                className="w-[170px] h-12 rounded-2xl bg-primary-600 hover:bg-primary-700 px-6 text-sm font-extrabold uppercase tracking-wide text-white shadow-sm transition"
                            >
                                TIẾP TỤC
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

