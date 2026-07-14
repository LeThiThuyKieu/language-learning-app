import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  examService,
  type ExamAttemptDetailDto,
  type GradeResponse,
  type QuestionResultDetailDto,
  type SaveExamAttemptQuestionResult,
} from "@/services/examService";
import {
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Loader2, RotateCcw, Minus, Headphones, BookOpen, Mic, Trophy, ArrowLeft,
} from "lucide-react";

// State types
interface SpeakingGradeResult {
  partNumber:  number;
  partTitle:   string;
  transcript:  string;
  grade:       GradeResponse;
  questions:   string[];
}

interface LocationState {
  testId?:         number;
  answers?:        Record<string, string>;
  correctAnswers?: Record<string, string>;
  questionTypes?:  Record<string, string>;
  /** paperType per mongoDocId: LISTENING | READING_WRITING | SPEAKING */
  paperTypes?:     Record<string, string>;
  writingGrades?:  Record<string, GradeResponse>;
  speakingGrades?: SpeakingGradeResult[];
}

// Shared helpers (same logic kept for A/B/C fix)
function letterToIndex(l: string) { return l.toUpperCase().charCodeAt(0) - 65; }

function resolveCorrectAnswerText(
  ca: string,
  bo: Array<{ number: number; options: string[] }> | null | undefined
): string {
  if (!bo?.length) return ca;
  try {
    const obj: Record<string, string | string[]> = JSON.parse(ca);
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (Array.isArray(v)) {
        // Multiple accepted answers — join with " / "
        out[k] = v.join(" / ");
      } else {
        const idx = letterToIndex(v);
        const opts = bo.find(b => b.number === Number(k))?.options;
        out[k] = (opts && opts[idx] != null) ? opts[idx] : v;
      }
    }
    return JSON.stringify(out);
  } catch { return ca; }
}

function checkAnswer(
  ua: string | null | undefined,
  ca: string | null | undefined,
  qType: string,
  bo?: Array<{ number: number; options: string[] }> | null
): boolean | null {
  if (!ua || !ca) return null;
  if (qType === "SHORT_WRITE" || qType === "SPEAKING_TASK") return null;
  try {
    if (qType === "FILL_IN_FORM" || qType === "MATCHING") {
      const uaObj: Record<string, string> = JSON.parse(ua);
      const caRaw: Record<string, string | string[]> = JSON.parse(ca);

      return Object.keys(caRaw).every(k => {
        const uaVal = (uaObj[k] ?? "").trim().toLowerCase();
        const caVal = caRaw[k];
        if (Array.isArray(caVal)) {
          // Multiple accepted answers
          return caVal.some(v => v.trim().toLowerCase() === uaVal);
        }
        // A/B/C letter with blanksOptions
        if (qType === "FILL_IN_FORM" && bo && /^[A-Da-d]$/.test(caVal)) {
          const idx = letterToIndex(caVal);
          const opts = bo.find(b => b.number === Number(k))?.options;
          const resolved = (opts && opts[idx] != null) ? opts[idx].toLowerCase() : caVal.toLowerCase();
          return uaVal === resolved;
        }
        return uaVal === caVal.trim().toLowerCase();
      });
    }
  } catch { /**/ }

  // MC / FILL_IN_TEXT — correct_answer might also be array
  try {
    const arr: string[] = JSON.parse(ca);
    if (Array.isArray(arr)) {
      return arr.some(v => v.trim().toLowerCase() === ua.trim().toLowerCase());
    }
  } catch { /**/ }

  return ua.trim().toLowerCase() === ca.trim().toLowerCase();
}

// Paper config
const PAPER_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  LISTENING: {
    label: "Listening",
    icon: <Headphones className="h-4 w-4" />,
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
  READING_WRITING: {
    label: "Reading & Writing",
    icon: <BookOpen className="h-4 w-4" />,
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  SPEAKING: {
    label: "Speaking",
    icon: <Mic className="h-4 w-4" />,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
};

// AnswerDisplay
function AnswerDisplay({ raw }: { raw: string }) {
  try {
    const obj: Record<string, string | string[]> = JSON.parse(raw);
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {Object.entries(obj).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-white border border-orange-200 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm">
            <span className="text-orange-400 font-bold">{k}.</span>
            {Array.isArray(v) ? v.join(" / ") : v}
          </span>
        ))}
      </div>
    );
  } catch {
    return <p className="text-sm text-gray-800 mt-1">{raw}</p>;
  }
}

