import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Eye, Pencil, Trash2, Plus, ChevronLeft, ChevronRight,
    X, Save, Loader2, Search, GripVertical, ChevronUp, ChevronDown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { revisionApi, type AdminTopicListItem, type SaveTopicRequest } from "@/services/revisionService";
import ConfirmModal from "@/components/user/layout/ConfirmModal";

type Topic = AdminTopicListItem;
type FilterKey = "all" | "active" | "inactive";
interface TopicForm { title: string; description: string; orderIndex: number; isActive: boolean; }
const EMPTY_FORM: TopicForm = { title: "", description: "", orderIndex: 0, isActive: true };
const PAGE_SIZE = 10;

// ─── Modal ────────────────────────────────────────────────────────────────────
function TopicModal({ topic, onClose, onSaved }: {
    topic: Topic | null;
    onClose: () => void;
    onSaved: (t: Topic) => void;
}) {
    const isEdit = topic !== null;
    const [form, setForm] = useState<TopicForm>(
        isEdit
            ? { title: topic.title, description: topic.description ?? "", orderIndex: topic.orderIndex, isActive: topic.isActive }
            : { ...EMPTY_FORM }
    );
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) { toast.error("Tên topic không được để trống"); return; }
        setSaving(true);
        try {
            const req: SaveTopicRequest = {
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                orderIndex: form.orderIndex,
                isActive: form.isActive,
            };
            const saved = isEdit
                ? await revisionApi.updateTopic(topic!.id, req)
                : await revisionApi.createTopic(req);
            toast.success(isEdit ? "Đã cập nhật topic" : "Đã thêm topic mới");
            onSaved(saved);
            onClose();
        } catch {
            toast.error("Có lỗi xảy ra khi lưu topic");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">
                        {isEdit ? "Sửa Topic" : "Thêm Topic mới"}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Tên topic <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={form.title}
                            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                            placeholder="vd: Health, Travel, Business..."
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mô tả</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Mô tả ngắn về nội dung topic..."
                            rows={3}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition resize-none"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Order Index</label>
                            <input
                                type="number"
                                min={0}
                                value={form.orderIndex}
                                onChange={e => setForm(p => ({ ...p, orderIndex: parseInt(e.target.value) || 0 }))}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Trạng thái</label>
                            <select
                                value={form.isActive ? "active" : "inactive"}
                                onChange={e => setForm(p => ({ ...p, isActive: e.target.value === "active" }))}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
                            Hủy
                        </button>
                        <button type="submit" disabled={!form.title.trim() || saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isEdit ? "Lưu thay đổi" : "Thêm Topic"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TopicManagementPage() {
    const navigate = useNavigate();
    const [topics, setTopics]       = useState<Topic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch]       = useState("");
    const [filter, setFilter]       = useState<FilterKey>("all");
    const [page, setPage]           = useState(1);
    const [modal, setModal]         = useState<Topic | null | undefined>(undefined);
    const [deleteTarget, setDeleteTarget] = useState<Topic | null>(null);
    const [orderDirty, setOrderDirty] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);

    const dragIndexRef = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const loadTopics = () => {
        setIsLoading(true);
        revisionApi.getTopics()
            .then(data => setTopics((data ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex)))
            .catch(() => toast.error("Không tải được danh sách topic"))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => { loadTopics(); }, []);
    useEffect(() => { setPage(1); }, [filter, search]);

    // Filtering
    const filtered = topics.filter(t => {
        const matchFilter = filter === "all" || (filter === "active" ? t.isActive : !t.isActive);
        const q = search.trim().toLowerCase();
        return matchFilter && (!q || t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q));
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const hasFilter  = search.trim() !== "" || filter !== "all";

    // Reorder
    const swapTopics = (a: number, b: number) => {
        setTopics(prev => {
            const next = [...prev];
            [next[a], next[b]] = [next[b], next[a]];
            return next.map((t, i) => ({ ...t, orderIndex: i + 1 }));
        });
        setOrderDirty(true);
    };
    const moveUp   = (t: Topic) => { const i = topics.findIndex(x => x.id === t.id); if (i > 0) swapTopics(i - 1, i); };
    const moveDown = (t: Topic) => { const i = topics.findIndex(x => x.id === t.id); if (i < topics.length - 1) swapTopics(i, i + 1); };

    // Drag & drop
    const handleDragStart = (i: number) => { dragIndexRef.current = i; };
    const handleDragEnter = (i: number) => setDragOverIndex(i);
    const handleDrop = (target: number) => {
        const from = dragIndexRef.current;
        if (from === null || from === target) { setDragOverIndex(null); return; }
        setTopics(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(target, 0, moved);
            return next.map((t, i) => ({ ...t, orderIndex: i + 1 }));
        });
        setOrderDirty(true);
        dragIndexRef.current = null;
        setDragOverIndex(null);
    };

    const handleSaveOrder = async () => {
        setSavingOrder(true);
        try {
            await revisionApi.reorderTopics(topics.map(t => ({ id: t.id, orderIndex: t.orderIndex })));
            toast.success("Đã lưu thứ tự");
            setOrderDirty(false);
        } catch {
            toast.error("Không thể lưu thứ tự");
        } finally {
            setSavingOrder(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await revisionApi.deleteTopic(id);
            toast.success("Đã xóa topic");
            setTopics(prev => prev.filter(t => t.id !== id));
        } catch {
            toast.error("Không thể xóa topic");
        }
    };

    const handleSaved = (saved: Topic) => {
        setTopics(prev => {
            const idx = prev.findIndex(t => t.id === saved.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
            }
            return [...prev, saved].sort((a, b) => a.orderIndex - b.orderIndex);
        });
    };

    const pageButtons = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (page <= 3) return [1, 2, 3, "...", totalPages];
        if (page >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
        return [1, "...", page, "...", totalPages];
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Revision Topics</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Quản lý và sắp xếp các chủ đề ôn tập tổng hợp.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start">
                    {orderDirty && (
                        <button
                            onClick={handleSaveOrder}
                            disabled={savingOrder}
                            className="flex items-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-600 shadow-sm transition hover:bg-orange-100 disabled:opacity-60"
                        >
                            {savingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Lưu thứ tự
                        </button>
                    )}
                    <button
                        onClick={() => setModal(null)}
                        className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
                    >
                        <Plus className="w-4 h-4" /> Add New Topic
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="flex items-end gap-4 flex-wrap">
                    <label className="flex-1 min-w-[200px]">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Tìm kiếm</span>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Tìm theo tên hoặc mô tả topic..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                            />
                        </div>
                    </label>
                    <label className="w-44 flex-shrink-0">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Trạng thái</span>
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value as FilterKey)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:bg-white"
                        >
                            <option value="all">Tất cả</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </label>
                    {hasFilter && (
                        <div className="flex-shrink-0 self-end">
                            <button
                                onClick={() => { setSearch(""); setFilter("all"); setPage(1); }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                            >
                                Reset
                            </button>
                        </div>
                    )}
                    <span className="ml-auto self-end text-sm text-gray-400 pb-0.5">{filtered.length} topics</span>
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="w-10 px-3 py-4 text-center"><GripVertical className="w-3.5 h-3.5 mx-auto text-gray-300" /></th>
                                    <th className="px-5 py-4 text-center w-16">#</th>
                                    <th className="px-5 py-4 text-left">Topic</th>
                                    <th className="px-5 py-4 text-left">Description</th>
                                    <th className="px-5 py-4 text-center">Tasks</th>
                                    <th className="px-5 py-4 text-center">Questions</th>
                                    <th className="px-5 py-4 text-center w-24">Position</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                                            Không có topic nào phù hợp.
                                        </td>
                                    </tr>
                                ) : paginated.map(t => {
                                    const globalIdx  = topics.findIndex(x => x.id === t.id);
                                    const isDragOver = dragOverIndex === globalIdx;
                                    return (
                                        <tr
                                            key={t.id}
                                            draggable
                                            onDragStart={() => handleDragStart(globalIdx)}
                                            onDragEnter={() => handleDragEnter(globalIdx)}
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={() => handleDrop(globalIdx)}
                                            onDragEnd={() => setDragOverIndex(null)}
                                            className={[
                                                "transition group",
                                                isDragOver ? "bg-orange-50 border-t-2 border-orange-400" : "hover:bg-orange-50/40",
                                                !t.isActive ? "opacity-60" : "",
                                            ].join(" ")}
                                        >
                                            <td className="px-3 py-4 text-center cursor-grab active:cursor-grabbing">
                                                <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-500 mx-auto transition" />
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                                                    {t.orderIndex}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-gray-900">{t.title}</p>
                                                <p className="text-xs mt-0.5">
                                                    <span className={`font-semibold ${t.isActive ? "text-emerald-600" : "text-gray-400"}`}>
                                                        {t.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{t.description}</td>
                                            <td className="px-5 py-4 text-center font-medium text-gray-700">{t.taskCount}</td>
                                            <td className="px-5 py-4 text-center font-medium text-gray-700">
                                                {Number(t.questionCount).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-0.5">
                                                    <button onClick={() => moveUp(t)} disabled={globalIdx === 0} title="Move up"
                                                        className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition text-gray-400 hover:text-gray-700">
                                                        <ChevronUp className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => moveDown(t)} disabled={globalIdx === topics.length - 1} title="Move down"
                                                        className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition text-gray-400 hover:text-gray-700">
                                                        <ChevronDown className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => navigate(`/admin/revision-management/topics/${t.id}`)} title="Xem chi tiết"
                                                        className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-orange-600">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setModal(t)} title="Chỉnh sửa"
                                                        className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-blue-600">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(t)} title="Xóa"
                                                        className="p-1.5 rounded-xl hover:bg-red-50 transition text-gray-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} topics
                        </p>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-30 transition">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {pageButtons().map((p, i) =>
                                    p === "..." ? (
                                        <span key={i} className="w-8 text-center text-gray-400 text-sm">…</span>
                                    ) : (
                                        <button key={p} onClick={() => setPage(Number(p))}
                                            className={["w-9 h-9 rounded-full text-sm font-semibold transition",
                                                p === page ? "bg-orange-500 text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"].join(" ")}>
                                            {p}
                                        </button>
                                    )
                                )}
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-30 transition">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {modal !== undefined && (
                <TopicModal topic={modal} onClose={() => setModal(undefined)} onSaved={handleSaved} />
            )}

            <ConfirmModal
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); setDeleteTarget(null); }}
                message={`Xóa topic "${deleteTarget?.title}"? Tất cả tasks và câu hỏi sẽ bị xóa vĩnh viễn.`}
            />
        </div>
    );
}
