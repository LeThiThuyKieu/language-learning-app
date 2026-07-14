import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  examService,
  type ExamAttemptDetailDto,
  type QuestionResultDetailDto,
} from "@/services/examService";
import {
  ArrowLeft, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Loader2, Minus, RotateCcw, Trophy, Headphones, BookOpen, Mic,
} from "lucide-react";

// Helpers
function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

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
          return caVal.some(v => v.trim().toLowerCase() === uaVal);
        }
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

  try {
    const arr: string[] = JSON.parse(ca);
    if (Array.isArray(arr)) {
      return arr.some(v => v.trim().toLowerCase() === ua.trim().toLowerCase());
    }
  } catch { /**/ }

  return ua.trim().toLowerCase() === ca.trim().toLowerCase();
}

// Paper config
const PAPER_CONFIG: Record<string, {
  label: string; icon: React.ReactNode;
  color: string; bg: string; border: string;
}> = {
  LISTENING:       { label:"Listening",         icon:<Headphones className="h-4 w-4"/>, color:"text-sky-700",    bg:"bg-sky-50",    border:"border-sky-200"    },
  READING_WRITING: { label:"Reading & Writing", icon:<BookOpen   className="h-4 w-4"/>, color:"text-violet-700", bg:"bg-violet-50", border:"border-violet-200" },
  SPEAKING:        { label:"Speaking",          icon:<Mic        className="h-4 w-4"/>, color:"text-rose-700",   bg:"bg-rose-50",   border:"border-rose-200"   },
};

// AnswerDisplay — JSON answer → readable chips (plain, no color)
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

// FillAnswerReview — hiển thị từng ô điền với màu đúng/sai
function FillAnswerReview({
  userAnswer,
  correctAnswer,
  blanksOptions,
  questionType,
}: {
  userAnswer: string;
  correctAnswer: string;
  blanksOptions?: Array<{ number: number; options: string[] }> | null;
  questionType: string;
}) {
  let uaObj: Record<string, string> = {};
  let caRaw: Record<string, string | string[]> = {};
  try { uaObj = JSON.parse(userAnswer); } catch { return <AnswerDisplay raw={userAnswer} />; }
  try { caRaw = JSON.parse(correctAnswer); } catch { return <AnswerDisplay raw={userAnswer} />; }

  const keys = Object.keys(caRaw);

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {keys.map(k => {
        const userVal = (uaObj[k] ?? "").trim().toLowerCase();
        const caVal = caRaw[k];

        // Resolve correct value (may be letter A/B/C for FILL_IN_FORM with blanksOptions)
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
        } else {
          return (
            <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-300 px-2.5 py-1 text-xs font-semibold shadow-sm">
              <span className="text-red-400 font-bold">{k}.</span>
              <span className="text-red-500">{uaObj[k] || "—"}</span>
              <span className="text-gray-400 mx-0.5">→</span>
              <span className="text-green-700 font-bold">{correctForDisplay}</span>
            </span>
          );
        }
      })}
    </div>
  );
}

