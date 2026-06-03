import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Headphones,
  Mic,
  Shuffle,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";

// Types

/**
 * Loại bài trong General Revision.
 * Dùng string thay vì union cứng để dễ mở rộng thêm type mới
 * (READING, WRITING, DICTATION…) mà không cần sửa lại type này.
 *
 * Các giá trị hiện tại: VOCAB | LISTENING | SPEAKING | MATCHING
 */
export type RevisionTaskType = string;

/** Các type đã biết — dùng để map icon/màu, fallback về default nếu không khớp */
const KNOWN_TYPES = ["VOCAB", "LISTENING", "SPEAKING", "MATCHING"] as const;
type KnownType = typeof KNOWN_TYPES[number];

export interface RevisionTask {
  taskId: number;
  taskIndex: number; // 1-4
  taskLabel: string;
  questionType: RevisionTaskType;
  description: string;
  completed?: boolean;
}

export interface RevisionTopic {
  topicId: number;
  title: string;
  description: string;
  iconUrl?: string;
  orderIndex: number;
  tasks: RevisionTask[];
  completedTasks: number; // 0-4
}

interface GeneralRevisionViewProps {
  onStartTask: (topicId: number, task: RevisionTask) => void;
}

//  Mock data

const MOCK_TOPICS: RevisionTopic[] = [
  {
    topicId: 1, title: "Daily Life", orderIndex: 1,
    description: "Từ vựng và kỹ năng giao tiếp hằng ngày",
    iconUrl: "/icons/general_revision/daily_life.svg", completedTasks: 2,
    tasks: [
      { taskId: 1,  taskIndex: 1, taskLabel: "Từ vựng",   questionType: "VOCAB",     description: "Điền từ còn thiếu vào chỗ trống",     completed: true  },
      { taskId: 2,  taskIndex: 2, taskLabel: "Nghe hiểu", questionType: "LISTENING", description: "Nghe và chọn đáp án đúng",             completed: true  },
      { taskId: 3,  taskIndex: 3, taskLabel: "Nói",       questionType: "SPEAKING",  description: "Đọc to câu cho trước",                 completed: false },
      { taskId: 4,  taskIndex: 4, taskLabel: "Ghép đôi",  questionType: "MATCHING",  description: "Ghép từ với nghĩa tương ứng",          completed: false },
    ],
  },
  {
    topicId: 2, title: "Travel", orderIndex: 2,
    description: "Tiếng Anh cho du lịch và khám phá",
    iconUrl: "/icons/general_revision/travel.svg", completedTasks: 0,
    tasks: [
      { taskId: 5,  taskIndex: 1, taskLabel: "Từ vựng",   questionType: "VOCAB",     description: "Từ vựng du lịch cơ bản",              completed: false },
      { taskId: 6,  taskIndex: 2, taskLabel: "Nghe hiểu", questionType: "LISTENING", description: "Nghe thông báo sân bay",               completed: false },
      { taskId: 7,  taskIndex: 3, taskLabel: "Nói",       questionType: "SPEAKING",  description: "Hỏi đường và chỉ đường",              completed: false },
      { taskId: 8,  taskIndex: 4, taskLabel: "Ghép đôi",  questionType: "MATCHING",  description: "Ghép từ du lịch với nghĩa",           completed: false },
    ],
  },
  {
    topicId: 3, title: "Food & Dining", orderIndex: 3,
    description: "Gọi món, nhà hàng và ẩm thực thế giới",
    iconUrl: "/icons/general_revision/food.svg", completedTasks: 4,
    tasks: [
      { taskId: 9,  taskIndex: 1, taskLabel: "Từ vựng",   questionType: "VOCAB",     description: "Từ vựng ẩm thực",                     completed: true  },
      { taskId: 10, taskIndex: 2, taskLabel: "Nghe hiểu", questionType: "LISTENING", description: "Nghe hội thoại nhà hàng",              completed: true  },
      { taskId: 11, taskIndex: 3, taskLabel: "Nói",       questionType: "SPEAKING",  description: "Đọc menu và gọi món",                 completed: true  },
      { taskId: 12, taskIndex: 4, taskLabel: "Ghép đôi",  questionType: "MATCHING",  description: "Ghép tên món ăn",                     completed: true  },
    ],
  },
  {
    topicId: 4, title: "Work & Career", orderIndex: 4,
    description: "Tiếng Anh công sở, phỏng vấn và email",
    iconUrl: "/icons/general_revision/work.svg", completedTasks: 0,
    tasks: [
      { taskId: 13, taskIndex: 1, taskLabel: "Từ vựng",   questionType: "VOCAB",     description: "Từ vựng văn phòng",                   completed: false },
      { taskId: 14, taskIndex: 2, taskLabel: "Nghe hiểu", questionType: "LISTENING", description: "Nghe cuộc họp",                        completed: false },
      { taskId: 15, taskIndex: 3, taskLabel: "Nói",       questionType: "SPEAKING",  description: "Phát âm từ chuyên ngành",              completed: false },
      { taskId: 16, taskIndex: 4, taskLabel: "Ghép đôi",  questionType: "MATCHING",  description: "Ghép vị trí công việc",               completed: false },
    ],
  },
  {
    topicId: 5, title: "Health & Body", orderIndex: 5,
    description: "Sức khỏe, bộ phận cơ thể và y tế",
    iconUrl: "/icons/general_revision/health.svg", completedTasks: 1,
    tasks: [
      { taskId: 17, taskIndex: 1, taskLabel: "Từ vựng",   questionType: "VOCAB",     description: "Từ vựng y tế",                        completed: true  },
      { taskId: 18, taskIndex: 2, taskLabel: "Nghe hiểu", questionType: "LISTENING", description: "Nghe khám bệnh",                       completed: false },
      { taskId: 19, taskIndex: 3, taskLabel: "Nói",       questionType: "SPEAKING",  description: "Mô tả triệu chứng",                   completed: false },
      { taskId: 20, taskIndex: 4, taskLabel: "Ghép đôi",  questionType: "MATCHING",  description: "Ghép bộ phận cơ thể",                 completed: false },
    ],
  },
  {
    topicId: 6, title: "Technology", orderIndex: 6,
    description: "Công nghệ, internet và thiết bị số",
    iconUrl: "/icons/general_revision/technology.svg", completedTasks: 0,
    tasks: [
      { taskId: 21, taskIndex: 1, taskLabel: "Từ vựng",   questionType: "VOCAB",     description: "Từ vựng công nghệ",                   completed: false },
      { taskId: 22, taskIndex: 2, taskLabel: "Nghe hiểu", questionType: "LISTENING", description: "Nghe hướng dẫn kỹ thuật",              completed: false },
      { taskId: 23, taskIndex: 3, taskLabel: "Nói",       questionType: "SPEAKING",  description: "Đọc tên thiết bị",                    completed: false },
      { taskId: 24, taskIndex: 4, taskLabel: "Ghép đôi",  questionType: "MATCHING",  description: "Ghép tính năng phần mềm",             completed: false },
    ],
  },
  {
    topicId: 7, title: "Nature & Environment", orderIndex: 7,
    description: "Môi trường, thời tiết và thiên nhiên",
    iconUrl: "/icons/general_revision/nature.svg", completedTasks: 0,
    tasks: [
      { taskId: 25, taskIndex: 1, taskLabel: "Từ vựng",   questionType: "VOCAB",     description: "Từ vựng môi trường",                  completed: false },
      { taskId: 26, taskIndex: 2, taskLabel: "Nghe hiểu", questionType: "LISTENING", description: "Nghe dự báo thời tiết",                completed: false },
      { taskId: 27, taskIndex: 3, taskLabel: "Nói",       questionType: "SPEAKING",  description: "Mô tả cảnh thiên nhiên",              completed: false },
      { taskId: 28, taskIndex: 4, taskLabel: "Ghép đôi",  questionType: "MATCHING",  description: "Ghép hiện tượng tự nhiên",            completed: false },
    ],
  },
  {
    topicId: 8, title: "Education", orderIndex: 8,
    description: "Học tập, trường lớp và học thuật",
    iconUrl: "/icons/general_revision/education.svg", completedTasks: 0,
    tasks: [
      { taskId: 29, taskIndex: 1, taskLabel: "Từ vựng",   questionType: "VOCAB",     description: "Từ vựng học đường",                   completed: false },
      { taskId: 30, taskIndex: 2, taskLabel: "Nghe hiểu", questionType: "LISTENING", description: "Nghe bài giảng",                       completed: false },
      { taskId: 31, taskIndex: 3, taskLabel: "Nói",       questionType: "SPEAKING",  description: "Trả lời câu hỏi lớp học",             completed: false },
      { taskId: 32, taskIndex: 4, taskLabel: "Ghép đôi",  questionType: "MATCHING",  description: "Ghép môn học với tên",                completed: false },
    ],
  },
  {
    topicId: 9, title: "Shopping", orderIndex: 9,
    description: "Mua sắm, giá cả và thương lượng",
    iconUrl: "/icons/general_revision/shopping.svg", completedTasks: 3,
    tasks: [
      { taskId: 33, taskIndex: 1, taskLabel: "Từ vựng",   questionType: "VOCAB",     description: "Từ vựng mua sắm",                     completed: true  },
      { taskId: 34, taskIndex: 2, taskLabel: "Nghe hiểu", questionType: "LISTENING", description: "Nghe hội thoại cửa hàng",              completed: true  },
      { taskId: 35, taskIndex: 3, taskLabel: "Nói",       questionType: "SPEAKING",  description: "Đọc giá và thương lượng",             completed: true  },
      { taskId: 36, taskIndex: 4, taskLabel: "Ghép đôi",  questionType: "MATCHING",  description: "Ghép loại hàng hóa",                  completed: false },
    ],
  },
  {
    topicId: 10, title: "Culture & Traditions", orderIndex: 10,
    description: "Văn hóa, lễ hội và phong tục thế giới",
    iconUrl: "/icons/general_revision/culture.svg", completedTasks: 0,
    tasks: [
      { taskId: 37, taskIndex: 1, taskLabel: "Từ vựng",   questionType: "VOCAB",     description: "Từ vựng văn hóa",                     completed: false },
      { taskId: 38, taskIndex: 2, taskLabel: "Nghe hiểu", questionType: "LISTENING", description: "Nghe giới thiệu lễ hội",               completed: false },
      { taskId: 39, taskIndex: 3, taskLabel: "Nói",       questionType: "SPEAKING",  description: "Kể về phong tục",                     completed: false },
      { taskId: 40, taskIndex: 4, taskLabel: "Ghép đôi",  questionType: "MATCHING",  description: "Ghép lễ hội với quốc gia",            completed: false },
    ],
  },
];

