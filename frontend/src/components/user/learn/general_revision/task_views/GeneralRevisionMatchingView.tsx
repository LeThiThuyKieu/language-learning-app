import { useMemo, useState, useRef } from "react";
import { Sparkles } from "lucide-react";
import type { RevisionQuestionDto } from "@/services/generalRevisionService";
import LessonTopBar from "@/components/user/learn/LessonTopBar";
import LessonExitModal from "@/components/user/learn/LessonExitModal";
import LessonCompleteView from "@/components/user/learn/LessonCompleteView";

// ── helpers ──────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** true nếu chuỗi trông giống URL ảnh */
function isImageUrl(s: string): boolean {
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(s.trim());
}

// ── sparkle ───────────────────────────────────────────────────

function CorrectPairSparkles() {
  const spots = [
    { cls: "left-[10%] top-[20%]",         delay: "0ms"   },
    { cls: "right-[12%] top-[24%]",        delay: "70ms"  },
    { cls: "left-[18%] bottom-[22%]",      delay: "130ms" },
    { cls: "right-[16%] bottom-[20%]",     delay: "45ms"  },
    { cls: "left-1/2 top-[10%] -translate-x-1/2", delay: "90ms" },
    { cls: "left-[42%] bottom-[12%]",      delay: "20ms"  },
  ];
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
      {spots.map((s, i) => (
        <Sparkles
          key={i}
          className={`match-sparkle-icon absolute h-3.5 w-3.5 text-emerald-500 drop-shadow-sm ${s.cls}`}
          strokeWidth={2.4}
          style={{ animationDelay: s.delay }}
        />
      ))}
    </span>
  );
}

// ── cell renderers ────────────────────────────────────────────

function TextCell({ text }: { text: string }) {
  return (
    <span className="relative z-[1] text-base font-semibold text-gray-800 line-clamp-3">
      {text}
    </span>
  );
}

function ImageCell({ url }: { url: string }) {
  return (
    <span className="relative z-[1] flex items-center justify-center w-full">
      <img
        src={url}
        alt=""
        className="h-16 w-auto max-w-full object-contain rounded-lg"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    </span>
  );
}

// ── main component ────────────────────────────────────────────

interface Props {
  taskDescription: string;
  /** Mảng 1 phần tử — MATCHING chỉ có 1 document */
  questions: RevisionQuestionDto[];
  onLeave: () => void;
  onComplete: (correctCount: number) => void;
}

type Pair = { id: string; left: string; right: string };

