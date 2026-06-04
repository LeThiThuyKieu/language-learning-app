import { useState, useRef } from "react";
import { PenLine, X } from "lucide-react";
import type { RevisionQuestionDto } from "@/services/generalRevisionService";
import LessonExitModal from "@/components/user/learn/LessonExitModal";
import LessonResultFooter from "@/components/user/learn/LessonResultFooter";

interface Props {
  taskDescription: string;
  /** Mảng 1 phần tử — SPEAKING chỉ có 1 document */
  questions: RevisionQuestionDto[];
  onLeave: () => void;
  onComplete: (correctCount: number) => void;
}

export default function GeneralRevisionWritingView({
  taskDescription,
  questions,
  onLeave,
  onComplete,
}: Props) {
  const question    = questions[0];
  const categories  = question?.categories ?? [];
  const refImages   = question?.images     ?? [];
  const completingRef = useRef(false);

  // Parse correct_words từ correctAnswer JSON string bên SQL
  // Format: {"Kitchen":["kettle","toaster",...], "Living Room":[...], ...}
  const correctMap: Record<string, string[]> = (() => {
    try {
      return question?.correctAnswer ? JSON.parse(question.correctAnswer) : {};
    } catch {
      return {};
    }
  })();

  // answers[catIdx][slotIdx] = string
  const [answers, setAnswers] = useState<string[][]>(
    () => categories.map((c) => Array(c.slots).fill(""))
  );
  const [checked, setChecked] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  // grading
  const normalise = (s: string) => s.trim().toLowerCase();

  const results: boolean[][] = categories.map((cat, ci) => {
    const correctWords = correctMap[cat.label] ?? [];
    return correctWords.map((word, si) =>
      checked ? normalise(answers[ci]?.[si] ?? "") === normalise(word) : false
    );
  });

  const totalSlots   = categories.reduce((acc, c) => acc + c.slots, 0);
  const correctCount = results.flat().filter(Boolean).length;
  const allCorrect   = checked && correctCount === totalSlots;

  // handlers
  function setAnswer(catIdx: number, slotIdx: number, val: string) {
    setAnswers((prev) => {
      const next = prev.map((row) => [...row]);
      next[catIdx][slotIdx] = val;
      return next;
    });
  }

  function handleCheck() {
    setChecked(true);
  }

  function handleContinue() {
    if (completingRef.current) return;
    completingRef.current = true;
    onComplete(correctCount);
  }

  const hasAnyInput = answers.some((row) => row.some((v) => v.trim() !== ""));

  if (!question) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Đề bài + nút X cùng 1 hàng — không có header riêng */}
      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 pt-6 pb-0 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExitOpen(true)}
          aria-label="Thoát"
          className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
        >
          <X size={22} />
        </button>
        <div className="flex-1 flex items-center gap-2 rounded-2xl border-2 border-primary-200 bg-primary-50 px-4 py-3">
          <PenLine size={16} className="text-primary-600 shrink-0" />
          <span className="text-xs font-extrabold uppercase tracking-wide text-primary-600">
            {taskDescription}
          </span>
        </div>
      </div>

      <main className="flex-1 w-full pb-32 flex flex-col">
        <div className="w-full max-w-5xl mx-auto px-4 md:px-6 pt-4 flex flex-col gap-4 flex-1">

          {/* Categories — grid ngang */}
          <div className={`grid gap-3 ${
            categories.length <= 2 ? "grid-cols-2"
            : categories.length === 3 ? "grid-cols-3"
            : "grid-cols-2 md:grid-cols-4"
          }`}>
            {categories.map((cat, ci) => (
              <div
                key={ci}
                className="rounded-2xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden"
              >
                {/* Header nhóm */}
                <div className="bg-primary-50 border-b border-primary-100 px-3 py-2 text-center">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-primary-700">
                    {cat.label}
                  </span>
                </div>

                {/* Ô điền */}
                <div className="px-3 py-3 flex flex-col gap-2">
                  {Array.from({ length: cat.slots }).map((_, si) => {
                    const val      = answers[ci]?.[si] ?? "";
                    const correctWords = correctMap[cat.label] ?? [];
                    const isRight  = checked && results[ci]?.[si] === true;
                    const isWrong  = checked && results[ci]?.[si] === false && val.trim() !== "";
                    const isEmpty  = checked && val.trim() === "";
                    const correctW = correctWords[si] ?? "";

                    return (
                      <div key={si} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">
                            {si + 1}.
                          </span>
                          <input
                            type="text"
                            value={val}
                            disabled={checked}
                            onChange={(e) => setAnswer(ci, si, e.target.value)}
                            placeholder="..."
                            className={[
                              "flex-1 min-w-0 rounded-lg border px-2 py-1.5 text-sm font-semibold transition outline-none",
                              !checked
                                ? "border-gray-200 bg-white focus:border-primary-400"
                                : isRight
                                ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                                : isWrong
                                ? "border-red-400 bg-red-50 text-red-700"
                                : isEmpty
                                ? "border-gray-200 bg-gray-50 text-gray-400"
                                : "border-gray-200 bg-white",
                            ].join(" ")}
                          />
                        </div>
                        {/* Hiện đáp án đúng nếu sai */}
                        {checked && (isWrong || isEmpty) && correctW && (
                          <span className="text-[10px] text-red-500 font-semibold pl-5">
                            → {correctW}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Hình tham khảo — không có tiêu đề, ảnh lớn, đẩy xuống sát footer */}
          {refImages.length > 0 && (
            <div className="mt-auto rounded-2xl border border-gray-200 bg-white shadow-sm px-4 py-4">
              <div className="grid grid-cols-5 gap-3">
                {refImages.map((img, i) => (
                  <div key={i} className="w-full aspect-square rounded-xl border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-contain p-1.5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      {!checked ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur-md">
          <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-end">
            <button
              type="button"
              disabled={!hasAnyInput}
              onClick={handleCheck}
              className={[
                "min-w-[160px] h-12 rounded-2xl px-6 text-sm font-extrabold uppercase tracking-wide shadow-sm transition",
                hasAnyInput
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
          variant={allCorrect ? "correct" : "incorrect"}
          title={allCorrect ? "Tuyệt vời!" : `${correctCount}/${totalSlots} đúng`}
          detail={
            allCorrect ? undefined : (
              <span className="text-red-900 font-semibold">
                Xem đáp án đúng phía trên nhé.
              </span>
            )
          }
          onContinue={handleContinue}
        />
      )}

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
