import { useState, useRef } from "react";
import type { RevisionQuestionDto } from "@/services/generalRevisionService";
import LessonTopBar from "@/components/user/learn/LessonTopBar";
import LessonExitModal from "@/components/user/learn/LessonExitModal";
import LessonResultFooter from "@/components/user/learn/LessonResultFooter";

interface Props {
  /** Đề bài từ bảng general_revision_task.description */
  taskDescription: string;
  questions: RevisionQuestionDto[];
  onLeave: () => void;
  onComplete: (correctCount: number) => void;
}

export default function GeneralRevisionVocabImageView({
  taskDescription,
  questions,
  onLeave,
  onComplete,
}: Props) {
  const total = Math.max(questions.length, 1);
  const [index, setIndex]           = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [checked, setChecked]       = useState(false);
  const [exitOpen, setExitOpen]     = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const completingRef = useRef(false);

  const current     = questions[index];
  const progressPct = ((index + 1) / total) * 100;
  const fractionLabel = `${index + 1}/${total}`;

  const normalise = (s: string) => s.trim().toLowerCase();
  const isCorrect = checked && normalise(inputValue) === normalise(current?.correctAnswer ?? "");

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
      onComplete(nextCorrect);
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
          {/* Ảnh + ô nhập — khung trắng chứa cả đề bài */}
          <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 md:p-10 flex flex-col items-center gap-6">
            {/* Đề bài */}
            <div className="w-full mb-2">
              <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
                {taskDescription}
              </span>
            </div>
            {/* Ảnh */}
            <div className={`relative rounded-2xl overflow-hidden border-4 transition-all ${
              !checked ? "border-gray-200"
              : isCorrect ? "border-emerald-400"
              : "border-red-400"
            }`} style={{ width: 220, height: 180 }}>
              <img
                src={current.imageUrl}
                alt="vocabulary image"
                className="w-full h-full object-contain bg-gray-50 p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/icons/learn/hoc.svg";
                }}
              />
            </div>

            {/* Ô nhập từ */}
            <div className="w-full max-w-sm flex flex-col items-center gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !checked) handleCheck(); }}
                disabled={checked}
                placeholder="Type the word…"
                className={[
                  "w-full rounded-2xl border-2 px-5 py-4 text-center text-xl font-bold transition outline-none",
                  !checked
                    ? "border-gray-200 bg-white focus:border-primary-400"
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
