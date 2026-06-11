import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Eye, Pencil, Trash2, Plus, ChevronLeft, ChevronRight, X, Save, Loader2
} from "lucide-react";

type Topic = {
    id: number;
    title: string;
    code: string;
    description: string;
    tasks: number;
    questions: number;
    isActive: boolean;
};

const SAMPLE: Topic[] = [
    { id: 1,  title: "Health",      code: "HL-101", description: "Health & Wellness",      tasks: 5, questions: 120, isActive: true  },
    { id: 2,  title: "Education",   code: "ED-204", description: "School & Learning",      tasks: 4, questions: 90,  isActive: true  },
    { id: 3,  title: "Travel",      code: "TT-302", description: "Travel & Tourism",       tasks: 3, questions: 60,  isActive: true  },
    { id: 4,  title: "Food",        code: "FD-105", description: "Culinary & Dining",      tasks: 4, questions: 80,  isActive: true  },
    { id: 5,  title: "Business",    code: "BZ-211", description: "Corporate Communication",tasks: 6, questions: 150, isActive: true  },
    { id: 6,  title: "Technology",  code: "TC-308", description: "IT & Innovation",        tasks: 5, questions: 110, isActive: false },
    { id: 7,  title: "Sports",      code: "SP-104", description: "Athletics & Fitness",    tasks: 3, questions: 70,  isActive: true  },
    { id: 8,  title: "Environment", code: "EN-207", description: "Nature & Ecology",       tasks: 4, questions: 95,  isActive: true  },
    { id: 9,  title: "Shopping",    code: "SH-109", description: "Retail & E-commerce",    tasks: 3, questions: 55,  isActive: false },
    { id: 10, title: "Art & Music", code: "AM-312", description: "Culture & Creativity",   tasks: 4, questions: 85,  isActive: true  },
    { id: 11, title: "Science",     code: "SC-215", description: "Research & Discovery",   tasks: 5, questions: 130, isActive: true  },
    { id: 12, title: "Family",      code: "FM-101", description: "Home & Relationships",   tasks: 3, questions: 65,  isActive: true  },
];

const PAGE_SIZE = 10;

type SortKey = "recently" | "title" | "tasks" | "questions";
type FilterKey = "all" | "active" | "inactive";

interface TopicForm { title: string; description: string; }
const EMPTY_FORM: TopicForm = { title: "", description: "" };

function TopicModal({
    topic,
    onClose,
    onSave,
}: {
    topic: Topic | null;
    onClose: () => void;
    onSave: (form: TopicForm) => void;
}) {
    const isEdit = topic !== null;
    const [form, setForm] = useState<TopicForm>(
        isEdit ? { title: topic.title, description: topic.description } : { ...EMPTY_FORM }
    );
    const [saving, setSaving] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSaving(true);
        // simulate short delay then save
        setTimeout(() => { onSave(form); setSaving(false); }, 200);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">
                        {isEdit ? "Sửa Topic" : "Thêm Topic mới"}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
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

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving || !form.title.trim()}
                            className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isEdit ? "Lưu thay đổi" : "Thêm Topic"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function TopicManagementPage() {
    const navigate = useNavigate();
    const [topics, setTopics] = useState<Topic[]>(SAMPLE);
    const [filter, setFilter] = useState<FilterKey>("all");
    const [sort, setSort]     = useState<SortKey>("recently");
    const [page, setPage]     = useState(1);
    // undefined=closed | null=create | Topic=edit
    const [modal, setModal]   = useState<Topic | null | undefined>(undefined);

    const filtered = topics
        .filter(t => filter === "all" || (filter === "active" ? t.isActive : !t.isActive))
        .sort((a, b) => {
            if (sort === "title")     return a.title.localeCompare(b.title);
            if (sort === "tasks")     return b.tasks - a.tasks;
            if (sort === "questions") return b.questions - a.questions;
            return b.id - a.id; // recently
        });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleSave = (form: TopicForm) => {
        if (modal && modal.id) {
            // edit
            setTopics(prev => prev.map(t => t.id === modal.id
                ? { ...t, title: form.title, description: form.description }
                : t
            ));
        } else {
            // create
            const newId = topics.length ? Math.max(...topics.map(t => t.id)) + 1 : 1;
            setTopics(prev => [
                { id: newId, title: form.title, description: form.description, code: `NEW-${newId}`, tasks: 0, questions: 0, isActive: true },
                ...prev,
            ]);
        }
        setModal(undefined);
    };

    const handleDelete = (id: number) => {
        if (!confirm("Xóa topic này?")) return;
        setTopics(prev => prev.filter(t => t.id !== id));
    };

    // page buttons with ellipsis
    const pageButtons = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (page <= 3) return [1, 2, 3, "...", totalPages];
        if (page >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
        return [1, "...", page, "...", totalPages];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Revision Topics</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage and organize educational modules for student revision.</p>
                </div>
                <button
                    onClick={() => setModal(null)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold transition shrink-0"
                >
                    <Plus className="w-4 h-4" /> Add New Topic
                </button>
            </div>

            {/* Filter + sort bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex flex-wrap items-center gap-3">
                {/* Filter By */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-semibold">Filter By:</span>
                    <select value={filter} onChange={e => { setFilter(e.target.value as FilterKey); setPage(1); }}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-orange-300 transition">
                        <option value="all">All Categories</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                {/* Sort */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-semibold">Sort:</span>
                    <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-orange-300 transition">
                        <option value="recently">Recently Added</option>
                        <option value="title">Title A–Z</option>
                        <option value="tasks">Most Tasks</option>
                        <option value="questions">Most Questions</option>
                    </select>
                </div>
                <span className="ml-auto text-sm text-gray-400">Showing {filtered.length} Topics</span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wide">
                            <th className="px-6 py-3 text-left">Topic</th>
                            <th className="px-6 py-3 text-left">Description</th>
                            <th className="px-6 py-3 text-center">Tasks</th>
                            <th className="px-6 py-3 text-center">Questions</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((t, i) => (
                            <tr key={t.id}
                                className={`border-b border-gray-50 transition hover:bg-gray-50 ${i === paginated.length - 1 ? "border-b-0" : ""}`}>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900">{t.title}</p>
                                    <p className="text-xs text-primary-600 font-semibold mt-0.5">{t.code}</p>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{t.description}</td>
                                <td className="px-6 py-4 text-center text-gray-700 font-medium">{t.tasks}</td>
                                <td className="px-6 py-4 text-center text-gray-700 font-medium">{t.questions}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => navigate(`/admin/revision-management/topics/${t.id}`)}
                                            title="Xem chi tiết"
                                            className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-primary-600">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setModal(t)}
                                            title="Chỉnh sửa"
                                            className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-blue-600">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(t.id)}
                                            title="Xóa"
                                            className="p-1.5 rounded-xl hover:bg-red-50 transition text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-1 pt-2">
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
                                p === page ? "bg-primary-700 text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"].join(" ")}>
                            {p}
                        </button>
                    )
                )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-30 transition">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Modal */}
            {modal !== undefined && (
                <TopicModal
                    topic={modal}
                    onClose={() => setModal(undefined)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
