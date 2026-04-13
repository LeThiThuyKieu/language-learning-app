import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Lightbulb, Loader2, Mic} from "lucide-react";
import toast from "react-hot-toast";
import LessonAudioPlayer from "@/components/user/learn/LessonAudioPlayer.tsx";
import LessonExitModal from "@/components/user/learn/LessonExitModal.tsx";
import PlacementHeader, {
    type PlacementSkillBar,
} from "@/components/user/learn/placement/PlacementHeader.tsx";
import PlacementMatchingLock from "@/components/user/learn/placement/PlacementMatchingLock.tsx";
import {PLACEMENT_SECTION_COUNTS} from "@/pages/User/learn/placement/placementTypes.ts";
import {mapPlacementResultToPayload} from "@/pages/User/learn/placement/placementResultMapper.ts";
import type {PlacementLevelBand, PlacementStep} from "@/pages/User/learn/placement/placementTypes.ts";
import {scoreSpeakingStep} from "@/pages/User/learn/placement/placementScoring.ts";
import {profileService} from "@/services/profileService.ts";
import {
    placementTestService,
    type PlacementListeningData,
    type PlacementMatchingData,
    type PlacementSpeakingData,
    type PlacementVocabItem,
} from "@/services/placementTestService.ts";
import {cn} from "@/utils/cn.ts";

const VOCAB_PER_LEVEL = 5;

