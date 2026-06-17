import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  A2_TEST1_LISTENING,
  type ListeningPart,
  type ListeningQuestion,
} from "@/data/examMockData";
import { Play, Pause, Clock, ChevronLeft, ChevronRight, Check } from "lucide-react";

// Thời gian: 30 phút = 1800 giây
const TOTAL_SECONDS = 30 * 60;

// Mock audio (thay bằng URL thật sau)
const MOCK_AUDIO_URL = null; // null → không có audio thật, chỉ giả lập

// Helpers
function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Overlay Play trước khi bắt đầu
function AudioStartOverlay({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 rounded-xl">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white mb-4">
        <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" fill="currentColor">
          <path d="M12 3C9.79 3 8 4.34 8 6v5c0 1.66 1.79 3 4 3s4-1.34 4-3V6c0-1.66-1.79-3-4-3zm-6 9c0 3.31 2.69 6 6 6s6-2.69 6-6h-2c0 2.21-1.79 4-4 4s-4-1.79-4-4H6z"/>
        </svg>
      </div>
      <p className="text-white text-sm font-semibold text-center max-w-xs px-4 leading-relaxed mb-1">
        You will be listening to an audio clip during this test.
      </p>
      <p className="text-white/70 text-xs text-center mb-6">
        You will not be permitted to pause or rewind the audio while answering the questions.
      </p>
      <p className="text-white text-sm font-semibold mb-4">To continue, click Play.</p>
      <button
        type="button"
        onClick={onPlay}
        className="flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold px-8 py-3 transition shadow-lg"
      >
        <Play className="h-5 w-5" />
        Play
      </button>
    </div>
  );
}

// Header: đồng hồ + phần hiện tại
function ExamHeader({
  timeLeft,
  isPlaying,
  audioStarted,
  onToggleAudio,
}: {
  timeLeft: number;
  isPlaying: boolean;
  audioStarted: boolean;
  onToggleAudio: () => void;
}) {
  const pct = (timeLeft / TOTAL_SECONDS) * 100;
  const urgent = timeLeft < 300; // < 5 phút

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
      {/* Tên bài thi */}
      <span className="text-sm font-extrabold text-gray-700 uppercase tracking-wide">
        Listening
      </span>

      {/* Thanh tiến trình thời gian */}
      <div className="flex items-center gap-2 flex-1 mx-6">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${urgent ? "bg-red-500" : "bg-primary-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={`flex items-center gap-1 text-sm font-extrabold ${urgent ? "text-red-600" : "text-gray-700"}`}>
          <Clock className="h-4 w-4" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Nút play/pause audio */}
      {audioStarted && (
        <button
          type="button"
          onClick={onToggleAudio}
          className="flex items-center gap-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 text-xs font-bold transition"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? "Pause" : "Resume"}
        </button>
      )}
    </div>
  );
}

