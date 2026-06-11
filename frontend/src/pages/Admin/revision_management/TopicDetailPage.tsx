import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft, ChevronLeft, ChevronRight, Loader2,
    GripVertical, ChevronUp, ChevronDown, Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import apiClient from "@/config/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type Task = {
    id: number;
    taskIndex: number;
    taskLabel: string;
    questionType: string;
    description: string;
    questionCount: number;
};

type TopicDetail = {
    id: number;
    title: string;
    description: string;
    orderIndex: number;
    isActive: boolean;
    totalQuestions: number;
    tasks: Task[];
};

type ApiResponse<T> = { success: boolean; message: string; data: T };

const PAGE_SIZE = 10;

// ─── Question Type Badge ──────────────────────────────────────────────────────
const TYPE_STYLES: Record<string, string> = {
    VOCAB:     "bg-violet-50 text-violet-600",
    LISTENING: "bg-sky-50 text-sky-600",
    SPEAKING:  "bg-amber-50 text-amber-600",
    MATCHING:  "bg-emerald-50 text-emerald-600",
};

function QuestionTypeBadge({ type }: { type: string }) {
    const style = TYPE_STYLES[type?.toUpperCase()] ?? "bg-gray-100 text-gray-500";
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${style}`}>
            {type}
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TopicDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [topic, setTopic]         = useState<TopicDetail | null>(null);
    const [tasks, setTasks]         = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch]       = useState("");
    const [page, setPage]           = useState(1);

    // drag state
    const dragIndexRef  = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        apiClient.get<ApiResponse<TopicDetail>>(`/admin/revision/topics/${id}`)
            .then(res => {
                const data = res.data.data;
                setTopic(data);
                // sort by taskIndex initially
                const sorted = (data.tasks ?? []).slice().sort((a, b) => a.taskIndex - b.taskIndex);
                setTasks(sorted);
            })
            .catch(() => toast.error("Không tải được chi tiết topic"))
            .finally(() => setIsLoading(false));
    }, [id]);

    // Reset page on search change
    useEffect(() => { setPage(1); }, [search]);

    // ── Filtering ─────────────────────────────────────────────────────────────
    const filtered = tasks.filter(t => {
        const q = search.trim().toLowerCase();
        return !q
            || t.taskLabel.toLowerCase().includes(q)
            || (t.description ?? "").toLowerCase().includes(q)
            || t.questionType.toLowerCase().includes(q);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // ── Reorder helpers ───────────────────────────────────────────────────────
    const swapTasks = (idxA: number, idxB: number) => {
        setTasks(prev => {
            const next = [...prev];
            [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
            return next.map((t, i) => ({ ...t, taskIndex: i + 1 }));
        });
    };

    const moveUp   = (task: Task) => {
        const idx = tasks.findIndex(t => t.id === task.id);
        if (idx > 0) swapTasks(idx - 1, idx);
    };
    const moveDown = (task: Task) => {
        const idx = tasks.findIndex(t => t.id === task.id);
        if (idx < tasks.length - 1) swapTasks(idx, idx + 1);
    };

    // ── Drag & Drop ───────────────────────────────────────────────────────────
    const handleDragStart = (globalIdx: number) => { dragIndexRef.current = globalIdx; };
    const handleDragEnter = (globalIdx: number) => { setDragOverIndex(globalIdx); };
    const handleDrop = (targetGlobalIdx: number) => {
        const from = dragIndexRef.current;
        if (from === null || from === targetGlobalIdx) { setDragOverIndex(null); return; }
        setTasks(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(targetGlobalIdx, 0, moved);
            return next.map((t, i) => ({ ...t, taskIndex: i + 1 }));
        });
        dragIndexRef.current = null;
        setDragOverIndex(null);
    };

    // ── Loading / not found states ────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!topic) {
        return (
            <div className="py-16 text-center text-gray-400">
                Không tìm thấy topic.
                <button onClick={() => navigate("/admin/revision-management/topics")}
                    className="ml-2 text-orange-600 underline text-sm">Quay lại</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* ── Breadcrumb ── */}
            <nav className="text-sm text-gray-400 flex items-center gap-1.5">
                <Link to="/admin/revision-management/topics" className="hover:text-gray-600 transition">
                    Revision Topics
                </Link>
                <span>›</span>
                <span className="text-gray-600">{topic.title} Detail</span>
            </nav>

            {/* ── Header ── */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/admin/revision-management/topics")}
                        className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                                {topic.title}
                            </h1>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                topic.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                            }`}>
                                {topic.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
                            {topic.description || <span className="italic text-gray-300">Chưa có mô tả</span>}
                        </p>
                    </div>
                </div>

                {/* stat chip */}
                <div className="shrink-0 flex items-center gap-3">
                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-3 text-center">
                        <p className="text-xs text-gray-400">Tổng câu hỏi</p>
                        <p className="text-2xl font-extrabold text-orange-500">{topic.totalQuestions.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-3 text-center">
                        <p className="text-xs text-gray-400">Tasks</p>
                        <p className="text-2xl font-extrabold text-slate-700">{tasks.length}</p>
                    </div>
                </div>
            </div>

            {/* ── Search bar ── */}
            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="flex items-end gap-4 flex-wrap">
                    <label className="flex-1 min-w-[200px]">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Tìm kiếm task</span>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Tìm theo tên, loại, hoặc mô tả..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                            />
                        </div>
                    </label>
                    {search.trim() !== "" && (
                        <div className="flex-shrink-0 self-end">
                            <button
                                onClick={() => { setSearch(""); setPage(1); }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                            >
                                Reset
                            </button>
                        </div>
                    )}
                    <span className="self-end text-sm text-gray-400 pb-0.5 ml-auto">
                        {filtered.length} tasks
                    </span>
                </div>
            </div>

            {/* ── Tasks table ── */}
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
                                <th className="w-10 px-3 py-4 text-center">
                                    <GripVertical className="w-3.5 h-3.5 mx-auto text-gray-300" />
                                </th>
                                <th className="px-5 py-4 text-center w-16">#</th>
                                <th className="px-5 py-4 text-left">Task Name</th>
                                <th className="px-5 py-4 text-left">Type</th>
                                <th className="px-5 py-4 text-center">Questions</th>
                                <th className="px-5 py-4 text-left">Description</th>
                                <th className="px-5 py-4 text-center w-24">Order</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
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
                                        {/* drag handle */}
                                        <td className="px-3 py-4 text-center cursor-grab active:cursor-grabbing">
                                            <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-500 mx-auto transition" />
                                        </td>

                                        {/* task index */}
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                                                {task.taskIndex}
                                            </span>
                                        </td>

                                        {/* task label */}
                                        <td className="px-5 py-4 font-semibold text-gray-900">{task.taskLabel}</td>

                                        {/* type badge */}
                                        <td className="px-5 py-4">
                                            <QuestionTypeBadge type={task.questionType} />
                                        </td>

                                        {/* question count */}
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 rounded-full px-3 py-1 text-xs font-bold">
                                                {task.questionCount.toLocaleString()} Qs
                                            </span>
                                        </td>

                                        {/* description */}
                                        <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{task.description}</td>

                                        {/* move up/down */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-0.5">
                                                <button
                                                    onClick={() => moveUp(task)}
                                                    disabled={globalIdx === 0}
                                                    title="Move up"
                                                    className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition text-gray-400 hover:text-gray-700"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => moveDown(task)}
                                                    disabled={globalIdx === tasks.length - 1}
                                                    title="Move down"
                                                    className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition text-gray-400 hover:text-gray-700"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
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
        </div>
    );
}
