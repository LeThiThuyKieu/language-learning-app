import {useMemo, useState} from "react";
import type {SkillTreeNodeQuestionsData} from "@/types";
import LessonCompleteView from "@/components/user/learn/LessonCompleteView";

export default function VocabLessonView({
                                           node,
                                           onExit,
                                           onComplete,
                                       }: {
    node: SkillTreeNodeQuestionsData;
    onExit: () => void;
    onComplete: () => void;
}) {
    const questions = node.questions ?? [];
    const total = Math.max(questions.length, 1);
    const [index, setIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [checked, setChecked] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const current = questions[index];

    const options = useMemo(() => current?.options ?? [], [current?.options]);
    const questionText = useMemo(() => {
        const raw = current?.questionText ?? "";
        return String(raw).replace(/\\n/g, "\n");
    }, [current?.questionText]);

    const progressPercent = ((index + 1) / total) * 100;

    const correctOptionText = useMemo(() => {
        const raw = (current as any)?.correctAnswer as string | undefined;
        const correctAnswer = (raw ?? "").trim();
        if (!correctAnswer) return "";

        // Most common: correctAnswer is the option text
        const byText = options.find(
            (o) => (o ?? "").trim().toLowerCase() === correctAnswer.toLowerCase()
        );
        if (byText) return byText;

        // Fallback: A/B/C/D -> map to option index
        if (/^[A-D]$/i.test(correctAnswer)) {
            const idx = correctAnswer.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
            return options[idx] ?? "";
        }

        return correctAnswer;
    }, [current, options]);

    const isCorrect = checked && Boolean(selectedOption) && selectedOption === correctOptionText;

    function resetForNextQuestion(nextIndex: number) {
        setIndex(nextIndex);
        setSelectedOption(null);
        setChecked(false);
    }

    function handleCheck() {
        if (!selectedOption) return;
        setChecked(true);
    }

    function handleContinue() {
        if (!checked) return;
        if (index < total - 1) {
            resetForNextQuestion(index + 1);
        } else {
            setIsFinished(true);
        }
    }

    if (isFinished) {
        return <LessonCompleteView knGained={10} onContinue={onComplete}/>;
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Top bar */}
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
                    <div className="flex-1 mx-4">
                        <div className="h-3.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                                style={{width: `${progressPercent}%`}}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-700 whitespace-nowrap">
                        <span className="tabular-nums">{questions.length || 0}</span>
                        <span className="text-gray-400">câu</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 w-full">
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pt-10 pb-28">
                    <div className="max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 mb-2">
                            Từ vựng mới
                        </p>
                        {/* Giữ chiều cao tối thiểu để câu ngắn/dài không làm layout nhảy */}
                        <h1 className="min-h-[92px] whitespace-pre-wrap text-3xl md:text-4xl font-extrabold text-gray-900 leading-[1.18]">
                            {questionText || "Câu hỏi đang tải..."}
                        </h1>
                    </div>

                    <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 items-stretch">
                        {options.map((opt, i) => {
                            const isThirdAlone = options.length === 3 && i === 2;
                            const isSelected = selectedOption === opt;
                            const showCorrect = checked && opt === correctOptionText;
                            const showWrongSelected = checked && isSelected && !isCorrect;
                            return (
                                <button
                                    key={`${opt}-${i}`}
                                    type="button"
                                    onClick={() => {
                                        if (checked) return;
                                        setSelectedOption(opt);
                                    }}
                                    className={[
                                        "group relative w-full",
                                        "rounded-2xl border-2 border-gray-200 bg-white px-5 py-7 md:py-8 shadow-sm",
                                        "transition-all duration-150",
                                        "hover:-translate-y-0.5 hover:border-primary-500 hover:shadow-md",
                                        "active:translate-y-0",
                                        "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200",
                                        "min-h-[88px] md:min-h-[104px]",
                                        // Khi chọn nhưng chưa kiểm tra: viền + nền nhạt theo màu chủ đạo
                                        isSelected && !checked
                                            ? "border-primary-500 bg-primary-100 ring-2 ring-primary-200"
                                            : "",
                                        showCorrect ? "border-emerald-500 bg-emerald-50" : "",
                                        showWrongSelected ? "border-red-500 bg-red-50" : "",
                                        isThirdAlone
                                            ? "sm:col-span-2 sm:justify-self-center sm:w-[calc(50%-0.75rem)]"
                                            : "",
                                    ].join(" ")}
                                >
                                    <span
                                        className={[
                                            "block text-base md:text-lg font-semibold text-center line-clamp-2",
                                            isSelected && !checked ? "text-primary-700" : "text-gray-800",
                                        ].join(" ")}
                                    >
                                        {opt}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom bar */}
                {!checked ? (
                    <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur">
                        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-end gap-4">
                            <button
                                type="button"
                                disabled={!selectedOption}
                                onClick={handleCheck}
                                className={[
                                    "w-[170px] h-12 rounded-2xl px-6 text-sm font-extrabold uppercase tracking-wide shadow-sm transition",
                                    selectedOption
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
                            "sticky bottom-0 w-full",
                            isCorrect
                                ? "bg-emerald-100 border-emerald-200"
                                : "bg-red-100 border-red-200",
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
                                    <span className="text-2xl font-extrabold">
                                        {isCorrect ? "✓" : "×"}
                                    </span>
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
                                            {correctOptionText || "(không có đáp án)"}
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

