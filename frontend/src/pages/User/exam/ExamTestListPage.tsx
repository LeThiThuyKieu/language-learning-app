import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import GuestPrompt from "@/components/user/GuestPrompt";
import LearnSidebar from "@/components/user/learn/common/LearnSidebar.tsx";
import LearnRightPanel from "@/components/user/learn/common/LearnRightPanel.tsx";
import { EXAM_LEVELS, type CefrLevel } from "@/data/examMockData";
import { examService, type ExamTestDto, type ExamPaperSummaryDto } from "@/services/examService";
import { Clock, Headphones, BookOpen, Mic, ChevronRight, ArrowLeft } from "lucide-react";

const PAPER_ICON: Record<string, React.ReactNode> = {
  LISTENING:       <Headphones className="h-4 w-4" />,
  READING_WRITING: <BookOpen   className="h-4 w-4" />,
  SPEAKING:        <Mic        className="h-4 w-4" />,
};

function PaperBadge({ paper }: { paper: ExamPaperSummaryDto }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
      {PAPER_ICON[paper.paperType]}
      {paper.label}
      <span className="text-gray-400">·</span>
      <Clock className="h-3 w-3 text-gray-400" />
      {paper.durationLabel}
    </span>
  );
}

function TestCard({
  test,
  levelText,
  levelBorder,
  onSelect,
}: {
  test: ExamTestDto;
  levelText: string;
  levelBorder: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full text-left rounded-2xl border-2 bg-white p-5 transition-all hover:shadow-md active:scale-[0.99] ${levelBorder}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-lg font-extrabold ${levelText}`}>{test.title}</h3>
        <ChevronRight className={`h-5 w-5 ${levelText} transition-transform group-hover:translate-x-1`} />
      </div>
      <p className="text-sm text-gray-500 mb-4">{test.description}</p>
      <div className="flex flex-wrap gap-2">
        {test.papers.map((p) => (
          <PaperBadge key={p.paperType} paper={p} />
        ))}
      </div>
    </button>
  );
}

export default function ExamTestListPage() {
  const navigate = useNavigate();
  const { level } = useParams<{ level: string }>();
  const { isAuthenticated, logout } = useAuthStore();

  const levelKey = level?.toUpperCase() as CefrLevel;
  const levelInfo = EXAM_LEVELS.find((l) => l.id === levelKey);

  const [tests, setTests] = useState<ExamTestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!levelKey) return;
    setLoading(true);
    setError(null);
    examService
      .getTestsByLevel(levelKey)
      .then((data) => setTests(data))
      .catch(() => setError("Không thể tải danh sách bài thi. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, [levelKey]);

  if (!isAuthenticated) return <GuestPrompt />;
  if (!levelInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Không tìm thấy cấp độ này.</p>
      </div>
    );
  }

  return (
    <div className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white -mt-8">
      <div className="w-full px-4 pb-8 pt-5 md:px-8 md:pt-6">
        <div className="grid grid-cols-12 gap-6">
          <LearnSidebar
            isAllLevelsCompleted={false}
            showGeneralRevision={false}
            onToggleGeneralRevision={() => navigate("/general-revision")}
            activeItem="exam"
            onNavigate={(path) => navigate(path)}
            onLogout={() => { logout(); navigate("/login", { replace: true }); }}
          />

          <main className="col-span-12 md:col-span-9 lg:col-span-9">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 px-4 lg:px-6">
                {/* Header */}
                <div className="pt-6 mb-6">
                  <button
                    type="button"
                    onClick={() => navigate("/exam")}
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 mb-4 transition"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </button>

                  <div className={`inline-flex items-center gap-3 rounded-2xl px-5 py-3 ${levelInfo.color} border ${levelInfo.borderColor} mb-2`}>
                    <span className={`text-3xl font-black ${levelInfo.textColor}`}>{levelInfo.id}</span>
                    <div>
                      <div className={`text-base font-extrabold ${levelInfo.textColor}`}>{levelInfo.label}</div>
                      <div className="text-xs text-gray-500">{levelInfo.description}</div>
                    </div>
                  </div>
                </div>

                {/* Papers info — lấy từ test đầu tiên */}
                {tests[0] && (
                  <div className="mb-6 rounded-xl bg-gray-50 border border-gray-200 p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Cấu trúc bài thi</p>
                    <div className="flex flex-wrap gap-2">
                      {tests[0].papers.map((p) => (
                        <PaperBadge key={p.paperType} paper={p} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="flex flex-col gap-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                )}

                {/* Error */}
                {!loading && error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Danh sách bài thi */}
                {!loading && !error && (
                  <div className="flex flex-col gap-3">
                    {tests.map((test) => (
                      <TestCard
                        key={test.id}
                        test={test}
                        levelText={levelInfo.textColor}
                        levelBorder={levelInfo.borderColor}
                        onSelect={() =>
                          navigate(`/exam/${level}/${test.id}/listening`)
                        }
                      />
                    ))}
                    {tests.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-8">
                        Chưa có bài thi nào cho cấp độ này.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <LearnRightPanel onViewProfile={() => navigate("/profile")} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