type SpeechRecognitionLike = {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
    onerror: ((event: { error?: string }) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function resolveMediaUrl(url: string | null | undefined): string {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
    const origin = base.replace(/\/api\/?$/, "");
    return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

type LevelBundle = {
    vocab: PlacementVocabItem[];
    matching: PlacementMatchingData;
    listening: PlacementListeningData;
    speaking: PlacementSpeakingData;
};

type SessionStep =
    | { kind: "vocab"; vocabIndex: number }
    | { kind: "listening" }
    | { kind: "speaking" }
    | { kind: "matching" };

function buildSessionSteps(): SessionStep[] {
    const v = Array.from({length: VOCAB_PER_LEVEL}, (_, vocabIndex) => ({
        kind: "vocab" as const,
        vocabIndex,
    }));
    return [...v, {kind: "listening" as const}, {kind: "speaking" as const}, {kind: "matching" as const}];
}

const STEPS = buildSessionSteps();

function ListeningFill({textWithBlanks,}: {
    textWithBlanks: string;
}) {
    const normalized = String(textWithBlanks ?? "").replace(/\\n/g, "\n");
    return (
        <p className="whitespace-pre-wrap text-base font-semibold leading-relaxed text-gray-900 md:text-lg">
            {normalized}
        </p>
    );
}

function ListeningInputsGrid({
                                 blankCount,
                                 values,
                                 onChange,
                             }: {
    blankCount: number;
    values: string[];
    onChange: (i: number, v: string) => void;
}) {
    return (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {Array.from({length: blankCount}, (_, i) => (
                <div
                    key={i}
                    className="rounded-2xl border-2 border-gray-200 bg-white px-4 py-4 shadow-sm transition focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-200/80"
                >
                    <input
                        type="text"
                        value={values[i] ?? ""}
                        onChange={(e) => onChange(i, e.target.value)}
                        placeholder={`Nhập đáp án (${i + 1})...`}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-primary-500"
                    />
                </div>
            ))}
        </div>
    );
}

export default function PlacementTestSessionPage() {
    const navigate = useNavigate();

    const [phase, setPhase] = useState<"boot" | "loading" | "ready" | "submitting" | "error">("boot");
    const [testId, setTestId] = useState<number | null>(null);
    const [currentLevel, setCurrentLevel] = useState<PlacementLevelBand>(1);
    const [bundle, setBundle] = useState<LevelBundle | null>(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [vocabAnswers, setVocabAnswers] = useState<{ questionId: number; selectedOptionIndex: number }[]>(
        []
    );
    const [listeningBuffer, setListeningBuffer] = useState<string[] | null>(null);
    const [speakingBuffer, setSpeakingBuffer] = useState<string[] | null>(null);
    const [exitOpen, setExitOpen] = useState(false);
    const [hintOpen, setHintOpen] = useState(false);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [userName, setUserName] = useState("Bạn");
    const [matchingLockedCount, setMatchingLockedCount] = useState(0);

    const step = STEPS[stepIndex];

    const loadLevel = useCallback(async (tid: number, level: PlacementLevelBand) => {
        setPhase("loading");
        setBundle(null);
        setVocabAnswers([]);
        setListeningBuffer(null);
        setSpeakingBuffer(null);
        setStepIndex(0);
        setMatchingLockedCount(0);
        setWrongAttempts(0);
        try {
            // Fetch tuần tự để tránh race-condition ghi đè issued_json ở backend.
            const vocab = await placementTestService.getVocab(tid, level);
            const matching = await placementTestService.getMatching(tid, level);
            const listening = await placementTestService.getListening(tid, level);
            const speaking = await placementTestService.getSpeaking(tid, level);
            if (vocab.length < VOCAB_PER_LEVEL) {
                throw new Error("Không đủ câu vocab");
            }
            const blankN = Math.max(1, listening.blankCount || 0);
            setListeningBuffer(Array.from({length: blankN}, () => ""));
            setSpeakingBuffer(Array.from({length: speaking.lines.length}, () => ""));
            setBundle({vocab, matching, listening, speaking});
            setPhase("ready");
        } catch (e: unknown) {
            console.error(e);
            toast.error("Không tải được bài test. Thử lại sau.");
            setPhase("error");
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const {testId: tid} = await placementTestService.start();
                if (cancelled) return;
                setTestId(tid);
                await loadLevel(tid, 1);
            } catch (e: unknown) {
                console.error(e);
                toast.error("Không mở được phiên test. Bạn đã đăng nhập chưa?");
                setPhase("error");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [loadLevel]);

    useEffect(() => {
        let cancelled = false;
        profileService
            .getMyProfile()
            .then((p) => {
                if (!cancelled && p.fullName?.trim()) {
                    const first = p.fullName.trim().split(/\s+/)[0];
                    setUserName(first);
                }
            })
            .catch(() => {
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const bumpWrong = useCallback(() => {
        setWrongAttempts((n) => n + 1);
    }, []);

    const handleAfterLevelSubmit = useCallback(
        async (lvl: PlacementLevelBand, submitRes: { status: string; message?: string }) => {
            if (!testId) return;
            if (submitRes.message) toast.success(submitRes.message);
            if (submitRes.status === "continue" && lvl < 3) {
                const next = (lvl + 1) as PlacementLevelBand;
                setCurrentLevel(next);
                await loadLevel(testId, next);
                return;
            }
            if (submitRes.status === "finished" || submitRes.status === "completed") {
                setPhase("submitting");
                try {
                    const result = await placementTestService.getResult(testId);
                    const payload = mapPlacementResultToPayload(userName, result);
                    navigate("/placement-test/results", {state: {placementResult: payload}});
                } catch (e: unknown) {
                    console.error(e);
                    toast.error("Không lấy được kết quả.");
                    setPhase("ready");
                }
                return;
            }
        },
        [loadLevel, navigate, testId, userName]
    );

    // Xử lý khi nộp bài của matching
    const submitCurrentLevel = useCallback(async (matchingPairs: { leftCardId: string; rightCardId: string }[]) => {
            if (!testId || !bundle || !listeningBuffer || !speakingBuffer) return;
            setPhase("submitting");
            try {
                const speakingLines = bundle.speaking.lines;
                const speakingAnswers = speakingLines.map((line, i) => ({
                    questionId: line.questionId,
                    lineIndex: line.lineIndex,
                    typedText: speakingBuffer[i] ?? "",
                }));
                const res = await placementTestService.submitSection({
                    testId,
                    level: currentLevel,
                    vocabAnswers,
                    matchingAnswers: matchingPairs,
                    listeningAnswers: [
                        {
                            questionId: bundle.listening.questionId,
                            gapAnswers: listeningBuffer,
                        },
                    ],
                    speakingAnswers,
                });
                await handleAfterLevelSubmit(currentLevel, res);
            } catch (e: unknown) {
                console.error(e);
                const err = e as {
                    response?: { data?: { message?: string; data?: { message?: string } } };
                    message?: string;
                };
                const detail =
                    err.response?.data?.data?.message ||
                    err.response?.data?.message ||
                    err.message ||
                    "Nộp bài thất bại.";
                toast.error(detail);
                setPhase("ready");
            }
        },
        [bundle, currentLevel, handleAfterLevelSubmit, listeningBuffer, speakingBuffer, testId, vocabAnswers]
    );

    // 4 skill bar ở trên header của placement test session
    const skillBars = useMemo((): [
        PlacementSkillBar,
        PlacementSkillBar,
        PlacementSkillBar,
        PlacementSkillBar,
    ] => {
        const C = PLACEMENT_SECTION_COUNTS;
        const emptyBars = (): [PlacementSkillBar, PlacementSkillBar, PlacementSkillBar, PlacementSkillBar] => [
            {ratioLabel: `0/${C.vocab}`, complete: false, fillRatio: 0},
            {ratioLabel: `0/${C.listening}`, complete: false, fillRatio: 0},
            {ratioLabel: `0/${C.speaking}`, complete: false, fillRatio: 0},
            {ratioLabel: `0/${C.matchingPairs}`, complete: false, fillRatio: 0},
        ];
        if (!step || phase !== "ready" || !bundle) {
            return emptyBars();
        }

        const vocabDoneThisLevel = stepIndex < 5 ? vocabAnswers.length : VOCAB_PER_LEVEL;
        const effV = Math.min(C.vocab, (currentLevel - 1) * VOCAB_PER_LEVEL + vocabDoneThisLevel);
        const listenGlobal = (currentLevel - 1) + (stepIndex >= 6 ? 1 : 0);
        const speakGlobal = (currentLevel - 1) + (stepIndex >= 7 ? 1 : 0);
        const matchPairs =
            (currentLevel - 1) * VOCAB_PER_LEVEL + (stepIndex === 7 ? matchingLockedCount : 0);

        const vocabDone = effV >= C.vocab;
        const listenDone = listenGlobal >= C.listening;
        const speakDone = speakGlobal >= C.speaking;
        const matchDone = matchPairs >= C.matchingPairs;

        const ratioV = vocabDone ? 1 : effV / C.vocab;
        const ratioL = listenDone ? 1 : listenGlobal / C.listening;
        const ratioS = speakDone ? 1 : speakGlobal / C.speaking;
        const ratioM = matchDone ? 1 : matchPairs / C.matchingPairs;

        return [
            {ratioLabel: `${effV}/${C.vocab}`, complete: vocabDone, fillRatio: ratioV},
            {ratioLabel: `${listenGlobal}/${C.listening}`, complete: listenDone, fillRatio: ratioL},
            {ratioLabel: `${speakGlobal}/${C.speaking}`, complete: speakDone, fillRatio: ratioS},
            {ratioLabel: `${matchPairs}/${C.matchingPairs}`, complete: matchDone, fillRatio: ratioM},
        ];
    }, [
        bundle,
        currentLevel,
        matchingLockedCount,
        phase,
        step,
        stepIndex,
        vocabAnswers.length,
    ]);

    const hintStep = useMemo((): PlacementStep | null => {
        if (!bundle || !step || phase !== "ready") return null;
        if (step.kind === "vocab") {
            const item = bundle.vocab[step.vocabIndex];
            return {
                kind: "vocab",
                id: `v-${item.questionId}`,
                level: currentLevel,
                questionId: item.questionId,
                prompt: item.questionText,
                options: item.options,
            };
        }
        if (step.kind === "listening") {
            return {
                kind: "listening",
                id: `l-${bundle.listening.questionId}`,
                level: currentLevel,
                questionId: bundle.listening.questionId,
                title: "Nghe và điền",
                audioUrl: resolveMediaUrl(bundle.listening.audioUrl),
                textWithBlanks: bundle.listening.textWithBlanks,
            };
        }
        if (step.kind === "speaking") {
            return {
                kind: "speaking",
                id: `s-${currentLevel}`,
                level: currentLevel,
                instruction: "Bấm mic để đọc từng dòng (bài kiểm tra không gợi ý đáp án).",
                lines: bundle.speaking.lines.map((l) => ({
                    questionId: l.questionId,
                    lineIndex: l.lineIndex,
                    text: l.line,
                })),
            };
        }
        return null;
    }, [bundle, currentLevel, phase, step]);

    // Xử lý thoát
    const handleExit = () => {
        navigate("/placement-test");
    };

    // Xử lý lỗi ko tải được placement test
    if (phase === "error") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f1f3] px-4">
                <p className="text-center text-gray-700">Không tải được placement test.</p>
                <button
                    type="button"
                    className="mt-4 rounded-full bg-primary-600 px-6 py-2 text-sm font-bold text-white"
                    onClick={() => navigate("/placement-test")}
                >
                    Quay lại
                </button>
            </div>
        );
    }

    // Sẵn sàng chuẩn bị làm test
    if (phase === "boot" || phase === "loading" || !bundle || !step || !listeningBuffer || !speakingBuffer) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f1f3]">
                <Loader2 className="h-10 w-10 animate-spin text-primary-600"/>
                <p className="mt-4 text-sm text-gray-600">Đang chuẩn bị bài test…</p>
            </div>
        );
    }

    const vocabItem = step.kind === "vocab" ? bundle.vocab[step.vocabIndex] : null;
    const stepKey = `${currentLevel}-${stepIndex}-${step.kind === "vocab" ? step.vocabIndex : ""}`;

    const attempts = wrongAttempts;
    const hintEnabled = step.kind !== "matching" && attempts >= 2;

    return (
        <div className="flex min-h-screen flex-col bg-[#f0f1f3] font-sans text-gray-900">
            {/* Header */}
            <PlacementHeader
                currentLevel={currentLevel}
                bars={skillBars}
                onClosePress={() => setExitOpen(true)}
            />

            <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-36 pt-6 md:px-8 md:pb-40 md:pt-8">
                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-10">
                    {/* Nộp bài */}
                    {phase === "submitting" && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="h-10 w-10 animate-spin text-primary-600"/>
                            <p className="mt-3 text-sm text-gray-600">Đang nộp bài…</p>
                        </div>
                    )}
                    {/* Đang làm vocab*/}
                    {phase === "ready" && step.kind === "vocab" && vocabItem && (
                        <VocabStep
                            key={stepKey}
                            prompt={vocabItem.questionText}
                            options={vocabItem.options}
                            onSubmit={(selectedOptionIndex) => {
                                setVocabAnswers((prev) => [...prev, {
                                    questionId: vocabItem.questionId,
                                    selectedOptionIndex
                                }]);
                                setWrongAttempts(0);
                                if (step.vocabIndex >= VOCAB_PER_LEVEL - 1) {
                                    setStepIndex(5);
                                } else {
                                    setStepIndex((i) => i + 1);
                                }
                            }}
                        />
                    )}

                    {/* Đang làm lisstening */}
                    {phase === "ready" && step.kind === "listening" && (
                        <ListeningStep
                            key={`${currentLevel}-listen`}
                            title="Nghe và điền"
                            audioUrl={resolveMediaUrl(bundle.listening.audioUrl)}
                            textWithBlanks={bundle.listening.textWithBlanks}
                            values={listeningBuffer}
                            onChange={(i, v) => {
                                setListeningBuffer((prev) => {
                                    if (!prev) return prev;
                                    const next = [...prev];
                                    next[i] = v;
                                    return next;
                                });
                            }}
                            onSubmit={(ok) => {
                                if (!ok) bumpWrong();
                                setWrongAttempts(0);
                                setStepIndex(6);
                            }}
                        />
                    )}

                    {/* Đang làm speaking */}
                    {phase === "ready" && step.kind === "speaking" && (
                        <SpeakingStep
                            key={`${currentLevel}-speak`}
                            instruction="Nghe mẫu và luyện đọc theo từng câu"
                            audioUrl={resolveMediaUrl(bundle.speaking.audioUrl)}
                            lines={bundle.speaking.lines.map((l) => ({
                                questionId: l.questionId,
                                lineIndex: l.lineIndex,
                                text: l.line,
                            }))}
                            values={speakingBuffer}
                            onChange={(i, v) => {
                                setSpeakingBuffer((prev) => {
                                    if (!prev) return prev;
                                    const next = [...prev];
                                    next[i] = v;
                                    return next;
                                });
                            }}
                            onSubmit={(_pts, isWeak) => {
                                if (isWeak) bumpWrong();
                                setWrongAttempts(0);
                                setStepIndex(7);
                            }}
                        />
                    )}

                    {/* Đang làm matching */}
                    {phase === "ready" && step.kind === "matching" && (
                        <div key={`${currentLevel}-match`}>
                            <p className="mb-6 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
                                Matching
                            </p>
                            <h2 className="text-xl font-extrabold text-[#0a192f] md:text-2xl">Ghép nối từ và nghĩa</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 md:text-base">
                                Chọn một ô bên trái, sau đó chọn một ô bên phải để ghép cặp — đã ghép sẽ không đổi được.
                            </p>
                            <div className="mt-6">
                                <PlacementMatchingLock
                                    leftColumn={bundle.matching.leftColumn.map((c) => ({id: c.cardId, text: c.text}))}
                                    rightColumn={bundle.matching.rightColumn.map((c) => ({id: c.cardId, text: c.text}))}
                                    shuffleRight={false}
                                    onLockedPairsChange={setMatchingLockedCount}
                                    onSubmitPairs={(pairs) => {
                                        void submitCurrentLevel(pairs);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {phase === "ready" && step.kind !== "matching" && (
                <footer
                    className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-[#f7f7f8]/95 backdrop-blur-md">
                    <div className="relative mx-auto flex max-w-4xl items-end justify-center px-4 py-4 md:px-8">
                        <StepFooterActions hintEnabled={hintEnabled} onHint={() => setHintOpen(true)}/>
                    </div>
                </footer>
            )}

            <LessonExitModal
                open={exitOpen}
                onContinue={() => setExitOpen(false)}
                onExit={handleExit}
                continueButtonText="Tiếp tục Test"
            />

            {hintOpen && hintStep && hintStep.kind !== "matching" && (
                <HintOverlay step={hintStep} onClose={() => setHintOpen(false)}/>
            )}
        </div>
    );
}

// Vocab
function VocabStep({
                       prompt,
                       options,
                       onSubmit,
                   }: {
    prompt: string;
    options: string[];
    onSubmit: (selectedOptionIndex: number) => void;
}) {
    const [sel, setSel] = useState<number | null>(null);

    const canSubmit = sel != null;
    const handleNop = () => {
        if (sel == null) return;
        onSubmit(sel);
    };

    return (
        <>
            <p className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
                Từ vựng
            </p>
            <h2 className="text-xl font-extrabold text-[#0a192f] md:text-2xl">{prompt}</h2>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-3">
                {options.map((opt, i) => {
                    const active = sel === i;
                    const lastAloneInTwoCol = options.length % 2 === 1 && i === options.length - 1;
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setSel(i)}
                            className={cn(
                                "w-full rounded-2xl border-2 px-5 py-5 text-left text-sm font-semibold shadow-sm transition md:py-6 md:text-base",
                                lastAloneInTwoCol && "sm:col-span-2 sm:justify-self-center sm:w-[calc(50%-0.5rem)]",
                                active
                                    ? "border-primary-500 bg-primary-100 ring-2 ring-primary-200"
                                    : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-md"
                            )}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
            <div className="mt-10 flex justify-center">
                <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={handleNop}
                    className={cn(
                        "min-w-[200px] rounded-full px-10 py-3 text-sm font-bold shadow-md md:text-base",
                        canSubmit ? "bg-[#F9CF15] text-gray-900 hover:brightness-95" : "cursor-not-allowed bg-gray-300 text-gray-500"
                    )}
                >
                    Nộp bài
                </button>
            </div>
        </>
    );
}

// Listening
function ListeningStep({
                           title,
                           audioUrl,
                           textWithBlanks,
                           values,
                           onChange,
                           onSubmit,
                       }: {
    title: string;
    audioUrl: string;
    textWithBlanks: string;
    values: string[];
    onChange: (i: number, v: string) => void;
    onSubmit: (ok: boolean) => void;
}) {
    const normalized = useMemo(() => String(textWithBlanks ?? "").replace(/\\n/g, "\n"), [textWithBlanks]);
    const n = values.length;
    const filled = n === 0 || values.slice(0, n).every((v) => v.trim().length > 0);
    const handleNop = () => {
        onSubmit(true);
    };

    return (
        <>
            <p className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
                Nghe hiểu
            </p>
            <h2 className="text-xl font-extrabold text-[#0a192f] md:text-2xl">{title}</h2>
            <div className="mt-6">
                <LessonAudioPlayer src={audioUrl} trackKey={normalized.slice(0, 40)}/>
            </div>
            <div className="mt-8 rounded-2xl border-2 border-gray-100 bg-gray-50/80 p-5 md:p-6">
                <ListeningFill textWithBlanks={normalized}/>
                <ListeningInputsGrid blankCount={n} values={values} onChange={onChange}/>
            </div>
            <div className="mt-10 flex justify-center">
                <button
                    type="button"
                    disabled={!filled}
                    onClick={handleNop}
                    className={cn(
                        "min-w-[200px] rounded-full px-10 py-3 text-sm font-bold shadow-md md:text-base",
                        filled ? "bg-[#F9CF15] text-gray-900 hover:brightness-95" : "cursor-not-allowed bg-gray-300 text-gray-500"
                    )}
                >
                    Nộp bài
                </button>
            </div>
        </>
    );
}

// Speaking
function SpeakingStep({
                          instruction,
                          audioUrl,
                          lines,
                          values,
                          onChange,
                          onSubmit,
                      }: {
    instruction: string;
    audioUrl: string;
    lines: { questionId: number; lineIndex: number; text: string }[];
    values: string[];
    onChange: (i: number, v: string) => void;
    onSubmit: (points: number, isWeak: boolean) => void;
}) {
    const filled = values.every((v) => v.trim().length > 0);
    const handleNop = () => {
        const ratio = scoreSpeakingStep(
            lines.map((l) => l.text),
            values
        );
        const isWeak = ratio < 0.45;
        onSubmit(ratio, isWeak);
    };

    const [activeMicIndex, setActiveMicIndex] = useState<number | null>(null);
    const [micError, setMicError] = useState<string | null>(null);
    const recRef = useRef<SpeechRecognitionLike | null>(null);

    const stopMic = useCallback(() => {
        try {
            recRef.current?.stop?.();
        } catch {
            // ignore
        }
        recRef.current = null;
        setActiveMicIndex(null);
    }, []);

    useEffect(() => {
        return () => {
            stopMic();
        };
    }, [stopMic]);

    const startMicFor = useCallback(
        (idx: number) => {
            const w = window as Window & {
                SpeechRecognition?: SpeechRecognitionCtor;
                webkitSpeechRecognition?: SpeechRecognitionCtor;
            };
            const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
            if (!SR) {
                setMicError("Trình duyệt chưa hỗ trợ SpeechRecognition. Bạn có thể gõ tay để nộp bài.");
                toast.error("Trình duyệt chưa hỗ trợ micro (SpeechRecognition).");
                return;
            }
            setMicError(null);
            stopMic();
            const rec = new SR();
            rec.lang = "en-US";
            rec.interimResults = false;
            rec.maxAlternatives = 1;
            rec.onresult = (e) => {
                const t = e?.results?.[0]?.[0]?.transcript ?? "";
                onChange(idx, String(t));
            };
            rec.onerror = (e) => {
                const msg = e?.error ? String(e.error) : "micro_error";
                setMicError(`Không dùng được mic: ${msg}`);
            };
            rec.onend = () => {
                recRef.current = null;
                setActiveMicIndex(null);
            };
            recRef.current = rec;
            setActiveMicIndex(idx);
            try {
                rec.start();
            } catch {
                setMicError("Không thể bật mic. Hãy kiểm tra quyền truy cập micro.");
            }
        },
        [onChange, stopMic]
    );

    return (
        <>
            <p className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
                Nói / Đọc
            </p>
            <h2 className="text-xl font-extrabold text-[#0a192f] md:text-2xl">{instruction}</h2>
            <div className="mt-6">
                <LessonAudioPlayer src={audioUrl} trackKey={`${instruction}-${lines[0]?.questionId ?? "speak"}`}/>
            </div>
            {micError && <p className="mt-3 text-sm font-semibold text-amber-700">{micError}</p>}
            <div
                className="mt-8 rounded-2xl border-2 border-gray-200 bg-gradient-to-b from-gray-50/80 to-white p-5 md:p-6 shadow-inner">
                <p className="mb-4 text-sm font-semibold text-gray-600">
                    Bấm mic ở mỗi câu để đọc. Hệ thống sẽ ghi lại transcript để chấm điểm (bạn vẫn có thể chỉnh sửa bằng
                    tay).
                </p>
                <div className="space-y-3">
                    {lines.map((line, i) => {
                        const active = activeMicIndex === i;
                        const lineText = String(line.text ?? "").replace(/\\n/g, "\n");
                        return (
                            <div
                                key={`${line.questionId}-${line.lineIndex}`}
                                className={cn(
                                    "rounded-2xl border-2 px-4 py-4 shadow-sm transition",
                                    active ? "border-primary-500 bg-primary-100 ring-2 ring-primary-200" : "border-gray-200 bg-white"
                                )}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <span
                                            className="text-gray-900 font-semibold leading-snug whitespace-pre-wrap">{lineText}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (active) stopMic();
                                            else startMicFor(i);
                                        }}
                                        className={cn(
                                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition shadow-sm",
                                            active
                                                ? "border-primary-500 bg-primary-500 text-white hover:bg-primary-600"
                                                : "border-gray-200 bg-white text-primary-600 hover:border-primary-300 hover:bg-primary-50"
                                        )}
                                        aria-label="Bấm để đọc"
                                        title={active ? "Dừng" : "Bấm để đọc"}
                                    >
                                        <Mic className="h-5 w-5" strokeWidth={2.2}/>
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={values[i] ?? ""}
                                    onChange={(e) => onChange(i, e.target.value)}
                                    placeholder="Transcript sẽ hiện ở đây..."
                                    className="mt-3 w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-primary-500"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="mt-10 flex justify-center">
                <button
                    type="button"
                    disabled={!filled}
                    onClick={handleNop}
                    className={cn(
                        "min-w-[200px] rounded-full px-10 py-3 text-sm font-bold shadow-md md:text-base",
                        filled ? "bg-[#F9CF15] text-gray-900 hover:brightness-95" : "cursor-not-allowed bg-gray-300 text-gray-500"
                    )}
                >
                    Nộp bài
                </button>
            </div>
        </>
    );
}

// matching ở trên component /user/learn/placement/PlacementMatchingLock.tsx

// Hint
function StepFooterActions({
                               hintEnabled,
                               onHint,
                           }: {
    hintEnabled: boolean;
    onHint: () => void;
}) {
    return (
        <div className="relative w-full max-w-xl">
            <div className="flex justify-center">
                <span className="text-xs text-transparent md:text-sm">.</span>
            </div>
            <button
                type="button"
                disabled={!hintEnabled}
                onClick={onHint}
                title={hintEnabled ? "Xem gợi ý" : "Gợi ý sau vài lần chưa đúng"}
                className={cn(
                    "absolute -right-1 bottom-0 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition md:right-2",
                    hintEnabled
                        ? "text-amber-600 hover:bg-amber-50"
                        : "cursor-not-allowed text-gray-300 opacity-70"
                )}
            >
                <Lightbulb className="h-5 w-5" strokeWidth={2.2}/>
            </button>
        </div>
    );
}

function HintOverlay({
                         step,
                         onClose,
                     }: {
    step: Exclude<PlacementStep, { kind: "matching" }>;
    onClose: () => void;
}) {
    let body = "";
    if (step.kind === "vocab") {
        body =
            step.correctIndex != null
                ? `Gợi ý: đáp án đúng là "${step.options[step.correctIndex]}".`
                : "Bài kiểm tra trực tuyến không hiển thị đáp án gợi ý.";
    } else if (step.kind === "listening") {
        body = step.blankAnswers?.length
            ? `Gợi ý: ${step.blankAnswers.map((a, i) => `Từ ${i + 1}: "${a}"`).join(" · ")}`
            : "Nghe kỹ và điền từ phù hợp vào từng chỗ trống.";
    } else {
        body = `Gợi ý: ${step.lines.map((l, i) => `Dòng ${i + 1}: "${l.text}"`).join(" ")}`;
    }

    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-black/45" aria-label="Đóng" onClick={onClose}/>
            <div className="relative max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                <p className="text-sm font-extrabold text-[#0a192f]">Gợi ý</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{body}</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 w-full rounded-2xl bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700"
                >
                    Đã hiểu
                </button>
            </div>
        </div>
    );
}
