import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft, ChevronLeft, ChevronRight, Loader2, GripVertical,
    ChevronUp, ChevronDown, Search, Eye, Plus, Pencil, Trash2, X, Save,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { revisionApi, type AdminTaskDetail, type SaveTaskRequest } from "@/services/revisionService";
import { getQuestionDetailPath, skipsTaskDetail } from "./revisionNavigation";

const PAGE_SIZE = 10;

const TYPE_STYLES: Record<string, string> = {
    VOCAB_IMAGE: "bg-violet-50 text-violet-600 border-violet-200",
    LISTENING:   "bg-sky-50 text-sky-600 border-sky-200",
    SPEAKING:    "bg-amber-50 text-amber-600 border-amber-200",
    MATCHING:    "bg-emerald-50 text-emerald-600 border-emerald-200",
    WRITING:     "bg-orange-50 text-orange-600 border-orange-200",
};

function QuestionTypeBadge({ type }: { type: string }) {
    const style = TYPE_STYLES[type?.toUpperCase()] ?? "bg-gray-100 text-gray-500 border-gray-200";
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${style}`}>
            {type}
        </span>
    );
}

interface TaskForm { taskLabel: string; questionType: string; description: string; taskIndex: number; }
const EMPTY_TASK: TaskForm = { taskLabel: "", questionType: "VOCAB_IMAGE", description: "", taskIndex: 1 };

function TaskModal({ topicId, task, maxIndex, onClose, onSaved }: {
    topicId: string;
    task: AdminTaskDetail | null;
    maxIndex: number;
    onClose: () => void;
    onSaved: (t: AdminTaskDetail) => void;
}) {
    const isEdit = task !== null;
    const [form, setForm] = useState<TaskForm>(
        isEdit
            ? { taskLabel: task.taskLabel, questionType: task.questionType, description: task.description ?? "", taskIndex: task.taskIndex }
            : { ...EMPTY_TASK, taskIndex: maxIndex + 1 }
    );
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.taskLabel.trim()) { toast.error("Tên task không được để trống"); return; }
        setSaving(true);
        try {
            const req: SaveTaskRequest = {
                taskLabel: form.taskLabel.trim(),
                questionType: form.questionType,
                description: form.description.trim() || undefined,
                taskIndex: form.taskIndex,
            };
            const saved = isEdit
                ? await revisionApi.updateTask(parseInt(topicId), task!.id, req)
                : await revisionApi.createTask(parseInt(topicId), req);
            toast.success(isEdit ? "Đã cập nhật task" : "Đã thêm task mới");
            onSaved(saved);
            onClose();
        } catch {
            toast.error("Có lỗi xảy ra khi lưu task");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">{isEdit ? "Sửa Task" : "Thêm Task mới"}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Tên task <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={form.taskLabel}
                            onChange={e => setForm(p => ({ ...p, taskLabel: e.target.value }))}
                            placeholder="vd: Vocabulary, Listening Practice..."
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition"
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Loại câu hỏi</label>
                            <select
                                value={form.questionType}
                                onChange={e => setForm(p => ({ ...p, questionType: e.target.value }))}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition"
                            >
                                <option value="VOCAB_IMAGE">VOCAB_IMAGE</option>
                                <option value="LISTENING">LISTENING</option>
                                <option value="MATCHING">MATCHING</option>
                                <option value="WRITING">WRITING</option>
                            </select>
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Index</label>
                            <input
                                type="number" min={1}
                                value={form.taskIndex}
                                onChange={e => setForm(p => ({ ...p, taskIndex: parseInt(e.target.value) || 1 }))}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mô tả</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Mô tả ngắn về task..."
                            rows={2}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition resize-none"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
                            Hủy
                        </button>
                        <button type="submit" disabled={!form.taskLabel.trim() || saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isEdit ? "Lưu thay đổi" : "Thêm Task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function TopicDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [topicTitle, setTopicTitle]   = useState("");
    const [topicDesc, setTopicDesc]     = useState("");
    const [topicActive, setTopicActive] = useState(true);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [tasks, setTasks]             = useState<AdminTaskDetail[]>([]);
    const [isLoading, setIsLoading]     = useState(true);
    const [search, setSearch]           = useState("");
    const [page, setPage]               = useState(1);
    const [taskModal, setTaskModal]     = useState<AdminTaskDetail | null | undefined>(undefined);

    const dragIndexRef  = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        revisionApi.getTopicDetail(parseInt(id))
            .then(data => {
                setTopicTitle(data.title);
                setTopicDesc(data.description ?? "");
                setTopicActive(data.isActive);
                setTotalQuestions(data.totalQuestions);
                setTasks((data.tasks ?? []).slice().sort((a, b) => a.taskIndex - b.taskIndex));
            })
            .catch(() => toast.error("Không tải được chi tiết topic"))
            .finally(() => setIsLoading(false));
    }, [id]);

    useEffect(() => { setPage(1); }, [search]);

    const filtered   = tasks.filter(t => {
        const q = search.trim().toLowerCase();
        return !q || t.taskLabel.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q) || t.questionType.toLowerCase().includes(q);
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Reorder
    const swapTasks = (a: number, b: number) => {
        setTasks(prev => {
            const next = [...prev];
            [next[a], next[b]] = [next[b], next[a]];
            return next.map((t, i) => ({ ...t, taskIndex: i + 1 }));
        });
    };
    const moveUp   = (t: AdminTaskDetail) => { const i = tasks.findIndex(x => x.id === t.id); if (i > 0) swapTasks(i - 1, i); };
    const moveDown = (t: AdminTaskDetail) => { const i = tasks.findIndex(x => x.id === t.id); if (i < tasks.length - 1) swapTasks(i, i + 1); };

    // Drag & drop
    const handleDragStart = (i: number) => { dragIndexRef.current = i; };
    const handleDragEnter = (i: number) => setDragOverIndex(i);
    const handleDrop = (target: number) => {
        const from = dragIndexRef.current;
        if (from === null || from === target) { setDragOverIndex(null); return; }
        setTasks(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(target, 0, moved);
            return next.map((t, i) => ({ ...t, taskIndex: i + 1 }));
        });
        dragIndexRef.current = null;
        setDragOverIndex(null);
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm("Xóa task này? Tất cả câu hỏi trong task sẽ bị xóa.")) return;
        try {
            await revisionApi.deleteTask(parseInt(id!), taskId);
            toast.success("Đã xóa task");
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch {
            toast.error("Không thể xóa task");
        }
    };

    const handleOpenTask = async (task: AdminTaskDetail) => {
        if (!id) return;
        if (!skipsTaskDetail(task.questionType)) {
            navigate(`/admin/revision-management/topics/${id}/tasks/${task.id}`);
            return;
        }
        try {
            const questions = await revisionApi.getQuestions(parseInt(id), task.id);
            navigate(getQuestionDetailPath(id, task.id, questions));
        } catch {
            toast.error("Không tải được danh sách câu hỏi");
        }
    };

    const handleTaskSaved = (saved: AdminTaskDetail) => {
        setTasks(prev => {
            const idx = prev.findIndex(t => t.id === saved.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
            }
            return [...prev, saved].sort((a, b) => a.taskIndex - b.taskIndex);
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-400 flex items-center gap-1.5">
                <Link to="/admin/revision-management/topics" className="hover:text-gray-600 transition">
                    Revision Topics
                </Link>
                <span>›</span>
                <span className="text-gray-600">{topicTitle}</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate("/admin/revision-management/topics")}
                        className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{topicTitle}</h1>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${topicActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                {topicActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                        {topicDesc && <p className="mt-1 text-sm text-slate-500 max-w-2xl">{topicDesc}</p>}
                    </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-3 text-center">
                        <p className="text-xs text-gray-400">Tổng câu hỏi</p>
                        <p className="text-2xl font-extrabold text-orange-500">{totalQuestions.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-3 text-center">
                        <p className="text-xs text-gray-400">Tasks</p>
                        <p className="text-2xl font-extrabold text-slate-700">{tasks.length}</p>
                    </div>
                    <button
                        onClick={() => setTaskModal(null)}
                        className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
                    >
                        <Plus className="w-4 h-4" /> Add Task
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="flex items-end gap-4 flex-wrap">
                    <label className="flex-1 min-w-[200px]">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Tìm kiếm task</span>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Tìm theo tên, loại, hoặc mô tả..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-500 focus:bg-white" />
                        </div>
                    </label>
                    {search.trim() !== "" && (
                        <button onClick={() => { setSearch(""); setPage(1); }}
                            className="self-end inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600">
                            Reset
                        </button>
                    )}
                    <span className="self-end text-sm text-gray-400 pb-0.5 ml-auto">{filtered.length} tasks</span>
                </div>
            </div>

            {/* Tasks table */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-orange-500 inline-block" />
                        Tasks List
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="w-10 px-3 py-4 text-center"><GripVertical className="w-3.5 h-3.5 mx-auto text-gray-300" /></th>
                                <th className="px-5 py-4 text-center w-16">#</th>
                                <th className="px-5 py-4 text-left">Task Name</th>
                                <th className="px-5 py-4 text-left">Type</th>
                                <th className="px-5 py-4 text-center">Questions</th>
                                <th className="px-5 py-4 text-left">Description</th>
                                <th className="px-5 py-4 text-center">Questions</th>
                                <th className="px-5 py-4 text-center w-24">Order</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm">
                                        {search ? "Không tìm thấy task phù hợp." : "Topic này chưa có task nào."}
                                    </td>
                                </tr>
                            ) : paginated.map(task => {
                                const globalIdx  = tasks.findIndex(t => t.id === task.id);
                                const isDragOver = dragOverIndex === globalIdx;
                                return (
                                    <tr
                                        key={task.id}
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
                                                {task.taskIndex}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 font-semibold text-gray-900">{task.taskLabel}</td>
                                        <td className="px-5 py-4"><QuestionTypeBadge type={task.questionType} /></td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 rounded-full px-3 py-1 text-xs font-bold">
                                                {Number(task.questionCount).toLocaleString()} Qs
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{task.description}</td>
                                        <td className="px-5 py-4 text-center">
                                            <button
                                                onClick={() => handleOpenTask(task)}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> Questions
                                            </button>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-0.5">
                                                <button onClick={() => moveUp(task)} disabled={globalIdx === 0} title="Move up"
                                                    className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition text-gray-400 hover:text-gray-700">
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => moveDown(task)} disabled={globalIdx === tasks.length - 1} title="Move down"
                                                    className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition text-gray-400 hover:text-gray-700">
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setTaskModal(task)} title="Chỉnh sửa"
                                                    className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-blue-600">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteTask(task.id)} title="Xóa"
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
                </div>
                <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                        Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} tasks
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

            {taskModal !== undefined && id && (
                <TaskModal
                    topicId={id}
                    task={taskModal}
                    maxIndex={tasks.length}
                    onClose={() => setTaskModal(undefined)}
                    onSaved={handleTaskSaved}
                />
            )}
        </div>
    );
}
