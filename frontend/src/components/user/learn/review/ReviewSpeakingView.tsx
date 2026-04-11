import {useEffect, useMemo, useState} from "react";
import type {SkillTreeNodeQuestionsData} from "@/types";
import LessonTopBar from "@/components/user/learn/LessonTopBar";
import LessonExitModal from "@/components/user/learn/LessonExitModal";
import LessonAudioPlayer from "@/components/user/learn/LessonAudioPlayer";
import LessonResultFooter from "@/components/user/learn/LessonResultFooter";
import {Mic} from "lucide-react";

function splitLines(text?: string): string[] {
    const raw = String(text ?? "").replace(/\\n/g, "\n");
    return raw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
}

export default function ReviewSpeakingView({
    node,
    onLeaveLesson,
    onComplete,
}: {
    node: SkillTreeNodeQuestionsData;
    onLeaveLesson: () => void;
    onComplete: () => void;
}) {
    const q = node.questions?.[0];
    const audioUrl = q?.audioUrl ?? "";
    const lines = useMemo(
        () => splitLines((q as {correctAnswer?: string})?.correctAnswer || q?.questionText),
        [q]
    );

    const [activeMicIndex, setActiveMicIndex] = useState<number | null>(null);
    const [checked, setChecked] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [exitOpen, setExitOpen] = useState(false);

    useEffect(() => {
        setActiveMicIndex(null);
        setChecked(false);
        setIsFinished(false);
    }, [q?.mongoQuestionId]);

    useEffect(() => {
        if (isFinished) onComplete();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFinished]);

    function handleCheck() {
        setChecked(true);
    }

    function handleContinue() {
        if (!checked) return;
        setIsFinished(true);
    }

    if (isFinished) return null;

    const isCorrect = checked;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <LessonTopBar
                onClosePress={() => setExitOpen(true)}
                progressPercent={100}
                rightLabel="1/1"
            />

            <main className="flex-1 w-full">
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-28">
                    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 md:p-8">
                        <div className="max-w-2xl">
                            <p className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200 mb-3">
                                Luyện nói
                            </p>
                            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-snug">
                                Nghe mẫu và luyện đọc theo từng câu
                            </h1>
                        </div>

                        <div className="mt-6">
                            <LessonAudioPlayer src={audioUrl} trackKey={q?.mongoQuestionId}/>
                        </div>

                        <div className="mt-8 rounded-2xl border-2 border-gray-200 bg-gradient-to-b from-gray-50/80 to-white p-5 md:p-6 shadow-inner">
                            <div className="space-y-3">
                                {(lines.length ? lines : ["(Chưa có danh sách câu)"]).map((line, idx) => {
                                    const active = activeMicIndex === idx;
                                    return (
                                        <div
                                            key={`${idx}-${line.slice(0, 24)}`}
                                            className={[
                                                "flex items-center justify-between gap-4 rounded-2xl border-2 px-4 py-4 transition shadow-sm",
                                                active && !checked
                                                    ? "border-primary-500 bg-primary-100 ring-2 ring-primary-200"
                                                    : "border-gray-200 bg-white",
                                                checked ? "opacity-90" : "",
                                            ].join(" ")}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <span className="text-gray-900 font-semibold leading-snug whitespace-pre-wrap">
                                                    {line}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={checked}
                                                onClick={() => {
                                                    if (checked) return;
                                                    setActiveMicIndex((cur) => (cur === idx ? null : idx));
                                                }}
                                                className={[
                                                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition shadow-sm",
                                                    checked
                                                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        : active
                                                            ? "border-primary-500 bg-primary-500 text-white hover:bg-primary-600"
                                                            : "border-gray-200 bg-white text-primary-600 hover:border-primary-300 hover:bg-primary-50",
                                                ].join(" ")}
                                                aria-label="Bấm để luyện nói"
                                            >
                                                <Mic className="h-5 w-5" strokeWidth={2.2}/>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 text-xs text-gray-500">
                                (Review: UI demo — chấm điểm % sẽ bổ sung sau.)
                            </div>
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
                                Kiểm tra
                            </button>
                        </div>
                    </div>
                ) : (
                    <LessonResultFooter
                        variant={isCorrect ? "correct" : "incorrect"}
                        title={isCorrect ? "Tuyệt vời!" : "Chưa đúng"}
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
