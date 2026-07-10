import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    Headphones,
    BookOpen,
    Loader2,
    Eye,
    Pencil,
    Trash2,
    Plus,
    FileQuestion,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    examManagementService,
    examQuestionApi,
    type AdminExamTestDto,
    type AdminExamQuestionDto,
} from "@/services/admin/examManagementService";
import { getErrorMessage } from "@/utils/errorMessage";
import ConfirmModal from "@/components/user/layout/ConfirmModal";

const PAPER_ICONS: Record<string, React.ElementType> = {
    LISTENING: Headphones,
    READING_WRITING: BookOpen,
};

const PAPER_LABELS: Record<string, string> = {
    LISTENING: "Listening",
    READING_WRITING: "Reading & Writing",
    SPEAKING: "Speaking",
};

const PAPER_BADGE: Record<string, string> = {
    LISTENING: "bg-blue-50 text-blue-600",
    READING_WRITING: "bg-purple-50 text-purple-600",
    SPEAKING: "bg-green-50 text-green-600",
};

const QUESTION_TYPE_COLORS: Record<string, string> = {
    MULTIPLE_CHOICE: "bg-sky-100 text-sky-700",
    FILL_IN_BLANK: "bg-amber-100 text-amber-700",
    MATCHING: "bg-teal-100 text-teal-700",
    SHORT_ANSWER: "bg-pink-100 text-pink-700",
    SPEAKING: "bg-emerald-100 text-emerald-700",
};

const LEVEL_COLORS: Record<string, string> = {
    A2: "bg-green-100 text-green-700",
    B1: "bg-blue-100 text-blue-700",
    B2: "bg-indigo-100 text-indigo-700",
    C1: "bg-purple-100 text-purple-700",
    C2: "bg-rose-100 text-rose-700",
};

interface FlatQuestion extends AdminExamQuestionDto {
    paperType: string;
    partNumber: number;
    globalIndex: number;
}

/**
 * Parse một chuỗi JSON nếu hợp lệ, trả về null nếu không phải JSON.
 */
function tryParseJson(value: string): unknown | null {
    const trimmed = value.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
    try {
        return JSON.parse(trimmed);
    } catch {
        return null;
    }
}

/** Render một mảng đáp án thành text phẳng, cách nhau bởi " / " */
function AnswerPills({ items }: { items: string[] }) {
    return (
        <span className="text-sm font-medium text-gray-700">
            {items.join(" / ")}
        </span>
    );
}

/**
 * Render đáp án — hỗ trợ các dạng:
 *   - plain JSON array:        ["a","b"]                    →  pill: a  pill: b
 *   - plain JSON object:       {"1":"a","2":"b"}            →  Q1: pill  Q2: pill
 *   - multi "N:jsonArray":     25:["a","this"]26:["in",…]  →  Q25: pill pill  /  Q26: pill pill
 *   - single "N:jsonArray":    30:["when","after"]          →  Q30: pill pill
 *   - plain string:            "B"                          →  pill: B
 */