export default function GeneralRevisionMatchingView({
  taskDescription,
  questions,
  onLeave,
  onComplete,
}: Props) {
  // Lấy pairs từ câu hỏi đầu tiên
  const pairs: Pair[] = useMemo(() => {
    const rawPairs = questions[0]?.pairs ?? [];
    return rawPairs.map((p, i) => ({
      id: String(i),
      left:  p.left  ?? "",
      right: p.right ?? "",
    }));
  }, [questions]);

  const rightItems = useMemo(
    () => shuffle(pairs.map((p) => ({ id: p.id, value: p.right }))),
    [pairs]
  );

  const [selectedLeftId,  setSelectedLeftId]  = useState<string | null>(null);
  const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
  const [matchedIds,      setMatchedIds]      = useState<Set<string>>(new Set());
  const [justMatchedIds,  setJustMatchedIds]  = useState<Set<string>>(new Set());
  const [wrongPair,       setWrongPair]       = useState<{ leftId: string; rightId: string } | null>(null);
  const [finished,        setFinished]        = useState(false);
  const [exitOpen,        setExitOpen]        = useState(false);
  const completingRef = useRef(false);

  const matchPct   = pairs.length === 0 ? 0 : (matchedIds.size / pairs.length) * 100;
  const matchLabel = `${matchedIds.size}/${pairs.length}`;

  function tryResolve(nextLeft: string | null, nextRight: string | null) {
    if (!nextLeft || !nextRight) return;
    if (matchedIds.has(nextLeft) || justMatchedIds.has(nextLeft)) return;

    // left.id === right.id means they're a correct pair
    const isCorrect = nextLeft === nextRight;

    if (isCorrect) {
      const nextJust = new Set(justMatchedIds);
      nextJust.add(nextLeft);
      setJustMatchedIds(nextJust);
      setSelectedLeftId(null);
      setSelectedRightId(null);
      setWrongPair(null);

      window.setTimeout(() => {
        setMatchedIds((prev) => {
          const next = new Set(prev).add(nextLeft);
          if (next.size === pairs.length && pairs.length > 0) {
            window.setTimeout(() => {
              if (completingRef.current) return;
              completingRef.current = true;
              onComplete(pairs.length);
              setFinished(true);
            }, 400);
          }
          return next;
        });
        setJustMatchedIds((prev) => {
          const n = new Set(prev);
          n.delete(nextLeft);
          return n;
        });
      }, 600);
    } else {
      setWrongPair({ leftId: nextLeft, rightId: nextRight });
      window.setTimeout(() => {
        setSelectedLeftId(null);
        setSelectedRightId(null);
        setWrongPair(null);
      }, 650);
    }
  }

  if (finished) {
    return (
      <LessonCompleteView
        knGained={0}
        accuracy={100}
        newBadges={[]}
        onContinue={() => onComplete(pairs.length)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <LessonTopBar
        onClosePress={() => setExitOpen(true)}
        progressPercent={matchPct}
        rightLabel={matchLabel}
      />

      <main className="flex-1 w-full">
        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-28">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">

            {/* Đề bài */}
            <div className="max-w-2xl mb-6">
              <p className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200 mb-3">
                Nối từ
              </p>
              <h1 className="text-2xl font-extrabold leading-snug text-gray-900 md:text-3xl">
                {taskDescription}
              </h1>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Cột trái */}
              <div className="space-y-3">
                {pairs.map((p, idx) => {
                  const isMatched      = matchedIds.has(p.id);
                  const isJustMatched  = justMatchedIds.has(p.id);
                  const isSelected     = selectedLeftId === p.id;
                  const isWrong        = wrongPair?.leftId === p.id;
                  const showAsImg      = isImageUrl(p.left);

                  return (
                    <button
                      key={`L-${p.id}`}
                      type="button"
                      disabled={isMatched || isJustMatched}
                      onClick={() => {
                        const next = selectedLeftId === p.id ? null : p.id;
                        setSelectedLeftId(next);
                        tryResolve(next, selectedRightId);
                      }}
                      className={[
                        "relative w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left shadow-sm",
                        "transition-all duration-300 ease-out",
                        "bg-white border-gray-200",
                        !isMatched && !isJustMatched && !isWrong && !isSelected
                          ? "hover:border-gray-300 hover:bg-gray-50 active:translate-y-0.5" : "",
                        isSelected && !isWrong && !isJustMatched
                          ? "border-primary-500 bg-primary-100 ring-2 ring-primary-300/70 shadow-md" : "",
                        isWrong
                          ? "border-red-500 bg-red-100 animate-[shake_0.3s_ease-in-out]" : "",
                        isJustMatched
                          ? "z-[1] border-emerald-500 bg-emerald-100 ring-2 ring-emerald-300/80 shadow-md animate-[match-pop_0.45s_ease-out]" : "",
                        isMatched
                          ? "pointer-events-none border-gray-200 bg-gray-50 opacity-25 shadow-none duration-500" : "",
                      ].join(" ")}
                    >
                      {isJustMatched && <CorrectPairSparkles />}
                      <span className={[
                        "relative z-[1] h-8 w-8 shrink-0 rounded-lg border flex items-center justify-center text-xs font-bold transition-colors",
                        isSelected
                          ? "bg-white border-primary-200 text-primary-600"
                          : "bg-gray-50 border-gray-100 text-gray-400",
                      ].join(" ")}>
                        {idx + 1}
                      </span>
                      {showAsImg
                        ? <ImageCell url={p.left} />
                        : <TextCell text={p.left} />}
                    </button>
                  );
                })}
              </div>

              {/* Cột phải */}
              <div className="space-y-3">
                {rightItems.map((r, idx) => {
                  const isMatched      = matchedIds.has(r.id);
                  const isJustMatched  = justMatchedIds.has(r.id);
                  const isSelected     = selectedRightId === r.id;
                  const isWrong        = wrongPair?.rightId === r.id;
                  const showAsImg      = isImageUrl(r.value);

                  return (
                    <button
                      key={`R-${r.id}-${idx}`}
                      type="button"
                      disabled={isMatched || isJustMatched}
                      onClick={() => {
                        const next = selectedRightId === r.id ? null : r.id;
                        setSelectedRightId(next);
                        tryResolve(selectedLeftId, next);
                      }}
                      className={[
                        "relative w-full flex items-center justify-between gap-4 rounded-2xl border-2 p-4 text-left shadow-sm",
                        "transition-all duration-300 ease-out",
                        "bg-white border-gray-200",
                        !isMatched && !isJustMatched && !isWrong && !isSelected
                          ? "hover:border-gray-300 hover:bg-gray-50 active:translate-y-0.5" : "",
                        isSelected && !isWrong && !isJustMatched
                          ? "border-primary-500 bg-primary-100 ring-2 ring-primary-300/70 shadow-md" : "",
                        isWrong
                          ? "border-red-500 bg-red-100 animate-[shake_0.3s_ease-in-out]" : "",
                        isJustMatched
                          ? "z-[1] border-emerald-500 bg-emerald-100 ring-2 ring-emerald-300/80 shadow-md animate-[match-pop_0.45s_ease-out]" : "",
                        isMatched
                          ? "pointer-events-none border-gray-200 bg-gray-50 opacity-25 shadow-none duration-500" : "",
                      ].join(" ")}
                    >
                      {isJustMatched && <CorrectPairSparkles />}
                      {showAsImg
                        ? <ImageCell url={r.value} />
                        : <TextCell text={r.value} />}
                      <span className="relative z-[1] h-8 w-8 shrink-0 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-4px); }
          75%       { transform: translateX(4px); }
        }
        @keyframes match-pop {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        @keyframes match-sparkle-float {
          0%   { opacity: 0; transform: scale(0.35) rotate(-12deg) translateY(6px); }
          30%  { opacity: 1; transform: scale(1.1)  rotate(0deg)   translateY(0); }
          55%  { opacity: 0.95; transform: scale(1) rotate(6deg)   translateY(-2px); }
          100% { opacity: 0; transform: scale(0.5)  rotate(18deg)  translateY(-14px); }
        }
        .match-sparkle-icon {
          animation: match-sparkle-float 0.88s ease-out forwards;
        }
      `}</style>

      <LessonExitModal
        open={exitOpen}
        onContinue={() => setExitOpen(false)}
        onExit={() => { setExitOpen(false); onLeave(); }}
        continueButtonText="Tiếp tục Ôn"
        bodyText="Đợi chút, đừng đi mà! Bạn sẽ mất hết tiến trình của bài ôn tập này nếu thoát bây giờ."
      />
    </div>
  );
}