// Helpers

const TASK_ICON: Record<KnownType, React.ReactNode> = {
  VOCAB:     <BookOpen   className="w-4 h-4 shrink-0" />,
  LISTENING: <Headphones className="w-4 h-4 shrink-0" />,
  SPEAKING:  <Mic        className="w-4 h-4 shrink-0" />,
  MATCHING:  <Shuffle    className="w-4 h-4 shrink-0" />,
};

const TASK_COLOR: Record<KnownType, string> = {
  VOCAB:     "bg-blue-100 text-blue-700",
  LISTENING: "bg-purple-100 text-purple-700",
  SPEAKING:  "bg-rose-100 text-rose-700",
  MATCHING:  "bg-amber-100 text-amber-700",
};

const TASK_BTN_COLOR: Record<KnownType, string> = {
  VOCAB:     "bg-blue-500 hover:bg-blue-600",
  LISTENING: "bg-purple-500 hover:bg-purple-600",
  SPEAKING:  "bg-rose-500 hover:bg-rose-600",
  MATCHING:  "bg-amber-500 hover:bg-amber-600",
};

function getTaskIcon(type: RevisionTaskType): React.ReactNode {
  return TASK_ICON[type as KnownType] ?? <BookOpen className="w-4 h-4 shrink-0" />;
}
function getTaskColor(type: RevisionTaskType): string {
  return TASK_COLOR[type as KnownType] ?? "bg-gray-100 text-gray-700";
}
function getTaskBtnColor(type: RevisionTaskType): string {
  return TASK_BTN_COLOR[type as KnownType] ?? "bg-gray-500 hover:bg-gray-600";
}

