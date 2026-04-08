import {useEffect, useMemo, useRef, useState} from "react";
import type {SkillTreeNodeQuestionsData} from "@/types";
import LessonCompleteView from "@/components/user/learn/LessonCompleteView";

function parseExpectedTokens(correctAnswer?: string): string[] {
    const raw = (correctAnswer ?? "").trim();
    if (!raw) return [];

    // Format thường gặp: "1:Sorry | 2:can't | 3:can ..."
    const parts = raw.split("|").map((p) => p.trim()).filter(Boolean);
    const numbered = parts
        .map((p) => {
            const m = p.match(/^(\d+)\s*:\s*(.+)$/);
            if (!m) return null;
            return {i: Number(m[1]), v: (m[2] ?? "").trim()};
        })
        .filter((x): x is { i: number; v: string } => Boolean(x && x.v));

    if (numbered.length > 0) {
        return numbered.sort((a, b) => a.i - b.i).map((x) => x.v);
    }

    // Fallback: nếu correctAnswer chỉ là 1 chuỗi
    return [raw];
}

export default function ListeningLessonView({
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
    const expected = useMemo(() => parseExpectedTokens(q?.correctAnswer), [q?.correctAnswer]);
    const questionText = useMemo(() => {
        const raw = q?.questionText ?? "";
        return String(raw).replace(/\\n/g, "\n");
    }, [q?.questionText]);

    const [inputs, setInputs] = useState<string[]>(() => expected.map(() => ""));
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [checked, setChecked] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        setInputs(expected.map(() => ""));
        setChecked(false);
        setSelectedIndex(null);
        setIsFinished(false);
    }, [expected]);

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
        if (expected.length === 0) return;
        setChecked(true);
    }

    const isCorrect = useMemo(() => {
        if (!checked) return false;
        if (expected.length === 0) return false;
        return expected.every((exp, i) => {
            const got = (inputs[i] ?? "").trim().toLowerCase();
            return got === exp.trim().toLowerCase();
        });
    }, [checked, expected, inputs]);

    const correctAnswerDisplay = useMemo(() => {
        // Hiển thị đúng theo yêu cầu: lấy từ answer và thay "|" bằng ","
        // Ví dụ: "1:doesn't | 2:Don't | 3:you" -> "doesn't, Don't, you"
        if (expected.length > 0) return expected.join(", ");
        const raw = (q?.correctAnswer ?? "").trim();
        if (!raw) return "";
        return raw.replace(/\s*\|\s*/g, ", ").replace(/\b\d+\s*:\s*/g, "");
    }, [expected, q?.correctAnswer]);

    function handleContinue() {
        if (!checked) return;
        setIsFinished(true);
    }

    if (isFinished) {
        return <LessonCompleteView knGained={10} onContinue={onComplete}/>;
    }

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
                    <div className="text-sm font-semibold text-gray-700">1 câu</div>
                </div>
            </div>

            <main className="flex-1 w-full">
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pt-10 pb-28">
                    <div className="max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 mb-2">
                            Nghe & điền từ
                        </p>
                        <h1 className="min-h-[70px] text-3xl md:text-4xl font-extrabold text-gray-900 leading-[1.18]">
                            Hoàn thành đoạn hội thoại
                        </h1>
                    </div>

                    {/* Audio */}
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
                                aria-label="Phát audio"
                            >
                                <span className="text-2xl font-extrabold">
                                    {playing ? "❚❚" : "▶"}
                                </span>
                            </button>
                            <div className="text-sm text-gray-600">
                                {audioUrl ? "Nhấn để nghe đoạn audio" : "Chưa có audio"}
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

                    {/* Text + inputs */}
                    <div className="mt-10 rounded-2xl border-2 border-gray-200 bg-white p-5 md:p-6 shadow-sm">
                        {q?.questionText ? (
                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {questionText}
                            </p>
                        ) : (
                            <p className="text-gray-600">Điền từ còn thiếu theo đoạn nghe.</p>
                        )}

                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {expected.map((_, i) => {
                                const isSelected = selectedIndex === i;
                                const showCorrect = checked && isCorrect;
                                const showWrong = checked && !isCorrect;
                                return (
                                    <div
                                        key={i}
                                        className={[
                                            "rounded-2xl border-2 bg-white px-4 py-4 transition",
                                            isSelected && !checked ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200" : "border-gray-200",
                                            checked && showCorrect ? "border-emerald-500 bg-emerald-50" : "",
                                            checked && showWrong ? "border-red-500 bg-red-50" : "",
                                        ].join(" ")}
                                        onMouseDown={() => {
                                            if (!checked) setSelectedIndex(i);
                                        }}
                                    >
                                        <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-500 mb-2">
                                            Từ {i + 1}
                                        </label>
                                        <input
                                            value={inputs[i] ?? ""}
                                            disabled={checked}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setInputs((arr) => {
                                                    const next = [...arr];
                                                    next[i] = v;
                                                    return next;
                                                });
                                            }}
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900 outline-none focus:ring-4 focus:ring-primary-200"
                                            placeholder="Nhập từ..."
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                {!checked ? (
                    <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur border-t border-gray-200">
                        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-end gap-4">
                            <button
                                type="button"
                                disabled={expected.length === 0 || inputs.some((x) => !x.trim())}
                                onClick={handleCheck}
                                className={[
                                    "w-[170px] h-12 rounded-2xl px-6 text-sm font-extrabold uppercase tracking-wide shadow-sm transition",
                                    expected.length > 0 && inputs.every((x) => x.trim())
                                        ? "bg-primary-600 hover:bg-primary-700 text-white"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed",
                                ].join(" ")}
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
                                        {isCorrect ? "Tuyệt vời!" : "Đáp án đúng:"}
                                    </div>
                                    {!isCorrect && (
                                        <div className="text-sm font-semibold text-red-700">
                                            {correctAnswerDisplay || "(không có đáp án)"}
                                        </div>
                                    )}
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

