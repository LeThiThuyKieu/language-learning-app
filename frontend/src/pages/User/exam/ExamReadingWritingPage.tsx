import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  A2_TEST1_READING_WRITING,
  type RWPart,
  type RWQuestion,
} from "@/data/examMockData";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import LessonExitModal from "@/components/user/learn/LessonExitModal.tsx";

const TOTAL_SECONDS = 60 * 60; // 1 giờ

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `0:${m}:${s}`;
}

// Overlay "Chuẩn bị làm Reading & Writing"
function StartOverlay({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#5a5a5a]/90">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-white">
        <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>
      <p className="max-w-lg text-center text-lg font-bold text-white leading-snug px-8 mb-3">
        Bạn đã hoàn thành phần Listening.<br />Tiếp theo là phần <span className="text-primary-300">Reading and Writing</span>.
      </p>
      <p className="text-base font-semibold text-white/90 mb-6">Thời gian: 1 giờ. Nhấn Bắt đầu để tiếp tục.</p>
      <button
        type="button"
        onClick={onStart}
        className="flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-bold px-12 py-3.5 text-base transition shadow-xl"
      >
        Bắt đầu
      </button>
    </div>
  );
}

// Header
function ExamHeader({
  timeLeft,
  timeHidden,
  onToggleTime,
  onExit,
}: {
  timeLeft: number;
  timeHidden: boolean;
  onToggleTime: () => void;
  onExit: () => void;
}) {
  const urgent = timeLeft < 300;
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
      <button type="button" onClick={onExit} className="flex items-center justify-center h-9 w-9 rounded-xl text-gray-500 hover:bg-gray-100 transition">
        <X className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <div className="flex items-center gap-2">
        <div className={`rounded-lg px-5 py-2 text-sm font-extrabold text-white ${urgent ? "bg-red-700" : "bg-red-500"}`}>
          {timeHidden ? "Time left" : `Time left ${formatTime(timeLeft)}`}
        </div>
        <button type="button" onClick={onToggleTime} className="rounded-lg border-2 border-blue-400 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 transition bg-white">
          {timeHidden ? "Show" : "Hide"}
        </button>
      </div>
    </div>
  );
}

