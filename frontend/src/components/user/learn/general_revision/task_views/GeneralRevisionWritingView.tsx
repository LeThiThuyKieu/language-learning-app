import { useState, useRef } from "react";
import { PenLine, X } from "lucide-react";
import type { RevisionQuestionDto } from "@/services/generalRevisionService";
import LessonExitModal from "@/components/user/learn/LessonExitModal";
import LessonResultFooter from "@/components/user/learn/LessonResultFooter";
import LessonTopBar from "@/components/user/learn/LessonTopBar";

interface Props {
  taskDescription: string;
  questions: RevisionQuestionDto[];
  onLeave: () => void;
  onComplete: (correctCount: number, totalCount?: number) => void;
}

// Detect dạng bài
// Dạng 1: categories grid (1 document, nhiều categories/slots)
// Dạng 2: danh sách định nghĩa (nhiều documents, mỗi cái có questionText)
function isDefinitionList(questions: RevisionQuestionDto[]): boolean {
  return questions.length > 1 || !!questions[0]?.questionText;
}

// Dạng 1: Categories grid
function CategoriesView({
  taskDescription, questions, onLeave, onComplete,
}: Props) {
  const question   = questions[0];
  const categories = question?.categories ?? [];
  const refImages  = question?.images     ?? [];
  const completingRef = useRef(false);

  const normalise = (s: string) => s.trim().toLowerCase();

  const correctMap: Record<string, string[][]> = (() => {
    try { return question?.correctAnswer ? JSON.parse(question.correctAnswer) : {}; }
    catch { return {}; }
  })();

  const [answers, setAnswers] = useState<string[][]>(
    () => categories.map((c) => Array(c.slots).fill(""))
  );
  const [checked, setChecked] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  const results: boolean[][] = categories.map((cat, ci) => {
    const correctSlots: string[][] = correctMap[cat.label] ?? [];
    return correctSlots.map((accepted, si) =>
      checked ? accepted.some((w) => normalise(answers[ci]?.[si] ?? "") === normalise(w)) : false
    );
  });

  const totalSlots   = categories.reduce((acc, c) => acc + c.slots, 0);
  const correctCount = results.flat().filter(Boolean).length;
  const allCorrect   = checked && correctCount === totalSlots;

  function setAnswer(ci: number, si: number, val: string) {
    setAnswers((prev) => { const n = prev.map((r) => [...r]); n[ci][si] = val; return n; });
  }

  const hasAnyInput = answers.some((row) => row.some((v) => v.trim() !== ""));

  if (!question) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 pt-6 pb-0 flex items-center gap-3">
        <button type="button" onClick={() => setExitOpen(true)} aria-label="Thoát"
          className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
          <X size={22} />
        </button>
        <div className="flex-1 flex items-center gap-2 rounded-2xl border-2 border-primary-200 bg-primary-50 px-4 py-3">
          <PenLine size={16} className="text-primary-600 shrink-0" />
          <span className="text-xs font-extrabold uppercase tracking-wide text-primary-600">{taskDescription}</span>
        </div>
      </div>

      <main className="flex-1 w-full pb-32 flex flex-col">
        <div className="w-full max-w-5xl mx-auto px-4 md:px-6 pt-4 flex flex-col gap-4 flex-1">
          <div className={`grid gap-3 ${
            categories.length <= 2 ? "grid-cols-2"
            : categories.length === 3 ? "grid-cols-3"
            : "grid-cols-2 md:grid-cols-4"
          }`}>
            {categories.map((cat, ci) => (
              <div key={ci} className="rounded-2xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-primary-50 border-b border-primary-100 px-3 py-2 text-center">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-primary-700">{cat.label}</span>
                </div>
                <div className="px-3 py-3 flex flex-col gap-2">
                  {Array.from({ length: cat.slots }).map((_, si) => {
                    const val      = answers[ci]?.[si] ?? "";
                    const accepted = (correctMap[cat.label] ?? [])[si] ?? [];
                    const isRight  = checked && results[ci]?.[si] === true;
                    const isWrong  = checked && results[ci]?.[si] === false && val.trim() !== "";
                    const isEmpty  = checked && val.trim() === "";
                    return (
                      <div key={si} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">{si + 1}.</span>
                          <input type="text" value={val} disabled={checked} spellCheck={false}
                            onChange={(e) => setAnswer(ci, si, e.target.value)} placeholder="..."
                            className={["flex-1 min-w-0 rounded-lg border px-2 py-1.5 text-sm font-semibold transition outline-none",
                              !checked ? "border-gray-200 bg-white focus:border-primary-400"
                              : isRight ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                              : isWrong ? "border-red-400 bg-red-50 text-red-700"
                              : isEmpty ? "border-gray-200 bg-gray-50 text-gray-400"
                              : "border-gray-200 bg-white",
                            ].join(" ")} />
                        </div>
                        {checked && (isWrong || isEmpty) && accepted.length > 0 && (
                          <span className="text-[10px] text-red-500 font-semibold pl-5">→ {accepted.join(" / ")}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {refImages.length > 0 && (
            <div className="mt-auto">
              {refImages.length === 1 ? (
                <div className="w-full overflow-auto rounded-2xl">
                  <img src={refImages[0].url} alt="" className="w-full h-auto object-contain rounded-2xl"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              ) : (
                <div className={`grid gap-3 ${refImages.length <= 4 ? "grid-cols-4" : refImages.length <= 6 ? "grid-cols-6" : "grid-cols-5"}`}>
                  {refImages.map((img, i) => (
                    <div key={i} className="w-full aspect-square rounded-xl border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
                      <img src={img.url} alt="" className="w-full h-full object-contain p-1.5"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {!checked ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur-md">
          <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-end">
            <button type="button" disabled={!hasAnyInput} onClick={() => setChecked(true)}
              className={["min-w-[160px] h-12 rounded-2xl px-6 text-sm font-extrabold uppercase tracking-wide shadow-sm transition",
                hasAnyInput ? "bg-primary-600 hover:bg-primary-700 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"].join(" ")}>
              Kiểm tra
            </button>
          </div>
        </div>
      ) : (
        <LessonResultFooter
          variant={allCorrect ? "correct" : "incorrect"}
          title={allCorrect ? "Tuyệt vời!" : `${correctCount}/${totalSlots} đúng`}
          detail={allCorrect ? undefined : <span className="text-red-900 font-semibold">Xem đáp án đúng phía trên nhé.</span>}
          onContinue={() => { if (completingRef.current) return; completingRef.current = true; onComplete(correctCount, totalSlots); }}
        />
      )}

      <LessonExitModal open={exitOpen} onContinue={() => setExitOpen(false)}
        onExit={() => { setExitOpen(false); onLeave(); }}
        continueButtonText="Tiếp tục Ôn"
        bodyText="Đợi chút, đừng đi mà! Bạn sẽ mất hết tiến trình của bài ôn tập này nếu thoát bây giờ." />
    </div>
  );
}

// Dạng 2: Mỗi câu 1 trang (giống VOCAB_IMAGE)
function DefinitionListView({
  taskDescription, questions, onLeave, onComplete,
}: Props) {
  const total = questions.length;
  const [index, setIndex]       = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [checked, setChecked]   = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const completingRef = useRef(false);

  const current       = questions[index];
  const progressPct   = ((index + 1) / total) * 100;
  const fractionLabel = `${index + 1}/${total}`;

  const normalise = (s: string) => s.trim().toLowerCase();
  const isCorrect = (() => {
    if (!checked) return false;
    const ans     = normalise(inputValue);
    const correct = current?.correctAnswer ?? "";
    return correct.split("/").map((s) => normalise(s)).includes(ans);
  })();

  function handleCheck() {
    if (!inputValue.trim()) return;
    setChecked(true);
  }

  function handleContinue() {
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    if (index < total - 1) {
      setCorrectCount(nextCorrect);
      setIndex(index + 1);
      setInputValue("");
      setChecked(false);
    } else {
      if (completingRef.current) return;
      completingRef.current = true;
      onComplete(nextCorrect, total);
    }
  }

  if (!current) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <LessonTopBar
        onClosePress={() => setExitOpen(true)}
        progressPercent={progressPct}
        rightLabel={fractionLabel}
      />

      <main className="flex-1 w-full">
        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-32">
          <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 md:p-10 flex flex-col items-center gap-8">
            {/* Đề bài */}
            <div className="w-full">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
                <PenLine size={13} />
                {taskDescription}
              </span>
            </div>

            {/* Định nghĩa — text thuần, không khung */}
            <div className="w-full max-w-lg mt-4">
              <p className="text-2xl font-extrabold text-gray-900 leading-snug text-center">
                {current.questionText}
              </p>
            </div>

            {/* Ô nhập — dấu mũi tên + input cùng hàng */}
            <div className="w-full max-w-lg flex items-center gap-3 mt-6">
              <span className="text-4xl font-bold text-primary-500 shrink-0">→</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !checked) handleCheck(); }}
                disabled={checked}
                placeholder="Write the expression…"
                spellCheck={false}
                className={[
                  "w-full rounded-2xl border-2 px-4 py-3 text-left text-lg font-semibold transition outline-none h-14",
                  !checked
                    ? "border-gray-200 bg-gray-50 focus:border-primary-400 focus:bg-white"
                    : isCorrect
                    ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                    : "border-red-400 bg-red-50 text-red-800",
                ].join(" ")}
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        {!checked ? (
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-end">
              <button
                type="button"
                disabled={!inputValue.trim()}
                onClick={handleCheck}
                className={[
                  "min-w-[160px] h-12 rounded-2xl px-6 text-sm font-extrabold uppercase tracking-wide shadow-sm transition",
                  inputValue.trim()
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
                <span className="font-bold text-red-900">
                  {current.correctAnswer || "(không có đáp án)"}
                </span>
              )
            }
            onContinue={handleContinue}
          />
        )}
      </main>

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

// Main export: tự detect dạng bài
export default function GeneralRevisionWritingView(props: Props) {
  if (!props.questions.length) return null;
  return isDefinitionList(props.questions)
    ? <DefinitionListView {...props} />
    : <CategoriesView {...props} />;
}
