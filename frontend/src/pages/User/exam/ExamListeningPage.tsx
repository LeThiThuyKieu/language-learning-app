import { useCallback, useEffect, useRef, useState } from "react";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { examService, type ExamPartDto, type ExamQuestionDto } from "@/services/examService";
import { Play, Volume2, ChevronLeft, ChevronRight, Check, Headphones, X } from "lucide-react";
import LessonExitModal from "@/components/user/learn/LessonExitModal.tsx";

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `0:${m}:${s}`;
}

/**
 * Parse mini-markdown: **text** → <strong>, \n → <br/>
 * Dùng cho instruction và các text field trong exam.
 */
function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\n)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part === "\n") return <br key={i} />;
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// Overlay Play
function AudioStartOverlay({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#5a5a5a]/90">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-white">
        <Headphones className="h-12 w-12 text-white" strokeWidth={1.5} />
      </div>
      <p className="max-w-lg text-center text-lg font-bold text-white leading-snug px-8 mb-3">
        Audio sẽ phát liên tục trong suốt bài thi. Bạn không thể dừng hoặc tua lại.
      </p>
      <p className="text-base font-semibold text-white mb-6">Nhấn Play để bắt đầu.</p>
      <button
        type="button"
        onClick={onPlay}
        className="flex items-center gap-3 rounded-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold px-12 py-3.5 text-base transition shadow-xl"
      >
        <Play className="h-5 w-5 fill-white" />
        Play
      </button>
    </div>
  );
}

// Header
function ExamHeader({
  timeLeft, isPlaying, audioStarted, timeHidden, onToggleTime, onExit,
}: {
  timeLeft: number; isPlaying: boolean; audioStarted: boolean;
  timeHidden: boolean; onToggleTime: () => void; onExit: () => void;
}) {
  const urgent = timeLeft < 300;
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onExit}
          className="flex items-center justify-center h-9 w-9 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition">
          <X className="h-5 w-5" strokeWidth={2.5} />
        </button>
        {audioStarted && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold border-2 ${
            isPlaying ? "border-primary-400 bg-primary-50 text-primary-600" : "border-gray-300 bg-gray-50 text-gray-400"
          }`}>
            <Volume2 className="h-4 w-4" />
            {isPlaying ? "Audio đang phát" : "Đã kết thúc"}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-extrabold text-white ${urgent ? "bg-red-700" : "bg-red-500"}`}>
          {timeHidden ? "Time left" : `Time left ${formatTime(timeLeft)}`}
        </div>
        <button type="button" onClick={onToggleTime}
          className="rounded-lg border-2 border-blue-400 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 transition bg-white">
          {timeHidden ? "Show" : "Hide"}
        </button>
      </div>
    </div>
  );
}