// Score Arc (half-circle)
function ScoreArc({ score, size = 80 }: { score: number; size?: number }) {
  const r    = size / 2 - 8;
  const circ = Math.PI * r;
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
              style={{ width:`${v}%` }}/>
          </div>
        </div>
      ))}
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

  // Render options list (MULTIPLE_CHOICE)
  function renderOptions() {
    if (!q.options?.length) return null;

    // userAnswer cho MC lưu opt.id (A, B, C...) trực tiếp
    const userAns = (q.userAnswer ?? "").trim().toUpperCase();

    // correctAnswer có thể là plain "B" hoặc JSON {"1":"B"}
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

          let bg = "bg-white border-gray-200 text-gray-700";
          let letterCls = "text-gray-400";
          if (isCorrectOpt) {
            bg = "bg-green-50 border-green-400";
            letterCls = "text-green-600";
          } else if (isUserPick) {
            bg = "bg-red-50 border-red-300";
            letterCls = "text-red-400";
          }

          return (
            <div key={i} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${bg}`}>
              <span className={`text-xs font-bold w-4 shrink-0 ${letterCls}`}>{optId}</span>
              {opt.image_url
                ? <img src={opt.image_url} alt={opt.text || `Option ${optId}`} className="h-16 w-auto rounded object-contain"/>
                : <span className="text-sm">{opt.text}</span>
              }
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
      {/* ── Header row (always visible) ── */}
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50/40 transition text-left">
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${statusBg}`}>
          {statusIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-orange-500 uppercase tracking-wide">{label}</span>
            <span className="text-sm text-gray-400">·</span>
            <span className="text-sm text-gray-400 font-medium">{q.questionType.replace(/_/g," ")}</span>
          </div>
        </div>
        <div className="shrink-0 text-gray-300">
          {open ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 flex flex-col gap-3">
          {/* Passage image (R&W) */}
          {q.passageImageUrl && (
            <img src={q.passageImageUrl} alt="Passage" className="rounded-lg max-h-48 object-contain border border-gray-200"/>
          )}

          {/* Question text — render **bold** markdown */}
          {(q.text || q.sentence || (q.questionType !== "SHORT_WRITE" && q.formContent) || q.promptText) && (
            <p className="text-base font-semibold text-gray-800 leading-snug">
              {(q.text ?? q.sentence ?? q.promptText ?? (q.formContent && q.questionType !== "SHORT_WRITE" ? "Điền vào chỗ trống" : null) ?? "—")
                .split(/(\*\*[^*]+\*\*)/)
                .map((part, i) =>
                  part.startsWith("**") && part.endsWith("**")
                    ? <strong key={i}>{part.slice(2, -2)}</strong>
                    : part
                )
              }
            </p>
          )}

          {/* Speaking image */}
          {q.imageUrl && q.questionType === "SPEAKING_TASK" && (
            <img src={q.imageUrl} alt="Speaking prompt" className="rounded-lg max-h-48 object-contain border border-gray-200"/>
          )}

          {/* Story images (SHORT_WRITE) */}
          {!!q.storyImages?.length && (
            <div className="flex flex-wrap gap-2">
              {q.storyImages.sort((a,b)=>(a.order??0)-(b.order??0)).map((img, i) => (
                <img key={i} src={img.image_url} alt={img.alt ?? `Story ${i+1}`}
                  className="rounded-lg h-28 object-contain border border-gray-200"/>
              ))}
            </div>
          )}

          {/* Bullet points (SHORT_WRITE) */}
          {q.bulletPoints?.length && (
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
              {q.bulletPoints.map((bp, i) => <li key={i}>{bp}</li>)}
            </ul>
          )}

          {/* MULTIPLE_CHOICE options */}
          {q.questionType === "MULTIPLE_CHOICE" && renderOptions()}

          {/* MATCHING left/right items */}
          {q.questionType === "MATCHING" && q.leftItems?.length && (
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

          {/* User answer — bỏ qua SPEAKING_TASK vì đã hiện trong transcript */}
          {q.userAnswer && q.questionType !== "SPEAKING_TASK" && q.questionType !== "MULTIPLE_CHOICE" && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bạn trả lời</p>
              {/* FILL_IN_FORM / FILL_IN_TEXT / MATCHING — hiện từng ô màu đúng/sai */}
              {(q.questionType === "FILL_IN_FORM" || q.questionType === "FILL_IN_TEXT" || q.questionType === "MATCHING")
               && q.correctAnswer
                ? <FillAnswerReview
                    userAnswer={q.userAnswer}
                    correctAnswer={q.correctAnswer}
                    blanksOptions={q.blanksOptions}
                    questionType={q.questionType}
                  />
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

          {/* Correct answer — chỉ hiện khi SAI và không phải MC (MC đã highlight rồi)
               và không phải FILL types (đã gộp vào FillAnswerReview) */}
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
              {q.questionType === "SPEAKING_TASK" && (
                <p className="text-sm text-gray-400 italic">* Phần Speaking không có đáp án mẫu.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Paper Section
function PaperSection({ paperKey, questions }: { paperKey: string; questions: QuestionResultDetailDto[] }) {
  const cfg = PAPER_CONFIG[paperKey] ?? {
    label: paperKey, icon: null,
    color:"text-gray-600", bg:"bg-gray-50", border:"border-gray-200",
  };

  const byPart = new Map<number, QuestionResultDetailDto[]>();
  questions.forEach(q => {
    const p = q.partNumber ?? 0;
    if (!byPart.has(p)) byPart.set(p, []);
    byPart.get(p)!.push(q);
  });

  const gradable = questions.filter(q =>
    q.questionType !== "SHORT_WRITE" && q.questionType !== "SPEAKING_TASK"
  );
  const correct = gradable.filter(q => {
    const res = (q.questionType === "FILL_IN_FORM" && q.blanksOptions)
      ? checkAnswer(q.userAnswer, q.correctAnswer, q.questionType, q.blanksOptions)
      : q.isCorrect;
    return res === true;
  }).length;

  return (
    <div className="mb-6">
      <div className={`flex items-center justify-between rounded-xl px-4 py-3 mb-3 ${cfg.bg} border ${cfg.border}`}>
        <div className={`flex items-center gap-2 font-extrabold text-sm ${cfg.color}`}>
          {cfg.icon}{cfg.label}
        </div>
        {gradable.length > 0 && (
          <span className="text-xs font-semibold text-gray-500 bg-white/70 px-2 py-0.5 rounded-full border border-gray-200">
            {correct}/{gradable.length} đúng
          </span>
        )}
      </div>

      {Array.from(byPart.entries()).sort(([a],[b])=>a-b).map(([partNum, qs]) => (
        <div key={partNum} className="mb-4">
          {partNum > 0 && (
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Part {partNum}</p>
          )}
          <div className="flex flex-col gap-2">
            {qs.map((q, i) => <QuestionCard key={q.mongoDocId ?? i} q={q} idx={i}/>)}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Page
const PAPER_ORDER = ["LISTENING", "READING_WRITING", "SPEAKING"];

export default function ExamAttemptViewPage() {
  const navigate = useNavigate();
  const { level, testId, attemptId } = useParams<{ level: string; testId: string; attemptId: string }>();

  const [detail, setDetail]   = useState<ExamAttemptDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const numAttemptId = parseInt(attemptId ?? "0", 10);
  const numTestId    = parseInt((testId ?? "0").replace(/\D/g, ""), 10);

  useEffect(() => {
    if (isNaN(numAttemptId) || numAttemptId <= 0) {
      setError("ID không hợp lệ."); setLoading(false); return;
    }
    examService.getAttemptDetail(numAttemptId)
      .then(setDetail)
      .catch(() => setError("Không thể tải chi tiết bài thi."))
      .finally(() => setLoading(false));
  }, [numAttemptId]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500"/>
        <p className="text-sm text-gray-500">Đang tải bài thi…</p>
      </div>
    </div>
  );

  if (error || !detail) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="rounded-2xl bg-white border border-orange-100 shadow-lg p-8 text-center max-w-sm">
        <p className="text-red-600 font-semibold mb-4">{error ?? "Không tìm thấy bài thi."}</p>
        <button type="button" onClick={() => navigate(-1)}
          className="rounded-xl bg-orange-500 text-white px-5 py-2 text-sm font-bold hover:bg-orange-600 transition">
          Quay lại
        </button>
      </div>
    </div>
  );

  // Group questions by paper (same logic as ExamResultPage)
  const byPaper = new Map<string, QuestionResultDetailDto[]>();
  PAPER_ORDER.forEach(p => byPaper.set(p, []));
  detail.questionResults.forEach(q => {
    const pk = q.paperType ?? (
      q.questionType === "SPEAKING_TASK" ? "SPEAKING"
      : q.questionType === "SHORT_WRITE" || q.questionType === "FILL_IN_FORM"
        || q.questionType === "FILL_IN_TEXT" || q.questionType === "MATCHING"
        ? "READING_WRITING"
      : "LISTENING"
    );
    if (!byPaper.has(pk)) byPaper.set(pk, []);
    byPaper.get(pk)!.push(q);
  });

  // Tính tổng số câu đúng/tổng cho mỗi paper
  const paperStats = PAPER_ORDER.map(pk => {
    const qs = (byPaper.get(pk) ?? []).filter(q =>
      q.questionType !== "SHORT_WRITE" && q.questionType !== "SPEAKING_TASK"
    );
    const correct = qs.filter(q =>
      checkAnswer(q.userAnswer, q.correctAnswer, q.questionType, q.blanksOptions) === true
    ).length;
    return { pk, correct, total: qs.length };
  }).filter(s => s.total > 0);

  const totalCorrect = paperStats.reduce((a, s) => a + s.correct, 0);
  const totalQuestions = paperStats.reduce((a, s) => a + s.total, 0);
  const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <button type="button" onClick={() => navigate(`/exam/${level}`)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-600 transition shrink-0">
            <ArrowLeft className="h-4 w-4"/>Danh sách đề thi
          </button>
          <div className="text-center min-w-0">
            <p className="text-base font-extrabold text-gray-800 truncate">{detail.testTitle}</p>
            <p className="text-xs text-gray-400">{formatDate(detail.attemptedAt)}</p>
          </div>
          <button type="button"
            onClick={() => navigate(`/exam/${level}/${numTestId}/listening`)}
            className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-bold transition shadow-sm shrink-0">
            <RotateCcw className="h-4 w-4"/>Thi lại
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Summary banner ── */}
        <div className="rounded-2xl bg-white border border-orange-100 shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-white/80 shrink-0"/>
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Tổng kết</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-white">{totalCorrect}</span>
                <span className="text-sm text-white/70">/ {totalQuestions}</span>
                <span className="ml-1 text-sm font-semibold text-white/80">({overallPct}%)</span>
              </div>
              <div className="flex flex-wrap gap-2 ml-auto">
                {(["LISTENING", "READING_WRITING"] as const).map(pk => {
                  const stat = paperStats.find(s => s.pk === pk);
                  if (!stat) return null;
                  const labels: Record<string, string> = { LISTENING: "L", READING_WRITING: "R&W" };
                  return (
                    <div key={pk} className="flex items-baseline gap-1 bg-white/20 rounded-lg px-3 py-1">
                      <span className="text-xs font-semibold text-white/80">{labels[pk]}:</span>
                      <span className="text-sm font-black text-white">{stat.correct}</span>
                      <span className="text-xs text-white/70">/{stat.total}</span>
                    </div>
                  );
                })}
                {detail.speakingScore != null && detail.speakingScore > 0 && (
                  <div className="flex items-baseline gap-1 bg-white/20 rounded-lg px-3 py-1">
                    <span className="text-xs font-semibold text-white/80">Speaking:</span>
                    <span className="text-sm font-black text-white">{detail.speakingScore}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Writing + Speaking score arcs */}
          {(detail.writingScore != null || detail.speakingScore != null) && (
            <div className="flex divide-x divide-gray-100">
              {detail.writingScore != null && (
                <div className="flex flex-col items-center py-5 px-8 gap-1 flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <BookOpen className="h-3.5 w-3.5"/>Writing
                  </p>
                  <ScoreArc score={detail.writingScore} size={96}/>
                </div>
              )}
              {detail.speakingScore != null && (
                <div className="flex flex-col items-center py-5 px-8 gap-1 flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Mic className="h-3.5 w-3.5"/>Speaking
                  </p>
                  <ScoreArc score={detail.speakingScore} size={96}/>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Per-paper question review ── */}
        <div>
          <p className="text-base font-extrabold text-gray-700 mb-5">📋 Xem lại từng câu</p>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Listening column */}
            <div>
              {(["LISTENING"] as const).map(pk => {
                const qs = byPaper.get(pk) ?? [];
                if (qs.length === 0) return null;
                return <PaperSection key={pk} paperKey={pk} questions={qs}/>;
              })}
            </div>
            {/* Reading & Writing column */}
            <div>
              {(["READING_WRITING"] as const).map(pk => {
                const qs = byPaper.get(pk) ?? [];
                if (qs.length === 0) return null;
                return <PaperSection key={pk} paperKey={pk} questions={qs}/>;
              })}
            </div>
            {/* Speaking column */}
            <div>
              {(["SPEAKING"] as const).map(pk => {
                const qs = byPaper.get(pk) ?? [];
                if (qs.length === 0) return null;
                return <PaperSection key={pk} paperKey={pk} questions={qs}/>;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
