import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft, ChevronLeft, ChevronRight, Loader2, GripVertical,
    ChevronUp, ChevronDown, Search, Plus, Eye, Pencil, Trash2,
    ImageIcon, Music, Layers, AlignLeft,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { revisionApi, type AdminQuestion, type AdminTaskDetail } from "@/services/revisionService";

type QuestionType = "VOCAB_IMAGE" | "LISTENING" | "MATCHING" | "WRITING";

const PAGE_SIZE = 10;

const TYPE_STYLES: Record<QuestionType, { label: string; color: string; icon: React.ReactNode }> = {
    VOCAB_IMAGE: { label: "Vocab Image", color: "bg-violet-50 text-violet-600 border-violet-200", icon: <ImageIcon className="w-3 h-3" /> },
    LISTENING:   { label: "Listening",   color: "bg-sky-50 text-sky-600 border-sky-200",          icon: <Music className="w-3 h-3" /> },
    MATCHING:    { label: "Matching",    color: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: <Layers className="w-3 h-3" /> },
    WRITING:     { label: "Writing",     color: "bg-amber-50 text-amber-600 border-amber-200",     icon: <AlignLeft className="w-3 h-3" /> },
};

function TypeBadge({ type }: { type: string }) {
    const meta = TYPE_STYLES[type as QuestionType] ?? { label: type, color: "bg-gray-100 text-gray-500 border-gray-200", icon: null };
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${meta.color}`}>
            {meta.icon}{meta.label}
        </span>
    );
}

export default function TaskDetailPage() {
    const { topicId, taskId } = useParams<{ topicId: string; taskId: string }>();
    const navigate = useNavigate();

    const [task, setTask]           = useState<AdminTaskDetail | null>(null);
    const [questions, setQuestions] = useState<AdminQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch]       = useState("");
    const [page, setPage]           = useState(1);

    const dragIndexRef = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!topicId || !taskId) return;
        setIsLoading(true);
        Promise.all([
            revisionApi.getTaskDetail(parseInt(topicId), parseInt(taskId)),
            revisionApi.getQuestions(parseInt(topicId), parseInt(taskId)),
        ])
            .then(([taskData, qData]) => {
                setTask(taskData);
                setQuestions((qData ?? []).slice().sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
            })
            .catch(() => toast.error("Không tải được dữ liệu task"))
            .finally(() => setIsLoading(false));
    }, [topicId, taskId]);

    useEffect(() => { setPage(1); }, [search]);

    const filtered   = questions.filter(q => {
        const s = search.trim().toLowerCase();
        return !s || q.questionType.toLowerCase().includes(s) || (q.questionText ?? "").toLowerCase().includes(s);
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Reorder
    const swapQ = (a: number, b: number) => {
        setQuestions(prev => {
            const next = [...prev];
            [next[a], next[b]] = [next[b], next[a]];
            return next.map((q, i) => ({ ...q, orderIndex: i + 1 }));
        });
    };
    const moveUp   = (q: AdminQuestion) => { const i = questions.findIndex(x => x.mongoId === q.mongoId); if (i > 0) swapQ(i - 1, i); };
    const moveDown = (q: AdminQuestion) => { const i = questions.findIndex(x => x.mongoId === q.mongoId); if (i < questions.length - 1) swapQ(i, i + 1); };

    const handleDragStart = (i: number) => { dragIndexRef.current = i; };
    const handleDragEnter = (i: number) => setDragOverIndex(i);
    const handleDrop = (target: number) => {
        const from = dragIndexRef.current;
        if (from === null || from === target) { setDragOverIndex(null); return; }
        setQuestions(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(target, 0, moved);
            return next.map((q, i) => ({ ...q, orderIndex: i + 1 }));
        });
        dragIndexRef.current = null;
        setDragOverIndex(null);
    };

    const handleDelete = async (mongoId: string) => {
        if (!confirm("Xóa câu hỏi này?")) return;
        try {
            await revisionApi.deleteQuestion(parseInt(topicId!), parseInt(taskId!), mongoId);
            toast.success("Đã xóa câu hỏi");
            setQuestions(prev => prev.filter(q => q.mongoId !== mongoId));
        } catch {
            toast.error("Không thể xóa câu hỏi");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
        );
    }

    const basePath = `/admin/revision-management/topics/${topicId}/tasks/${taskId}`;

    return (
        <div className="space-y-6 p-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-gray-400">
                <Link to="/admin/revision-management/topics" className="hover:text-gray-600 transition">Revision Topics</Link>
                <span>›</span>
                <Link to={`/admin/revision-management/topics/${topicId}`} className="hover:text-gray-600 transition">Topic Detail</Link>
                <span>›</span>
                <span className="text-gray-600">{task?.taskLabel ?? "Task Detail"}</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/admin/revision-management/topics/${topicId}`)}
                        className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                                {task?.taskLabel ?? "Task Detail"}
                            </h1>
                            {task && <TypeBadge type={task.questionType} />}
                        </div>
                        {task?.description && (
                            <p className="mt-1 text-sm text-slate-500 max-w-2xl">{task.description}</p>
                        )}
                    </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-3 text-center">
                        <p className="text-xs text-gray-400">Questions</p>
                        <p className="text-2xl font-extrabold text-orange-500">{questions.length}</p>
                    </div>
                    <button onClick={() => navigate(`${basePath}/questions/new`)}
                        className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600">
                        <Plus className="w-4 h-4" /> Add Question
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="flex items-end gap-4 flex-wrap">
                    <label className="flex-1 min-w-[200px]">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Tìm kiếm câu hỏi</span>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Tìm theo type, nội dung..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-500 focus:bg-white" />
                        </div>
                    </label>
                    {search.trim() !== "" && (
                        <button onClick={() => { setSearch(""); setPage(1); }}
                            className="self-end inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600">
                            Reset
                        </button>
                    )}
                    <span className="self-end text-sm text-gray-400 pb-0.5 ml-auto">{filtered.length} questions</span>
                </div>
            </div>

            {/* Questions table */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center px-6 py-4 border-b border-gray-100">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-orange-500 inline-block" />
                        Questions List
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    {task?.questionType === "VOCAB_IMAGE" ? (
                        /* ── VOCAB_IMAGE table ── */
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="px-5 py-4 text-center w-16">#</th>
                                    <th className="px-5 py-4 text-left">Preview</th>
                                    <th className="px-5 py-4 text-left">Answer</th>
                                    <th className="px-5 py-4 text-center w-28">Position</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                                            {search ? "Không tìm thấy câu hỏi phù hợp." : "Task này chưa có câu hỏi nào."}
                                        </td>
                                    </tr>
                                ) : paginated.map(q => {
                                    const globalIdx = questions.findIndex(x => x.mongoId === q.mongoId);
                                    return (
                                        <tr key={q.mongoId} className="transition hover:bg-orange-50/40">
                                            {/* # order_index */}
                                            <td className="px-5 py-3 text-center">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                                                    {q.orderIndex}
                                                </span>
                                            </td>
                                            {/* Preview ảnh */}
                                            <td className="px-5 py-3">
                                                {q.imageUrl ? (
                                                    <div className="h-14 w-20 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                                                        <img
                                                            src={q.imageUrl}
                                                            alt="vocab"
                                                            className="h-full w-full object-contain"
                                                            onError={e => {
                                                                const el = e.target as HTMLImageElement;
                                                                el.style.display = "none";
                                                                const parent = el.parentElement;
                                                                if (parent) {
                                                                    parent.innerHTML = '<span class="text-xs text-gray-300 italic">Lỗi ảnh</span>';
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-400 italic">
                                                        <ImageIcon className="w-3.5 h-3.5" /> Chưa có ảnh
                                                    </span>
                                                )}
                                            </td>
                                            {/* Answer */}
                                            <td className="px-5 py-3">
                                                {q.correctAnswer ? (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                                                        {q.correctAnswer}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 italic text-xs">—</span>
                                                )}
                                            </td>
                                            {/* Position */}
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-center gap-0.5">
                                                    <button
                                                        onClick={() => moveUp(q)}
                                                        disabled={globalIdx === 0}
                                                        title="Lên"
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition text-gray-400 hover:text-gray-700"
                                                    >
                                                        <ChevronUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => moveDown(q)}
                                                        disabled={globalIdx === questions.length - 1}
                                                        title="Xuống"
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition text-gray-400 hover:text-gray-700"
                                                    >
                                                        <ChevronDown className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            {/* Actions */}
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => navigate(`${basePath}/questions/${q.mongoId}`)} title="Xem"
                                                        className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-orange-600">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => navigate(`${basePath}/questions/${q.mongoId}/edit`)} title="Chỉnh sửa"
                                                        className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-blue-600">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(q.mongoId)} title="Xóa"
                                                        className="p-1.5 rounded-xl hover:bg-red-50 transition text-gray-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        /* ── Default table (các type khác) ── */
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="w-10 px-3 py-4 text-center"><GripVertical className="w-3.5 h-3.5 mx-auto text-gray-300" /></th>
                                    <th className="px-5 py-4 text-center w-16">#</th>
                                    <th className="px-5 py-4 text-left">Type</th>
                                    <th className="px-5 py-4 text-left">Preview</th>
                                    <th className="px-5 py-4 text-center w-24">Order</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                                            {search ? "Không tìm thấy câu hỏi phù hợp." : "Task này chưa có câu hỏi nào."}
                                        </td>
                                    </tr>
                                ) : paginated.map(q => {
                                    const globalIdx  = questions.findIndex(x => x.mongoId === q.mongoId);
                                    const isDragOver = dragOverIndex === globalIdx;
                                    return (
                                        <tr
                                            key={q.mongoId}
                                            draggable
                                            onDragStart={() => handleDragStart(globalIdx)}
                                            onDragEnter={() => handleDragEnter(globalIdx)}
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={() => handleDrop(globalIdx)}
                                            onDragEnd={() => setDragOverIndex(null)}
                                            className={[
                                                "transition group",
                                                isDragOver ? "bg-orange-50 border-t-2 border-orange-400" : "hover:bg-orange-50/40",
                                            ].join(" ")}
                                        >
                                            <td className="px-3 py-4 text-center cursor-grab active:cursor-grabbing">
                                                <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-500 mx-auto transition" />
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                                                    {q.orderIndex}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4"><TypeBadge type={q.questionType} /></td>
                                            <td className="px-5 py-4">
                                                {q.imageUrl ? (
                                                    <img src={q.imageUrl} alt="preview"
                                                        className="h-10 w-auto rounded-lg border border-gray-200 object-contain"
                                                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                                ) : q.questionText ? (
                                                    <span className="text-gray-600 truncate max-w-xs block">{q.questionText}</span>
                                                ) : q.pairs && q.pairs.length > 0 ? (
                                                    <span className="text-gray-400 text-xs italic">{q.pairs.length} pairs</span>
                                                ) : (
                                                    <span className="text-gray-300 italic text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-0.5">
                                                    <button onClick={() => moveUp(q)} disabled={globalIdx === 0} title="Move up"
                                                        className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition text-gray-400 hover:text-gray-700">
                                                        <ChevronUp className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => moveDown(q)} disabled={globalIdx === questions.length - 1} title="Move down"
                                                        className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition text-gray-400 hover:text-gray-700">
                                                        <ChevronDown className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => navigate(`${basePath}/questions/${q.mongoId}`)} title="Xem"
                                                        className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-orange-600">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => navigate(`${basePath}/questions/${q.mongoId}/edit`)} title="Chỉnh sửa"
                                                        className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-blue-600">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(q.mongoId)} title="Xóa"
                                                        className="p-1.5 rounded-xl hover:bg-red-50 transition text-gray-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                        Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} questions
                    </p>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition">
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={["w-7 h-7 rounded-full text-xs font-bold transition",
                                        p === page ? "bg-orange-500 text-white" : "hover:bg-gray-200 text-gray-600"].join(" ")}>
                                    {p}
                                </button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition">
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
