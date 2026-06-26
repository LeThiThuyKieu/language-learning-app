import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { examService, type ExamQuestionDto } from "@/services/examService";
import { Mic, MicOff, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import LessonExitModal from "@/components/user/learn/LessonExitModal.tsx";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

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
      <p className="text-base font-semibold text-white/90 mb-2">Hãy chuẩn bị micro và nói rõ ràng.</p>
      <button type="button" onClick={onStart}
        className="flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-bold px-12 py-3.5 text-base transition shadow-xl mt-6">
        Bắt đầu
      </button>
    </div>
  );
}

function ExamHeader({ onExit }: { onExit: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
      <button type="button" onClick={onExit}
        className="flex items-center justify-center h-9 w-9 rounded-xl text-gray-500 hover:bg-gray-100 transition">
        <X className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <span className="text-sm font-extrabold text-gray-600 uppercase tracking-widest">Speaking</span>
      <div className="w-9" />
    </div>
  );
}

function SpeakingPartNavBar({
  tasks, doneKeys, activeTaskIdx, onGoToTask, onFinish,
}: {
  tasks: ExamQuestionDto[]; doneKeys: Set<string>;
  activeTaskIdx: number; onGoToTask: (idx: number) => void; onFinish: () => void;
}) {
  // Nhóm theo partNumber (lấy từ partTitle hoặc questionNumberStart)
  const parts = useMemo(() => {
    const map = new Map<number, { task: ExamQuestionDto; idx: number }[]>();
    tasks.forEach((t, idx) => {
      const partNum = t.questionNumberStart ?? idx + 1;
      const arr = map.get(partNum) ?? [];
      arr.push({ task: t, idx });
      map.set(partNum, arr);
    });
    return Array.from(map.entries()).map(([partNum, items]) => ({ partNum, items }));
  }, [tasks]);

  const activeTask = tasks[activeTaskIdx];
  const activePartNum = activeTask?.questionNumberStart ?? activeTaskIdx + 1;

  return (
    <div className="flex items-stretch border-t-2 border-gray-300 bg-white">
      {parts.map(({ partNum, items }) => {
        const isActivePart = partNum === activePartNum;
        const doneCount = items.filter((i) => doneKeys.has(i.task.mongoDocId)).length;
        return (
          <button key={partNum} type="button"
            onClick={() => { if (items[0]) onGoToTask(items[0].idx); }}
            className={`flex flex-1 items-center justify-center gap-2 border-r border-gray-200 px-3 py-4 text-sm transition select-none ${
              isActivePart ? "bg-primary-50" : "bg-white hover:bg-gray-50"
            }`}>
            <span className={`whitespace-nowrap ${isActivePart ? "font-extrabold text-primary-700" : "font-medium text-gray-500"}`}>
              Part {partNum}
            </span>
            {isActivePart ? (
              <span className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                {items.map(({ task, idx }) => {
                  const isCurrent = idx === activeTaskIdx;
                  const isDone = doneKeys.has(task.mongoDocId);
                  return (
                    <span key={task.mongoDocId} onClick={(e) => { e.stopPropagation(); onGoToTask(idx); }}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-extrabold cursor-pointer transition ${
                        isCurrent ? "bg-primary-600 text-white ring-2 ring-primary-300"
                        : isDone ? "bg-primary-100 text-primary-700"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}>
                      {idx + 1}
                    </span>
                  );
                })}
              </span>
            ) : (
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{doneCount} of {items.length}</span>
            )}
          </button>
        );
      })}
      <button type="button" onClick={onFinish}
        className="flex items-center justify-center px-5 bg-primary-600 hover:bg-primary-700 text-white transition shrink-0 border-l-2 border-primary-700">
        <Check className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function TaskView({
  task, phase, timeLeft, isRecording, onStartRecord, onStopRecord,
}: {
  task: ExamQuestionDto; phase: "PREP" | "SPEAK" | "DONE";
  timeLeft: number; isRecording: boolean;
  onStartRecord: () => void; onStopRecord: () => void;
}) {
  const urgent = phase === "SPEAK" && timeLeft < 15;
  const prepSec = task.prepTimeSec ?? 0;
  const speakSec = task.speakTimeSec ?? 60;

  return (
    <div className="flex-1 overflow-y-auto bg-[#dce9f0] p-6 flex flex-col gap-5">
      {task.partTitle && (
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 self-start">
          <span className="text-xs font-extrabold text-primary-700 uppercase tracking-wide">{task.partTitle}</span>
        </div>
      )}

      {task.instruction && (
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
          <p className="text-sm font-bold text-gray-600 mb-1">Hướng dẫn</p>
          <p className="text-base text-gray-800">{task.instruction}</p>
        </div>
      )}

      {task.imageUrl && (
        <img src={task.imageUrl} alt="Speaking prompt"
          className="rounded-xl shadow-md max-w-lg w-full object-cover" />
      )}

      {task.prompt && (
        <div className="bg-white border-l-4 border-primary-500 rounded-xl px-5 py-4 shadow-sm">
          <p className="text-sm font-bold text-primary-600 mb-1">Câu hỏi / Chủ đề</p>
          <p className="text-base font-semibold text-gray-800 leading-relaxed">{task.prompt}</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 mt-2">
        <div className={`text-sm font-bold px-4 py-1.5 rounded-full ${
          phase === "PREP" ? "bg-yellow-100 text-yellow-700"
          : phase === "SPEAK" ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-500"
        }`}>
          {phase === "PREP" && `Chuẩn bị: ${formatTime(timeLeft)}`}
          {phase === "SPEAK" && `Đang nói: ${formatTime(timeLeft)}`}
          {phase === "DONE" && "Đã hoàn thành"}
        </div>

        {phase === "SPEAK" && (
          <button type="button" onClick={isRecording ? onStopRecord : onStartRecord}
            className={`flex flex-col items-center gap-2 rounded-full p-6 transition-all shadow-lg ${
              isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-primary-500 hover:bg-primary-600"
            }`}>
            {isRecording ? <MicOff className="h-10 w-10 text-white" /> : <Mic className="h-10 w-10 text-white" />}
            <span className="text-xs font-bold text-white">{isRecording ? "Dừng" : "Bắt đầu nói"}</span>
          </button>
        )}

        {phase !== "DONE" && (
          <div className="w-64 h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${
              urgent ? "bg-red-500" : phase === "PREP" ? "bg-yellow-400" : "bg-green-500"
            }`} style={{ width: `${(timeLeft / (phase === "PREP" ? prepSec : speakSec)) * 100}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExamSpeakingPage() {
  const navigate = useNavigate();
  const { level: _level, testId } = useParams<{ level: string; testId: string }>();

  const [tasks, setTasks] = useState<ExamQuestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [started, setStarted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [taskIdx, setTaskIdx] = useState(0);
  const [phase, setPhase] = useState<"PREP" | "SPEAK" | "DONE">("PREP");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load speaking paper
  useEffect(() => {
    if (!testId) return;
    const numericTestId = parseInt(testId.replace(/\D/g, ""), 10);
    if (isNaN(numericTestId)) { setError("Test ID không hợp lệ."); setLoading(false); return; }

    examService
      .getPaper(numericTestId, "SPEAKING")
      .then((paper) => {
        // Flatten tất cả questions từ tất cả parts
        const allTasks = paper.parts.flatMap((p) => p.questions);
        setTasks(allTasks);
      })
      .catch(() => setError("Không thể tải bài thi. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, [testId]);

  const currentTask = tasks[taskIdx];

  const startTimer = useCallback((sec: number, onEnd: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(sec);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); onEnd(); return 0; }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (!started || !currentTask) return;
    const prepSec = currentTask.prepTimeSec ?? 0;
    const speakSec = currentTask.speakTimeSec ?? 60;

    if (prepSec > 0) {
      setPhase("PREP");
      startTimer(prepSec, () => {
        setPhase("SPEAK");
        startTimer(speakSec, () => {
          setPhase("DONE");
          setDoneKeys((prev) => new Set([...prev, currentTask.mongoDocId]));
        });
      });
    } else {
      setPhase("SPEAK");
      startTimer(speakSec, () => {
        setPhase("DONE");
        setDoneKeys((prev) => new Set([...prev, currentTask.mongoDocId]));
      });
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [taskIdx, started, currentTask, startTimer]);

  function goNext() {
    if (isRecording) setIsRecording(false);
    if (taskIdx < tasks.length - 1) setTaskIdx((i) => i + 1);
    else navigate(-3);
  }
  function goPrev() {
    if (taskIdx > 0) { if (isRecording) setIsRecording(false); setTaskIdx((i) => i - 1); }
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

  if (error || tasks.length === 0) {
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
      <ExamHeader onExit={() => setShowExitModal(true)} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!started && <StartOverlay onStart={() => setStarted(true)} />}
        {currentTask && (
          <TaskView
            task={currentTask} phase={phase} timeLeft={timeLeft}
            isRecording={isRecording}
            onStartRecord={() => setIsRecording(true)}
            onStopRecord={() => setIsRecording(false)}
          />
        )}
      </div>

      <div className="fixed bottom-20 right-4 z-40 flex items-center shadow-lg rounded-lg overflow-hidden">
        <button type="button" onClick={goPrev} disabled={taskIdx === 0}
          className="flex items-center justify-center h-11 w-11 bg-gray-500 hover:bg-gray-600 disabled:opacity-30 text-white transition">
          <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
        </button>
        <button type="button" onClick={goNext}
          className={`flex items-center justify-center h-11 w-11 text-white transition ${
            taskIdx === tasks.length - 1 ? "bg-green-600 hover:bg-green-700" : "bg-primary-600 hover:bg-primary-700"
          }`}>
          <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>

      <SpeakingPartNavBar
        tasks={tasks} doneKeys={doneKeys} activeTaskIdx={taskIdx}
        onGoToTask={(idx) => { if (isRecording) setIsRecording(false); setTaskIdx(idx); }}
        onFinish={() => navigate(-3)}
      />

      <LessonExitModal open={showExitModal} onContinue={() => setShowExitModal(false)} onExit={() => navigate(-1)}
        continueButtonText="Tiếp tục thi"
        bodyText="Đợi chút! Bạn sẽ mất hết tiến trình thi này nếu thoát bây giờ." />
    </div>
  );
}
