import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  examService,
  type ExamQuestionDto,
  type GradeResponse,
  type SpeakingPart,
  type SpeakingPhase,
} from "@/services/examService";
import { Mic, X, ChevronLeft, ChevronRight, Check, Loader2, Square } from "lucide-react";
import LessonExitModal from "@/components/user/learn/LessonExitModal.tsx";

// Types
interface PartGradeResult {
  partNumber:  number;
  partTitle:   string;
  transcript:  string;
  grade:       GradeResponse;
  questions:   string[];
}

// Web Speech API types
interface STTResultEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface STTErrorEvent extends Event { error: string; }
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult:  ((e: STTResultEvent) => void) | null;
  onerror:   ((e: STTErrorEvent) => void)  | null;
  onend:     (() => void)                  | null;
  start(): void; stop(): void; abort(): void;
}
declare global {
  interface Window {
    SpeechRecognition:       new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Collect all question texts from a SpeakingPart (all phases) */
function collectPartQuestions(part: SpeakingPart): string[] {
  const questions: string[] = [];
  part.phases.forEach((phase, pi) => {
    phase.questions.forEach(q => {
      questions.push(`Phase ${pi + 1}: ${q.questionText}`);
    });
    if (phase.extendedResponse?.prompt) {
      questions.push(`Phase ${pi + 1} (Extended): ${phase.extendedResponse.prompt}`);
    }
  });
  return questions;
}

// StartOverlay
function StartOverlay({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#5a5a5a]/90">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-white">
        <Mic className="h-12 w-12 text-white" strokeWidth={1.5}/>
      </div>
      <p className="max-w-lg text-center text-lg font-bold text-white leading-snug px-8 mb-3">
        Bạn đã hoàn thành phần Reading and Writing.<br/>
        Tiếp theo là phần <span className="text-orange-300">Speaking</span>.
      </p>
      <p className="text-sm text-white/80 mb-2 px-8 text-center">
        Bấm <strong>Bắt đầu ghi âm</strong> ở góc phải để ghi âm xuyên suốt từng Part. Nói tự nhiên, trả lời tất cả câu hỏi.
      </p>
      <button type="button" onClick={onStart}
        className="mt-6 flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold px-12 py-3.5 text-base transition shadow-xl">
        Bắt đầu
      </button>
    </div>
  );
}

// ExamHeader — recording button per part (top right)
function ExamHeader({
  onExit, isRecording, isGrading, timeElapsed, partDuration,
  onStartRecord, onStopRecord, started, transcript,
}: {
  onExit:       () => void;
  isRecording:  boolean;
  isGrading:    boolean;
  timeElapsed:  number;
  partDuration: number;
  onStartRecord:() => void;
  onStopRecord: () => void;
  started:      boolean;
  transcript:   string;
}) {
  const totalSec = partDuration * 60;
  const pct    = Math.min((timeElapsed / (totalSec || 1)) * 100, 100);
  const urgent = timeElapsed > totalSec * 0.8;

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm gap-4">
      <button type="button" onClick={onExit}
        className="flex items-center justify-center h-9 w-9 rounded-xl text-gray-500 hover:bg-gray-100 transition shrink-0">
        <X className="h-5 w-5" strokeWidth={2.5}/>
      </button>
      <span className="text-sm font-extrabold text-gray-600 uppercase tracking-widest shrink-0">Speaking</span>

      {started ? (
        <div className="flex items-center gap-3 flex-1 justify-end">
          {/* Timer bar */}
          {totalSec > 0 && (
            <div className="flex flex-col gap-0.5 w-36">
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>{formatTime(timeElapsed)}</span>
                <span>{formatTime(totalSec)}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-red-500" : "bg-orange-400"}`}
                  style={{ width:`${pct}%` }}/>
              </div>
            </div>
          )}

          {/* Transcript indicator */}
          {transcript && !isRecording && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              ✓ Đã ghi
            </span>
          )}

          {/* Record button */}
          {isGrading ? (
            <div className="flex items-center gap-2 rounded-full bg-orange-100 px-5 py-2.5 text-orange-600 text-sm font-bold">
              <Loader2 className="h-4 w-4 animate-spin"/>Đang chấm…
            </div>
          ) : (
            <button type="button"
              onClick={isRecording ? onStopRecord : onStartRecord}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-bold text-sm text-white transition shadow-md shrink-0 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : transcript
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-orange-500 hover:bg-orange-600"
              }`}>
              {isRecording
                ? <><Square className="h-4 w-4 fill-white"/>Dừng ghi âm</>
                : transcript
                  ? <><Mic className="h-4 w-4"/>Ghi âm lại</>
                  : <><Mic className="h-4 w-4"/>Bắt đầu ghi âm</>
              }
            </button>
          )}
        </div>
      ) : (
        <div className="w-9 shrink-0"/>
      )}
    </div>
  );
}

// BottomNav
function BottomNav({
  parts, activePartIdx, activePhaseIdx, donePartsMap, onGoToPart, onGoToPhase, onFinish,
}: {
  parts:          SpeakingPart[];
  activePartIdx:  number;
  activePhaseIdx: number;
  donePartsMap:   Record<number, { score: number } | null>;
  onGoToPart:     (idx: number) => void;
  onGoToPhase:    (idx: number) => void;
  onFinish:       () => void;
}) {
  return (
    <div className="flex items-stretch border-t-2 border-gray-300 bg-white">
      {parts.map((part, idx) => {
        const isActive = idx === activePartIdx;
        const grade    = donePartsMap[idx];
        const scoreCol = grade
          ? (grade.score >= 80 ? "text-green-600" : grade.score >= 60 ? "text-orange-500" : "text-red-500")
          : "";
        return (
          <button key={part.partNumber} type="button" onClick={() => onGoToPart(idx)}
            className={`flex flex-1 items-center justify-center gap-2 border-r border-gray-200 px-3 py-4 text-sm font-bold transition select-none ${
              isActive ? "bg-orange-50 text-orange-700" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
            <span className={`whitespace-nowrap ${isActive ? "font-extrabold text-orange-700" : "font-medium text-gray-500"}`}>
              Part {part.partNumber}
            </span>
            {grade && !isActive && (
              <span className={`text-xs font-black ${scoreCol}`}>{grade.score}%</span>
            )}
            {isActive && (
              <span className="flex items-center gap-1 ml-1" onClick={e => e.stopPropagation()}>
                {part.phases.map((phase, pi) => {
                  const isPhaseActive = pi === activePhaseIdx;
                  return (
                    <span key={phase.phaseNumber}
                      onClick={e => { e.stopPropagation(); onGoToPhase(pi); }}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-extrabold cursor-pointer transition ${
                        isPhaseActive ? "bg-orange-500 text-white ring-2 ring-orange-300" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {phase.phaseNumber}
                    </span>
                  );
                })}
              </span>
            )}
          </button>
        );
      })}
      <button type="button" onClick={onFinish}
        className="flex items-center justify-center px-5 bg-orange-500 hover:bg-orange-600 text-white transition shrink-0 border-l-2 border-orange-600">
        <Check className="h-5 w-5" strokeWidth={2.5}/>
      </button>
    </div>
  );
}

// PhaseCard — chỉ hiển thị câu hỏi (không có mic per question)
function PhaseCard({
  phase, phaseRef, isActive,
}: {
  phase:    SpeakingPhase;
  phaseRef: (el: HTMLDivElement | null) => void;
  isActive: boolean;
}) {
  return (
    <div ref={phaseRef}
      className={`rounded-2xl bg-white shadow-sm border overflow-hidden transition-all ${
        isActive ? "border-orange-300 ring-2 ring-orange-100" : "border-gray-200"}`}>
      {/* Phase header */}
      <div className={`flex items-center justify-between gap-2 px-5 py-3 border-b ${
        isActive ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-100"}`}>
        <span className={`text-xs font-extrabold uppercase tracking-wide ${isActive ? "text-orange-600" : "text-gray-400"}`}>
          Phase {phase.phaseNumber}
        </span>
        {phase.allowedTime != null && (
          <span className="text-xs text-gray-400 font-medium">{phase.allowedTime} phút</span>
        )}
      </div>

      {phase.interlocutorIntro && (
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Interlocutor</p>
          <p className="text-base text-gray-700 italic leading-relaxed">{phase.interlocutorIntro}</p>
        </div>
      )}

      {/* Images */}
      {phase.mediaUrls && phase.mediaUrls.length > 0 ? (
        <div className="px-5 pb-3 flex gap-3">
          {phase.mediaUrls.map((url, i) => (
            <div key={i} className="flex-1 bg-gray-100 rounded-xl overflow-hidden" style={{ height:250 }}>
              <img src={url} alt={`img-${i}`} className="w-full h-full object-contain"/>
            </div>
          ))}
        </div>
      ) : phase.mediaUrl ? (
        <div className="px-5 pb-3">
          <img src={phase.mediaUrl} alt="Speaking material" className="rounded-xl w-full object-contain max-h-64"/>
        </div>
      ) : null}

      {/* Questions — display only, no mic */}
      <div className="px-5 pb-4 flex flex-col gap-2">
        {phase.questions.map((q, qi) => (
          <div key={qi}
            className={`flex items-start gap-3 rounded-xl px-4 py-3 ${
              q.type === "optional" ? "bg-yellow-50 border border-yellow-100" : "bg-gray-50 border border-gray-100"}`}>
            <span className={`mt-0.5 shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold ${
              q.candidateTarget === "both" ? "bg-gray-200 text-gray-600"
              : q.candidateTarget === "A"  ? "bg-blue-100 text-blue-700"
              : "bg-purple-100 text-purple-700"}`}>
              {q.candidateTarget === "both" ? "AB" : q.candidateTarget}
            </span>
            <div className="flex flex-1 items-start justify-between gap-4 min-w-0">
              <p className="text-base font-semibold text-gray-800 flex-1">{q.questionText}</p>
              {q.backupQuestions.length > 0 && (
                <p className="text-sm text-gray-400 italic shrink-0 text-right max-w-[40%]">
                  {q.backupQuestions.join(" / ")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {phase.extendedResponse && (
        <div className="mx-5 mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-sm font-extrabold text-amber-600 uppercase mb-1">Extended Response</p>
          <p className="text-base font-semibold text-gray-800">{phase.extendedResponse.prompt}</p>
          {phase.extendedResponse.backupQuestions.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {phase.extendedResponse.backupQuestions.map((bq, i) => (
                <li key={i} className="text-sm text-amber-700">• {bq}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Main Page
export default function ExamSpeakingPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { level: _level, testId } = useParams<{ level: string; testId: string }>();

  const locState = (location.state ?? {}) as {
    writingGrades?:  Record<string, GradeResponse>;
    answers?:        Record<string, string>;
    correctAnswers?: Record<string, string>;
    questionTypes?:  Record<string, string>;
    paperTypes?:     Record<string, string>;
    testId?:         number;
  };
  const writingGrades = locState.writingGrades  ?? {};
  const passedAnswers = locState.answers        ?? {};
  const passedCorrect = locState.correctAnswers ?? {};
  const passedQTypes  = locState.questionTypes  ?? {};
  const passedPaperTypes = locState.paperTypes  ?? {};

  const [speakingDoc, setSpeakingDoc] = useState<ExamQuestionDto | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [started, setStarted]         = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const [partIdx, setPartIdx]   = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);

  // Per-part recording state
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false); // ref for use inside closures
  const [isGrading, setIsGrading]     = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  // partTranscripts[partIdx] = accumulated transcript for that part
  const [partTranscripts, setPartTranscripts] = useState<Record<number, string>>({});
  // donePartsMap[partIdx] = {score} after graded, or null if not yet
  const [donePartsMap, setDonePartsMap] = useState<Record<number, { score: number } | null>>({});
  const [allGradeResults, setAllGradeResults] = useState<PartGradeResult[]>([]);

  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Accumulate interim transcript
  const transcriptBufRef = useRef<string>("");

  const phaseRefs          = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!testId) return;
    const numericTestId = parseInt(testId.replace(/\D/g, ""), 10);
    if (isNaN(numericTestId)) { setError("Test ID không hợp lệ."); setLoading(false); return; }
    examService.getPaper(numericTestId, "SPEAKING")
      .then(paper => {
        const doc = paper.parts.flatMap(p => p.questions).find(q => q.questionType === "SPEAKING_TASK");
        setSpeakingDoc(doc ?? null);
      })
      .catch(() => setError("Không thể tải bài thi."))
      .finally(() => setLoading(false));
  }, [testId]);

  const parts: SpeakingPart[] = speakingDoc?.speakingParts ?? [];
  const currentPart           = parts[partIdx];

  // Reset khi đổi Part
  useEffect(() => {
    setPhaseIdx(0);
    setTimeElapsed(0);
    phaseRefs.current = [];
    stopTimer();
    isRecordingRef.current = false;
    stopRecognition();
    setIsRecording(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partIdx]);

  useEffect(() => () => { stopTimer(); stopRecognition(); }, []);

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }
  function stopRecognition() { recognitionRef.current?.abort(); recognitionRef.current = null; }

  // ── Recording: continuous STT for the whole Part ──
  function handleStartRecord() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Trình duyệt không hỗ trợ ghi âm. Dùng Chrome."); return; }

    stopRecognition();
    // Reset buffer: nếu ghi âm lại thì xoá transcript cũ và điểm cũ của part này
    transcriptBufRef.current = "";
    setPartTranscripts(prev => ({ ...prev, [partIdx]: "" }));
    setDonePartsMap(prev => ({ ...prev, [partIdx]: null }));
    setTimeElapsed(0); // reset timer khi ghi âm lại

    const rec = new SR();
    rec.lang            = "en-US";
    rec.interimResults  = true;
    rec.continuous      = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e: STTResultEvent) => {
      let final = "";
      // e.resultIndex chỉ những kết quả mới — tránh lặp toàn bộ history
      for (let i = e.resultIndex ?? 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
      }
      if (final) {
        transcriptBufRef.current += final;
        setPartTranscripts(prev => ({ ...prev, [partIdx]: transcriptBufRef.current.trim() }));
      }
    };
    rec.onerror = () => { setIsRecording(false); stopTimer(); };
    rec.onend = () => {
      // Auto-restart if still recording (continuous mode may stop)
      if (isRecordingRef.current && recognitionRef.current === rec) {
        try { rec.start(); } catch { setIsRecording(false); isRecordingRef.current = false; stopTimer(); }
      }
    };

    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
    isRecordingRef.current = true;

    timerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000);
  }

  async function handleStopRecord() {
    stopTimer();
    isRecordingRef.current = false;
    stopRecognition();
    setIsRecording(false);

    const transcript = partTranscripts[partIdx] ?? transcriptBufRef.current.trim();
    if (!transcript) return;

    // Grade the whole part
    setIsGrading(true);
    const partQuestions = collectPartQuestions(currentPart);
    try {
      const grade = await examService.gradeSpeaking({
        mongoDocId:          speakingDoc?.mongoDocId ?? "",
        partNumber:          currentPart.partNumber,
        partContext:         currentPart.partTitle,
        partDurationMinutes: currentPart.duration,
        transcript,
        allQuestionsText:    partQuestions,
        totalQuestions:      partQuestions.length,
      });

      setDonePartsMap(prev => ({ ...prev, [partIdx]: { score: grade.score } }));
      setAllGradeResults(prev => [
        ...prev.filter(r => r.partNumber !== currentPart.partNumber),
        {
          partNumber: currentPart.partNumber,
          partTitle:  currentPart.partTitle,
          transcript,
          grade,
          questions:  partQuestions,
        },
      ]);
    } catch {
      setDonePartsMap(prev => ({ ...prev, [partIdx]: { score: 0 } }));
    } finally {
      setIsGrading(false);
    }
  }

  function goToPhase(idx: number) {
    setPhaseIdx(idx);
    const el = phaseRefs.current[idx];
    const c  = scrollContainerRef.current;
    if (el && c) c.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  }

  function handleScroll() {
    const c = scrollContainerRef.current;
    if (!c) return;
    const top = c.scrollTop + 100;
    let cur = 0;
    phaseRefs.current.forEach((el, i) => { if (el && el.offsetTop <= top) cur = i; });
    setPhaseIdx(cur);
  }

  function goPrev() {
    if (isRecording) handleStopRecord();
    if (partIdx > 0) setPartIdx(i => i - 1);
  }
  function goNext() {
    if (isRecording) handleStopRecord();
    if (partIdx < parts.length - 1) setPartIdx(i => i + 1);
    else handleFinish();
  }

  function handleFinish() {
    if (isRecording) handleStopRecord();
    stopRecognition();
    const numericTestId = testId ? parseInt(testId.replace(/\D/g, ""), 10) : 0;
    navigate(`/exam/${_level}/${testId}/result`, {
      state: {
        testId:         numericTestId,
        writingGrades,
        speakingGrades: allGradeResults,
        answers:        passedAnswers,
        correctAnswers: passedCorrect,
        questionTypes:  passedQTypes,
        paperTypes:     passedPaperTypes,
      },
    });
  }

  // ── Loading / Error ──
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#e8eef2]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"/>
        <p className="text-sm text-gray-500">Đang tải bài thi…</p>
      </div>
    </div>
  );
  if (error || parts.length === 0) return (
    <div className="flex h-screen items-center justify-center bg-[#e8eef2]">
      <div className="rounded-2xl bg-white p-8 shadow-lg text-center max-w-sm">
        <p className="text-red-600 font-semibold mb-4">{error ?? "Không có dữ liệu Speaking."}</p>
        <button type="button" onClick={() => navigate(-1)}
          className="rounded-xl bg-orange-500 text-white px-6 py-2.5 text-sm font-bold hover:bg-orange-600 transition">
          Quay lại
        </button>
      </div>
    </div>
  );

  const currentTranscript = partTranscripts[partIdx] ?? "";

  return (
    <div className="flex flex-col h-screen bg-[#e8eef2] overflow-hidden">
      <ExamHeader
        onExit={() => setShowExitModal(true)}
        isRecording={isRecording}
        isGrading={isGrading}
        timeElapsed={timeElapsed}
        partDuration={currentPart?.duration ?? 0}
        onStartRecord={handleStartRecord}
        onStopRecord={handleStopRecord}
        started={started}
        transcript={currentTranscript}
      />

      <div className="flex-1 overflow-hidden relative">
        {currentPart && (
          <div ref={scrollContainerRef} className="h-full overflow-y-auto" onScroll={handleScroll}>
            {/* Part header */}
            <div className="w-full px-6 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100 bg-white">
              <span className="inline-flex items-center rounded-full bg-orange-500 px-4 py-1.5 text-xs font-extrabold text-white uppercase tracking-wide">
                {currentPart.partTitle}
              </span>
              <span className="text-xs text-gray-400 font-medium">{currentPart.duration} phút</span>
              {donePartsMap[partIdx] && (
                <span className={`ml-auto text-sm font-black ${
                  donePartsMap[partIdx]!.score >= 60 ? "text-green-600" : "text-red-500"}`}>
                  {donePartsMap[partIdx]!.score}%
                </span>
              )}
            </div>

            {/* Live recording indicator only — không show transcript để tránh confuse */}
            {isRecording && (
              <div className="mx-6 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0"/>
                <p className="text-xs font-semibold text-red-600">Đang ghi âm… Hãy trả lời các câu hỏi bên dưới.</p>
              </div>
            )}

            {/* Phase cards */}
            <div className="w-full px-6 py-4 flex flex-col gap-4">
              {currentPart.phases.map((phase, pi) => (
                <PhaseCard
                  key={phase.phaseNumber}
                  phase={phase}
                  isActive={pi === phaseIdx}
                  phaseRef={el => { phaseRefs.current[pi] = el; }}
                />
              ))}
            </div>
          </div>
        )}
        {!started && <StartOverlay onStart={() => setStarted(true)}/>}
      </div>

      {/* Prev / Next */}
      {started && (
        <div className="fixed top-1/2 -translate-y-1/2 right-4 z-40 flex flex-col gap-1 shadow-lg rounded-xl overflow-hidden">
          <button type="button" onClick={goPrev} disabled={partIdx === 0}
            className="flex items-center justify-center h-11 w-11 bg-gray-500 hover:bg-gray-600 disabled:opacity-30 text-white transition">
            <ChevronLeft className="h-6 w-6" strokeWidth={2.5}/>
          </button>
          <button type="button" onClick={goNext}
            className={`flex items-center justify-center h-11 w-11 text-white transition ${
              partIdx === parts.length - 1 ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"}`}>
            <ChevronRight className="h-6 w-6" strokeWidth={2.5}/>
          </button>
        </div>
      )}

      <BottomNav
        parts={parts}
        activePartIdx={partIdx}
        activePhaseIdx={phaseIdx}
        donePartsMap={donePartsMap}
        onGoToPart={idx => { if (isRecording) handleStopRecord(); setPartIdx(idx); }}
        onGoToPhase={goToPhase}
        onFinish={handleFinish}
      />

      <LessonExitModal
        open={showExitModal}
        onContinue={() => setShowExitModal(false)}
        onExit={() => navigate(-1)}
        continueButtonText="Tiếp tục thi"
        bodyText="Đợi chút! Bạn sẽ mất hết tiến trình thi này nếu thoát bây giờ."
      />
    </div>
  );
}