// Score Arc (half circle)
function ScoreArc({ score, size = 80 }: { score: number; size?: number }) {
  const r = size / 2 - 8;
  const circ = Math.PI * r; // half circle
  const off  = circ - (score / 100) * circ;
  const col  = score >= 80 ? "#22c55e" : score >= 60 ? "#f97316" : "#ef4444";
  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size / 2 + 12 }}>
      <svg width={size} height={size / 2 + 4} viewBox={`0 0 ${size} ${size / 2 + 4}`}>
        <path d={`M 8 ${size/2} A ${r} ${r} 0 0 1 ${size-8} ${size/2}`}
          fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round"/>
        <path d={`M 8 ${size/2} A ${r} ${r} 0 0 1 ${size-8} ${size/2}`}
          fill="none" stroke={col} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .7s ease" }}/>
      </svg>
      <span className="absolute bottom-0 text-lg font-black" style={{ color: col }}>{score}%</span>
    </div>
  );
}

// Breakdown bars
function BreakdownBars({ breakdown }: { breakdown?: string | null }) {
  if (!breakdown) return null;
  let bk: Record<string, number> = {};
  try { bk = JSON.parse(breakdown); } catch { return null; }
  const lm: Record<string, string> = {
    task_completion:           "Task Completion",
    content:                   "Content",
    grammar:                   "Grammar",
    vocabulary:                "Vocabulary",
    relevance:                 "Relevance",
    fluency:                   "Fluency",
    communicative_achievement: "Communicative Achievement",
    organisation:              "Organisation",
    language:                  "Language",
    questions_covered:         "Questions Covered",
    clarity:                   "Clarity",
  };
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
      {Object.entries(bk).map(([k, v]) => (
        <div key={k}>
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span className="font-medium">{lm[k] ?? k.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase())}</span>
            <span className={`font-bold ${v>=80?"text-green-600":v>=60?"text-orange-500":"text-red-500"}`}>{v}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${v>=80?"bg-green-400":v>=60?"bg-orange-400":"bg-red-400"}`}
              style={{ width: `${v}%` }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// FillAnswerReview — từng ô điền màu đúng/sai
function FillAnswerReview({
  userAnswer, correctAnswer, blanksOptions, questionType,
}: {
  userAnswer: string; correctAnswer: string;
  blanksOptions?: Array<{ number: number; options: string[] }> | null;
  questionType: string;
}) {
  let uaObj: Record<string, string> = {};
  let caRaw: Record<string, string | string[]> = {};
  try { uaObj = JSON.parse(userAnswer); } catch { return <AnswerDisplay raw={userAnswer}/>; }
  try { caRaw = JSON.parse(correctAnswer); } catch { return <AnswerDisplay raw={userAnswer}/>; }
  const keys = Object.keys(caRaw);
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {keys.map(k => {
        const userVal = (uaObj[k] ?? "").trim().toLowerCase();
        const caVal = caRaw[k];
        let correctForCompare: string;
        let correctForDisplay: string;
        if (Array.isArray(caVal)) {
          correctForCompare = caVal.map(v => v.trim().toLowerCase()).join(" / ");
          correctForDisplay = caVal.join(" / ");
        } else if (questionType === "FILL_IN_FORM" && blanksOptions && /^[A-Da-d]$/.test(caVal)) {
          const idx = caVal.toUpperCase().charCodeAt(0) - 65;
          const opts = blanksOptions.find(b => b.number === Number(k))?.options;
          correctForDisplay = (opts && opts[idx] != null) ? opts[idx] : caVal.toUpperCase();
          correctForCompare = correctForDisplay.toLowerCase();
        } else {
          correctForDisplay = (caVal as string).trim().toUpperCase();
          correctForCompare = (caVal as string).trim().toLowerCase();
        }
        const isCorrect = Array.isArray(caVal)
          ? caVal.some(v => v.trim().toLowerCase() === userVal)
          : userVal === correctForCompare;
        if (isCorrect) {
          return (
            <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-green-50 border border-green-400 px-2.5 py-1 text-xs font-semibold text-green-700 shadow-sm">
              <span className="text-green-500 font-bold">{k}.</span>
              {uaObj[k] ?? userVal}
              <CheckCircle2 className="h-3 w-3 text-green-500 ml-0.5"/>
            </span>
          );
        }
        return (
          <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-300 px-2.5 py-1 text-xs font-semibold shadow-sm">
            <span className="text-red-400 font-bold">{k}.</span>
            <span className="text-red-500">{uaObj[k] || "—"}</span>
            <span className="text-gray-400 mx-0.5">→</span>
            <span className="text-green-700 font-bold">{correctForDisplay}</span>
          </span>
        );
      })}
    </div>
  );
}

// Question Card
function QuestionCard({ q, idx }: { q: QuestionResultDetailDto; idx: number }) {
  const [open, setOpen] = useState(false);
  const isLlm = q.questionType === "SHORT_WRITE" || q.questionType === "SPEAKING_TASK";

  const resolvedCA = (q.questionType === "FILL_IN_FORM" && q.correctAnswer && q.blanksOptions)
    ? resolveCorrectAnswerText(q.correctAnswer, q.blanksOptions)
    : q.correctAnswer;

  const displayIsCorrect = (q.questionType === "FILL_IN_FORM" && q.blanksOptions && q.userAnswer && q.correctAnswer)
    ? checkAnswer(q.userAnswer, q.correctAnswer, q.questionType, q.blanksOptions)
    : q.isCorrect;

  const label = q.questionNumber != null ? `Câu ${q.questionNumber}`
    : q.questionNumberStart != null ? `Câu ${q.questionNumberStart}–${q.questionNumberEnd}`
    : `Câu ${idx + 1}`;

  const qTypeLabel = q.questionType.replace(/_/g, " ");

  // Status bubble
  let statusBg = "bg-gray-100";
  let statusIcon: React.ReactNode = <Minus className="h-4 w-4 text-gray-400"/>;
  if (isLlm && q.llmScore != null) {
    const c = q.llmScore >= 80 ? "text-green-600" : q.llmScore >= 60 ? "text-orange-500" : "text-red-500";
    statusBg = q.llmScore >= 80 ? "bg-green-100" : q.llmScore >= 60 ? "bg-orange-100" : "bg-red-100";
    statusIcon = <span className={`text-sm font-black ${c}`}>{q.llmScore}%</span>;
  } else if (displayIsCorrect === true) {
    statusBg = "bg-green-100";
    statusIcon = <CheckCircle2 className="h-5 w-5 text-green-600"/>;
  } else if (displayIsCorrect === false) {
    statusBg = "bg-red-100";
    statusIcon = <XCircle className="h-5 w-5 text-red-500"/>;
  }

  const borderLeft = isLlm ? "border-l-orange-400"
    : displayIsCorrect === true ? "border-l-green-400"
    : displayIsCorrect === false ? "border-l-red-400"
    : "border-l-gray-200";

  // MC options rendering
  function renderOptions() {
    if (!q.options?.length) return null;
    const userAns = (q.userAnswer ?? "").trim().toUpperCase();
    let correctAns = (q.correctAnswer ?? "").trim().toUpperCase();
    try {
      const p: Record<string, string> = JSON.parse(correctAns);
      const vals = Object.values(p);
      if (vals.length > 0) correctAns = (vals[0] as string).trim().toUpperCase();
    } catch { /**/ }
    return (
      <div className="flex flex-col gap-1.5 mt-2">
        {q.options.map((opt, i) => {
          const optId = (opt.id ?? String.fromCharCode(65 + i)).trim().toUpperCase();
          const isUserPick = optId === userAns;
          const isCorrectOpt = optId === correctAns;
          let bg = "bg-white border-gray-200"; let letterCls = "text-gray-400";
          if (isCorrectOpt) { bg = "bg-green-50 border-green-400"; letterCls = "text-green-600"; }
          else if (isUserPick) { bg = "bg-red-50 border-red-300"; letterCls = "text-red-400"; }
          return (
            <div key={i} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${bg}`}>
              <span className={`text-xs font-bold w-4 shrink-0 ${letterCls}`}>{optId}</span>
              {opt.image_url
                ? <img src={opt.image_url} alt={opt.text || `Option ${optId}`} className="h-16 w-auto rounded object-contain"/>
                : <span className="text-sm">{opt.text}</span>}
              {isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto shrink-0"/>}
              {isUserPick && !isCorrectOpt && <XCircle className="h-4 w-4 text-red-400 ml-auto shrink-0"/>}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-white shadow-sm border border-gray-100 border-l-4 ${borderLeft} overflow-hidden`}>
      {/* Header — only label + type, no question text */}
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50/40 transition text-left">
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${statusBg}`}>
          {statusIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-orange-500 uppercase tracking-wide">{label}</span>
            <span className="text-sm text-gray-400">·</span>
            <span className="text-sm text-gray-400 font-medium">{qTypeLabel}</span>
          </div>
        </div>
        <div className="shrink-0 text-gray-300">
          {open ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 flex flex-col gap-3">
          {/* Passage image */}
          {q.passageImageUrl && (
            <img src={q.passageImageUrl} alt="Passage" className="rounded-lg max-h-48 object-contain border border-gray-200"/>
          )}

          {/* Question text with **bold** markdown */}
          {(q.text || q.sentence || (q.questionType !== "SHORT_WRITE" && q.formContent) || q.promptText) && (
            <p className="text-base font-semibold text-gray-800 leading-snug">
              {(q.text ?? q.sentence ?? q.promptText ?? (q.formContent && q.questionType !== "SHORT_WRITE" ? "Điền vào chỗ trống" : null) ?? "—")
                .split(/(\*\*[^*]+\*\*)/)
                .map((part, i) => part.startsWith("**") && part.endsWith("**")
                  ? <strong key={i}>{part.slice(2,-2)}</strong> : part)
              }
            </p>
          )}

          {/* Speaking image */}
          {q.imageUrl && q.questionType === "SPEAKING_TASK" && (
            <img src={q.imageUrl} alt="Speaking prompt" className="rounded-lg max-h-48 object-contain border border-gray-200"/>
          )}

          {/* Story images */}
          {!!q.storyImages?.length && (
            <div className="flex flex-wrap gap-2">
              {q.storyImages.sort((a,b)=>(a.order??0)-(b.order??0)).map((img, i) => (
                <img key={i} src={img.image_url} alt={img.alt ?? `Story ${i+1}`}
                  className="rounded-lg h-28 object-contain border border-gray-200"/>
              ))}
            </div>
          )}

          {/* Bullet points */}
          {!!q.bulletPoints?.length && (
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
              {q.bulletPoints.map((bp, i) => <li key={i}>{bp}</li>)}
            </ul>
          )}

          {/* MC options */}
          {q.questionType === "MULTIPLE_CHOICE" && renderOptions()}

          {/* Matching items */}
          {q.questionType === "MATCHING" && !!q.leftItems?.length && (
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1">
                {q.leftItems.map((item, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
                    <span className="font-bold text-orange-400 mr-1">{item.question_number}.</span>{item.label}
                  </div>
                ))}
              </div>
              <div className="flex-1 flex flex-col gap-1">
                {q.rightItems?.map((item, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
                    <span className="font-bold text-gray-400 mr-1">{item.id}.</span>{item.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User answer — fill types with color per blank */}
          {q.userAnswer && q.questionType !== "SPEAKING_TASK" && q.questionType !== "MULTIPLE_CHOICE" && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bạn trả lời</p>
              {(q.questionType === "FILL_IN_FORM" || q.questionType === "FILL_IN_TEXT" || q.questionType === "MATCHING") && q.correctAnswer
                ? <FillAnswerReview userAnswer={q.userAnswer} correctAnswer={q.correctAnswer}
                    blanksOptions={q.blanksOptions} questionType={q.questionType}/>
                : <AnswerDisplay raw={q.userAnswer}/>
              }
            </div>
          )}

          {/* Câu không làm — hiện đáp án đúng màu xanh */}
          {!q.userAnswer && !isLlm && q.correctAnswer && q.questionType !== "MULTIPLE_CHOICE" && (
            <div className="rounded-xl px-3 py-2.5 bg-green-50 border border-green-200">
              <p className="flex items-center gap-1.5 text-xs font-bold text-green-600 uppercase tracking-widest mb-2">
                <CheckCircle2 className="h-3.5 w-3.5"/>Đáp án đúng
              </p>
              {(q.questionType === "FILL_IN_FORM" || q.questionType === "FILL_IN_TEXT" || q.questionType === "MATCHING")
                ? (() => {
                    try {
                      const caRaw: Record<string, string | string[]> = JSON.parse(q.correctAnswer!);
                      return (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(caRaw).map(([k, v]) => (
                            <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-white border border-green-400 px-2.5 py-1 text-xs font-semibold text-green-700 shadow-sm">
                              <span className="font-bold">{k}.</span>
                              {Array.isArray(v) ? v.join(" / ") : (v as string).toUpperCase()}
                            </span>
                          ))}
                        </div>
                      );
                    } catch { return <AnswerDisplay raw={q.correctAnswer!}/>; }
                  })()
                : <AnswerDisplay raw={q.correctAnswer!}/>
              }
            </div>
          )}

          {q.transcript && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bạn vừa nói</p>
              <p className="text-base text-gray-700 italic bg-white rounded-lg px-3 py-2 border border-gray-200">{q.transcript}</p>
            </div>
          )}

          {/* Correct answer — only for non-fill, non-MC when wrong */}
          {!isLlm && resolvedCA && displayIsCorrect === false
           && q.questionType !== "MULTIPLE_CHOICE"
           && q.questionType !== "FILL_IN_FORM"
           && q.questionType !== "FILL_IN_TEXT"
           && q.questionType !== "MATCHING" && (
            <div className="rounded-xl px-3 py-2.5 bg-red-50 border border-red-200">
              <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 uppercase tracking-widest mb-2">
                <XCircle className="h-3.5 w-3.5"/>Đáp án đúng
              </p>
              <AnswerDisplay raw={resolvedCA}/>
            </div>
          )}

          {/* LLM result */}
          {isLlm && (
            <div className="flex flex-col gap-3">
              {q.llmScore != null ? (
                <div className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 border border-orange-100">
                  <ScoreArc score={q.llmScore} size={70}/>
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-700 mb-1">
                      Điểm AI: <span className={q.llmScore>=60?"text-green-600":"text-red-500"}>{q.llmScore}/100</span>
                      {q.wordCount!=null && <span className="text-sm text-gray-400 font-normal ml-2">· {q.wordCount} từ</span>}
                    </p>
                    {q.llmFeedback && <p className="text-base text-gray-600 leading-relaxed">{q.llmFeedback}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-base text-gray-400 italic">Chưa có kết quả chấm AI.</p>
              )}
              <BreakdownBars breakdown={q.llmBreakdown}/>
              {q.llmSuggestion && (
                <div className="rounded-xl bg-orange-50 border border-orange-200 px-3 py-2.5">
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">💡 Gợi ý cải thiện</p>
                  <p className="text-base text-gray-700">{q.llmSuggestion}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Paper Section (groups questions)
function PaperSection({ paperKey, questions }: { paperKey: string; questions: QuestionResultDetailDto[] }) {
  const cfg = PAPER_CONFIG[paperKey] ?? { label: paperKey, icon: null, color:"text-gray-600", bg:"bg-gray-50", border:"border-gray-200" };

  // Group by partNumber
  const byPart = new Map<number, QuestionResultDetailDto[]>();
  questions.forEach(q => {
    const p = q.partNumber ?? 0;
    if (!byPart.has(p)) byPart.set(p, []);
    byPart.get(p)!.push(q);
  });

  const gradable = questions.filter(q => q.questionType !== "SHORT_WRITE" && q.questionType !== "SPEAKING_TASK");
  const correct  = gradable.filter(q => {
    const res = (q.questionType === "FILL_IN_FORM" && q.blanksOptions)
      ? checkAnswer(q.userAnswer, q.correctAnswer, q.questionType, q.blanksOptions)
      : q.isCorrect;
    return res === true;
  }).length;

  return (
    <div className="mb-6">
      {/* Paper header */}
      <div className={`flex items-center justify-between rounded-xl px-4 py-3 mb-3 ${cfg.bg} border ${cfg.border}`}>
        <div className={`flex items-center gap-2 font-extrabold text-sm ${cfg.color}`}>
          {cfg.icon}
          {cfg.label}
        </div>
        {gradable.length > 0 && (
          <span className="text-sm font-semibold text-gray-500 bg-white/70 px-2 py-0.5 rounded-full border border-gray-200">
            {correct}/{gradable.length} đúng
          </span>
        )}
      </div>

      {/* Parts */}
      {Array.from(byPart.entries())
        .sort(([a], [b]) => a - b)
        .map(([partNum, qs]) => (
          <div key={partNum} className="mb-4">
            {partNum > 0 && (
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                Part {partNum}
              </p>
            )}
            <div className="flex flex-col gap-2">
              {qs.map((q, i) => <QuestionCard key={q.mongoDocId ?? i} q={q} idx={i}/>)}
            </div>
          </div>
        ))
      }
    </div>
  );
}

// Main Page
export default function ExamResultPage() {
  const navigate = useNavigate();
  const { level, testId } = useParams<{ level: string; testId: string }>();
  const location = useLocation();
  const state    = (location.state ?? {}) as LocationState;

  const writingGrades  = state.writingGrades  ?? {};
  const speakingGrades = state.speakingGrades ?? [];
  const answers        = state.answers        ?? {};
  const correctAnswers = state.correctAnswers ?? {};
  const questionTypes  = state.questionTypes  ?? {};
  const paperTypes     = state.paperTypes     ?? {};

  const [attemptDetail, setAttemptDetail] = useState<ExamAttemptDetailDto | null>(null);
  const [saving, setSaving]     = useState(false);
  const hasSaved = useRef(false);

  const numericTestId = testId ? parseInt(testId.replace(/\D/g, ""), 10) : NaN;

  useEffect(() => {
    if (hasSaved.current || isNaN(numericTestId)) return;
    hasSaved.current = true;

    const qResults: SaveExamAttemptQuestionResult[] = [];
    Object.entries(answers).forEach(([mongoDocId, userAnswer]) => {
      const qType = questionTypes[mongoDocId] ?? "MULTIPLE_CHOICE";
      const ca    = correctAnswers[mongoDocId];
      const isCorrect = (qType === "SHORT_WRITE" || qType === "SPEAKING_TASK") ? null
        : checkAnswer(userAnswer, ca, qType);
      const wg = writingGrades[mongoDocId];
      const paper = paperTypes[mongoDocId] ?? (
        qType === "SHORT_WRITE" || qType === "FILL_IN_FORM"
          || qType === "FILL_IN_TEXT" || qType === "MATCHING"
          ? "READING_WRITING" : "LISTENING"
      );
      qResults.push({
        mongoDocId, questionType: qType, paperType: paper, userAnswer, isCorrect,
        llmScore: wg?.score ?? null, llmFeedback: wg?.feedback ?? null,
        llmBreakdown: wg?.breakdown ?? null, llmSuggestion: wg?.suggestion ?? null,
        wordCount: wg?.wordCount ?? null,
      });
    });
    speakingGrades.forEach(sg => {
      qResults.push({
        mongoDocId: `speaking-part-${sg.partNumber}`,
        questionType: "SPEAKING_TASK", userAnswer: sg.transcript, isCorrect: null,
        llmScore: sg.grade.score, llmFeedback: sg.grade.feedback,
        llmBreakdown: sg.grade.breakdown, llmSuggestion: sg.grade.suggestion,
        wordCount: null, transcript: sg.transcript,
      });
    });

    const wScores = Object.values(writingGrades).map(g => g.score);
    const sScores = speakingGrades.map(sg => sg.grade.score);
    const writingAvg  = wScores.length  ? Math.round(wScores.reduce((a,b)=>a+b,0)/wScores.length)  : null;
    const speakingAvg = sScores.length  ? Math.round(sScores.reduce((a,b)=>a+b,0)/sScores.length)  : null;

    setSaving(true);
    examService.saveAttempt({ testId: numericTestId, writingScore: writingAvg, speakingScore: speakingAvg, questionResults: qResults })
      .then(s => examService.getAttemptDetail(s.id))
      .then(setAttemptDetail)
      .catch(() => setAttemptDetail(null))
      .finally(() => setSaving(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericTestId]);

  // Prepare display questions — prefer server detail
  const displayQuestions: QuestionResultDetailDto[] = attemptDetail?.questionResults
    ?? Object.entries(answers).map(([mongoDocId, userAnswer]) => {
      const qType = questionTypes[mongoDocId] ?? "MULTIPLE_CHOICE";
      const wg    = writingGrades[mongoDocId];
      return {
        mongoDocId, questionType: qType, userAnswer,
        isCorrect: (qType === "SHORT_WRITE" || qType === "SPEAKING_TASK") ? null
          : checkAnswer(userAnswer, correctAnswers[mongoDocId], qType),
        correctAnswer: correctAnswers[mongoDocId] ?? null,
        llmScore: wg?.score ?? null, llmFeedback: wg?.feedback ?? null,
        llmBreakdown: wg?.breakdown ?? null, llmSuggestion: wg?.suggestion ?? null,
        wordCount: wg?.wordCount ?? null,
      } as QuestionResultDetailDto;
    });

  // Group by paper
  const byPaper = new Map<string, QuestionResultDetailDto[]>();
  const PAPER_ORDER = ["LISTENING", "READING_WRITING", "SPEAKING"];
  PAPER_ORDER.forEach(p => byPaper.set(p, []));

  displayQuestions.forEach(q => {
    const pk = q.paperType ?? (
      q.questionType === "SPEAKING_TASK" ? "SPEAKING"
      : q.questionType === "SHORT_WRITE" || q.questionType === "FILL_IN_FORM"
        || q.questionType === "FILL_IN_TEXT" || q.questionType === "MATCHING" ? "READING_WRITING"
      : "LISTENING"
    );
    if (!byPaper.has(pk)) byPaper.set(pk, []);
    byPaper.get(pk)!.push(q);
  });
  // Add speaking from state if not in attemptDetail
  if (!attemptDetail) {
    speakingGrades.forEach(sg => {
      const q: QuestionResultDetailDto = {
        mongoDocId:   `speaking-part-${sg.partNumber}`,
        questionType: "SPEAKING_TASK",
        paperType:    "SPEAKING",
        partNumber:   sg.partNumber,
        partTitle:    sg.partTitle,
        text:         `Part ${sg.partNumber}: ${sg.partTitle}`,
        transcript:   sg.transcript,
        llmScore:     sg.grade.score,
        llmFeedback:  sg.grade.feedback,
        llmBreakdown: sg.grade.breakdown,
        llmSuggestion: sg.grade.suggestion,
      };
      byPaper.get("SPEAKING")!.push(q);
    });
  }

  // Summary stats — dùng cho per-paper display (byPaper phải được tính trước)
  const wAvg = (() => {
    if (attemptDetail?.writingScore != null) return attemptDetail.writingScore;
    const v = Object.values(writingGrades).map(g=>g.score);
    return v.length ? Math.round(v.reduce((a,b)=>a+b,0)/v.length) : null;
  })();
  const sAvg = (() => {
    if (attemptDetail?.speakingScore != null) return attemptDetail.speakingScore;
    const v = speakingGrades.map(sg=>sg.grade.score);
    return v.length ? Math.round(v.reduce((a,b)=>a+b,0)/v.length) : null;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <button type="button" onClick={() => navigate(`/exam/${level}`)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-600 transition shrink-0">
            <ArrowLeft className="h-4 w-4"/>Về trang luyện thi
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-orange-500"/>
            </div>
            <div>
              <p className="text-base font-extrabold text-gray-800">Kết quả bài thi</p>
              {attemptDetail?.testTitle && (
                <p className="text-xs text-gray-400">{attemptDetail.testTitle}</p>
              )}
            </div>
          </div>
          <button type="button"
            onClick={() => navigate(`/exam/${level}/${numericTestId}/listening`)}
            className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-bold transition shadow-sm shrink-0">
            <RotateCcw className="h-4 w-4"/>Thi lại
          </button>
        </div>
      </div>

      {saving && (
        <div className="flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin"/>
          Đang lưu kết quả…
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Summary banner ── */}
        <div className="rounded-2xl bg-white border border-orange-100 shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-white/80 shrink-0"/>
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Tổng kết</span>
              </div>
              {/* Per-paper correct counts */}
              <div className="flex flex-wrap gap-2 ml-auto">
                {(() => {
                  const papers = ["LISTENING", "READING_WRITING"] as const;
                  const labels: Record<string, string> = { LISTENING: "L", READING_WRITING: "R&W" };
                  return papers.map(pk => {
                    const qs = (byPaper.get(pk) ?? []).filter(q =>
                      q.questionType !== "SHORT_WRITE" && q.questionType !== "SPEAKING_TASK"
                    );
                    if (qs.length === 0) return null;
                    const correct = qs.filter(q =>
                      checkAnswer(q.userAnswer, q.correctAnswer, q.questionType, q.blanksOptions) === true
                    ).length;
                    return (
                      <div key={pk} className="flex items-baseline gap-1 bg-white/20 rounded-lg px-3 py-1">
                        <span className="text-xs font-semibold text-white/80">{labels[pk]}:</span>
                        <span className="text-sm font-black text-white">{correct}</span>
                        <span className="text-xs text-white/70">/{qs.length}</span>
                      </div>
                    );
                  });
                })()}
                {sAvg != null && sAvg > 0 && (
                  <div className="flex items-baseline gap-1 bg-white/20 rounded-lg px-3 py-1">
                    <span className="text-xs font-semibold text-white/80">Speaking:</span>
                    <span className="text-sm font-black text-white">{sAvg}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Writing + Speaking score arcs */}
          {(wAvg !== null || sAvg !== null) && (
            <div className="flex divide-x divide-gray-100">
              {wAvg != null && (
                <div className="flex flex-col items-center py-5 px-8 gap-1 flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <BookOpen className="h-3.5 w-3.5"/>Writing
                  </p>
                  <ScoreArc score={wAvg} size={96}/>
                </div>
              )}
              {sAvg != null && (
                <div className="flex flex-col items-center py-5 px-8 gap-1 flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Mic className="h-3.5 w-3.5"/>Speaking
                  </p>
                  <ScoreArc score={sAvg} size={96}/>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Per-paper question review — 3 columns */}
        <div>
          <p className="text-base font-extrabold text-gray-700 mb-5">📋 Xem lại từng câu</p>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div>
              {(byPaper.get("LISTENING") ?? []).length > 0 && (
                <PaperSection paperKey="LISTENING" questions={byPaper.get("LISTENING")!}/>
              )}
            </div>
            <div>
              {(byPaper.get("READING_WRITING") ?? []).length > 0 && (
                <PaperSection paperKey="READING_WRITING" questions={byPaper.get("READING_WRITING")!}/>
              )}
            </div>
            <div>
              {(byPaper.get("SPEAKING") ?? []).length > 0 && (
                <PaperSection paperKey="SPEAKING" questions={byPaper.get("SPEAKING")!}/>
              )}
            </div>
          </div>
        </div>

        {/* Back button removed — moved to header */}
      </div>
    </div>
  );
}
