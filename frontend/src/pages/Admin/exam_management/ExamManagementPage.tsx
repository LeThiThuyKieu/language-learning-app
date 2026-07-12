import { useEffect, useState, useCallback } from "react";
import {
    BookOpen,
    CheckCircle2,
    EyeOff,
    FileQuestion,
    Plus,
    Search,
    SlidersHorizontal,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminStatCard, { type AdminStatCardProps } from "@/components/admin/common/AdminStatCard";
import {
    examManagementService,
    examQuestionApi,
    type AdminExamTestDto,
    type AdminExamPaperDto,
    type ExamTestStats,
} from "@/services/admin/examManagementService";
import ExamTestRow from "@/components/admin/exam_management/ExamTestRow";
import ExamTestFormModal from "@/components/admin/exam_management/ExamTestFormModal";
import ExamTestDetailModal from "@/components/admin/exam_management/ExamTestDetailModal";
import { getErrorMessage } from "@/utils/errorMessage";

const CEFR_LEVELS = ["ALL", "A2", "B1", "B2", "C1", "C2"] as const;
type LevelFilter = (typeof CEFR_LEVELS)[number];

const PAGE_SIZE = 10;

function buildStats(s: ExamTestStats): AdminStatCardProps[] {
    return [
        {
            label: "Tổng Exam Tests",
            value: s.totalTests.toLocaleString(),
            icon: <BookOpen size={24} />,
            iconBg: "bg-orange-50",
            iconText: "text-orange-500",
            borderColor: "border-l-orange-500",
            change: "Tổng số bài thi",
            trend: "up" as const,
        },
        {
            label: "Đang hiển thị",
            value: s.activeTests.toLocaleString(),
            icon: <CheckCircle2 size={24} />,
            iconBg: "bg-green-50",
            iconText: "text-green-600",
            borderColor: "border-l-green-500",
            change: "Bài thi active",
            trend: "up" as const,
        },
        {
            label: "Đang ẩn",
            value: s.inactiveTests.toLocaleString(),
            icon: <EyeOff size={24} />,
            iconBg: "bg-slate-50",
            iconText: "text-slate-500",
            borderColor: "border-l-slate-400",
            change: "Bài thi inactive",
        },
        {
            label: "Tổng câu hỏi",
            value: s.totalQuestions.toLocaleString(),
            icon: <FileQuestion size={24} />,
            iconBg: "bg-blue-50",
            iconText: "text-blue-500",
            borderColor: "border-l-blue-500",
            change: "Trong toàn bộ bài thi",
            trend: "up" as const,
        },
    ];
}

export default function ExamManagementPage() {
    const [tests, setTests] = useState<AdminExamTestDto[]>([]);
    const [stats, setStats] = useState<AdminStatCardProps[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination & filter
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [levelFilter, setLevelFilter] = useState<LevelFilter>("ALL");
    const [search, setSearch] = useState("");

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editTest, setEditTest] = useState<AdminExamTestDto | null>(null);
    const [detailTest, setDetailTest] = useState<AdminExamTestDto | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [speakingPhaseCount, setSpeakingPhaseCount] = useState(0);

    const loadStats = useCallback(async () => {
        try {
            const s = await examManagementService.getStats();
            setStats(buildStats(s));
        } catch {
            // stats fail silently
        }
    }, []);

    const loadTests = useCallback(async () => {
        setLoading(true);
        try {
            const level = levelFilter === "ALL" ? undefined : levelFilter;
            const data = await examManagementService.getTests(page, PAGE_SIZE, level);
            setTests(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch {
            toast.error("Không thể tải danh sách bài thi");
        } finally {
            setLoading(false);
        }
    }, [page, levelFilter]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    useEffect(() => {
        loadTests();
    }, [loadTests]);

    // Reset về trang đầu khi đổi filter
    useEffect(() => {
        setPage(0);
    }, [levelFilter]);

    const handleToggle = async (test: AdminExamTestDto) => {
        try {
            const updated = await examManagementService.toggleVisibility(test.id);
            setTests(prev => prev.map(t => (t.id === updated.id ? updated : t)));
            toast.success(updated.isActive ? "Đã hiện bài thi" : "Đã ẩn bài thi");
            loadStats();
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể thay đổi trạng thái"));
        }
    };

    const handleOpenDetail = async (test: AdminExamTestDto) => {
        setDetailLoading(true);
        setDetailTest(test);
        setSpeakingPhaseCount(0);
        try {
            const detail = await examManagementService.getTestDetail(test.id);
            setDetailTest(detail);

            // Fetch speaking questions để đếm phases
            let phaseCount = 0;
            for (const paper of detail.papers) {
                if (paper.paperType !== "SPEAKING") continue;
                for (const part of paper.parts ?? []) {
                    try {
                        const qs = await examQuestionApi.getByPart(part.id);
                        const taskQ = qs.find(q => q.questionType === "SPEAKING_TASK");
                        if (taskQ?.speakingParts) {
                            for (const sp of taskQ.speakingParts) {
                                const phases = (sp as Record<string, unknown>).phases as unknown[] | undefined;
                                phaseCount += phases?.length ?? 0;
                            }
                        }
                    } catch { /* ignore */ }
                }
            }
            setSpeakingPhaseCount(phaseCount);
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể tải chi tiết"));
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCreated = (newTest: AdminExamTestDto) => {
        setCreateModalOpen(false);
        toast.success("Tạo bài thi thành công");
        loadTests();
        loadStats();
        void newTest;
    };

    const handleUpdated = (updated: AdminExamTestDto) => {
        setEditTest(null);
        setTests(prev => prev.map(t => (t.id === updated.id ? updated : t)));
        toast.success("Cập nhật thành công");
        loadStats();
    };

    // Client-side search filter
    const displayTests = search.trim()
        ? tests.filter(t =>
              t.title.toLowerCase().includes(search.toLowerCase()) ||
              t.cefrLevel.toLowerCase().includes(search.toLowerCase())
          )
        : tests;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Exam Management</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Quản lý danh sách bài thi CEFR (A2 → C2)
                    </p>
                </div>
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
                >
                    <Plus size={16} />
                    Thêm bài thi
                </button>
            </div>

            {/* Stats */}
            {stats.length > 0 && (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {stats.map((s, i) => (
                        <AdminStatCard key={i} {...s} />
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài thi..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
                        />
                    </div>

                    {/* Level filter */}
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal size={15} className="text-slate-400 shrink-0" />
                        <div className="flex gap-1">
                            {CEFR_LEVELS.map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLevelFilter(l)}
                                    className={[
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                        levelFilter === l
                                            ? "bg-orange-500 text-white shadow-sm"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                                    ].join(" ")}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <span className="text-center">Bài thi</span>
                    <span className="text-center">Cấp độ</span>
                    <span className="text-center">Papers</span>
                    <span className="text-center">Câu hỏi</span>
                    <span className="text-center">Trạng thái</span>
                    <span className="text-center">Hành động</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
                        Đang tải...
                    </div>
                ) : displayTests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <BookOpen size={40} className="mb-3 opacity-30" />
                        <p className="text-sm">Không có bài thi nào</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {displayTests.map(test => (
                            <ExamTestRow
                                key={test.id}
                                test={test}
                                onToggle={handleToggle}
                                onEdit={() => setEditTest(test)}
                                onDetail={() => handleOpenDetail(test)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
                        <span>
                            Hiển thị {page * PAGE_SIZE + 1}–
                            {Math.min((page + 1) * PAGE_SIZE, totalElements)} /&nbsp;
                            {totalElements} bài thi
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="font-medium text-slate-700">
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {createModalOpen && (
                <ExamTestFormModal
                    mode="create"
                    onClose={() => setCreateModalOpen(false)}
                    onSaved={handleCreated}
                />
            )}

            {/* Edit Modal */}
            {editTest && (
                <ExamTestFormModal
                    mode="edit"
                    test={editTest}
                    onClose={() => setEditTest(null)}
                    onSaved={handleUpdated}
                />
            )}

            {/* Detail Modal */}
            {detailTest && (
                <ExamTestDetailModal
                    test={detailTest}
                    loading={detailLoading}
                    onClose={() => setDetailTest(null)}
                    speakingPhaseCount={speakingPhaseCount}
                    onPaperUpdated={(updatedPaper: AdminExamPaperDto) => {
                        setDetailTest(prev => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                papers: prev.papers.map(p =>
                                    p.id === updatedPaper.id ? { ...p, ...updatedPaper } : p
                                ),
                            };
                        });
                    }}
                />
            )}
        </div>
    );
}
