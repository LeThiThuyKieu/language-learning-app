import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import GuestPrompt from "@/components/user/GuestPrompt";
import LearnSidebar from "@/components/user/learn/common/LearnSidebar.tsx";
import LearnRightPanel from "@/components/user/learn/common/LearnRightPanel.tsx";
import { EXAM_LEVELS, type CefrLevel } from "@/data/examMockData";
import { examService, type ExamTestDto, type ExamPaperSummaryDto, type ExamAttemptSummaryDto } from "@/services/examService";
import {
  Clock, Headphones, BookOpen, Mic, ChevronRight, ArrowLeft,
  History, ChevronDown,
} from "lucide-react";

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
  test, levelText, levelBorder, onSelect, attempts, onViewAttempt,
}: {
  test: ExamTestDto;
  levelText: string;
  levelBorder: string;
  onSelect: () => void;
  attempts: ExamAttemptSummaryDto[];
  onViewAttempt: (attemptId: number) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const latest = attempts[0];

  function formatDate(iso: string) {
    try { return new Date(iso).toLocaleString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return iso; }
  }

  /** Format per-paper score: "L: 11/33 · R&W: 5/10" */
  function formatPaperScores(a: ExamAttemptSummaryDto): string {
    const parts: string[] = [];
    if (a.listeningTotal > 0) parts.push(`L: ${a.listeningCorrect}/${a.listeningTotal}`);
    if (a.rwTotal > 0)        parts.push(`R&W: ${a.rwCorrect}/${a.rwTotal}`);
    if (parts.length === 0 && a.totalCount > 0) parts.push(`${a.correctCount}/${a.totalCount}`);
    return parts.join(" · ");
  }

  return (
    <div className={`rounded-2xl border-2 bg-white overflow-hidden transition-all hover:shadow-md ${levelBorder}`}>
      {/* Main card — click to start */}
      <button type="button" onClick={onSelect}
        className="group w-full text-left p-5 active:scale-[0.99] transition">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-lg font-extrabold ${levelText}`}>{test.title}</h3>
          <ChevronRight className={`h-5 w-5 ${levelText} transition-transform group-hover:translate-x-1 shrink-0`}/>
        </div>
        <p className="text-sm text-gray-500 mb-3">{test.description}</p>
        <div className="flex flex-wrap gap-2">
          {test.papers.map(p => <PaperBadge key={p.paperType} paper={p}/>)}
        </div>
      </button>

      {/* History strip */}
      {attempts.length > 0 && (
        <div className="border-t border-orange-100">
          {/* Latest attempt summary */}
          {latest && !showHistory && (
            <div className="flex items-center justify-between px-5 py-2.5 bg-orange-50/60">
              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                <History className="h-3.5 w-3.5 text-orange-400 shrink-0"/>
                <span className="font-semibold text-gray-600">Lần cuối:</span>
                <span>{formatDate(latest.attemptedAt)}</span>
                <span className="text-gray-300">·</span>
                <span className="font-bold text-gray-700">{formatPaperScores(latest)}</span>
                {latest.writingScore != null && (
                  <span className="bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 font-bold">W {latest.writingScore}%</span>
                )}
                {latest.speakingScore != null && (
                  <span className="bg-rose-100 text-rose-700 rounded-full px-2 py-0.5 font-bold">S {latest.speakingScore}%</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <button type="button" onClick={() => onViewAttempt(latest.id)}
                  className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 text-xs font-bold transition">
                  Xem lại
                </button>
                {attempts.length > 1 && (
                  <button type="button" onClick={() => setShowHistory(true)}
                    className="rounded-lg border border-orange-200 text-orange-500 hover:bg-orange-50 px-2 py-1 text-xs font-bold transition flex items-center gap-1">
                    +{attempts.length - 1}
                    <ChevronDown className="h-3 w-3"/>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Expanded history */}
          {showHistory && (
            <div className="bg-orange-50/40">
              <div className="flex items-center justify-between px-5 py-2 border-b border-orange-100">
                <span className="text-xs font-bold text-orange-500 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5"/>{attempts.length} lần đã thi
                </span>
                <button type="button" onClick={() => setShowHistory(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition">Thu gọn ↑</button>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {attempts.map((a, i) => {
                  return (
                    <div key={a.id}
                      className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 px-3 py-2.5 shadow-sm">
                      {/* Rank badge */}
                      <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                        i === 0 ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400">{formatDate(a.attemptedAt)}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs font-bold text-gray-700">
                            {formatPaperScores(a)}
                          </span>
                          {a.writingScore != null && (
                            <span className="bg-violet-100 text-violet-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold">W {a.writingScore}%</span>
                          )}
                          {a.speakingScore != null && (
                            <span className="bg-rose-100 text-rose-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold">S {a.speakingScore}%</span>
                          )}
                        </div>
                      </div>
                      <button type="button" onClick={() => onViewAttempt(a.id)}
                        className="shrink-0 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 text-xs font-bold transition">
                        Xem lại
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
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
  // attempt history per testId
  const [attemptsMap, setAttemptsMap] = useState<Record<number, ExamAttemptSummaryDto[]>>({});

  useEffect(() => {
    if (!levelKey) return;
    setLoading(true);
    setError(null);
    examService
      .getTestsByLevel(levelKey)
      .then(async (data) => {
        setTests(data);
        // Fetch history for each test in parallel
        const map: Record<number, ExamAttemptSummaryDto[]> = {};
        await Promise.all(
          data.map(async (t) => {
            try {
              map[t.id] = await examService.getMyAttemptsForTest(t.id);
            } catch {
              map[t.id] = [];
            }
          })
        );
        setAttemptsMap(map);
      })
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
                        attempts={attemptsMap[test.id] ?? []}
                        onSelect={() =>
                          navigate(`/exam/${level}/${test.id}/listening`)
                        }
                        onViewAttempt={(attemptId) =>
                          navigate(`/exam/${level}/${test.id}/attempts/${attemptId}`)
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
