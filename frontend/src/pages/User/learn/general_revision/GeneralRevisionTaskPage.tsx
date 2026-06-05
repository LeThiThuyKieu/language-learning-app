import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { generalRevisionService } from "@/services/generalRevisionService";
import type { RevisionQuestionDto, RevisionTaskDto } from "@/services/generalRevisionService";
import LessonCompleteView from "@/components/user/learn/LessonCompleteView";
import GeneralRevisionVocabImageView from "@/components/user/learn/general_revision/task_views/GeneralRevisionVocabImageView";
import GeneralRevisionListeningView from "@/components/user/learn/general_revision/task_views/GeneralRevisionListeningView";
import GeneralRevisionWritingView from "@/components/user/learn/general_revision/task_views/GeneralRevisionWritingView";
import GeneralRevisionMatchingView from "@/components/user/learn/general_revision/task_views/GeneralRevisionMatchingView";
import { Loader2 } from "lucide-react";

type LocationState = {
  topicId?: number;
  task?: RevisionTaskDto;
};

export default function GeneralRevisionTaskPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const task    = state.task;
  const topicId = state.topicId;

  const [questions, setQuestions] = useState<RevisionQuestionDto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [finished, setFinished]   = useState(false);
  const [accuracy, setAccuracy]   = useState(0);

  useEffect(() => {
    if (!task?.taskId) {
      setError("Thiếu thông tin task. Vui lòng quay lại.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await generalRevisionService.getTaskQuestions(task.taskId);
        if (!cancelled) setQuestions(data);
      } catch {
        if (!cancelled) setError("Không tải được câu hỏi. Vui lòng thử lại.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [task?.taskId]);

  function handleLeave() {
    navigate("/general-revision");
  }

  function handleComplete(correctCount: number) {
    const total = questions.length || 1;
    setAccuracy(Math.round((correctCount / total) * 100));
    setFinished(true);
  }

  // Finished
  if (finished) {
    return (
      <LessonCompleteView
        knGained={0}
        accuracy={accuracy}
        newBadges={[]}
        onContinue={() => navigate("/general-revision", { state: { topicId } })}
      />
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center gap-2 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-semibold">Đang tải câu hỏi…</span>
      </div>
    );
  }

  // Error / missing task
  if (error || !task || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
          <p className="text-gray-700 font-semibold mb-4">
            {error ?? (questions.length === 0 ? "Chưa có câu hỏi cho task này." : "Đã xảy ra lỗi.")}
          </p>
          <button
            type="button"
            onClick={handleLeave}
            className="rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2.5 transition"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Render view theo question_type
  const qType = task.questionType;

  if (qType === "VOCAB_IMAGE") {
    return (
      <GeneralRevisionVocabImageView
        taskDescription={task.description ?? "Write the correct word under each picture"}
        questions={questions}
        onLeave={handleLeave}
        onComplete={handleComplete}
      />
    );
  }

  if (qType === "LISTENING") {
    return (
      <GeneralRevisionListeningView
        taskDescription={task.description ?? "Listen to the audio and write the word"}
        questions={questions}
        onLeave={handleLeave}
        onComplete={handleComplete}
      />
    );
  }

  if (qType === "SPEAKING" || qType === "WRITING") {
    return (
      <GeneralRevisionWritingView
        taskDescription={task.description ?? "Look at the pictures and write the words"}
        questions={questions}
        onLeave={handleLeave}
        onComplete={handleComplete}
      />
    );
  }

  if (qType === "MATCHING") {
    return (
      <GeneralRevisionMatchingView
        taskDescription={task.description ?? "Match the word with its meaning"}
        questions={questions}
        onLeave={handleLeave}
        onComplete={handleComplete}
      />
    );
  }

  // Các dạng khác → TODO
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
        <p className="text-gray-500 font-semibold mb-1">Dạng bài</p>
        <p className="text-xl font-extrabold text-gray-900 mb-4">{qType}</p>
        <p className="text-sm text-gray-400 mb-6">Đang phát triển — sẽ hoàn thiện sớm!</p>
        <button
          type="button"
          onClick={handleLeave}
          className="rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2.5 transition"
        >
          Quay lại
        </button>
      </div>
    </div>
  );
}
