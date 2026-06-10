import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2 } from "lucide-react";
import type { RevisionQuestionDto } from "@/services/generalRevisionService";
import LessonTopBar from "@/components/user/learn/LessonTopBar";
import LessonExitModal from "@/components/user/learn/LessonExitModal";
import LessonResultFooter from "@/components/user/learn/LessonResultFooter";

interface Props {
  taskDescription: string;
  questions: RevisionQuestionDto[];
  onLeave: () => void;
  onComplete: (correctCount: number) => void;
}

export default function GeneralRevisionListeningView({
  taskDescription,
  questions,
  onLeave,
  onComplete,
}: Props) {
  const total = Math.max(questions.length, 1);
  const [index, setIndex]               = useState(0);
  const [inputValue, setInputValue]     = useState("");
  const [checked, setChecked]           = useState(false);
  const [exitOpen, setExitOpen]         = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const completingRef = useRef(false);

  const current       = questions[index];
  const progressPct   = ((index + 1) / total) * 100;
  const fractionLabel = `${index + 1}/${total}`;
  const audioUrl      = current?.audioUrl ?? "";

  // Dạng fill-in-the-blank nếu câu có trường sentence
  const isFillInBlank = !!current?.sentence;

  const normalise = (s: string) => s.trim().toLowerCase();
  const isCorrect = checked && normalise(inputValue) === normalise(current?.correctAnswer ?? "");

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  function handlePlayAudio() {
    if (!audioUrl) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play().catch(() => setIsPlaying(false));
    setIsPlaying(true);
  }

  function handleCheck() {
    if (!inputValue.trim()) return;
    stopAudio();
    setChecked(true);
  }

  function handleContinue() {
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    stopAudio();
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

  // Tách câu thành phần trước và sau ___
  function renderSentenceWithInput(sentence: string) {
    const parts = sentence.split("___");
    if (parts.length < 2) {
      return <span className="text-lg font-semibold text-gray-800">{sentence}</span>;
    }
    const [before, after] = [parts[0], parts.slice(1).join("___")];
    return (
      <p className="text-lg font-semibold text-gray-800 leading-relaxed text-center">
        {before}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !checked) handleCheck(); }}
          disabled={checked}
          spellCheck={false}
          placeholder="..."
          className={[
            "inline-block mx-1 rounded-lg border-b-2 border-x-0 border-t-0 px-2 py-0.5 text-lg font-bold text-center transition outline-none",
            "w-36 bg-transparent",
            !checked
              ? "border-primary-400 focus:border-primary-600"
              : isCorrect
              ? "border-emerald-500 text-emerald-700"
              : "border-red-500 text-red-700",
          ].join(" ")}
          autoFocus
        />
        {after}
      </p>
    );
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
          <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 md:p-10 flex flex-col items-center gap-6">

            {/* Đề bài */}
            <div className="w-full mb-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
                <Volume2 size={13} />
                {taskDescription}
              </span>
            </div>

            {/* Icon loa + nội dung */}
            <div className={`flex items-center justify-center gap-8 w-full ${isFillInBlank ? "flex-col md:flex-row" : ""}`}>
              {/* Icon loa */}
              <button
                type="button"
                onClick={handlePlayAudio}
                disabled={!audioUrl || checked}
                aria-label="Play audio"
                className={[
                  "flex items-center justify-center rounded-full transition-all shrink-0",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200",
                  "w-24 h-24",
                  !audioUrl || checked
                    ? "text-gray-300 cursor-not-allowed"
                    : isPlaying
                    ? "text-primary-500 animate-pulse scale-110"
                    : "text-primary-500 hover:text-primary-600 hover:scale-110 active:scale-95",
                ].join(" ")}
              >
                <Volume2 size={72} strokeWidth={1.5} />
              </button>

              {isFillInBlank ? (
                // Dạng fill-in-the-blank
                <div className="flex flex-col items-center gap-5 flex-1">
                  {/* Ảnh nhỏ hơn */}
                  {current.imageUrl && (
                    <div className="w-full max-w-xs">
                      <img
                        src={current.imageUrl}
                        alt="listening image"
                        className={`w-full h-auto max-h-48 object-contain rounded-2xl transition-all ${
                          !checked ? ""
                          : isCorrect ? "ring-4 ring-emerald-400"
                          : "ring-4 ring-red-400"
                        }`}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}

                  {/* Câu có chỗ điền */}
                  <div className="w-full max-w-lg rounded-2xl bg-gray-50 px-6 py-4">
                    {renderSentenceWithInput(current.sentence ?? "")}
                  </div>
                </div>
              ) : (
                // Dạng ảnh thông thường
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full max-w-sm shrink-0">
                    <img
                      src={current.imageUrl}
                      alt="listening image"
                      className={`w-full h-auto max-h-64 object-contain rounded-2xl transition-all ${
                        !checked ? ""
                        : isCorrect ? "ring-4 ring-emerald-400"
                        : "ring-4 ring-red-400"
                      }`}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/icons/learn/hoc.svg"; }}
                    />
                  </div>

                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !checked) handleCheck(); }}
                    disabled={checked}
                    placeholder="Type the word you heard…"
                    spellCheck={false}
                    style={{ width: 300 }}
                    className={[
                      "rounded-2xl border-2 px-4 py-3 text-center text-xl font-bold transition outline-none",
                      !checked
                        ? "border-gray-200 bg-white focus:border-primary-400"
                        : isCorrect
                        ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                        : "border-red-400 bg-red-50 text-red-800",
                    ].join(" ")}
                    autoFocus
                  />
                </div>
              )}
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