function AnswerCell({ value }: { value: string | null }) {
    if (!value) return <span className="text-gray-300 font-medium">—</span>;

    // Case: multi-entry  e.g. 25:["a","this"]26:["in","during"]...
    const multiPattern = /(\d+):(\[[\s\S]*?\]|\{[\s\S]*?\})/g;
    const multiMatches = [...value.matchAll(multiPattern)];
    if (multiMatches.length > 1) {
        return (
            <div className="space-y-1.5">
                {multiMatches.map((m) => {
                    const qNum = m[1];
                    const parsed = tryParseJson(m[2]);
                    const items: string[] = Array.isArray(parsed)
                        ? (parsed as unknown[]).map(String)
                        : parsed !== null && typeof parsed === "object"
                        ? Object.entries(parsed as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`)
                        : [m[2]];
                    return (
                        <div key={qNum} className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-gray-400 shrink-0 w-7 text-right">
                                Q{qNum}
                            </span>
                            <AnswerPills items={items} />
                        </div>
                    );
                })}
            </div>
        );
    }

    // Case: single "N:jsonValue"  e.g.  30:["when","after"]
    if (multiMatches.length === 1) {
        const qNum = multiMatches[0][1];
        const parsed = tryParseJson(multiMatches[0][2]);
        const items: string[] = Array.isArray(parsed)
            ? (parsed as unknown[]).map(String)
            : parsed !== null && typeof parsed === "object"
            ? Object.entries(parsed as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`)
            : [multiMatches[0][2]];
        return (
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-gray-400 shrink-0 w-7 text-right">
                    Q{qNum}
                </span>
                <AnswerPills items={items} />
            </div>
        );
    }

    // Case: plain JSON array
    const parsed = tryParseJson(value);
    if (parsed !== null) {
        if (Array.isArray(parsed)) {
            return <AnswerPills items={(parsed as unknown[]).map(String)} />;
        }
        if (typeof parsed === "object" && parsed !== null) {
            return (
                <div className="space-y-1.5">
                    {Object.entries(parsed as Record<string, unknown>).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-gray-400 shrink-0 w-7 text-right">
                                Q{k}
                            </span>
                            <AnswerPills
                                items={
                                    Array.isArray(v)
                                        ? (v as unknown[]).map(String)
                                        : [typeof v === "object" ? JSON.stringify(v) : String(v)]
                                }
                            />
                        </div>
                    ))}
                </div>
            );
        }
    }

    // Plain string
    return <AnswerPills items={[value]} />;
}

export default function ExamTestQuestionsPage() {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [test, setTest] = useState<AdminExamTestDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterPaper, setFilterPaper] = useState<string>("ALL");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [pendingDelete, setPendingDelete] = useState<FlatQuestion | null>(null);

    // Parse ?partId from query string
    const queryPartId = (() => {
        const p = new URLSearchParams(location.search).get("partId");
        return p ? parseInt(p, 10) : null;
    })();

    const handleViewQuestion = (q: FlatQuestion) => {
        navigate(`/admin/exam-management/${testId}/questions/${q.id}`, {
            state: { fromPartId: queryPartId ?? undefined },
        });
    };

    const handleEditQuestion = (q: FlatQuestion) => {
        navigate(`/admin/exam-management/${testId}/questions/${q.id}`, {
            state: { editMode: true, fromPartId: queryPartId ?? undefined },
        });
    };

    const handleDeleteQuestion = async (q: FlatQuestion) => {
        setPendingDelete(q);
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        const q = pendingDelete;
        setPendingDelete(null);
        setDeletingId(q.id);
        try {
            await examQuestionApi.delete(q.id);
            toast.success("Đã xóa câu hỏi");
            // Reload test data
            if (testId) {
                const updated = await examManagementService.getTestDetail(parseInt(testId, 10));
                setTest(updated);
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể xóa câu hỏi"));
        } finally {
            setDeletingId(null);
        }
    };

    const handleAddQuestion = () => {
        // If viewing a specific part, pre-select it
        if (queryPartId && test) {
            for (const paper of test.papers) {
                const part = (paper.parts ?? []).find(p => p.id === queryPartId);
                if (part) {
                    navigate(`/admin/exam-management/${testId}/questions/new`, {
                        state: { partId: part.id, section: paper.paperType },
                    });
                    return;
                }
            }
        }
        // Fallback: first part of first paper
        if (test) {
            const firstPaper = test.papers[0];
            const firstPart = firstPaper?.parts?.[0];
            navigate(`/admin/exam-management/${testId}/questions/new`, {
                state: { partId: firstPart?.id, section: firstPaper?.paperType },
            });
        }
    };

    useEffect(() => {
        if (!testId) return;
        const id = parseInt(testId, 10);
        if (isNaN(id)) {
            toast.error("ID không hợp lệ");
            navigate("/admin/exam-management");
            return;
        }
        setLoading(true);
        examManagementService
            .getTestDetail(id)
            .then(data => setTest(data))
            .catch(err => {
                toast.error(getErrorMessage(err, "Không thể tải dữ liệu bài thi"));
                navigate("/admin/exam-management");
            })
            .finally(() => setLoading(false));
    }, [testId, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Đang tải...</span>
            </div>
        );
    }

    if (!test) return null;

    const levelColor = LEVEL_COLORS[test.cefrLevel] ?? "bg-slate-100 text-slate-600";

    // Flatten tất cả questions thành 1 mảng phẳng
    const flatQuestions: FlatQuestion[] = [];
    for (const paper of test.papers) {
        for (const part of paper.parts ?? []) {
            for (const q of part.questions) {
                flatQuestions.push({
                    ...q,
                    paperType: paper.paperType,
                    partNumber: part.partNumber,
                    globalIndex: flatQuestions.length,
                });
            }
        }
    }

    const paperTypes = ["ALL", ...Array.from(new Set(test.papers.map(p => p.paperType)))];

    // If partId query param is present, filter to that part only
    const activePartInfo = queryPartId
        ? (() => {
              for (const paper of test.papers) {
                  const part = (paper.parts ?? []).find(p => p.id === queryPartId);
                  if (part) return { paper, part };
              }
              return null;
          })()
        : null;

    const displayQuestions = queryPartId
        ? flatQuestions.filter(q => {
              for (const paper of test.papers) {
                  const part = (paper.parts ?? []).find(p => p.id === queryPartId);
                  if (part && part.questions.some(pq => pq.id === q.id)) return true;
              }
              return false;
          })
        : filterPaper === "ALL"
        ? flatQuestions
        : flatQuestions.filter(q => q.paperType === filterPaper);

    return (
        <>
        <div className="p-6 space-y-6">
            {/* Back + Header */}
            <div>
                {/* Back button */}
                <button
                    onClick={() => navigate(`/admin/exam-management/${testId}/parts`)}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 mb-4 transition-colors"
                >
                    <ArrowLeft size={15} />
                    Quay lại danh sách Part
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${levelColor}`}>
                                {test.cefrLevel}
                            </span>
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    test.isActive
                                        ? "bg-green-50 text-green-600"
                                        : "bg-gray-100 text-gray-400"
                                }`}
                            >
                                {test.isActive ? "Active" : "Ẩn"}
                            </span>
                            {/* Part breadcrumb badge */}
                            {activePartInfo && (() => {
                                const Icon = PAPER_ICONS[activePartInfo.paper.paperType] ?? BookOpen;
                                const badgeCls = {
                                    LISTENING: "bg-blue-50 text-blue-600",
                                    READING_WRITING: "bg-purple-50 text-purple-600",
                                    SPEAKING: "bg-green-50 text-green-600",
                                }[activePartInfo.paper.paperType] ?? "bg-gray-100 text-gray-500";
                                return (
                                    <>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeCls}`}>
                                            <Icon size={10} />
                                            {PAPER_LABELS[activePartInfo.paper.paperType] ?? activePartInfo.paper.paperType}
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600">
                                            Part {activePartInfo.part.partNumber}
                                        </span>
                                    </>
                                );
                            })()}
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900">
                            {activePartInfo
                                ? `Part ${activePartInfo.part.partNumber} — Danh sách câu hỏi`
                                : test.title}
                        </h1>
                        {!activePartInfo && test.description && (
                            <p className="text-sm text-gray-500 mt-1">{test.description}</p>
                        )}
                    </div>

                    <button
                        onClick={handleAddQuestion}
                        className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600">
                        <Plus size={15} />
                        Thêm câu hỏi
                    </button>
                </div>
            </div>

            {/* Questions Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-extrabold text-gray-900">
                            Danh sách câu hỏi
                        </h2>
                        <p className="text-xs font-medium text-gray-400 mt-0.5">
                            {displayQuestions.length} câu hỏi
                            {activePartInfo
                                ? ` · ${PAPER_LABELS[activePartInfo.paper.paperType] ?? activePartInfo.paper.paperType} · Part ${activePartInfo.part.partNumber}`
                                : filterPaper !== "ALL" ? ` · ${PAPER_LABELS[filterPaper] ?? filterPaper}` : ""}
                        </p>
                    </div>

                    {/* Paper filter tabs — only shown when NOT filtering by part */}
                    {!activePartInfo && (
                        <div className="flex gap-1.5">
                            {paperTypes.map(pt => {
                                const Icon = pt !== "ALL" ? PAPER_ICONS[pt] : null;
                                const isActive = filterPaper === pt;
                                return (
                                    <button
                                        key={pt}
                                        onClick={() => setFilterPaper(pt)}
                                        className={[
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                                            isActive
                                                ? "bg-orange-500 text-white shadow-sm"
                                                : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                                        ].join(" ")}
                                    >
                                        {Icon && <Icon size={11} />}
                                        {pt === "ALL" ? "Tất cả" : PAPER_LABELS[pt] ?? pt}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-fixed">
                        <colgroup>
                            <col style={{ width: 48 }} />   {/* # */}
                            <col style={{ width: 100 }} />  {/* Số câu */}
                            <col style={{ width: 190 }} />  {/* Loại */}
                            <col style={{ width: 200 }} />  {/* Phần */}
                            <col style={{ width: 80 }} />   {/* Order */}
                            <col style={{ width: 260 }} />  {/* Đáp án */}
                            <col style={{ width: 149 }} />  {/* Thao tác */}
                        </colgroup>
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4 text-center">#</th>
                                <th className="px-4 py-4 text-center">Số câu</th>
                                <th className="px-4 py-4 text-center">Loại</th>
                                <th className="px-4 py-4 text-center">Phần</th>
                                <th className="px-4 py-4 text-center">Order</th>
                                <th className="pl-14 pr-4 py-4 text-left">Đáp án</th>
                                <th className="px-4 py-4 text-left">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {displayQuestions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-300">
                                            <FileQuestion size={40} className="opacity-50" />
                                            <span className="text-sm font-medium text-gray-400">
                                                Chưa có câu hỏi nào.
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayQuestions.map((q, idx) => {
                                    const typeColor =
                                        QUESTION_TYPE_COLORS[q.questionType] ??
                                        "bg-gray-100 text-gray-500";
                                    const qRange =
                                        q.questionNumberEnd !== q.questionNumberStart
                                            ? `Q${q.questionNumberStart}–${q.questionNumberEnd}`
                                            : `Q${q.questionNumberStart}`;
                                    const paperBadge =
                                        PAPER_BADGE[q.paperType] ??
                                        "bg-gray-50 text-gray-500";
                                    const PaperIcon = PAPER_ICONS[q.paperType] ?? BookOpen;

                                    return (
                                        <tr
                                            key={q.id}
                                            className="group hover:bg-orange-50/30 transition-all align-top"
                                        >
                                            {/* # STT */}
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-bold text-gray-400">
                                                    {idx + 1}
                                                </span>
                                            </td>

                                            {/* Số câu */}
                                            <td className="px-4 py-4 text-center">
                                                <span className="text-sm font-bold text-gray-800">
                                                    {qRange}
                                                </span>
                                            </td>

                                            {/* Loại */}
                                            <td className="px-4 py-4 text-center">
                                                <span
                                                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeColor}`}
                                                >
                                                    {q.questionType.replace(/_/g, " ")}
                                                </span>
                                            </td>

                                            {/* Phần (Paper + Part) */}
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${paperBadge}`}
                                                    >
                                                        <PaperIcon size={10} />
                                                        {PAPER_LABELS[q.paperType] ?? q.paperType}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                        Part {q.partNumber}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Order Index */}
                                            <td className="px-4 py-4 text-center">
                                                <span className="text-sm font-bold text-gray-500">
                                                    {q.orderIndex}
                                                </span>
                                            </td>

                                            {/* Đáp án */}
                                            <td className="pl-14 pr-4 py-4 max-w-xs text-left">
                                                <AnswerCell value={q.correctAnswer} />
                                            </td>

                                            {/* Thao tác */}
                                            <td className="px-4 py-4 text-left">
                                                <div className="flex items-center justify-start gap-1">
                                                    <button
                                                        title="Xem chi tiết"
                                                        onClick={() => handleViewQuestion(q)}
                                                        className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        title="Chỉnh sửa"
                                                        onClick={() => handleEditQuestion(q)}
                                                        className="p-2 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        title="Xóa câu hỏi"
                                                        onClick={() => handleDeleteQuestion(q)}
                                                        disabled={deletingId === q.id}
                                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                                                    >
                                                        {deletingId === q.id
                                                            ? <Loader2 size={15} className="animate-spin" />
                                                            : <Trash2 size={15} />
                                                        }
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {displayQuestions.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-400">
                            Tổng{" "}
                            <span className="font-bold text-gray-800">{displayQuestions.length}</span>{" "}
                            câu hỏi
                            {activePartInfo && (
                                <>
                                    {" "}trong{" "}
                                    <span className="font-bold text-gray-800">
                                        Part {activePartInfo.part.partNumber}
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </div>

        <ConfirmModal
            isOpen={pendingDelete !== null}
            onClose={() => setPendingDelete(null)}
            onConfirm={confirmDelete}
            message={`Bạn có chắc muốn xóa câu hỏi Q${pendingDelete?.questionNumberStart}? Hành động này không thể hoàn tác.`}
        />
        </>
    );
}