function progressColor(completed: number): string {
  if (completed === 0) return "bg-gray-200";
  if (completed < 4) return "bg-primary-400";
  return "bg-emerald-500";
}

// Sub-components

function TaskRow({
  task,
  onStart,
}: {
  task: RevisionTask;
  onStart: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition ${
        task.completed
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-gray-100 bg-white hover:bg-gray-50"
      }`}
    >
      {/* Task type badge */}
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${getTaskColor(task.questionType)}`}
      >
        {getTaskIcon(task.questionType)}
        {task.taskLabel}
      </span>

      {/* Description */}
      <span className="flex-1 text-sm text-gray-600 min-w-0 truncate">
        {task.description}
      </span>

      {/* Status / action */}
      {task.completed ? (
        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
          Hoàn thành
        </span>
      ) : (
        <button
          type="button"
          onClick={onStart}
          className={`inline-flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition active:scale-95 ${getTaskBtnColor(task.questionType)}`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          Làm bài
        </button>
      )}
    </div>
  );
}

function TopicCard({
  topic,
  isOpen,
  onToggle,
  onStartTask,
}: {
  topic: RevisionTopic;
  isOpen: boolean;
  onToggle: () => void;
  onStartTask: (task: RevisionTask) => void;
}) {
  const allDone = topic.completedTasks >= 4;

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all ${
        allDone ? "border-emerald-300" : isOpen ? "border-primary-300" : "border-gray-200"
      }`}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition ${
          allDone
            ? "bg-emerald-50 hover:bg-emerald-100/70"
            : isOpen
            ? "bg-primary-50 hover:bg-primary-100/60"
            : "bg-white hover:bg-gray-50"
        }`}
      >
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
          {topic.iconUrl ? (
            <img
              src={topic.iconUrl}
              alt=""
              className="w-7 h-7 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <BookOpen className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Title + progress */}
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
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressColor(topic.completedTasks)}`}
                style={{ width: `${(topic.completedTasks / 4) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-500 shrink-0">{topic.completedTasks}/4</span>
          </div>
        </div>

        {/* Chevron */}
        <span className="text-gray-400 shrink-0">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </span>
      </button>

      {/* Task list */}
      {isOpen && (
        <div className="px-5 py-4 bg-gray-50/60 border-t border-gray-100 flex flex-col gap-2">
          {topic.tasks.map((task) => (
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

export default function GeneralRevisionView({ onStartTask }: GeneralRevisionViewProps) {
  const [openTopicId, setOpenTopicId] = useState<number | null>(null);

  const totalCompleted = MOCK_TOPICS.reduce((acc, t) => acc + (t.completedTasks >= 4 ? 1 : 0), 0);

  function handleToggle(topicId: number) {
    setOpenTopicId((prev) => (prev === topicId ? null : topicId));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white px-6 py-5 shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold leading-tight">10 Chủ đề</h2>
            <p className="text-sm text-white/80 mt-1 leading-snug">
              Ôn luyện toàn diện nâng cao tư duy theo từng chủ đề thực tế.
            </p>
          </div>
          <img
            src="/logo/lion.png"
            alt="Lion mascot"
            className="w-16 h-16 object-contain drop-shadow-lg select-none shrink-0 hidden sm:block"
            draggable={false}
          />
        </div>

        {/* Overall progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/70 font-bold mb-1.5">
            <span>Tiến độ tổng thể</span>
            <span>{totalCompleted}/10 chủ đề</span>
          </div>
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${(totalCompleted / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Topic list */}
      <div className="flex flex-col gap-3">
        {MOCK_TOPICS.map((topic) => (
          <TopicCard
            key={topic.topicId}
            topic={topic}
            isOpen={openTopicId === topic.topicId}
            onToggle={() => handleToggle(topic.topicId)}
            onStartTask={(task) => onStartTask(topic.topicId, task)}
          />
        ))}
      </div>
    </div>
  );
}
