import { useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, PlusCircle, X, Edit3, ToggleRight, ToggleLeft, Loader2 } from "lucide-react";

type Topic = {
    id: number;
    title: string;
    description: string;
    quizScore: number;
    listening: number;
    speaking: number;
    reading: number;
    writing: number;
    status: string;
};

const sampleTopics: Topic[] = [
    { id: 1, title: "Travel", description: "Vocabularies and scenarios for global exploration.", quizScore: 70, listening: 8, speaking: 6, reading: 10, writing: 8, status: "Active" },
    { id: 2, title: "Food", description: "Culinary terms, ordering food, and ingredients.", quizScore: 45, listening: 12, speaking: 5, reading: 15, writing: 4, status: "Active" },
    { id: 3, title: "Business", description: "Corporate communication, meetings, and strategy.", quizScore: 92, listening: 24, speaking: 18, reading: 30, writing: 20, status: "Active" },
    { id: 4, title: "Shopping", description: "Negotiating prices, sizes, and e-commerce phrases.", quizScore: 20, listening: 4, speaking: 2, reading: 8, writing: 6, status: "Active" },
    { id: 5, title: "Technology", description: "IT terminology, AI trends, and software.", quizScore: 55, listening: 16, speaking: 12, reading: 14, writing: 13, status: "Active" },
];

export default function ReviewTopicsPage() {
    const [topics, setTopics] = useState<Topic[]>(sampleTopics);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [form, setForm] = useState({ title: "", description: "", status: "Active" });
    const [togglingId, setTogglingId] = useState<number | null>(null);

    function openAddModal() {
        setEditingTopic(null);
        setForm({ title: "", description: "", status: "Active" });
        setIsModalOpen(true);
    }

    function openEditModal(t: Topic) {
        setEditingTopic(t);
        setForm({ title: t.title, description: t.description, status: "Active" });
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
    }

    function saveTopic() {
        // For now use local state only (sample data). Replace with API calls later.
        if (editingTopic) {
            setTopics((prev) => prev.map((p) => (p.id === editingTopic.id ? { ...p, title: form.title, description: form.description, status: form.status } : p)));
        } else {
            const nextId = topics.length ? Math.max(...topics.map((p) => p.id)) + 1 : 1;
            const newTopic: Topic = {
                id: nextId,
                title: form.title,
                description: form.description,
                status: form.status,
                quizScore: 0,
                listening: 0,
                speaking: 0,
                reading: 0,
                writing: 0,
            };
            setTopics((prev) => [newTopic, ...prev]);
        }
        setIsModalOpen(false);
    }

    function handleToggleTopicStatus(t: Topic) {
        setTogglingId(t.id);
        // simulate quick async update
        setTimeout(() => {
            setTopics((prev) => prev.map((p) => (p.id === t.id ? { ...p, status: p.status === "Active" ? "Inactive" : "Active" } : p)));
            setTogglingId(null);
        }, 250);
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Review Topics</h1>
                    <p className="text-sm text-gray-500">Manage review categories and performance goals.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            placeholder="Search topics..."
                            className="w-64 pl-3 pr-10 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                        />
                    </div>
                    <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg shadow-sm">
                        <PlusCircle className="w-4 h-4" />
                        Add Topic
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                {topics.map((t) => (
                    <div
                        key={t.id}
                        className={`rounded-2xl p-4 shadow-sm ${t.status === "Inactive" ? "bg-slate-50 border-slate-200 opacity-90" : "bg-white border-gray-100"}`}
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <div className="w-12 h-12">
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto"
                                    style={{ backgroundColor: "#fff7ed" }}
                                >
                                    <BookOpen className="w-5 h-5" style={{ color: "#f97316" }} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleToggleTopicStatus(t)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                                        {togglingId === t.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                        ) : t.status === "Active" ? (
                                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                                        )}
                                </button>

                                    <button onClick={() => openEditModal(t)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-700 mb-1">{t.title}</h3>
                        <p className="text-sm text-slate-500 mb-3">{t.description}</p>

                        {/* Quiz progress removed as requested */}

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "#fff7ed" }}>
                                <div className="text-xs text-slate-500">LISTENING</div>
                                <div className="font-medium text-slate-900">{t.listening}</div>
                            </div>
                            <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "#fff7ed" }}>
                                <div className="text-xs text-slate-500">SPEAKING</div>
                                <div className="font-medium text-slate-900">{t.speaking}</div>
                            </div>
                            <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "#fff7ed" }}>
                                <div className="text-xs text-slate-500">READING</div>
                                <div className="font-medium text-slate-900">{t.reading}</div>
                            </div>
                            <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "#fff7ed" }}>
                                <div className="text-xs text-slate-500">WRITING</div>
                                <div className="font-medium text-slate-900">{t.writing}</div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <button
                                onClick={() => openEditModal(t)}
                                className={`w-full py-2 rounded-lg text-sm font-semibold ${t.status === "Inactive" ? "bg-gray-100 text-gray-500" : "bg-orange-50 text-orange-600"}`}
                            >
                                Manage
                            </button>
                        </div>
                    </div>
                ))}

                {/* Create new topic card */}
                <div onClick={openAddModal} className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl p-6 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <div className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center mx-auto mb-3">
                            <PlusCircle className="w-6 h-6" />
                        </div>
                        <div className="text-sm">Create New Topic</div>
                        <div className="text-xs text-gray-500 mt-1">Define custom review categories and performance goals.</div>
                    </div>
                </div>
            </div>
            
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg min-h-[520px] overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-7 pt-6 pb-4">
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900">{editingTopic ? "Edit Topic" : "Add New Topic"}</h3>
                            </div>
                            <button onClick={closeModal} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); saveTopic(); }} className="space-y-5 px-7 pb-7">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Topic Name</label>
                                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white" placeholder="e.g., Advanced Engineering" />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description</label>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white" rows={4} placeholder="Brief overview of the topic..." />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Status</label>
                                <div className="flex items-center gap-4">
                                    <label className="inline-flex items-center gap-2"><input type="radio" checked={form.status === "Active"} onChange={() => setForm({ ...form, status: "Active" })} /> Active</label>
                                    <label className="inline-flex items-center gap-2"><input type="radio" checked={form.status === "Inactive"} onChange={() => setForm({ ...form, status: "Inactive" })} /> Inactive</label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Cancel</button>
                                <button type="submit" className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600">
                                    {editingTopic ? "Save Topic" : "Add Topic"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
