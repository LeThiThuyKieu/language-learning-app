import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Download, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X, Save, Loader2 } from "lucide-react";

type Task = {
    id: number;
    name: string;
    questions: number;
    description: string;
};

type TopicInfo = {
    id: number;
    title: string;
    fullTitle: string;
    description: string;
    isActive: boolean;
};

const TOPIC_MAP: Record<string, TopicInfo> = {
    "1":  { id: 1,  title: "Health",     fullTitle: "Foundations of Human Health",   description: "Comprehensive study of physical and mental well-being, focusing on preventive care, nutrition science, and basic physiological systems. This topic serves as the baseline for the second-year medical curriculum.", isActive: true  },
    "2":  { id: 2,  title: "Education",  fullTitle: "Education & Learning Systems",  description: "Explores school environments, academic vocabulary, learning strategies, and the relationship between educators and students.",                                                                                    isActive: true  },
    "3":  { id: 3,  title: "Travel",     fullTitle: "Travel & Global Exploration",   description: "Covers travel vocabulary, transportation, tourism scenarios, and cross-cultural communication essential for international contexts.",                                                                              isActive: true  },
    "4":  { id: 4,  title: "Food",       fullTitle: "Culinary Arts & Dining",        description: "Introduces culinary terms, food ordering, ingredient vocabulary, and restaurant culture across different cuisines.",                                                                                               isActive: true  },
    "5":  { id: 5,  title: "Business",   fullTitle: "Corporate Communication",       description: "Corporate language, meeting vocabulary, negotiation phrases, and professional email writing for business contexts.",                                                                                                isActive: true  },
    "6":  { id: 6,  title: "Technology", fullTitle: "Technology & Innovation",       description: "IT terminology, software concepts, AI trends, and digital literacy skills for modern professionals.",                                                                                                              isActive: false },
};

const TASKS_MAP: Record<string, Task[]> = {
    "1": [
        { id: 1, name: "Task 1: Nutrition Essentials",   questions: 20, description: "Comprehensive overview of essential nutrients and dietary guidelines." },
        { id: 2, name: "Task 2: Respiratory Systems",    questions: 15, description: "Detailed study of lung anatomy and gas exchange mechanisms." },
        { id: 3, name: "Task 3: Mental Wellness",        questions: 30, description: "Introduction to psychological health and stress management techniques." },
    ],
    "2": [
        { id: 1, name: "Task 1: Classroom Vocabulary",   questions: 18, description: "Essential words and phrases used in academic environments." },
        { id: 2, name: "Task 2: Study Skills",           questions: 12, description: "Effective learning strategies and note-taking methods." },
    ],
    "3": [
        { id: 1, name: "Task 1: Airport & Transport",    questions: 25, description: "Vocabulary for navigating airports, trains, and public transport." },
        { id: 2, name: "Task 2: Hotel & Accommodation",  questions: 20, description: "Booking, check-in, and hotel service language." },
        { id: 3, name: "Task 3: Tourist Attractions",    questions: 15, description: "Describing landmarks and tourist activities." },
    ],
};

const PAGE_SIZE = 5;

interface TaskForm { name: string; description: string; }
const EMPTY_FORM: TaskForm = { name: "", description: "" };

function TaskModal({
    task,
    onClose,
    onSave,
}: {
    task: Task | null;
    onClose: () => void;
    onSave: (form: TaskForm) => void;
}) {
    const isEdit = task !== null;
    const [form, setForm] = useState<TaskForm>(
        isEdit ? { name: task.name, description: task.description } : { ...EMPTY_FORM }
    );
    const [saving, setSaving] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSaving(true);
        setTimeout(() => { onSave(form); setSaving(false); }, 200);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">
                        {isEdit ? "Sửa Task" : "Thêm Task mới"}
                    </h2>
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
                            value={form.name}
                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="vd: Task 1: Nutrition Essentials"
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mô tả yêu cầu</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Mô tả nội dung task này..."
                            rows={3}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition resize-none"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving || !form.name.trim()}
                            className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold transition disabled:opacity-50">
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

    const topic = TOPIC_MAP[id ?? ""] ?? {
        id: 0, title: "Unknown", fullTitle: "Unknown Topic", description: "", isActive: false,
    };

    const [tasks, setTasks] = useState<Task[]>(TASKS_MAP[id ?? ""] ?? []);
    const [page, setPage]   = useState(1);
    // undefined=closed | null=create | Task=edit
    const [modal, setModal] = useState<Task | null | undefined>(undefined);

    const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
    const paginated  = tasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleSave = (form: TaskForm) => {
        if (modal && modal.id) {
            setTasks(prev => prev.map(t => t.id === modal.id ? { ...t, ...form } : t));
        } else {
            const newId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
            setTasks(prev => [...prev, { id: newId, name: form.name, description: form.description, questions: 0 }]);
        }
        setModal(undefined);
    };

    const handleDelete = (taskId: number) => {
        if (!confirm("Xóa task này?")) return;
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-400 flex items-center gap-1.5">
                <Link to="/admin/revision-management/topics" className="hover:text-gray-600 transition">Revision Topics</Link>
                <span>›</span>
                <span className="text-gray-600">{topic.title} Detail</span>
            </nav>

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/admin/revision-management/topics")}
                        className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-extrabold text-gray-900">Topic Detail: {topic.title}</h1>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            topic.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}>
                            {topic.isActive ? "Active" : "Inactive"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-600 transition">
                        <Download className="w-4 h-4" />
                        Export Data
                    </button>
                    <button
                        onClick={() => setModal(null)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold transition"
                    >
                        <Plus className="w-4 h-4" /> Add New Task
                    </button>
                </div>
            </div>

            {/* Topic info card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">{topic.fullTitle}</h2>
                <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">{topic.description}</p>
            </div>

            {/* Tasks list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-primary-700 inline-block" />
                        Tasks List
                    </h3>
                </div>

                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50">
                            <th className="px-6 py-3 text-left">Task Name</th>
                            <th className="px-6 py-3 text-left">Number of Questions</th>
                            <th className="px-6 py-3 text-left">Description (Mô tả yêu cầu)</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                                    Chưa có task nào. Nhấn "Add New Task" để thêm.
                                </td>
                            </tr>
                        ) : paginated.map((task, i) => (
                            <tr key={task.id}
                                className={`border-b border-gray-50 hover:bg-gray-50 transition ${i === paginated.length - 1 ? "border-b-0" : ""}`}>
                                <td className="px-6 py-4 font-semibold text-gray-900">{task.name}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 rounded-full px-3 py-1 text-xs font-bold">
                                        {task.questions} Questions
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{task.description}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => setModal(task)} title="Chỉnh sửa"
                                            className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-blue-600">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(task.id)} title="Xóa"
                                            className="p-1.5 rounded-xl hover:bg-red-50 transition text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Table footer: count + pagination */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
                    <span className="text-xs text-gray-400">
                        Showing {tasks.length === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + 1, tasks.length)}–{Math.min(page * PAGE_SIZE, tasks.length)} of {tasks.length} Tasks
                    </span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition">
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)}
                                className={["w-7 h-7 rounded-full text-xs font-bold transition",
                                    p === page ? "bg-primary-700 text-white" : "hover:bg-gray-200 text-gray-600"].join(" ")}>
                                {p}
                            </button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition">
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {modal !== undefined && (
                <TaskModal
                    task={modal}
                    onClose={() => setModal(undefined)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
