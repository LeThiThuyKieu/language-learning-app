import {useMemo, useState} from "react";
import type {SkillTreeNodeQuestionsData} from "@/types";
import LessonCompleteView from "@/components/user/learn/LessonCompleteView.tsx";
import LessonTopBar from "@/components/user/learn/LessonTopBar.tsx";
import LessonExitModal from "@/components/user/learn/LessonExitModal.tsx";
import LessonResultFooter from "@/components/user/learn/LessonResultFooter.tsx";
import WordTooltip from "@/components/user/learn/question_type/vocab/WordTooltip.tsx";

/** Tách câu thành tokens: từ tiếng Anh (isWord=true) và phần còn lại */
function tokenizeQuestion(text: string): { text: string; isWord: boolean }[] {
    const tokens: { text: string; isWord: boolean }[] = [];
    // Match từ tiếng Anh (chỉ chữ cái) hoặc phần không phải từ
    const regex = /([A-Za-z]+)|([^A-Za-z]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
        if (match[1]) {
            tokens.push({ text: match[1], isWord: true });
        } else {
            tokens.push({ text: match[2], isWord: false });
        }
    }
    return tokens;
}

export default function VocabLessonView({
    node,
    onLeaveLesson,
    onComplete,
}: {
    node: SkillTreeNodeQuestionsData;
    onLeaveLesson: () => void;
    onComplete: () => void;
}) {
    const questions = node.questions ?? [];
    const total = Math.max(questions.length, 1);
    const [index, setIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [checked, setChecked] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [exitOpen, setExitOpen] = useState(false);

    const current = questions[index];

    const options = useMemo(() => current?.options ?? [], [current?.options]);
    const questionText = useMemo(() => {
        const raw = current?.questionText ?? "";
        return String(raw).replace(/\\n/g, "\n");
    }, [current?.questionText]);

    const progressPercent = ((index + 1) / total) * 100;
    const fractionLabel = `${index + 1}/${total}`;

    const correctOptionText = useMemo(() => {
        const raw = (current as {correctAnswer?: string})?.correctAnswer as string | undefined;
        const correctAnswer = (raw ?? "").trim();
        if (!correctAnswer) return "";

        const byText = options.find(
            (o) => (o ?? "").trim().toLowerCase() === correctAnswer.toLowerCase()
        );
        if (byText) return byText;

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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <LessonTopBar
                onClosePress={() => setExitOpen(true)}
                progressPercent={progressPercent}
                rightLabel={fractionLabel}
            />

            <main className="flex-1 w-full">
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-32">
                    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 md:p-10">
                        <div className="max-w-2xl">
                            <p className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200 mb-4">
                                Từ vựng mới
                            </p>
                            <h1 className="min-h-[72px] text-xl md:text-2xl font-extrabold text-gray-900 leading-snug">
                                {questionText
                                    ? tokenizeQuestion(questionText).map((token, i) =>
                                        token.isWord ? (
                                            <WordTooltip key={i} word={token.text}>
                                                <span>{token.text}</span>
                                            </WordTooltip>
                                        ) : (
                                            <span key={i}>{token.text}</span>
                                        )
                                    )
                                    : "Câu hỏi đang tải..."}
                            </h1>
                        </div>

                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 items-stretch">
                            {options.map((opt, i) => {
                                const isThirdAlone = options.length === 3 && i === 2;
                                const isSelected = selectedOption === opt;
                                const showCorrect = checked && opt === correctOptionText;
                                const showWrongSelected = checked && isSelected && !isCorrect;
                                const locked = checked;

                                return (
                                    <button
                                        key={`${opt}-${i}`}
                                        type="button"
                                        disabled={locked}
                                        onClick={() => {
                                            if (locked) return;
                                            setSelectedOption(opt);
                                        }}
                                        className={[
                                            "group relative w-full",
                                            "rounded-2xl border-2 px-5 py-6 md:py-7 shadow-sm",
                                            "transition-all duration-150",
                                            "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200",
                                            "min-h-[80px] md:min-h-[96px]",
                                            locked
                                                ? "pointer-events-none cursor-default"
                                                : "hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-md active:translate-y-0",
                                            !locked && !isSelected ? "border-gray-200 bg-white" : "",
                                            !locked && isSelected
                                                ? "border-primary-500 bg-primary-100 ring-2 ring-primary-300/80 shadow-md"
                                                : "",
                                            showCorrect ? "border-emerald-500 bg-emerald-100" : "",
                                            showWrongSelected ? "border-red-500 bg-red-100" : "",
                                            locked && !showCorrect && !showWrongSelected
                                                ? "border-gray-200 bg-gray-50 text-gray-500"
                                                : "",
                                            isThirdAlone
                                                ? "sm:col-span-2 sm:justify-self-center sm:w-[calc(50%-0.5rem)]"
                                                : "",
                                        ].join(" ")}
                                    >
                                        <span
                                            className={[
                                                "block text-base md:text-lg font-semibold text-center line-clamp-3",
                                                !locked && isSelected ? "text-primary-900" : "text-gray-800",
                                                showCorrect ? "text-emerald-900" : "",
                                                showWrongSelected ? "text-red-900" : "",
                                                locked && !showCorrect && !showWrongSelected ? "text-gray-500" : "",
                                            ].join(" ")}
                                        >
                                            {opt}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {!checked ? (
                    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur-md">
                        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-end">
                            <button
                                type="button"
                                disabled={!selectedOption}
                                onClick={handleCheck}
                                className={[
                                    "min-w-[160px] h-12 rounded-2xl px-6 text-sm font-extrabold uppercase tracking-wide shadow-sm transition",
                                    selectedOption
                                        ? "bg-primary-600 hover:bg-primary-700 text-white"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed",
                                ].join(" ")}
                            >
                                Kiểm tra
                            </button>
                        </div>
                    </div>
                ) : (
                    <LessonResultFooter
                        variant={isCorrect ? "correct" : "incorrect"}
                        title={isCorrect ? "Tuyệt vời!" : "Đáp án đúng:"}
                        detail={
                            isCorrect ? undefined : (
                                <span className="font-bold text-red-900">{correctOptionText || "(không có đáp án)"}</span>
                            )
                        }
                        onContinue={handleContinue}
                    />
                )}
            </main>

            <LessonExitModal
                open={exitOpen}
                onContinue={() => setExitOpen(false)}
                onExit={() => {
                    setExitOpen(false);
                    onLeaveLesson();
                }}
            />
        </div>
    );
}