// Part nav bar
function PartNavBar({
  parts, answers, bookmarks, activePartIdx, activeQIdx,
  onGoToPart, onGoToQuestion, onSubmit,
}: {
  parts: RWPart[];
  answers: Record<number, string>;
  bookmarks: Set<number>;
  activePartIdx: number;
  activeQIdx: number;
  onGoToPart: (p: number) => void;
  onGoToQuestion: (p: number, q: number) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-stretch border-t-2 border-gray-300 bg-white">
      {parts.map((part, pIdx) => {
        const answered = part.questions.filter((q) => answers[q.id]).length;
        const isActive = pIdx === activePartIdx;
        return (
          <button key={part.partNumber} type="button" onClick={() => onGoToPart(pIdx)}
            className={`flex flex-1 items-center justify-center gap-2 border-r border-gray-200 px-3 py-4 text-sm font-bold transition select-none ${
              isActive ? "bg-primary-50 text-primary-700" : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span className={`whitespace-nowrap ${isActive ? "font-extrabold text-primary-700" : "font-medium text-gray-500"}`}>
              Part {part.partNumber}
            </span>
            {isActive ? (
              <span className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                {part.questions.length > 1 && part.questions.map((q, qIdx) => {
                  const isCurrent   = qIdx === activeQIdx;
                  const isBookmarked = bookmarks.has(q.id);
                  return (
                    <span key={q.id} className="relative">
                      {isBookmarked && (
                        <svg className="absolute -top-3.5 left-1/2 -translate-x-1/2 h-3 w-3 fill-primary-500 text-primary-500" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                      )}
                      <span onClick={(e) => { e.stopPropagation(); onGoToQuestion(pIdx, qIdx); }}
                        className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-extrabold cursor-pointer transition ${
                          isCurrent ? "bg-primary-600 text-white ring-2 ring-primary-300"
                          : answers[q.id] ? "bg-primary-100 text-primary-700"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {part.questions[0].id + qIdx}
                      </span>
                    </span>
                  );
                })}
              </span>
            ) : (
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{answered} of {part.questions.length}</span>
            )}
          </button>
        );
      })}
      <button type="button" onClick={onSubmit}
        className="flex items-center justify-center px-5 bg-primary-600 hover:bg-primary-700 text-white transition shrink-0 border-l-2 border-primary-700"
      >
        <Check className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

// Question View
function QuestionView({
  part, question, answer, isBookmarked, onAnswer, onToggleBookmark,
}: {
  part: RWPart;
  question: RWQuestion;
  answer: string;
  isBookmarked: boolean;
  onAnswer: (val: string) => void;
  onToggleBookmark: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#dce9f0] p-5">
      {/* Instruction */}
      <div className="bg-white border border-gray-300 rounded-lg px-5 py-3 mb-4 shadow-sm">
        <p className="text-sm font-extrabold text-gray-700">
          {part.questions.length === 1
            ? `Question ${part.questions[0].id}`
            : `Questions ${part.questions[0].id}–${part.questions[part.questions.length - 1].id}`
          }
        </p>
        <p className="text-base text-gray-700 mt-0.5">{part.instruction}</p>
      </div>

      {/* Passage (notice / normal) */}
      {question.passage?.text && (
        <div className={`mb-4 ${
          question.passage.style === "notice"
            ? "inline-block border-2 border-gray-800 bg-white rounded px-5 py-4 font-semibold text-gray-900 whitespace-pre-line"
            : "bg-white rounded-lg px-5 py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line border border-gray-200"
        }`}>
          {question.passage.text}
        </div>
      )}

      {/* Question + bookmark */}
      <div className="flex items-start gap-3 mb-5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary-600 text-white text-xs font-black">
          {question.id}
        </span>
        <p className="text-base font-semibold text-gray-800 leading-snug flex-1">{question.text}</p>
        <button type="button" onClick={onToggleBookmark} className="shrink-0 mr-2 transition-colors">
          <svg className={`h-6 w-6 transition-colors ${isBookmarked ? "fill-primary-500 text-primary-500" : "fill-none text-gray-400 hover:text-gray-600"}`}
            stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </button>
      </div>

      {/* MULTIPLE_CHOICE */}
      {question.type === "MULTIPLE_CHOICE" && (
        <div className="flex flex-col gap-2 max-w-xl">
          {question.options.map((opt) => (
            <button key={opt.id} type="button" onClick={() => onAnswer(opt.id)}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                answer === opt.id ? "border-primary-500 bg-primary-50" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition-all ${
                answer === opt.id ? "border-primary-500 bg-primary-500 text-white" : "border-gray-300 text-gray-500"
              }`}>{opt.id}</span>
              <span className="text-sm font-medium text-gray-700">{opt.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* FILL_IN */}
      {question.type === "FILL_IN" && (
        <input
          type="text"
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Nhập câu trả lời..."
          className="w-full max-w-sm rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 focus:border-primary-400 focus:outline-none transition"
        />
      )}

      {/* SHORT_WRITE */}
      {question.type === "SHORT_WRITE" && (
        <div>
          <textarea
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            rows={6}
            placeholder="Viết câu trả lời của bạn tại đây..."
            className="w-full max-w-2xl rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 focus:border-primary-400 focus:outline-none transition resize-none"
          />
          <p className="mt-1 text-xs text-gray-400">{answer.split(/\s+/).filter(Boolean).length} từ</p>
        </div>
      )}
    </div>
  );
}

// Main Page
export default function ExamReadingWritingPage() {
  const navigate = useNavigate();
  const { level: _level, testId: _testId } = useParams<{ level: string; testId: string }>();

  const parts = A2_TEST1_READING_WRITING;

  const [started, setStarted]           = useState(false);
  const [timeLeft, setTimeLeft]         = useState(TOTAL_SECONDS);
  const [timeHidden, setTimeHidden]     = useState(false);
  const [showExitModal, setShowExitModal]     = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activePartIdx, setActivePartIdx]     = useState(0);
  const [activeQIdx, setActiveQIdx]           = useState(0);
  const [answers, setAnswers]                 = useState<Record<number, string>>({});
  const [bookmarks, setBookmarks]             = useState<Set<number>>(new Set());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started]);

  const activePart     = parts[activePartIdx];
  const activeQuestion = activePart?.questions[activeQIdx];

  const isFirst = activePartIdx === 0 && activeQIdx === 0;
  const isLast  = activePartIdx === parts.length - 1 && activeQIdx === parts[parts.length - 1].questions.length - 1;

  function goNext() {
    if (activeQIdx < activePart.questions.length - 1) setActiveQIdx((i) => i + 1);
    else if (activePartIdx < parts.length - 1) { setActivePartIdx((p) => p + 1); setActiveQIdx(0); }
  }
  function goPrev() {
    if (activeQIdx > 0) setActiveQIdx((i) => i - 1);
    else if (activePartIdx > 0) { setActivePartIdx((p) => p - 1); setActiveQIdx(parts[activePartIdx - 1].questions.length - 1); }
  }
  function toggleBookmark(id: number) {
    setBookmarks((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  return (
    <div className="flex flex-col h-screen bg-[#e8eef2] overflow-hidden">
      <ExamHeader
        timeLeft={timeLeft}
        timeHidden={timeHidden}
        onToggleTime={() => setTimeHidden((v) => !v)}
        onExit={() => setShowExitModal(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Overlay bắt đầu */}
        {!started && <StartOverlay onStart={() => setStarted(true)} />}

        {activeQuestion && (
          <QuestionView
            part={activePart}
            question={activeQuestion}
            answer={answers[activeQuestion.id] ?? ""}
            isBookmarked={bookmarks.has(activeQuestion.id)}
            onAnswer={(val) => setAnswers((prev) => ({ ...prev, [activeQuestion.id]: val }))}
            onToggleBookmark={() => toggleBookmark(activeQuestion.id)}
          />
        )}

        {/* Prev / Next lơ lửng */}
        <div className="fixed bottom-20 right-4 z-40 flex items-center shadow-lg rounded-lg overflow-hidden">
          <button type="button" onClick={goPrev} disabled={isFirst}
            className="flex items-center justify-center h-11 w-11 bg-gray-500 hover:bg-gray-600 disabled:opacity-30 text-white transition">
            <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <button type="button" onClick={goNext} disabled={isLast}
            className="flex items-center justify-center h-11 w-11 bg-primary-600 hover:bg-primary-700 disabled:opacity-30 text-white transition">
            <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <PartNavBar
        parts={parts}
        answers={answers}
        bookmarks={bookmarks}
        activePartIdx={activePartIdx}
        activeQIdx={activeQIdx}
        onGoToPart={(p) => { setActivePartIdx(p); setActiveQIdx(0); }}
        onGoToQuestion={(p, q) => { setActivePartIdx(p); setActiveQIdx(q); }}
        onSubmit={() => setShowSubmitModal(true)}
      />

      {/* Modal nộp bài */}
      {showSubmitModal && (() => {
        const totalQ     = parts.flatMap((p) => p.questions).length;
        const answered   = Object.keys(answers).length;
        const unanswered = totalQ - answered;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSubmitModal(false)} />
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-extrabold text-gray-900">Nộp bài và kết thúc?</h2>
                <button type="button" onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-gray-600 mb-4">Sau khi nộp bài, bạn sẽ không thể thay đổi câu trả lời nữa.</p>
                {unanswered > 0 ? (
                  <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm font-semibold text-yellow-800">
                    Câu chưa trả lời: {unanswered}
                  </div>
                ) : (
                  <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-semibold text-green-700">
                    Bạn đã trả lời tất cả {totalQ} câu hỏi.
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowSubmitModal(false)}
                  className="rounded-xl border-2 border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                  Tiếp tục làm bài
                </button>
                <button type="button" onClick={() => { setShowSubmitModal(false); navigate(`/exam/${_level}/${_testId}/speaking`); }}
                  className="rounded-xl bg-primary-600 hover:bg-primary-700 px-5 py-2.5 text-sm font-extrabold text-white transition shadow-md">
                  Nộp bài
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <LessonExitModal
        open={showExitModal}
        onContinue={() => setShowExitModal(false)}
        onExit={() => navigate(-1)}
        continueButtonText="Tiếp tục thi"
        bodyText="Đợi chút, đừng đi mà! Bạn sẽ mất hết tiến trình thi này nếu thoát bây giờ."
      />
    </div>
  );
}
