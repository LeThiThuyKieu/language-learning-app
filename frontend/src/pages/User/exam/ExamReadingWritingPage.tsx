import { useEffect, useRef, useState } from "react";import { useNavigate, useParams } from "react-router-dom";
import { examService, type ExamPartDto, type ExamQuestionDto } from "@/services/examService";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import LessonExitModal from "@/components/user/learn/LessonExitModal.tsx";

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `0:${m}:${s}`;
}

/** Parse **bold** và \n → <br/> */
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
      <p className="text-base font-semibold text-white/90 mb-6">Nhấn Bắt đầu để tiếp tục.</p>
      <button type="button" onClick={onStart}
        className="flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-bold px-12 py-3.5 text-base transition shadow-xl">
        Bắt đầu
      </button>
    </div>
  );
}

function ExamHeader({ timeLeft, timeHidden, onToggleTime, onExit }: {
  timeLeft: number; timeHidden: boolean; onToggleTime: () => void; onExit: () => void;
}) {
  const urgent = timeLeft < 300;
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
      <button type="button" onClick={onExit}
        className="flex items-center justify-center h-9 w-9 rounded-xl text-gray-500 hover:bg-gray-100 transition">
        <X className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <div className="flex items-center gap-2">
        <div className={`rounded-lg px-5 py-2 text-sm font-extrabold text-white ${urgent ? "bg-red-700" : "bg-red-500"}`}>
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
        // Đếm answered — expand range cho FILL_IN_FORM
        const answered = part.questions.reduce((sum, q) => {
          const start = q.questionNumberStart ?? q.questionNumber ?? 0;
          const end   = q.questionNumberEnd   ?? q.questionNumber ?? start;
          const nums  = Array.from({ length: end - start + 1 }, (_, i) => start + i);
          if (nums.length > 1) {
            let parsedAns: Record<string, string> = {};
            try { parsedAns = answers[q.mongoDocId] ? JSON.parse(answers[q.mongoDocId]) : {}; } catch { /* ignore */ }
            return sum + nums.filter((n) => !!parsedAns[n]).length;
          }
          return sum + (answers[q.mongoDocId] ? 1 : 0);
        }, 0);
        const total = part.questions.reduce((sum, q) => {
          const start = q.questionNumberStart ?? q.questionNumber ?? 0;
          const end   = q.questionNumberEnd   ?? q.questionNumber ?? start;
          return sum + (end - start + 1);
        }, 0);
        const isActive = pIdx === activePartIdx;
        return (
          <button key={part.partNumber} type="button" onClick={() => onGoToPart(pIdx)}
            className={`flex flex-1 items-center justify-center gap-2 border-r border-gray-200 px-3 py-4 text-sm font-bold transition select-none ${
              isActive ? "bg-primary-50 text-primary-700" : "bg-white text-gray-500 hover:bg-gray-50"
            }`}>
            <span className={`whitespace-nowrap ${isActive ? "font-extrabold text-primary-700" : "font-medium text-gray-500"}`}>
              Part {part.partNumber}
            </span>
            {isActive ? (
              <span className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                {part.questions.flatMap((q, qIdx) => {
                  const isCurrQ = qIdx === activeQIdx;
                  const isBookmarked = bookmarks.has(q.mongoDocId);
                  const start = q.questionNumberStart ?? q.questionNumber ?? 0;
                  const end   = q.questionNumberEnd   ?? q.questionNumber ?? start;
                  const nums  = Array.from({ length: end - start + 1 }, (_, i) => start + i);

                  let parsedAns: Record<string, string> = {};
                  if (nums.length > 1 && answers[q.mongoDocId]) {
                    try { parsedAns = JSON.parse(answers[q.mongoDocId]); } catch { /* ignore */ }
                  }

                  return nums.map((num) => {
                    const isAnswered = nums.length > 1 ? !!parsedAns[num] : !!answers[q.mongoDocId];
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

function QuestionView({
  question, partQuestions, answer, isBookmarked, onAnswer, onToggleBookmark,
  answers, bookmarks, onAnswerFor, onToggleBookmarkFor, activeQIdx, focusBlankNum, onFocusBlank,
}: {
  question: ExamQuestionDto;
  partQuestions: ExamQuestionDto[];
  answer: string;
  isBookmarked: boolean;
  onAnswer: (val: string) => void;
  onToggleBookmark: () => void;
  answers: Record<string, string>;
  bookmarks: Set<string>;
  onAnswerFor: (mongoDocId: string, val: string) => void;
  onToggleBookmarkFor: (mongoDocId: string) => void;
  activeQIdx: number;
  focusBlankNum: number | null;
  onFocusBlank: (num: number) => void;
}) {
  const BookmarkBtn = ({ docId, bmarked }: { docId: string; bmarked: boolean }) => (
    <button type="button" onClick={() => onToggleBookmarkFor(docId)} className="shrink-0 mr-2 transition-colors">
      <svg className={`h-6 w-6 transition-colors ${bmarked ? "fill-primary-500 text-primary-500" : "fill-none text-gray-400 hover:text-gray-600"}`}
        stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    </button>
  );

  // Instruction và range lấy từ câu đầu tiên của part
  const firstQ     = partQuestions[0] ?? question;
  const partInstruction = firstQ.instruction ?? null;
  const partPassageText = firstQ.passageText ?? null;
  const partStart  = firstQ.questionNumber ?? firstQ.questionNumberStart;
  const partEnd    = partQuestions[partQuestions.length - 1]?.questionNumber
                     ?? partQuestions[partQuestions.length - 1]?.questionNumberEnd
                     ?? partStart;
  const rangeLabel = partStart === partEnd
    ? `Question ${partStart}`
    : `Questions ${partStart}–${partEnd}`;

  const rightColRef = useRef<HTMLDivElement>(null);

  // Scroll cột phải đến câu active khi activeQIdx thay đổi
  useEffect(() => {
    if (!partPassageText) return;
    const activeDocId = partQuestions[activeQIdx]?.mongoDocId;
    if (!activeDocId || !rightColRef.current) return;
    const el = rightColRef.current.querySelector<HTMLElement>(`[data-q-id="${activeDocId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeQIdx, partPassageText, partQuestions]);

  const QuestionHeader = () =>
    partInstruction ? (
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 mb-5 shadow-sm">
        <p className="text-base font-extrabold text-gray-800 mb-1">{rangeLabel}</p>
        <p className="text-base text-gray-700 leading-relaxed">
          <RichText text={partInstruction} />
        </p>
      </div>
    ) : null;

  // Render một câu MC
  const McQuestion = ({ q }: { q: ExamQuestionDto }) => {
    const ans = answers[q.mongoDocId] ?? "";
    const bmarked = bookmarks.has(q.mongoDocId);
    return (
      <div className="mb-6">
        {q.passageImageUrl && (
          <div className="mb-3">
            <img src={q.passageImageUrl} alt="passage"
              className="max-w-lg rounded-lg border border-gray-200 shadow-sm" />
          </div>
        )}
        <div className="flex items-center gap-3 mb-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary-600 text-white text-xs font-black">
            {q.questionNumber}
          </span>
          <p className="text-base font-semibold text-gray-800 flex-1">
            <RichText text={q.text ?? ""} />
          </p>
          <BookmarkBtn docId={q.mongoDocId} bmarked={bmarked} />
        </div>
        <div className="flex flex-col gap-2 max-w-xl ml-10">
          {(q.options ?? []).map((opt) => (
            <button key={opt.id} type="button" onClick={() => onAnswerFor(q.mongoDocId, opt.id)}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                ans === opt.id ? "border-primary-500 bg-primary-50" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition-all ${
                ans === opt.id ? "border-primary-500 bg-primary-500 text-white" : "border-gray-300 text-gray-500"
              }`}>{opt.id}</span>
              <span className="text-sm font-medium text-gray-700">
                <RichText text={opt.text ?? ""} />
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Layout 2 cột nếu có đoạn văn
  if (question.questionType === "MULTIPLE_CHOICE" && partPassageText) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#dce9f0]">
        {partInstruction && (
          <div className="shrink-0 px-5 pt-5">
            <QuestionHeader />
          </div>
        )}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: đoạn văn — scrollable */}
          <div className="w-1/2 overflow-y-auto px-5 py-4 border-r border-gray-300">
            <div className="text-sm text-gray-800 leading-relaxed">
              <RichText text={partPassageText} />
            </div>
          </div>
          {/* RIGHT: tất cả câu hỏi — scrollable */}
          <div className="w-1/2 overflow-y-auto px-5 py-4" ref={rightColRef}>
            {partQuestions.map((q) => (
              <div key={q.mongoDocId} data-q-id={q.mongoDocId}>
                <McQuestion q={q} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Layout 1 cột: chỉ câu active
  const BookmarkBtnSingle = () => (
    <button type="button" onClick={onToggleBookmark} className="shrink-0 mr-2 transition-colors">
      <svg className={`h-6 w-6 transition-colors ${isBookmarked ? "fill-primary-500 text-primary-500" : "fill-none text-gray-400 hover:text-gray-600"}`}
        stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#dce9f0] p-5">
      <QuestionHeader />

      {/* MULTIPLE_CHOICE (no passage) */}
      {question.questionType === "MULTIPLE_CHOICE" && (
        <div className="mb-6">
          {question.passageImageUrl && (
            <div className="mb-4">
              <img src={question.passageImageUrl} alt="passage"
                className="max-w-lg rounded-lg border border-gray-200 shadow-sm" />
            </div>
          )}
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary-600 text-white text-xs font-black">
              {question.questionNumber}
            </span>
            <p className="text-base font-semibold text-gray-800 flex-1">
              <RichText text={question.text ?? ""} />
            </p>
            <BookmarkBtnSingle />
          </div>
          <div className="flex flex-col gap-2 max-w-xl">
            {(question.options ?? []).map((opt) => (
              <button key={opt.id} type="button" onClick={() => onAnswer(opt.id)}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  answer === opt.id ? "border-primary-500 bg-primary-50" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition-all ${
                  answer === opt.id ? "border-primary-500 bg-primary-500 text-white" : "border-gray-300 text-gray-500"
                }`}>{opt.id}</span>
                <span className="text-sm font-medium text-gray-700">
                  <RichText text={opt.text ?? ""} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FILL_IN_FORM (paragraph với blanks — R&W) */}
      {question.questionType === "FILL_IN_FORM" && (() => {
        const lines = (question.formContent ?? "").split("\n");
        let blankCounter = question.questionNumberStart ?? 1;
        let parsedAnswer: Record<string, string> = {};
        try { parsedAnswer = answer ? JSON.parse(answer) : {}; } catch { /* ignore */ }
        const handleBlankChange = (num: number, val: string) => {
          const updated = { ...parsedAnswer, [num]: val };
          onAnswer(JSON.stringify(updated));
        };
        const blanksOpts = question.blanksOptions as Array<{ number: number; options: string[] }> | null;

        // Khi focusBlankNum thay đổi (từ nav bar) → focus element tương ứng
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const formRef = useRef<HTMLDivElement>(null);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (focusBlankNum == null || !formRef.current) return;
          const el = formRef.current.querySelector<HTMLElement>(`[data-blank-num="${focusBlankNum}"]`);
          if (el) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
        }, [focusBlankNum]);
        return (
          <div className="text-base text-gray-800" style={{ lineHeight: "2.6" }}>
            {question.formTitle && (
              <h2 className="text-xl font-extrabold text-gray-900 mb-5" style={{ lineHeight: "normal" }}>{question.formTitle}</h2>
            )}
            {lines.map((line, lineIdx) => {
              const segments = line.split("____");
              if (segments.length === 1) {
                if (line.trim() === "") return <div key={lineIdx} className="h-3" />;
                return <span key={lineIdx} className="block"><RichText text={line} /></span>;
              }
              // Mỗi ____ = 1 blank riêng, lấy số trước khi render
              const blankNums = segments.slice(0, -1).map(() => blankCounter++);
              return (
                <span key={lineIdx} className="inline">
                  {segments.map((seg, sIdx) => {
                    const currentNum = blankNums[sIdx];
                    const blankOpts = currentNum != null
                      ? blanksOpts?.find((b) => b.number === currentNum)?.options
                      : undefined;
                    return (
                      <span key={sIdx} className="inline">
                        {seg && <RichText text={seg} />}
                        {sIdx < segments.length - 1 && currentNum != null && (
                          <span className="relative inline-flex items-center mx-1">
                            <span className="absolute -top-4 left-1 text-[10px] font-black text-primary-600 select-none">
                              {currentNum}
                            </span>
                            {blankOpts && blankOpts.length > 0 ? (
                              <select
                                value={parsedAnswer[currentNum] ?? ""}
                                onChange={(e) => handleBlankChange(currentNum, e.target.value)}
                                className="w-32 rounded border-2 border-blue-300 bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-800 focus:border-primary-500 focus:bg-white focus:outline-none transition cursor-pointer"
                              >
                                <option value="" disabled />
                                {blankOpts.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={parsedAnswer[currentNum] ?? ""}
                                onChange={(e) => handleBlankChange(currentNum, e.target.value)}
                                className="w-32 rounded border-2 border-blue-300 bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-800 focus:border-primary-500 focus:bg-white focus:outline-none transition"
                              />
                            )}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </div>
        );
      })()}

      {/* FILL_IN_TEXT */}
      {question.questionType === "FILL_IN_TEXT" && (
        <>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary-600 text-white text-xs font-black">
              {question.questionNumber}
            </span>
            <p className="text-base font-semibold text-gray-800 flex-1">
              <RichText text={question.sentence ?? ""} />
            </p>
            <BookmarkBtnSingle />
          </div>
          <input type="text" value={answer} onChange={(e) => onAnswer(e.target.value)}
            placeholder="Nhập câu trả lời…"
            className="w-full max-w-sm rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 focus:border-primary-400 focus:outline-none transition" />
        </>
      )}

      {/* SHORT_WRITE */}
      {question.questionType === "SHORT_WRITE" && (
        <>
          {question.storyImages && question.storyImages.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {question.storyImages.sort((a, b) => a.order - b.order).map((img) => (
                <div key={img.order} className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                  style={{ width: 220, height: 140 }}>
                  {img.image_url
                    ? <img src={img.image_url} alt={img.alt} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">{img.alt}</div>
                  }
                </div>
              ))}
            </div>
          )}
          {question.promptText && (
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <RichText text={question.promptText} />
              </p>
              {(question.bulletPoints ?? []).length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {question.bulletPoints!.map((bp, i) => <li key={i}>{bp}</li>)}
                </ul>
              )}
            </div>
          )}
          <div className="flex items-start gap-2 mb-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary-600 text-white text-xs font-black">
              {question.questionNumber}
            </span>
            <span className="text-sm font-semibold text-gray-700 flex-1">
              Write your answer below.
              {question.minWords && ` Write ${question.minWords} words or more.`}
            </span>
            <BookmarkBtnSingle />
          </div>
          <div>
            <textarea value={answer} onChange={(e) => onAnswer(e.target.value)} rows={7}
              placeholder="Viết câu trả lời của bạn tại đây…"
              className="w-full max-w-2xl rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 focus:border-primary-400 focus:outline-none transition resize-none" />
            <p className="mt-1 text-xs text-gray-400">{answer.split(/\s+/).filter(Boolean).length} từ</p>
          </div>
        </>
      )}
    </div>
  );
}

export default function ExamReadingWritingPage() {
  const navigate = useNavigate();
  const { level: _level, testId } = useParams<{ level: string; testId: string }>();

  const [parts, setParts] = useState<ExamPartDto[]>([]);
  const [durationSeconds, setDurationSeconds] = useState(60 * 60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [timeHidden, setTimeHidden] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activePartIdx, setActivePartIdx] = useState(0);
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load paper
  useEffect(() => {
    if (!testId) return;
    const numericTestId = parseInt(testId.replace(/\D/g, ""), 10);
    if (isNaN(numericTestId)) { setError("Test ID không hợp lệ."); setLoading(false); return; }

    examService
      .getPaper(numericTestId, "READING_WRITING")
      .then((paper) => {
        setParts(paper.parts);
        const secs = (paper.durationMinutes ?? 60) * 60;
        setDurationSeconds(secs);
        setTimeLeft(secs);
      })
      .catch(() => setError("Không thể tải bài thi. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, [testId]);

  // Timer
  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started]);

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
    else if (activePartIdx > 0) { setActivePartIdx((p) => p - 1); setActiveQIdx(parts[activePartIdx - 1].questions.length - 1); }
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
      <ExamHeader timeLeft={timeLeft} timeHidden={timeHidden}
        onToggleTime={() => setTimeHidden((v) => !v)} onExit={() => setShowExitModal(true)} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!started && <StartOverlay onStart={() => setStarted(true)} />}

        {activeQuestion && (
          <QuestionView
            question={activeQuestion}
            partQuestions={activePart?.questions ?? []}
            answer={answers[activeQuestion.mongoDocId] ?? ""}
            isBookmarked={bookmarks.has(activeQuestion.mongoDocId)}
            answers={answers}
            bookmarks={bookmarks}
            activeQIdx={activeQIdx}
            onAnswer={(val) => setAnswers((prev) => ({ ...prev, [activeQuestion.mongoDocId]: val }))}
            onToggleBookmark={() => toggleBookmark(activeQuestion.mongoDocId)}
            onAnswerFor={(docId, val) => setAnswers((prev) => ({ ...prev, [docId]: val }))}
            onToggleBookmarkFor={(docId) => toggleBookmark(docId)}
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
          onGoToPart={(p) => { setActivePartIdx(p); setActiveQIdx(0); }}
          onGoToQuestion={(p, q) => { setActivePartIdx(p); setActiveQIdx(q); }}
          onSubmit={() => setShowSubmitModal(true)}
        />
      )}

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
                <button type="button" onClick={() => { setShowSubmitModal(false); navigate(`/exam/${_level}/${testId}/speaking`); }}
                  className="rounded-xl bg-primary-600 hover:bg-primary-700 px-5 py-2.5 text-sm font-extrabold text-white transition shadow-md">
                  Nộp bài
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <LessonExitModal open={showExitModal} onContinue={() => setShowExitModal(false)} onExit={() => navigate(-1)}
        continueButtonText="Tiếp tục thi"
        bodyText="Đợi chút! Bạn sẽ mất hết tiến trình thi này nếu thoát bây giờ." />
    </div>
  );
}