// Part Nav Bar
function PartNavBar({
  parts, answers, bookmarks, activePartIdx, activeQIdx, focusBlankNum,
  onGoToPart, onGoToQuestion, onSubmit,
}: {
  parts: ExamPartDto[]; answers: Record<string, string>;
  bookmarks: Set<string>; activePartIdx: number; activeQIdx: number;
  focusBlankNum: number | null;
  onGoToPart: (p: number) => void; onGoToQuestion: (p: number, q: number, blankNum?: number) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-stretch border-t-2 border-gray-300 bg-white">
      {parts.map((part, pIdx) => {
        const answered = part.questions.reduce((sum, q) => {
          const start = q.questionNumberStart ?? q.questionNumber ?? 0;
          const end   = q.questionNumberEnd   ?? q.questionNumber ?? start;
          const nums  = Array.from({ length: end - start + 1 }, (_, i) => start + i);
          if (nums.length > 1) {
            // FILL_IN_FORM: đếm từng blank có giá trị
            let parsedAns: Record<string, string> = {};
            try { parsedAns = answers[q.mongoDocId] ? JSON.parse(answers[q.mongoDocId]) : {}; } catch { /* ignore */ }
            return sum + nums.filter((n) => !!parsedAns[n]).length;
          }
          return sum + (answers[q.mongoDocId] ? 1 : 0);
        }, 0);
        // Tổng số câu thực tế (FILL_IN_FORM 1 object có thể = nhiều câu)
        const total = part.questions.reduce((sum, q) => {
          const start = q.questionNumberStart ?? q.questionNumber ?? 0;
          const end   = q.questionNumberEnd   ?? q.questionNumber ?? start;
          return sum + (end - start + 1);
        }, 0);
        const isActive = pIdx === activePartIdx;
        return (
          <button key={part.partNumber} type="button" onClick={() => onGoToPart(pIdx)}
            className={`flex flex-1 items-center justify-center gap-2 border-r border-gray-200 px-3 py-4 text-sm font-bold transition select-none ${
              isActive ? "bg-primary-50 text-primary-700" : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}>
            <span className={`whitespace-nowrap ${isActive ? "font-extrabold text-primary-700" : "font-medium text-gray-500"}`}>
              Part {part.partNumber}
            </span>
            {isActive ? (
              <span className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                {part.questions.flatMap((q, qIdx) => {
                  const isCurrQ = qIdx === activeQIdx;
                  const isBookmarked = bookmarks.has(q.mongoDocId);
                  // FILL_IN_FORM / MATCHING có thể có range → expand ra từng số
                  const start = q.questionNumberStart ?? q.questionNumber ?? 0;
                  const end   = q.questionNumberEnd   ?? q.questionNumber ?? start;
                  const nums  = Array.from({ length: end - start + 1 }, (_, i) => start + i);

                  // Parse answer dạng JSON nếu là range question
                  let parsedAnswer: Record<string, string> = {};
                  if (nums.length > 1 && answers[q.mongoDocId]) {
                    try { parsedAnswer = JSON.parse(answers[q.mongoDocId]); } catch { /* ignore */ }
                  }

                  return nums.map((num) => {
                    // isAnswered: với range thì check từng num, với single thì check mongoDocId
                    const isAnswered = nums.length > 1
                      ? !!parsedAnswer[num]
                      : !!answers[q.mongoDocId];

                    // isCurrent: với range, active là ô đang focused (focusBlankNum) hoặc ô đầu nếu chưa focus
                    const isCurrent = isCurrQ && (
                      nums.length > 1
                        ? (focusBlankNum != null ? num === focusBlankNum : num === start)
                        : true
                    );

                    return (
                      <span key={`${q.mongoDocId}-${num}`} className="relative">
                        {isBookmarked && num === start && (
                          <svg className="absolute -top-3.5 left-1/2 -translate-x-1/2 h-3 w-3 fill-primary-500 text-primary-500"
                            stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                          </svg>
                        )}
                        <span onClick={(e) => { e.stopPropagation(); onGoToQuestion(pIdx, qIdx, nums.length > 1 ? num : undefined); }}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-extrabold cursor-pointer transition ${
                            isCurrent ? "bg-primary-600 text-white ring-2 ring-primary-300"
                            : isAnswered ? "bg-primary-100 text-primary-700"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}>
                          {num}
                        </span>
                      </span>
                    );
                  });
                })}
              </span>
            ) : (
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{answered} of {total}</span>
            )}
          </button>
        );
      })}
      <button type="button" onClick={onSubmit}
        className="flex items-center justify-center px-5 bg-primary-600 hover:bg-primary-700 text-white transition shrink-0 border-l-2 border-primary-700">
        <Check className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

// FillInFormView — tách ra để dùng hooks hợp lệ
function FillInFormView({ lines, blankCounterStart, parsedAnswer, formTitle, focusBlankNum, blanksOptions, onBlankChange, onFocusBlank, instructionBox }: {
  lines: string[];
  blankCounterStart: number;
  parsedAnswer: Record<string, string>;
  formTitle?: string | null;
  focusBlankNum?: number | null;
  blanksOptions?: Array<{ number: number; options: string[] }> | null;
  onBlankChange: (num: number, val: string) => void;
  onFocusBlank: (num: number) => void;
  instructionBox: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusBlankNum == null) return;
    const input = containerRef.current?.querySelector<HTMLInputElement>(
      `input[data-blank-num="${focusBlankNum}"]`
    );
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusBlankNum]);

  let blankCounter = blankCounterStart;

  return (
    <div className="flex-1 overflow-y-auto bg-[#dce9f0] p-5" ref={containerRef}>
      {instructionBox}
      <div className="max-w-2xl">
        {formTitle && (
          <h2 className="text-xl font-extrabold text-gray-900 mb-5 border-b pb-3 border-gray-300">
            {formTitle}
          </h2>
        )}
        <div className="flex flex-col gap-4">
          {lines.map((line, lineIdx) => {
            const segments = line.split("____");
            if (segments.length === 1) {
              return (
                <p key={lineIdx} className="text-base text-gray-700">
                  <RichText text={line} />
                </p>
              );
            }
            const currentNum = blankCounter++;
            return (
              <div key={lineIdx} className="flex items-center flex-wrap gap-2 text-base text-gray-800">
                {segments.map((seg, sIdx) => (
                  <span key={sIdx} className="flex items-center gap-2">
                    {seg && <RichText text={seg} />}
                    {sIdx < segments.length - 1 && (
                      <span className="relative inline-flex items-center">
                        <span className="absolute -top-4 left-2 text-[11px] font-black text-primary-600 select-none">
                          {currentNum}
                        </span>
                        {(() => {
                          const blankOpts = blanksOptions?.find((b) => b.number === currentNum)?.options;
                          if (blankOpts && blankOpts.length > 0) {
                            // Dropdown select
                            return (
                              <select
                                data-blank-num={currentNum}
                                value={parsedAnswer[currentNum] ?? ""}
                                onChange={(e) => onBlankChange(currentNum, e.target.value)}
                                onFocus={() => onFocusBlank(currentNum)}
                                className="w-36 rounded-md border-2 border-blue-300 bg-blue-50 px-2 py-1.5 text-base font-semibold text-gray-800 focus:border-primary-500 focus:bg-white focus:outline-none transition cursor-pointer"
                              >
                                <option value="" disabled />
                                {blankOpts.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            );
                          }
                          return (
                            <input
                              type="text"
                              data-blank-num={currentNum}
                              value={parsedAnswer[currentNum] ?? ""}
                              onChange={(e) => onBlankChange(currentNum, e.target.value)}
                              onFocus={() => onFocusBlank(currentNum)}
                              className="w-36 rounded-md border-2 border-blue-300 bg-blue-50 px-3 py-1.5 text-base font-semibold text-gray-800 focus:border-primary-500 focus:bg-white focus:outline-none transition"
                            />
                          );
                        })()}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

//Question View — hỗ trợ MULTIPLE_CHOICE, FILL_IN_FORM, MATCHING
function QuestionView({
  question, partQuestions, answer, isBookmarked, focusBlankNum, onAnswer, onToggleBookmark, onFocusBlank,
}: {
  question: ExamQuestionDto;
  partQuestions: ExamQuestionDto[];
  answer: string;
  isBookmarked: boolean;
  focusBlankNum?: number | null;
  onAnswer: (val: string) => void;
  onToggleBookmark: () => void;
  onFocusBlank: (num: number) => void;
}) {
  // Instruction và range lấy từ câu đầu tiên của part (câu duy nhất có instruction)
  const firstQ = partQuestions[0] ?? question;
  const partInstruction = firstQ.instruction ?? null;
  const partStart = firstQ.questionNumberStart ?? firstQ.questionNumber;
  const partEnd   = partQuestions[partQuestions.length - 1]?.questionNumber
                    ?? partQuestions[partQuestions.length - 1]?.questionNumberEnd
                    ?? partStart;
  const rangeLabel = partStart === partEnd
    ? `Question ${partStart}`
    : `Questions ${partStart}–${partEnd}`;

  const InstructionBox = () =>
    partInstruction ? (
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 mb-5 shadow-sm">
        <p className="text-base font-extrabold text-gray-800 mb-1">{rangeLabel}</p>
        <p className="text-base text-gray-700 leading-relaxed">
          <RichText text={partInstruction} />
        </p>
      </div>
    ) : null;

  const BookmarkBtn = () => (
    <button type="button" onClick={onToggleBookmark} className="shrink-0 mr-2 transition-colors">
      <svg className={`h-6 w-6 transition-colors ${isBookmarked ? "fill-primary-500 text-primary-500" : "fill-none text-gray-400 hover:text-gray-600"}`}
        stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    </button>
  );

  // MULTIPLE_CHOICE
  if (question.questionType === "MULTIPLE_CHOICE") {
    const hasImages = (question.options ?? []).some((o) => o.image_url != null);
    return (
      <div className="flex-1 overflow-y-auto bg-[#dce9f0] p-5">
        <InstructionBox />
        <div className="flex items-start gap-3 mb-5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary-600 text-white text-xs font-black">
            {question.questionNumber}
          </span>
          <p className="text-base font-semibold text-gray-800 leading-snug flex-1">{question.text}</p>
          <BookmarkBtn />
        </div>
        {hasImages ? (
          <div className="flex items-start gap-5 flex-wrap">
            {(question.options ?? []).map((opt) => (
              <button key={opt.id} type="button" onClick={() => onAnswer(opt.id)} className="flex flex-col items-center gap-2 group">
                <div className={`overflow-hidden rounded-lg border-4 transition-all bg-white ${
                  answer === opt.id ? "border-primary-500 shadow-lg" : "border-transparent group-hover:border-gray-300"
                }`} style={{ width: 310, height: 230 }}>
                  <img src={opt.image_url!} alt={`Option ${opt.id}`} className="w-full h-full object-cover" />
                </div>
                {opt.text && <span className="text-sm font-semibold text-gray-700">{opt.text}</span>}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-lg">
            {(question.options ?? []).map((opt) => (
              <button key={opt.id} type="button" onClick={() => onAnswer(opt.id)}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  answer === opt.id ? "border-primary-500 bg-primary-50" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition-all ${
                  answer === opt.id ? "border-primary-500 bg-primary-500 text-white" : "border-gray-300 text-gray-500"
                }`}>{opt.id}</span>
                <span className="text-sm font-medium text-gray-700">{opt.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // FILL_IN_FORM
  if (question.questionType === "FILL_IN_FORM") {
    const lines = (question.formContent ?? "").split("\n");
    let parsedAnswer: Record<string, string> = {};
    try { parsedAnswer = answer ? JSON.parse(answer) : {}; } catch { /* ignore */ }

    const handleBlankChange = (num: number, val: string) => {
      const updated = { ...parsedAnswer, [num]: val };
      onAnswer(JSON.stringify(updated));
    };

    return (
      <FillInFormView
        lines={lines}
        blankCounterStart={question.questionNumberStart ?? 1}
        parsedAnswer={parsedAnswer}
        formTitle={question.formTitle}
        focusBlankNum={focusBlankNum}
        blanksOptions={question.blanksOptions as Array<{ number: number; options: string[] }> | null}
        onBlankChange={handleBlankChange}
        onFocusBlank={(num) => onFocusBlank(num)}
        instructionBox={<InstructionBox />}
      />
    );
  }

  // MATCHING
  if (question.questionType === "MATCHING") {
    let parsedAnswer: Record<string, string> = {};
    try { parsedAnswer = answer ? JSON.parse(answer) : {}; } catch { /* ignore */ }

    const handleDrop = (questionNum: number, rightId: string) => {
      // Nếu rightId đã được dùng ở ô khác → hoán đổi
      const prevOwner = Object.entries(parsedAnswer).find(([, v]) => v === rightId)?.[0];
      const updated = { ...parsedAnswer };
      if (prevOwner !== undefined) delete updated[prevOwner];
      // Nếu ô đích đang có item → trả item đó về pool (xóa)
      updated[questionNum] = rightId;
      onAnswer(JSON.stringify(updated));
    };

    const handleRemove = (questionNum: number) => {
      const updated = { ...parsedAnswer };
      delete updated[questionNum];
      onAnswer(JSON.stringify(updated));
    };

    return (
      <div className="flex-1 overflow-y-auto bg-[#dce9f0] p-5">
        <InstructionBox />
        {question.instructionDetail && (
          <p className="text-sm text-gray-600 mb-4 italic">{question.instructionDetail}</p>
        )}
        <div className="flex gap-10 flex-wrap items-start">
          {/* Left items — drop zones */}
          <div className="flex flex-col gap-3">
            {(question.leftItems ?? []).map((item) => {
              const qNum = item.question_number as number;
              const selected = parsedAnswer[qNum];
              return (
                <div key={qNum} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary-600 text-white text-xs font-black">
                    {qNum}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 w-24">{item.label as string}</span>
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const rightId = e.dataTransfer.getData("rightId");
                      if (rightId) handleDrop(qNum, rightId);
                    }}
                    className={`relative rounded-lg border-2 min-w-[100px] h-9 flex items-center justify-center transition-all ${
                      selected
                        ? "border-primary-500 bg-primary-50"
                        : "border-dashed border-gray-400 bg-white/50"
                    }`}
                  >
                    {selected ? (
                      <>
                        <span className="text-sm font-bold text-primary-700 px-3">{selected}</span>
                        <button
                          type="button"
                          onClick={() => handleRemove(qNum)}
                          className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-gray-400 hover:bg-red-500 text-white flex items-center justify-center text-[10px] font-black transition"
                        >×</button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 select-none">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right items — draggable pool */}
          <div className="flex flex-col gap-2">
            {(question.rightItems ?? []).map((item) => {
              const isUsed = Object.values(parsedAnswer).includes(item.id);
              return (
                <div
                  key={item.id}
                  draggable={!isUsed}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("rightId", item.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-sm font-semibold select-none transition ${
                    isUsed
                      ? "border-gray-200 bg-gray-100 text-gray-400 opacity-50 cursor-default"
                      : "border-gray-300 bg-white hover:border-primary-400 hover:bg-primary-50 text-gray-700 cursor-grab active:cursor-grabbing active:border-primary-500 active:shadow-md"
                  }`}
                >
                  <span className="font-black text-gray-500">{item.id}</span>
                  <span>{item.label as string}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-[#dce9f0]">
      <p className="text-gray-400 text-sm">Unsupported question type: {question.questionType}</p>
    </div>
  );
}

// Main Page
export default function ExamListeningPage() {
  const navigate = useNavigate();
  const { level: _level, testId } = useParams<{ level: string; testId: string }>();

  const [parts, setParts] = useState<ExamPartDto[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(30 * 60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [audioStarted, setAudioStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [timeHidden, setTimeHidden] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activePartIdx, setActivePartIdx] = useState(0);
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [focusBlankNum, setFocusBlankNum] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lấy dữ liệu paper từ API
  useEffect(() => {
    if (!testId) return;
    const numericTestId = parseInt(testId.replace(/\D/g, ""), 10);
    if (isNaN(numericTestId)) { setError("Test ID không hợp lệ."); setLoading(false); return; }

    examService
      .getPaper(numericTestId, "LISTENING")
      .then((paper) => {
        setParts(paper.parts);
        setAudioUrl(paper.audioUrl);
        const secs = (paper.durationMinutes ?? 30) * 60;
        setDurationSeconds(secs);
        setTimeLeft(secs);
      })
      .catch(() => setError("Không thể tải bài thi. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, [testId]);

  // Timer
  useEffect(() => {
    if (!audioStarted) return;
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [audioStarted, isPlaying]);

  const handleStartAudio = useCallback(() => {
    setAudioStarted(true);
    setIsPlaying(true);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  // Dừng audio khi component unmount (navigate đi nơi khác)
  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  const activePart = parts[activePartIdx];
  const activeQuestion = activePart?.questions[activeQIdx];
  const isFirst = activePartIdx === 0 && activeQIdx === 0;
  const isLast = parts.length > 0 &&
    activePartIdx === parts.length - 1 &&
    activeQIdx === parts[parts.length - 1].questions.length - 1;

  function goNext() {
    if (!activePart) return;
    if (activeQIdx < activePart.questions.length - 1) setActiveQIdx((i) => i + 1);
    else if (activePartIdx < parts.length - 1) { setActivePartIdx((p) => p + 1); setActiveQIdx(0); }
  }
  function goPrev() {
    if (activeQIdx > 0) setActiveQIdx((i) => i - 1);
    else if (activePartIdx > 0) {
      setActivePartIdx((p) => p - 1);
      setActiveQIdx(parts[activePartIdx - 1].questions.length - 1);
    }
  }
  function toggleBookmark(key: string) {
    setBookmarks((prev) => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#e8eef2]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Đang tải bài thi…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#e8eef2]">
        <div className="rounded-2xl bg-white p-8 shadow-lg text-center max-w-sm">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button type="button" onClick={() => navigate(-1)}
            className="rounded-xl bg-primary-600 text-white px-6 py-2.5 text-sm font-bold hover:bg-primary-700 transition">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#e8eef2] overflow-hidden">
      <ExamHeader
        timeLeft={timeLeft} isPlaying={isPlaying} audioStarted={audioStarted}
        timeHidden={timeHidden} onToggleTime={() => setTimeHidden((v) => !v)}
        onExit={() => setShowExitModal(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!audioStarted && <AudioStartOverlay onPlay={handleStartAudio} />}

        {activeQuestion && (
          <QuestionView
            question={activeQuestion}
            partQuestions={activePart?.questions ?? []}
            answer={answers[activeQuestion.mongoDocId] ?? ""}
            isBookmarked={bookmarks.has(activeQuestion.mongoDocId)}
            focusBlankNum={focusBlankNum}
            onAnswer={(val) => setAnswers((prev) => ({ ...prev, [activeQuestion.mongoDocId]: val }))}
            onToggleBookmark={() => toggleBookmark(activeQuestion.mongoDocId)}
            onFocusBlank={(num) => setFocusBlankNum(num)}
          />
        )}

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

      {parts.length > 0 && (
        <PartNavBar
          parts={parts} answers={answers} bookmarks={bookmarks}
          activePartIdx={activePartIdx} activeQIdx={activeQIdx}
          focusBlankNum={focusBlankNum}
          onGoToPart={(p) => { setActivePartIdx(p); setActiveQIdx(0); setFocusBlankNum(null); }}
          onGoToQuestion={(p, q, blankNum) => { setActivePartIdx(p); setActiveQIdx(q); setFocusBlankNum(blankNum ?? null); }}
          onSubmit={() => setShowSubmitModal(true)}
        />
      )}

      {/* Submit modal */}
      {showSubmitModal && (() => {
        const totalQ = parts.flatMap((p) => p.questions).length;
        const answered = Object.keys(answers).length;
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
                <p className="text-sm text-gray-600 mb-4">Sau khi nộp, bạn sẽ không thể thay đổi câu trả lời.</p>
                {unanswered > 0
                  ? <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm font-semibold text-yellow-800">Câu chưa trả lời: {unanswered}</div>
                  : <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-semibold text-green-700">Bạn đã trả lời tất cả {totalQ} câu hỏi.</div>
                }
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowSubmitModal(false)}
                  className="rounded-xl border-2 border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                  Tiếp tục làm bài
                </button>
                <button type="button" onClick={() => { setShowSubmitModal(false); navigate(`/exam/${_level}/${testId}/reading-writing`); }}
                  className="rounded-xl bg-primary-600 hover:bg-primary-700 px-5 py-2.5 text-sm font-extrabold text-white transition shadow-md">
                  Nộp bài
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <LessonExitModal
        open={showExitModal} onContinue={() => setShowExitModal(false)} onExit={() => { stopAudio(); navigate(-1); }}
        continueButtonText="Tiếp tục thi"
        bodyText="Đợi chút! Bạn sẽ mất hết tiến trình thi này nếu thoát bây giờ."
      />
    </div>
  );
}