// Part navigation bar (bottom)
function PartNavBar({
  parts,
  answers,
  activePartIdx,
  activeQIdx,
  onGoToPart,
}: {
  parts: ListeningPart[];
  answers: Record<number, string>;
  activePartIdx: number;
  activeQIdx: number;
  onGoToPart: (idx: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-2 text-xs overflow-x-auto gap-2">
      {parts.map((part, idx) => {
        const answered = part.questions.filter((q) => answers[q.id]).length;
        const total = part.questions.length;
        const isActive = idx === activePartIdx;
        return (
          <button
            key={part.partNumber}
            type="button"
            onClick={() => onGoToPart(idx)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition whitespace-nowrap ${
              isActive
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>Part {part.partNumber}</span>
            {isActive && (
              <span className="rounded bg-white/30 px-1">{activeQIdx + 1}</span>
            )}
            <span className="opacity-70">{answered} of {total}</span>
          </button>
        );
      })}
      {/* Nút submit */}
      <button
        type="button"
        className="ml-auto flex items-center gap-1 rounded-lg bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 font-bold transition"
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}

// Question view
function QuestionView({
  part,
  question,
  selectedAnswer,
  onSelect,
}: {
  part: ListeningPart;
  question: ListeningQuestion;
  selectedAnswer: string | null;
  onSelect: (optionId: string) => void;
}) {
  const hasImages = question.options.some((o) => o.imageUrl);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Part instruction */}
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Questions {part.questions[0].id}–{part.questions[part.questions.length - 1].id}
        </p>
        <p className="text-sm text-gray-700 mt-0.5">{part.instruction}</p>
      </div>

      {/* Question */}
      <div className="px-5 py-5">
        <div className="flex items-start gap-3 mb-5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-600 text-white text-xs font-black">
            {question.id}
          </span>
          <p className="text-base font-semibold text-gray-800 leading-snug">{question.text}</p>
        </div>

        {/* Options */}
        {hasImages ? (
          /* Ảnh 3 cột */
          <div className="grid grid-cols-3 gap-4">
            {question.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelect(opt.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-2 transition-all ${
                  selectedAnswer === opt.id
                    ? "border-primary-500 shadow-md"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <img
                  src={opt.imageUrl!}
                  alt={`Option ${opt.id}`}
                  className="w-full rounded-lg object-cover aspect-[4/3]"
                />
                <span
                  className={`h-5 w-5 rounded-full border-2 transition-all ${
                    selectedAnswer === opt.id
                      ? "border-primary-500 bg-primary-500"
                      : "border-gray-300 bg-white"
                  }`}
                />
              </button>
            ))}
          </div>
        ) : (
          /* Text options */
          <div className="flex flex-col gap-2">
            {question.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelect(opt.id)}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  selectedAnswer === opt.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition-all ${
                    selectedAnswer === opt.id
                      ? "border-primary-500 bg-primary-500 text-white"
                      : "border-gray-300 text-gray-500"
                  }`}
                >
                  {opt.id}
                </span>
                <span className="text-sm font-medium text-gray-700">{opt.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main Page
export default function ExamListeningPage() {
  const navigate = useNavigate();
  const { level, testId } = useParams<{ level: string; testId: string }>();

  const parts = A2_TEST1_LISTENING; // mockup — thay bằng API sau

  const [audioStarted, setAudioStarted] = useState(false);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [timeLeft, setTimeLeft]         = useState(TOTAL_SECONDS);
  const [activePartIdx, setActivePartIdx] = useState(0);
  const [activeQIdx, setActiveQIdx]     = useState(0);
  const [answers, setAnswers]           = useState<Record<number, string>>({});

  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // Đồng hồ đếm ngược — chỉ chạy khi đã bắt đầu và đang play
  useEffect(() => {
    if (!audioStarted) return;
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [audioStarted, isPlaying]);

  const handleStartAudio = useCallback(() => {
    setAudioStarted(true);
    setIsPlaying(true);
    if (MOCK_AUDIO_URL) {
      const audio = new Audio(MOCK_AUDIO_URL);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => setIsPlaying(false);
    }
  }, []);

  const handleToggleAudio = useCallback(() => {
    if (!audioRef.current) {
      setIsPlaying((v) => !v);
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const activePart = parts[activePartIdx];
  const activeQuestion = activePart?.questions[activeQIdx];

  function goNext() {
    const part = parts[activePartIdx];
    if (activeQIdx < part.questions.length - 1) {
      setActiveQIdx((i) => i + 1);
    } else if (activePartIdx < parts.length - 1) {
      setActivePartIdx((p) => p + 1);
      setActiveQIdx(0);
    }
  }

  function goPrev() {
    if (activeQIdx > 0) {
      setActiveQIdx((i) => i - 1);
    } else if (activePartIdx > 0) {
      setActivePartIdx((p) => p - 1);
      setActiveQIdx(parts[activePartIdx - 1].questions.length - 1);
    }
  }

  const isFirst = activePartIdx === 0 && activeQIdx === 0;
  const isLast  = activePartIdx === parts.length - 1 &&
                  activeQIdx === parts[parts.length - 1].questions.length - 1;

  return (
    <div className="flex flex-col h-screen bg-[#f0f0f0] overflow-hidden">
      {/* Header */}
      <ExamHeader
        timeLeft={timeLeft}
        isPlaying={isPlaying}
        audioStarted={audioStarted}
        onToggleAudio={handleToggleAudio}
      />

      {/* Nội dung chính */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Khung câu hỏi */}
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full bg-white rounded-xl shadow-sm overflow-hidden my-4 mx-4 relative">
          {/* Overlay Play */}
          {!audioStarted && (
            <AudioStartOverlay onPlay={handleStartAudio} />
          )}

          {activeQuestion && (
            <QuestionView
              part={activePart}
              question={activeQuestion}
              selectedAnswer={answers[activeQuestion.id] ?? null}
              onSelect={(optId) =>
                setAnswers((prev) => ({ ...prev, [activeQuestion.id]: optId }))
              }
            />
          )}

          {/* Nút Prev / Next */}
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 bg-white">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirst}
              className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <span className="text-xs text-gray-400 font-semibold">
              Question {activeQuestion?.id} / {parts.flatMap((p) => p.questions).length}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={isLast}
              className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 transition"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Part navigation bar */}
      <PartNavBar
        parts={parts}
        answers={answers}
        activePartIdx={activePartIdx}
        activeQIdx={activeQIdx}
        onGoToPart={(idx) => { setActivePartIdx(idx); setActiveQIdx(0); }}
      />
    </div>
  );
}
