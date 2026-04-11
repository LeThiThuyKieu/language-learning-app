import {useEffect, useMemo, useState} from "react";
import type {SkillTreeNodeQuestionsData} from "@/types";
import LessonTopBar from "@/components/user/learn/LessonTopBar";
import LessonExitModal from "@/components/user/learn/LessonExitModal";
import LessonAudioPlayer from "@/components/user/learn/LessonAudioPlayer";
import LessonResultFooter from "@/components/user/learn/LessonResultFooter";

function parseExpectedTokens(correctAnswer?: string): string[] {
    const raw = (correctAnswer ?? "").trim();
    if (!raw) return [];
    const parts = raw.split("|").map((p) => p.trim()).filter(Boolean);
    const numbered = parts
        .map((p) => {
            const m = p.match(/^(\d+)\s*:\s*(.+)$/);
            if (!m) return null;
            return {i: Number(m[1]), v: (m[2] ?? "").trim()};
        })
        .filter((x): x is { i: number; v: string } => Boolean(x && x.v));

    if (numbered.length > 0) return numbered.sort((a, b) => a.i - b.i).map((x) => x.v);
    return [raw];
}

function tokenMatches(input: string, expectedToken: string): boolean {
    return input.trim().toLowerCase() === expectedToken.trim().toLowerCase();
}

export default function ReviewListeningView({
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
    const expected = useMemo(() => parseExpectedTokens(q?.correctAnswer), [q?.correctAnswer]);
    const questionText = useMemo(() => String(q?.questionText ?? "").replace(/\\n/g, "\n"), [q?.questionText]);

    const [inputs, setInputs] = useState<string[]>(() => expected.map(() => ""));
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [checked, setChecked] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [exitOpen, setExitOpen] = useState(false);

    useEffect(() => {
        setInputs(expected.map(() => ""));
        setChecked(false);
        setSelectedIndex(null);
        setIsFinished(false);
    }, [expected]);

    useEffect(() => {
        if (isFinished) onComplete();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFinished]);

    function handleCheck() {
        if (expected.length === 0) return;
        setChecked(true);
    }

    const isCorrect = useMemo(() => {
        if (!checked) return false;
        if (expected.length === 0) return false;
        return expected.every((exp, i) => tokenMatches(inputs[i] ?? "", exp));
    }, [checked, expected, inputs]);

    function handleContinue() {
        if (!checked) return;
        setIsFinished(true);
    }

    if (isFinished) return null;

    const answerListDetail =
        expected.length > 0 ? (
            <ol className="mt-1 list-decimal space-y-1.5 pl-5 font-semibold text-red-900/95">
                {expected.map((v, i) => (
                    <li key={i} className="pl-1 marker:font-extrabold">
                        {v}
                    </li>
                ))}
            </ol>
        ) : (
            <span className="font-semibold">(không có đáp án)</span>
        );

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
                                Nghe &amp; điền từ
                            </p>
                            <h1 className="min-h-[56px] text-xl md:text-2xl font-extrabold text-gray-900 leading-snug">
                                Hoàn thành đoạn hội thoại
                            </h1>
                        </div>

                        <div className="mt-6">
                            <LessonAudioPlayer src={audioUrl} trackKey={q?.mongoQuestionId}/>
                        </div>

                        <div className="mt-8 rounded-2xl border-2 border-gray-200 bg-gray-50/50 p-5 md:p-6">
                            {q?.questionText ? (
                                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base md:text-[17px]">
                                    {questionText}
                                </p>
                            ) : (
                                <p className="text-gray-600">Điền từ còn thiếu theo đoạn nghe.</p>
                            )}

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {expected.map((exp, i) => {
                                    const isSelected = selectedIndex === i;
                                    const slotOk = checked && tokenMatches(inputs[i] ?? "", exp);
                                    const slotBad = checked && !slotOk;
                                    const locked = checked;
                                    const frameClass = slotOk
                                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200/80"
                                        : slotBad
                                            ? "border-red-500 bg-red-50 ring-2 ring-red-200/80"
                                            : !locked && isSelected
                                                ? "border-primary-500 bg-primary-100 ring-2 ring-primary-200"
                                                : "border-gray-200 bg-white";
                                    return (
                                        <div
                                            key={i}
                                            className={[
                                                "rounded-2xl border-2 px-4 py-4 transition",
                                                locked ? "pointer-events-none" : "",
                                                frameClass,
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
                                                className={[
                                                    "w-full rounded-xl border px-3 py-2 text-gray-900 outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-default",
                                                    checked && slotOk
                                                        ? "border-emerald-400 bg-emerald-50/80 text-emerald-950"
                                                        : checked && slotBad
                                                            ? "border-red-400 bg-red-50/80 text-red-950"
                                                            : "border-gray-200 bg-white focus:ring-primary-200 disabled:bg-gray-50",
                                                ].join(" ")}
                                                placeholder="Nhập từ..."
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

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
                                Kiểm tra
                            </button>
                        </div>
                    </div>
                ) : (
                    <LessonResultFooter
                        variant={isCorrect ? "correct" : "incorrect"}
                        title={isCorrect ? "Tuyệt vời!" : "Đáp án đúng:"}
                        detail={isCorrect ? undefined : answerListDetail}
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
