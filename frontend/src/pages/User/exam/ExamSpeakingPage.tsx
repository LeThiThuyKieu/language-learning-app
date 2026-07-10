import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  examService,
  type ExamQuestionDto,
  type SpeakingPart,
  type SpeakingPhase,
} from "@/services/examService";
import { Mic, MicOff, X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import LessonExitModal from "@/components/user/learn/LessonExitModal.tsx";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// StartOverlay
function StartOverlay({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#5a5a5a]/90">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-white">
        <Mic className="h-12 w-12 text-white" strokeWidth={1.5} />
      </div>
      <p className="max-w-lg text-center text-lg font-bold text-white leading-snug px-8 mb-3">
        Bạn đã hoàn thành phần Reading and Writing.<br />
        Tiếp theo là phần <span className="text-primary-300">Speaking</span>.
      </p>
      <p className="text-base font-semibold text-white/90 mb-2">
        Hãy chuẩn bị micro và nói rõ ràng.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-6 flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-bold px-12 py-3.5 text-base transition shadow-xl"
      >
        Bắt đầu
      </button>
    </div>
  );
}

// ExamHeader
function ExamHeader({
  onExit,
  isRecording,
  timeElapsed,
  partDuration,
  onStartRecord,
  onStopRecord,
  started,
}: {
  onExit: () => void;
  isRecording: boolean;
  timeElapsed: number;
  partDuration: number;
  onStartRecord: () => void;
  onStopRecord: () => void;
  started: boolean;
}) {
  const totalSec = partDuration * 60;
  const pct = Math.min((timeElapsed / totalSec) * 100, 100);
  const urgent = timeElapsed > totalSec * 0.8;

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm gap-4">
      {/* Left: exit */}
      <button
        type="button"
        onClick={onExit}
        className="flex items-center justify-center h-9 w-9 rounded-xl text-gray-500 hover:bg-gray-100 transition shrink-0"
      >
        <X className="h-5 w-5" strokeWidth={2.5} />
      </button>

      {/* Center: title */}
      <span className="text-sm font-extrabold text-gray-600 uppercase tracking-widest shrink-0">
        Speaking
      </span>

      {/* Right: recording panel */}
      {started ? (
        <div className="flex items-center gap-3 flex-1 justify-end">
          {/* Timer bar */}
          <div className="flex flex-col gap-0.5 w-40">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{formatTime(timeElapsed)}</span>
              <span>{formatTime(totalSec)}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-red-500" : "bg-primary-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          {/* Record button */}
          <button
            type="button"
            onClick={isRecording ? onStopRecord : onStartRecord}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-bold text-sm text-white transition shadow-md shrink-0 ${
              isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-primary-500 hover:bg-primary-600"
            }`}
          >
            {isRecording
              ? <><MicOff className="h-4 w-4" />Dừng lại</>
              : <><Mic className="h-4 w-4" />Bắt đầu ghi âm</>
            }
          </button>
        </div>
      ) : (
        <div className="w-9 shrink-0" />
      )}
    </div>
  );
}

// Bottom Nav: Part tabs với Phase bubbles inline
function BottomNav({
  parts,
  activePartIdx,
  activePhaseIdx,
  doneParts,
  onGoToPart,
  onGoToPhase,
  onFinish,
}: {
  parts: SpeakingPart[];
  activePartIdx: number;
  activePhaseIdx: number;
  doneParts: Set<number>;
  onGoToPart: (idx: number) => void;
  onGoToPhase: (idx: number) => void;
  onFinish: () => void;
}) {
  return (
    <div className="flex items-stretch border-t-2 border-gray-300 bg-white">
      {parts.map((part, idx) => {
        const isActive = idx === activePartIdx;
        const isDone = doneParts.has(idx);
        return (
          <button
            key={part.partNumber}
            type="button"
            onClick={() => onGoToPart(idx)}
            className={`flex flex-1 items-center justify-center gap-2 border-r border-gray-200 px-3 py-4 text-sm font-bold transition select-none ${
              isActive ? "bg-primary-50 text-primary-700" : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            {/* Part label */}
            <span className={`whitespace-nowrap ${isActive ? "font-extrabold text-primary-700" : "font-medium text-gray-500"}`}>
              Part {part.partNumber}
            </span>

            {/* Phase bubbles — chỉ hiện khi Part đang active */}
            {isActive ? (
              <span className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                {part.phases.map((phase, pi) => {
                  const isPhaseActive = pi === activePhaseIdx;
                  return (
                    <span
                      key={phase.phaseNumber}
                      onClick={(e) => { e.stopPropagation(); onGoToPhase(pi); }}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-extrabold cursor-pointer transition ${
                        isPhaseActive
                          ? "bg-primary-600 text-white ring-2 ring-primary-300"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {phase.phaseNumber}
                    </span>
                  );
                })}
              </span>
            ) : null}

            {isDone && !isActive && (
              <Check className="h-3.5 w-3.5 text-primary-500 ml-1" strokeWidth={2.5} />
            )}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onFinish}
        className="flex items-center justify-center px-5 bg-primary-600 hover:bg-primary-700 text-white transition shrink-0 border-l-2 border-primary-700"
      >
        <Check className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

// PhaseCard
function PhaseCard({
  phase,
  phaseRef,
  isActive,
}: {
  phase: SpeakingPhase;
  phaseRef: (el: HTMLDivElement | null) => void;
  isActive: boolean;
}) {
  return (
    <div
      ref={phaseRef}
      className={`rounded-2xl bg-white shadow-sm border overflow-hidden transition-all ${
        isActive ? "border-primary-300 ring-2 ring-primary-100" : "border-gray-200"
      }`}
    >
      <div
        className={`flex items-center justify-between gap-2 px-5 py-3 border-b ${
          isActive ? "bg-primary-50 border-primary-100" : "bg-gray-50 border-gray-100"
        }`}
      >
        <span
          className={`text-xs font-extrabold uppercase tracking-wide ${
            isActive ? "text-primary-600" : "text-gray-400"
          }`}
        >
          Phase {phase.phaseNumber}
        </span>
        {phase.allowedTime != null && (
          <span className="text-xs text-gray-400 font-medium">
            {phase.allowedTime} phút
          </span>
        )}
      </div>

      {phase.interlocutorIntro && (
        <div className="px-5 pt-4 pb-2">
          <p className="text-sm font-bold text-gray-400 uppercase mb-1">Interlocutor</p>
          <p className="text-base text-gray-700 italic leading-relaxed">{phase.interlocutorIntro}</p>
        </div>
      )}

      {/* Image(s) */}
      {(phase.mediaUrls && phase.mediaUrls.length > 0) ? (
        <div className="px-5 pb-3 flex gap-3">
          {phase.mediaUrls.map((url, i) => (
            <div key={i} className="flex-1 bg-gray-100 rounded-xl overflow-hidden" style={{ height: 250 }}>
              <img src={url} alt={`Speaking material ${i + 1}`}
                className="w-full h-full object-contain" />
            </div>
          ))}
        </div>
      ) : phase.mediaUrl ? (
        <div className="px-5 pb-3">
          <img src={phase.mediaUrl} alt="Speaking material"
            className="rounded-xl w-full object-contain max-h-64" />
        </div>
      ) : null}

      {/* Questions */}
      <div className="px-5 pb-4 flex flex-col gap-2">
        {phase.questions.map((q, qi) => (
          <div key={qi}
            className={`flex items-start gap-3 rounded-xl px-4 py-3 ${
              q.type === "optional"
                ? "bg-yellow-50 border border-yellow-100"
                : "bg-gray-50 border border-gray-100"
            }`}
          >
            <span className={`mt-0.5 shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold ${
              q.candidateTarget === "both" ? "bg-gray-200 text-gray-600"
              : q.candidateTarget === "A" ? "bg-blue-100 text-blue-700"
              : "bg-purple-100 text-purple-700"
            }`}>
              {q.candidateTarget === "both" ? "AB" : q.candidateTarget}
            </span>
            {/* Question text + backup prompt side by side */}
            <div className="flex flex-1 items-start justify-between gap-4 min-w-0">
              <p className="text-base font-semibold text-gray-800">{q.questionText}</p>
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
  const navigate = useNavigate();
  const { level: _level, testId } = useParams<{ level: string; testId: string }>();

  const [speakingDoc, setSpeakingDoc] = useState<ExamQuestionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const [partIdx, setPartIdx] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [doneParts, setDoneParts] = useState<Set<number>>(new Set());

  const [isRecording, setIsRecording] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!testId) return;
    const numericTestId = parseInt(testId.replace(/\D/g, ""), 10);
    if (isNaN(numericTestId)) { setError("Test ID không hợp lệ."); setLoading(false); return; }
    examService
      .getPaper(numericTestId, "SPEAKING")
      .then((paper) => {
        const doc = paper.parts.flatMap((p) => p.questions).find(
          (q) => q.questionType === "SPEAKING_TASK"
        );
        setSpeakingDoc(doc ?? null);
      })
      .catch(() => setError("Không thể tải bài thi. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, [testId]);

  const parts: SpeakingPart[] = speakingDoc?.speakingParts ?? [];
  const currentPart = parts[partIdx];

  // Reset khi đổi Part
  useEffect(() => {
    setPhaseIdx(0);
    setTimeElapsed(0);
    phaseRefs.current = [];
    if (timerRef.current) clearInterval(timerRef.current);
  }, [partIdx]);

  // Scroll tới phase card khi click phase tab
  function goToPhase(idx: number) {
    setPhaseIdx(idx);
    const el = phaseRefs.current[idx];
    const container = scrollContainerRef.current;
    if (el && container) {
      container.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
    }
  }

  // Scroll spy
  function handleScroll() {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop + 100;
    let current = 0;
    phaseRefs.current.forEach((el, i) => {
      if (el && el.offsetTop <= scrollTop) current = i;
    });
    setPhaseIdx(current);
  }

  function handleStartRecord() {
    setIsRecording(true);
    timerRef.current = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
  }
  function handleStopRecord() {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setDoneParts((prev) => new Set([...prev, partIdx]));
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function goPrev() {
    if (isRecording) handleStopRecord();
    if (partIdx > 0) setPartIdx((i) => i - 1);
  }
  function goNext() {
    if (isRecording) handleStopRecord();
    if (partIdx < parts.length - 1) setPartIdx((i) => i + 1);
    else navigate(-3);
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

  if (error || parts.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#e8eef2]">
        <div className="rounded-2xl bg-white p-8 shadow-lg text-center max-w-sm">
          <p className="text-red-600 font-semibold mb-4">{error ?? "Không có dữ liệu Speaking."}</p>
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
        onExit={() => setShowExitModal(true)}
        isRecording={isRecording}
        timeElapsed={timeElapsed}
        partDuration={currentPart?.duration ?? 0}
        onStartRecord={handleStartRecord}
        onStopRecord={handleStopRecord}
        started={started}
      />

      <div className="flex-1 overflow-hidden relative">
        {/* Phase content luôn render phía sau để overlay có thể che mờ */}
        {currentPart && (
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto"
            onScroll={handleScroll}
          >
            {/* Part header */}
            <div className="w-full px-6 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100 bg-white">
              <span className="inline-flex items-center rounded-full bg-primary-600 px-4 py-1.5 text-xs font-extrabold text-white uppercase tracking-wide">
                {currentPart.partTitle}
              </span>
              <span className="text-xs text-gray-400 font-medium">{currentPart.duration} phút</span>
            </div>

            {/* Phase cards */}
            <div className="w-full px-6 py-4 flex flex-col gap-4">
              {currentPart.phases.map((phase, pi) => (
                <PhaseCard
                  key={phase.phaseNumber}
                  phase={phase}
                  isActive={pi === phaseIdx}
                  phaseRef={(el) => { phaseRefs.current[pi] = el; }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Overlay che khi chưa bắt đầu */}
        {!started && <StartOverlay onStart={() => setStarted(true)} />}
      </div>

      {/* Prev / Next floating — lơ lửng giữa màn hình */}
      {started && (
        <div className="fixed top-1/2 -translate-y-1/2 right-4 z-40 flex flex-col items-center gap-1 shadow-lg rounded-xl overflow-hidden">
          <button type="button" onClick={goPrev} disabled={partIdx === 0}
            className="flex items-center justify-center h-11 w-11 bg-gray-500 hover:bg-gray-600 disabled:opacity-30 text-white transition">
            <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <button type="button" onClick={goNext}
            className={`flex items-center justify-center h-11 w-11 text-white transition ${
              partIdx === parts.length - 1 ? "bg-green-600 hover:bg-green-700" : "bg-primary-600 hover:bg-primary-700"
            }`}>
            <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Bottom nav: Phase tabs trên, Part tabs dưới */}
      <BottomNav
        parts={parts}
        activePartIdx={partIdx}
        activePhaseIdx={phaseIdx}
        doneParts={doneParts}
        onGoToPart={(idx) => { if (isRecording) handleStopRecord(); setPartIdx(idx); }}
        onGoToPhase={goToPhase}
        onFinish={() => navigate(-3)}
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
