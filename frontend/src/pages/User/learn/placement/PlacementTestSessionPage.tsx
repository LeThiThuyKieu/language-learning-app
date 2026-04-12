import {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Lightbulb} from "lucide-react";
import toast from "react-hot-toast";
import LessonAudioPlayer from "@/components/user/learn/LessonAudioPlayer.tsx";
import LessonExitModal from "@/components/user/learn/LessonExitModal.tsx";
import PlacementHeader, {
  type PlacementSkillBar,
} from "@/components/user/learn/placement/PlacementHeader.tsx";
import PlacementMatchingLock from "@/components/user/learn/placement/PlacementMatchingLock.tsx";
import {buildPlacementSteps, PLACEMENT_SECTION_COUNTS} from "@/pages/User/learn/placement/buildPlacementSteps.ts";
import type {PlacementStep} from "@/pages/User/learn/placement/placementTypes.ts";
import {
  buildResultFromSession,
  emptySkillScores,
  isListeningBlankCorrect,
  scoreListeningBlanks,
  scoreMatchingPairs,
  scoreSpeakingStep,
  scoreVocab,
} from "@/pages/User/learn/placement/placementScoring.ts";
import {profileService} from "@/services/profileService.ts";
import {cn} from "@/utils/cn.ts";

function ListeningFill({
  step,
  values,
  onChange,
}: {
  step: Extract<PlacementStep, {kind: "listening"}>;
  values: string[];
  onChange: (i: number, v: string) => void;
}) {
  const parts = step.textWithBlanks.split("___");
  const n = Math.max(0, parts.length - 1);
  return (
    <div className="text-base font-semibold leading-relaxed text-gray-900 md:text-lg">
      {parts.map((part, i) => (
        <span key={i} className="inline leading-relaxed">
          <span className="whitespace-pre-wrap">{part}</span>
          {i < n && (
            <span className="mx-1 inline-flex flex-col align-middle">
              <span className="text-[10px] font-bold uppercase tracking-wide text-primary-600">
                Từ {i + 1}
              </span>
              <input
                type="text"
                value={values[i] ?? ""}
                onChange={(e) => onChange(i, e.target.value)}
                placeholder="Nhập từ..."
                className="mt-0.5 min-w-[140px] rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-inner outline-none focus:border-primary-500 md:min-w-[180px]"
              />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export default function PlacementTestSessionPage() {
  const navigate = useNavigate();
  const steps = useMemo(() => buildPlacementSteps(), []);
  const total = steps.length;

  const [index, setIndex] = useState(0);
  const [, setSkillScores] = useState(emptySkillScores);
  const [exitOpen, setExitOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState<Record<string, number>>({});
  const [userName, setUserName] = useState("Bạn");
  /** Số cặp đã ghép trong khối Matching hiện tại (0–5) */
  const [matchingLockedCount, setMatchingLockedCount] = useState(0);

  const step = steps[index];

  useEffect(() => {
    setMatchingLockedCount(0);
  }, [step?.id]);

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
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const bumpWrong = useCallback((id: string) => {
    setWrongAttempts((prev) => ({...prev, [id]: (prev[id] ?? 0) + 1}));
  }, []);

  const advanceOrFinish = useCallback(
    (nextScores: ReturnType<typeof emptySkillScores>) => {
      if (index >= total - 1) {
        const result = buildResultFromSession(userName, nextScores);
        navigate("/placement-test/results", {state: {placementResult: result}});
      } else {
        setIndex((i) => i + 1);
      }
    },
    [index, navigate, total, userName]
  );

  const handleExit = () => {
    navigate("/placement-test");
  };

  const skillBars = useMemo(() => {
    const C = PLACEMENT_SECTION_COUNTS;
    const emptyBars = (): [PlacementSkillBar, PlacementSkillBar, PlacementSkillBar, PlacementSkillBar] => [
      {ratioLabel: `0/${C.vocab}`, complete: false, fillRatio: 0},
      {ratioLabel: `0/${C.listening}`, complete: false, fillRatio: 0},
      {ratioLabel: `0/${C.speaking}`, complete: false, fillRatio: 0},
      {ratioLabel: `0/${C.matchingPairs}`, complete: false, fillRatio: 0},
    ];
    if (!step) {
      return emptyBars();
    }
    const completedBefore = steps.slice(0, index);
    const vf = completedBefore.filter((s) => s.kind === "vocab").length;
    const lf = completedBefore.filter((s) => s.kind === "listening").length;
    const sf = completedBefore.filter((s) => s.kind === "speaking").length;
    const matchBlocksDone = completedBefore.filter((s) => s.kind === "matching").length;
    const partialPairs = step.kind === "matching" ? matchingLockedCount : 0;
    const matchPairs = Math.min(C.matchingPairs, matchBlocksDone * 5 + partialPairs);

    const effV = Math.min(C.vocab, vf + (step.kind === "vocab" ? 1 : 0));
    const effL = Math.min(C.listening, lf + (step.kind === "listening" ? 1 : 0));
    const effS = Math.min(C.speaking, sf + (step.kind === "speaking" ? 1 : 0));

    const vocabDone = vf >= C.vocab;
    const listenDone = lf >= C.listening;
    const speakDone = sf >= C.speaking;
    const matchDone = matchBlocksDone >= 3;

    const ratioV = vocabDone ? 1 : effV / C.vocab;
    const ratioL = listenDone ? 1 : effL / C.listening;
    const ratioS = speakDone ? 1 : effS / C.speaking;
    const ratioM = matchDone ? 1 : matchPairs / C.matchingPairs;

    return [
      {ratioLabel: `${effV}/${C.vocab}`, complete: vocabDone, fillRatio: ratioV},
      {ratioLabel: `${effL}/${C.listening}`, complete: listenDone, fillRatio: ratioL},
      {ratioLabel: `${effS}/${C.speaking}`, complete: speakDone, fillRatio: ratioS},
      {ratioLabel: `${matchPairs}/${C.matchingPairs}`, complete: matchDone, fillRatio: ratioM},
    ] as [PlacementSkillBar, PlacementSkillBar, PlacementSkillBar, PlacementSkillBar];
  }, [steps, index, step, matchingLockedCount]);

  if (!step) {
    return null;
  }

  const attempts = wrongAttempts[step.id] ?? 0;
  const hintEnabled = step.kind !== "matching" && attempts >= 2;

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f1f3] font-sans text-gray-900">
      <PlacementHeader
        currentLevel={step.level}
        bars={skillBars}
        onClosePress={() => setExitOpen(true)}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-36 pt-6 md:px-8 md:pb-40 md:pt-8">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-10">
          {step.kind === "vocab" && (
            <VocabStep
              key={step.id}
              step={step}
              onSubmit={(correct) => {
                if (!correct) bumpWrong(step.id);
                let nextSnapshot = emptySkillScores();
                setSkillScores((prev) => {
                  nextSnapshot = {
                    ...prev,
                    vocab: {...prev.vocab, score: prev.vocab.score + scoreVocab(correct)},
                  };
                  return nextSnapshot;
                });
                advanceOrFinish(nextSnapshot);
              }}
            />
          )}

          {step.kind === "matching" && (
            <div key={step.id}>
              <p className="mb-6 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
                Matching
              </p>
              <h2 className="text-xl font-extrabold text-[#0a192f] md:text-2xl">Ghép nối từ và nghĩa</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 md:text-base">
                Chọn một ô bên trái, sau đó chọn một ô bên phải để ghép cặp — đã ghép sẽ không đổi được.
              </p>
              <div className="mt-6">
              <PlacementMatchingLock
                pairs={step.pairs}
                onLockedPairsChange={setMatchingLockedCount}
                onSubmitScore={(correct, max) => {
                  let nextSnapshot = emptySkillScores();
                  setSkillScores((prev) => {
                    nextSnapshot = {
                      ...prev,
                      matching: {
                        ...prev.matching,
                        score: prev.matching.score + scoreMatchingPairs(correct),
                      },
                    };
                    return nextSnapshot;
                  });
                  toast.success(`Đã chấm: ${correct}/${max} cặp đúng`);
                  advanceOrFinish(nextSnapshot);
                }}
              />
              </div>
            </div>
          )}

          {step.kind === "listening" && (
            <ListeningStep
              key={step.id}
              step={step}
              onSubmit={(ok) => {
                if (!ok) bumpWrong(step.id);
                let nextSnapshot = emptySkillScores();
                setSkillScores((prev) => {
                  nextSnapshot = {
                    ...prev,
                    listening: {
                      ...prev.listening,
                      score: prev.listening.score + scoreListeningBlanks(ok),
                    },
                  };
                  return nextSnapshot;
                });
                advanceOrFinish(nextSnapshot);
              }}
            />
          )}

          {step.kind === "speaking" && (
            <SpeakingStep
              key={step.id}
              step={step}
              onSubmit={(pts, isWeak) => {
                if (isWeak) bumpWrong(step.id);
                let nextSnapshot = emptySkillScores();
                setSkillScores((prev) => {
                  nextSnapshot = {
                    ...prev,
                    speaking: {...prev.speaking, score: prev.speaking.score + pts},
                  };
                  return nextSnapshot;
                });
                advanceOrFinish(nextSnapshot);
              }}
            />
          )}
        </div>
      </main>

      {step.kind !== "matching" && (
        <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-[#f7f7f8]/95 backdrop-blur-md">
          <div className="relative mx-auto flex max-w-4xl items-end justify-center px-4 py-4 md:px-8">
            <StepFooterActions hintEnabled={hintEnabled} onHint={() => setHintOpen(true)} />
          </div>
        </footer>
      )}

      <LessonExitModal
        open={exitOpen}
        onContinue={() => setExitOpen(false)}
        onExit={handleExit}
        continueButtonText="Tiếp tục Test"
      />

      {hintOpen && step.kind !== "matching" && (
        <HintOverlay
          step={step}
          onClose={() => setHintOpen(false)}
        />
      )}
    </div>
  );
}

function VocabStep({
  step,
  onSubmit,
}: {
  step: Extract<PlacementStep, {kind: "vocab"}>;
  onSubmit: (correct: boolean) => void;
}) {
  const [sel, setSel] = useState<number | null>(null);

  const canSubmit = sel != null;
  const handleNop = () => {
    if (sel == null) return;
    const correct = sel === step.correctIndex;
    onSubmit(correct);
  };

  return (
    <>
      <p className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
        Từ vựng
      </p>
      <h2 className="text-xl font-extrabold text-[#0a192f] md:text-2xl">{step.prompt}</h2>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {step.options.map((opt, i) => {
          const active = sel === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSel(i)}
              className={cn(
                "rounded-2xl border-2 px-5 py-5 text-left text-sm font-semibold shadow-sm transition md:text-base",
                active
                  ? "border-primary-500 bg-primary-100 ring-2 ring-primary-200"
                  : "border-gray-200 bg-white hover:border-primary-300"
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

function ListeningStep({
  step,
  onSubmit,
}: {
  step: Extract<PlacementStep, {kind: "listening"}>;
  onSubmit: (ok: boolean) => void;
}) {
  const n = step.blankAnswers.length;
  const [vals, setVals] = useState<string[]>(() => Array.from({length: n}, () => ""));

  const filled = vals.every((v) => v.trim().length > 0);
  const handleNop = () => {
    const ok = step.blankAnswers.every((a, i) => isListeningBlankCorrect(vals[i] ?? "", a));
    onSubmit(ok);
  };

  return (
    <>
      <p className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
        Nghe hiểu
      </p>
      <h2 className="text-xl font-extrabold text-[#0a192f] md:text-2xl">{step.title}</h2>
      <div className="mt-6">
        <LessonAudioPlayer src={step.audioUrl} trackKey={step.id} />
      </div>
      <div className="mt-8 rounded-2xl border-2 border-gray-100 bg-gray-50/80 p-5 md:p-6">
        <ListeningFill
          step={step}
          values={vals}
          onChange={(i, v) => setVals((prev) => {
            const next = [...prev];
            next[i] = v;
            return next;
          })}
        />
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

function SpeakingStep({
  step,
  onSubmit,
}: {
  step: Extract<PlacementStep, {kind: "speaking"}>;
  onSubmit: (points: number, isWeak: boolean) => void;
}) {
  const [vals, setVals] = useState<string[]>(() => step.lines.map(() => ""));

  const filled = vals.every((v) => v.trim().length > 0);
  const handleNop = () => {
    const pts = scoreSpeakingStep(step.lines, vals);
    const isWeak = pts < 1.5;
    onSubmit(pts, isWeak);
  };

  return (
    <>
      <p className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
        Nói / Đọc
      </p>
      <h2 className="text-xl font-extrabold text-[#0a192f] md:text-2xl">{step.instruction}</h2>
      <div className="mt-8 space-y-4">
        {step.lines.map((line, i) => (
          <div key={i} className="rounded-2xl border-2 border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700">{line}</p>
            <label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-primary-600">
              Từ {i + 1}
            </label>
            <input
              type="text"
              value={vals[i] ?? ""}
              onChange={(e) =>
                setVals((prev) => {
                  const n = [...prev];
                  n[i] = e.target.value;
                  return n;
                })
              }
              placeholder="Nhập từ..."
              className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
            />
          </div>
        ))}
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
        <Lightbulb className="h-5 w-5" strokeWidth={2.2} />
      </button>
    </div>
  );
}

function HintOverlay({
  step,
  onClose,
}: {
  step: Exclude<PlacementStep, {kind: "matching"}>;
  onClose: () => void;
}) {
  let body = "";
  if (step.kind === "vocab") {
    body = `Gợi ý: đáp án đúng là "${step.options[step.correctIndex]}".`;
  } else if (step.kind === "listening") {
    body = `Gợi ý: ${step.blankAnswers.map((a, i) => `Từ ${i + 1}: "${a}"`).join(" · ")}`;
  } else {
    body = `Gợi ý: ${step.lines.map((l, i) => `Câu ${i + 1}: "${l}"`).join(" ")}`;
  }

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Đóng" onClick={onClose} />
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
