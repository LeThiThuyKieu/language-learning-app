import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Headphones,
  Mic,
  Shuffle,
  Image,
  CheckCircle2,
  PlayCircle,
  Loader2,
  PenLine,
} from "lucide-react";
import { generalRevisionService } from "@/services/generalRevisionService";
import type { RevisionTopicDto, RevisionTaskDto } from "@/services/generalRevisionService";

// Re-export types for consumers
export type { RevisionTopicDto as RevisionTopic, RevisionTaskDto as RevisionTask };
export type RevisionTaskType = string;

// Props
interface GeneralRevisionViewProps {
  onStartTask: (topicId: number, task: RevisionTaskDto) => void;
  /** Navigate về trang học — truyền từ Page để View không phụ thuộc router */
  onBack?: () => void;
}

// Helpers
const KNOWN_TYPES = ["VOCAB", "VOCAB_IMAGE", "LISTENING", "SPEAKING", "WRITING", "MATCHING"] as const;
type KnownType = typeof KNOWN_TYPES[number];

const TASK_ICON: Record<KnownType, React.ReactNode> = {
  VOCAB:       <BookOpen   className="w-4 h-4 shrink-0" />,
  VOCAB_IMAGE: <Image      className="w-4 h-4 shrink-0" />,
  LISTENING:   <Headphones className="w-4 h-4 shrink-0" />,
  SPEAKING:    <Mic        className="w-4 h-4 shrink-0" />,
  WRITING:     <PenLine    className="w-4 h-4 shrink-0" />,
  MATCHING:    <Shuffle    className="w-4 h-4 shrink-0" />,
};
const TASK_COLOR: Record<KnownType, string> = {
  VOCAB:       "bg-blue-100 text-blue-700",
  VOCAB_IMAGE: "bg-cyan-100 text-cyan-700",
  LISTENING:   "bg-purple-100 text-purple-700",
  SPEAKING:    "bg-rose-100 text-rose-700",
  WRITING:     "bg-rose-100 text-rose-700",
  MATCHING:    "bg-amber-100 text-amber-700",
};
const TASK_BTN_COLOR: Record<KnownType, string> = {
  VOCAB:       "bg-blue-500 hover:bg-blue-600",
  VOCAB_IMAGE: "bg-cyan-500 hover:bg-cyan-600",
  LISTENING:   "bg-purple-500 hover:bg-purple-600",
  SPEAKING:    "bg-rose-500 hover:bg-rose-600",
  WRITING:     "bg-rose-500 hover:bg-rose-600",
  MATCHING:    "bg-amber-500 hover:bg-amber-600",
};

const getTaskIcon    = (t: string) => TASK_ICON[t as KnownType]    ?? <BookOpen className="w-4 h-4 shrink-0" />;
const getTaskColor   = (t: string) => TASK_COLOR[t as KnownType]   ?? "bg-gray-100 text-gray-700";
const getTaskBtnColor= (t: string) => TASK_BTN_COLOR[t as KnownType] ?? "bg-gray-500 hover:bg-gray-600";

function progressColor(n: number) {
  if (n === 0) return "bg-gray-200";
  if (n < 4)   return "bg-primary-400";
  return "bg-emerald-500";
}

// Sub-components

