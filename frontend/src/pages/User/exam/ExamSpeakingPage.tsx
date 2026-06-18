import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { A2_TEST1_SPEAKING, type SpeakingTask } from "@/data/examMockData";
import { Mic, MicOff, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import LessonExitModal from "@/components/user/learn/LessonExitModal.tsx";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Overlay chuyển tiếp từ Reading & Writing
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
      <p className="text-base font-semibold text-white/90 mb-2">Thời gian: 8–10 phút.</p>
      <p className="text-sm text-white/60 mb-8">Hãy chuẩn bị micro và nói rõ ràng.</p>
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
function ExamHeader({ onExit }: { onExit: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
      <button type="button" onClick={onExit}
        className="flex items-center justify-center h-9 w-9 rounded-xl text-gray-500 hover:bg-gray-100 transition">
        <X className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <span className="text-sm font-extrabold text-gray-600 uppercase tracking-widest">
        Speaking
      </span>
      <div className="w-9" />{/* spacer để giữ căn giữa */}
    </div>
  );
}

// Part Nav Bar
function SpeakingPartNavBar({
  tasks,
  doneTaskIds,
  activeTaskIdx,
  onGoToTask,
  onFinish,
}: {
  tasks: SpeakingTask[];
  doneTaskIds: Set<number>;
  activeTaskIdx: number;
  onGoToTask: (idx: number) => void;
  onFinish: () => void;
}) {
  // Nhóm tasks theo partNumber
  const parts = useMemo(() => {
    const map = new Map<number, SpeakingTask[]>();
    tasks.forEach((t) => {
      const arr = map.get(t.partNumber) ?? [];
      arr.push(t);
      map.set(t.partNumber, arr);
    });
    return Array.from(map.entries()).map(([partNum, items]) => ({ partNum, items }));
  }, [tasks]);

  // Tìm partNumber của task đang active
  const activePartNum = tasks[activeTaskIdx]?.partNumber ?? 1;

  return (
    <div className="flex items-stretch border-t-2 border-gray-300 bg-white">
      {parts.map(({ partNum, items }) => {
        const isActivePart = partNum === activePartNum;
        const doneCount    = items.filter((t) => doneTaskIds.has(t.id)).length;

        return (
          <button
            key={partNum}
            type="button"
            onClick={() => {
              const firstIdx = tasks.findIndex((t) => t.partNumber === partNum);
              if (firstIdx >= 0) onGoToTask(firstIdx);
            }}
            className={`flex flex-1 items-center justify-center gap-2 border-r border-gray-200 px-3 py-4 text-sm transition select-none ${
              isActivePart ? "bg-primary-50" : "bg-white hover:bg-gray-50"
            }`}
          >
            <span className={`whitespace-nowrap ${isActivePart ? "font-extrabold text-primary-700" : "font-medium text-gray-500"}`}>
              Part {partNum}
            </span>

            {isActivePart ? (
              <span className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                {items.map((t) => {
                  const globalIdx = tasks.findIndex((x) => x.id === t.id);
                  const isCurrent = globalIdx === activeTaskIdx;
                  const isDone    = doneTaskIds.has(t.id);
                  return (
                    <span
                      key={t.id}
                      onClick={(e) => { e.stopPropagation(); onGoToTask(globalIdx); }}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-extrabold cursor-pointer transition ${
                        isCurrent
                          ? "bg-primary-600 text-white ring-2 ring-primary-300"
                          : isDone
                            ? "bg-primary-100 text-primary-700"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {globalIdx + 1}
                    </span>
                  );
                })}
              </span>
            ) : (
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                {doneCount} of {items.length}
              </span>
            )}
          </button>
        );
      })}

      {/* Nút hoàn thành ✓ */}
      <button
        type="button"
        onClick={onFinish}
        className="flex items-center justify-center px-5 bg-primary-600 hover:bg-primary-700 text-white transition shrink-0 border-l-2 border-primary-700"
        title="Hoàn thành Speaking"
      >
        <Check className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

// Task View
function TaskView({
  task,
  phase,
  timeLeft,
  isRecording,
  onStartRecord,
  onStopRecord,
}: {
  task: SpeakingTask;
  phase: "PREP" | "SPEAK" | "DONE";
  timeLeft: number;
  isRecording: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
}) {
  const urgent = phase === "SPEAK" && timeLeft < 15;

  return (
    <div className="flex-1 overflow-y-auto bg-[#dce9f0] p-6 flex flex-col gap-5">
      {/* Part label */}
      <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 self-start">
        <span className="text-xs font-extrabold text-primary-700 uppercase tracking-wide">
          {task.partTitle}
        </span>
      </div>

      {/* Instruction */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
        <p className="text-sm font-bold text-gray-600 mb-1">Hướng dẫn</p>
        <p className="text-base text-gray-800">{task.instruction}</p>
      </div>

      {/* Ảnh minh họa (nếu có) */}
      {task.imageUrl && (
        <img
          src={task.imageUrl}
          alt="Speaking prompt"
          className="rounded-xl shadow-md max-w-lg w-full object-cover"
        />
      )}

      {/* Prompt */}
      <div className="bg-white border-l-4 border-primary-500 rounded-xl px-5 py-4 shadow-sm">
        <p className="text-sm font-bold text-primary-600 mb-1">Câu hỏi / Chủ đề</p>
        <p className="text-base font-semibold text-gray-800 leading-relaxed">{task.prompt}</p>
      </div>

      {/* Timer + mic */}
      <div className="flex flex-col items-center gap-4 mt-2">
        {/* Phase label */}
        <div className={`text-sm font-bold px-4 py-1.5 rounded-full ${
          phase === "PREP" ? "bg-yellow-100 text-yellow-700"
          : phase === "SPEAK" ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-500"
        }`}>
          {phase === "PREP" && `Chuẩn bị: ${formatTime(timeLeft)}`}
          {phase === "SPEAK" && `Đang nói: ${formatTime(timeLeft)}`}
          {phase === "DONE" && "Đã hoàn thành"}
        </div>

        {/* Nút mic */}
        {phase === "SPEAK" && (
          <button
            type="button"
            onClick={isRecording ? onStopRecord : onStartRecord}
            className={`flex flex-col items-center gap-2 rounded-full p-6 transition-all shadow-lg ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : "bg-primary-500 hover:bg-primary-600"
            }`}
          >
            {isRecording
              ? <MicOff className="h-10 w-10 text-white" />
              : <Mic className="h-10 w-10 text-white" />
            }
            <span className="text-xs font-bold text-white">
              {isRecording ? "Dừng" : "Bắt đầu nói"}
            </span>
          </button>
        )}

        {/* Thanh đếm ngược */}
        {phase !== "DONE" && (
          <div className="w-64 h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                urgent ? "bg-red-500" : phase === "PREP" ? "bg-yellow-400" : "bg-green-500"
              }`}
              style={{
                width: `${(timeLeft / (phase === "PREP" ? task.prepTimeSec : task.speakTimeSec)) * 100}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Main Page
export default function ExamSpeakingPage() {
  const navigate = useNavigate();
  const { level: _level, testId: _testId } = useParams<{ level: string; testId: string }>();

  const tasks = A2_TEST1_SPEAKING;

  const [started, setStarted]             = useState(false);
  const [showExitModal, setShowExitModal]   = useState(false);
  const [taskIdx, setTaskIdx]               = useState(0);
  const [phase, setPhase]                   = useState<"PREP" | "SPEAK" | "DONE">("PREP");
  const [timeLeft, setTimeLeft]             = useState(0);
  const [isRecording, setIsRecording]       = useState(false);
  const [doneTaskIds, setDoneTaskIds]       = useState<Set<number>>(new Set());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentTask = tasks[taskIdx];

  // Khởi tạo timer khi chuyển task / phase
  const startTimer = useCallback((sec: number, onEnd: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(sec);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          onEnd();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  // Khi bắt đầu task mới
  useEffect(() => {
    if (!started) return;
    if (currentTask.prepTimeSec > 0) {
      setPhase("PREP");
      startTimer(currentTask.prepTimeSec, () => {
        setPhase("SPEAK");
        startTimer(currentTask.speakTimeSec, () => {
          setPhase("DONE");
          setDoneTaskIds((prev) => new Set([...prev, currentTask.id]));
        });
      });
    } else {
      setPhase("SPEAK");
      startTimer(currentTask.speakTimeSec, () => {
        setPhase("DONE");
        setDoneTaskIds((prev) => new Set([...prev, currentTask.id]));
      });
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [taskIdx, started, currentTask, startTimer]);

  function handleStartRecord() { setIsRecording(true); }
  function handleStopRecord()  { setIsRecording(false); }

  function goNext() {
    if (isRecording) setIsRecording(false);
    if (taskIdx < tasks.length - 1) {
      setTaskIdx((i) => i + 1);
    } else {
      // Hoàn thành tất cả → thoát
      navigate(-3);
    }
  }
  function goPrev() {
    if (taskIdx > 0) {
      if (isRecording) setIsRecording(false);
      setTaskIdx((i) => i - 1);
    }
  }

  const isFirst = taskIdx === 0;
  const isLast  = taskIdx === tasks.length - 1;

  return (
    <div className="flex flex-col h-screen bg-[#e8eef2] overflow-hidden">
      <ExamHeader onExit={() => setShowExitModal(true)} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Overlay chuyển tiếp */}
        {!started && <StartOverlay onStart={() => setStarted(true)} />}

        <TaskView
          task={currentTask}
          phase={phase}
          timeLeft={timeLeft}
          isRecording={isRecording}
          onStartRecord={handleStartRecord}
          onStopRecord={handleStopRecord}
        />
      </div>

      {/* Prev / Next — lơ lửng góc phải gần dưới, giống Reading */}
      <div className="fixed bottom-20 right-4 z-40 flex items-center shadow-lg rounded-lg overflow-hidden">
        <button type="button" onClick={goPrev} disabled={isFirst}
          className="flex items-center justify-center h-11 w-11 bg-gray-500 hover:bg-gray-600 disabled:opacity-30 text-white transition">
          <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
        </button>
        <button type="button" onClick={goNext}
          className={`flex items-center justify-center h-11 w-11 text-white transition ${
            isLast ? "bg-green-600 hover:bg-green-700" : "bg-primary-600 hover:bg-primary-700"
          }`}>
          <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>

      <SpeakingPartNavBar
        tasks={tasks}
        doneTaskIds={doneTaskIds}
        activeTaskIdx={taskIdx}
        onGoToTask={(idx) => {
          if (isRecording) setIsRecording(false);
          setTaskIdx(idx);
        }}
        onFinish={() => navigate(-3)}
      />

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