function TaskRow({ task, onStart }: { task: RevisionTaskDto; onStart: () => void }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition ${
      task.completed ? "border-emerald-200 bg-emerald-50/60" : "border-gray-100 bg-white hover:bg-gray-50"
    }`}>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shrink-0 ${getTaskColor(task.questionType)}`}>
        {getTaskIcon(task.questionType)}
        {task.taskLabel}
      </span>
      <span className="flex-1 text-sm text-gray-600 min-w-0 truncate">{task.description}</span>
      {task.completed ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> Hoàn thành
          </span>
          {/* Vẫn cho làm lại */}
          <button
            type="button"
            onClick={onStart}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition active:scale-95 ${getTaskBtnColor(task.questionType)}`}
          >
            <PlayCircle className="w-3.5 h-3.5" /> Làm lại
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onStart}
          className={`inline-flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition active:scale-95 ${getTaskBtnColor(task.questionType)}`}
        >
          <PlayCircle className="w-3.5 h-3.5" /> Làm bài
        </button>
      )}
    </div>
  );
}

function TopicCard({ topic, isOpen, onToggle, onStartTask }: {
  topic: RevisionTopicDto;
  isOpen: boolean;
  onToggle: () => void;
  onStartTask: (t: RevisionTaskDto) => void;
}) {
  const taskCount = topic.tasks?.length ?? 4;
  const allDone   = topic.completedTasks >= taskCount && taskCount > 0;

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${
      allDone ? "border-emerald-300" : isOpen ? "border-primary-300" : "border-gray-200"
    }`}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition ${
          allDone ? "bg-emerald-50 hover:bg-emerald-100/70"
          : isOpen ? "bg-primary-50 hover:bg-primary-100/60"
          : "bg-white hover:bg-gray-50"
        }`}
      >
        {/* Title + progress — không có icon */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-extrabold text-gray-900 truncate">{topic.title}</span>
            {allDone && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Hoàn thành
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate mb-2">{topic.description}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressColor(topic.completedTasks)}`}
                style={{ width: `${(topic.completedTasks / taskCount) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-500 shrink-0">
              {topic.completedTasks}/{taskCount}
            </span>
          </div>
        </div>
        <span className="text-gray-400 shrink-0">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </span>
      </button>

      {/* Task list */}
      {isOpen && (
        <div className="px-5 py-4 bg-gray-50/60 border-t border-gray-100 flex flex-col gap-2">
          {(topic.tasks ?? []).map((task) => (
            <TaskRow
              key={task.taskId}
              task={task}
              onStart={() => onStartTask(task)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main component

export default function GeneralRevisionView({ onStartTask, onBack }: GeneralRevisionViewProps) {
  const [topics, setTopics]       = useState<RevisionTopicDto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [openTopicId, setOpenTopicId] = useState<number | null>(null);

  const location = useLocation();

  // Giữ lại topic đang mở khi navigate về (state.topicId từ task page)
  const returnedTopicId = (location.state as { topicId?: number } | null)?.topicId;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await generalRevisionService.getTopics();
        if (!cancelled) {
          setTopics(data);
          // Tự mở lại topic vừa làm khi navigate về
          if (returnedTopicId) {
            setOpenTopicId(returnedTopicId);
          }
        }
      } catch {
        if (!cancelled) setError("Không tải được danh sách chủ đề. Vui lòng thử lại.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [location.key]); // reload mỗi lần navigate về

  const totalCompleted = topics.reduce((acc, t) => {
    const taskCount = t.tasks?.length ?? 4;
    return acc + (t.completedTasks >= taskCount && taskCount > 0 ? 1 : 0);
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Banner sticky */}
      <div className="sticky top-20 z-[45]">
        <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
          <div className="h-2 w-full bg-white pointer-events-none" aria-hidden />
          <div className="bg-gradient-to-r from-primary-500 to-orange-500 text-white px-6 py-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-extrabold uppercase tracking-widest transition w-fit mb-1"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Lộ trình học
              </button>
            )}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight">
                  Ôn tập tổng hợp
                </h1>
                <p className="text-sm text-white/80 mt-0.5 leading-snug">
                  Ôn luyện toàn diện nâng cao tư duy theo từng chủ đề thực tế.
                </p>
              </div>
              <img
                src="/logo/lion.png"
                alt="Lion mascot"
                className="w-14 h-14 object-contain drop-shadow-lg select-none shrink-0 hidden sm:block"
                draggable={false}
              />
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-white/70 font-bold mb-1.5">
                <span>Tiến độ tổng thể</span>
                <span>{totalCompleted}/{topics.length || 10} chủ đề</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: topics.length ? `${(totalCompleted / topics.length) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Đang tải chủ đề…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Topic list */}
      {!loading && !error && (
        <div className="flex flex-col gap-3">
          {topics.map((topic) => (
            <TopicCard
              key={topic.topicId}
              topic={topic}
              isOpen={openTopicId === topic.topicId}
              onToggle={() => setOpenTopicId((prev) => (prev === topic.topicId ? null : topic.topicId))}
              onStartTask={(task) => onStartTask(topic.topicId, task)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
