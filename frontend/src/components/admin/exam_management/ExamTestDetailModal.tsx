import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Headphones, BookOpen, Mic, ChevronDown, ChevronRight, Loader2, Pencil, Check, XCircle, List } from "lucide-react";
import toast from "react-hot-toast";
import {
    examManagementService,
    type AdminExamTestDto,
    type AdminExamPaperDto,
} from "@/services/admin/examManagementService";
import { getErrorMessage } from "@/utils/errorMessage";

interface Props {
    test: AdminExamTestDto;
    loading: boolean;
    onClose: () => void;
    onPaperUpdated: (paper: AdminExamPaperDto) => void;
}

const PAPER_ICONS = {
    LISTENING: Headphones,
    READING_WRITING: BookOpen,
    SPEAKING: Mic,
};

const PAPER_LABELS: Record<string, string> = {
    LISTENING: "Listening",
    READING_WRITING: "Reading & Writing",
    SPEAKING: "Speaking",
};

const PAPER_COLORS: Record<string, string> = {
    LISTENING: "bg-blue-50 text-blue-700 border-blue-100",
    READING_WRITING: "bg-purple-50 text-purple-700 border-purple-100",
    SPEAKING: "bg-green-50 text-green-700 border-green-100",
};

const LEVEL_COLORS: Record<string, string> = {
    A2: "bg-green-100 text-green-700",
    B1: "bg-blue-100 text-blue-700",
    B2: "bg-indigo-100 text-indigo-700",
    C1: "bg-purple-100 text-purple-700",
    C2: "bg-rose-100 text-rose-700",
};

function PaperEditForm({
    paper,
    onSaved,
    onCancel,
}: {
    paper: AdminExamPaperDto;
    onSaved: (p: AdminExamPaperDto) => void;
    onCancel: () => void;
}) {
    const [duration, setDuration] = useState(paper.durationMinutes.toString());
    const [audioUrl, setAudioUrl] = useState(paper.audioUrl ?? "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const mins = parseInt(duration, 10);
        if (!mins || mins < 1) {
            toast.error("Thời lượng phải là số dương");
            return;
        }
        setSaving(true);
        try {
            const updated = await examManagementService.updatePaper(paper.id, {
                durationMinutes: mins,
                audioUrl: audioUrl.trim() || null,
            });
            onSaved(updated);
            toast.success("Đã cập nhật paper");
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, "Không thể cập nhật paper"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                        Thời lượng (phút)
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                </div>
                <div className="flex items-end gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
                    >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        Lưu
                    </button>
                    <button
                        onClick={onCancel}
                        className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        <XCircle size={14} />
                    </button>
                </div>
            </div>
            {paper.paperType === "LISTENING" && (
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                        Audio URL (Listening only)
                    </label>
                    <textarea
                        rows={3}
                        value={audioUrl}
                        onChange={e => setAudioUrl(e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none font-mono"
                        placeholder="https://res.cloudinary.com/..."
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        Nhiều file: phân cách bằng dấu phẩy
                    </p>
                </div>
            )}
        </div>
    );
}

function PaperSection({
    paper,
    onPaperUpdated,
}: {
    paper: AdminExamPaperDto;
    onPaperUpdated: (p: AdminExamPaperDto) => void;
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const Icon = PAPER_ICONS[paper.paperType] ?? BookOpen;
    const colorClass = PAPER_COLORS[paper.paperType] ?? "bg-slate-50 text-slate-600 border-slate-200";

    return (
        <div className={`border rounded-xl overflow-hidden ${colorClass}`}>
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setOpen(v => !v)}
                        className="flex items-center gap-2 font-medium text-sm"
                    >
                        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        <Icon size={15} />
                        {PAPER_LABELS[paper.paperType]}
                    </button>
                    <span className="text-xs opacity-70">
                        {paper.durationMinutes} phút · {paper.totalQuestions} câu
                    </span>
                </div>
                <button
                    onClick={() => setEditing(v => !v)}
                    className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
                    title="Chỉnh sửa paper"
                >
                    <Pencil size={13} />
                </button>
            </div>

            {editing && (
                <div className="px-4 pb-3">
                    <PaperEditForm
                        paper={paper}
                        onSaved={updated => {
                            onPaperUpdated(updated);
                            setEditing(false);
                        }}
                        onCancel={() => setEditing(false)}
                    />
                </div>
            )}

            {open && paper.parts && paper.parts.length > 0 && (
                <div className="px-4 pb-3 space-y-2">
                    {paper.parts.map(part => (
                        <div key={part.id} className="bg-white/70 rounded-lg px-3 py-2 text-xs">
                            <p className="font-medium text-slate-700 mb-1">Part {part.partNumber}</p>
                            <div className="space-y-1">
                                {part.questions.map(q => (
                                    <div
                                        key={q.id}
                                        className="flex items-center justify-between text-slate-500"
                                    >
                                        <span className="font-mono text-[10px] text-slate-400">{q.mongoDocId}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                                                {q.questionType.replace("_", " ")}
                                            </span>
                                            <span>
                                                Q{q.questionNumberStart}
                                                {q.questionNumberEnd !== q.questionNumberStart
                                                    ? `–${q.questionNumberEnd}`
                                                    : ""}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {open && (!paper.parts || paper.parts.length === 0) && (
                <div className="px-4 pb-3 text-xs text-slate-400 italic">
                    Chưa có câu hỏi nào trong paper này.
                </div>
            )}
        </div>
    );
}

export default function ExamTestDetailModal({ test, loading, onClose, onPaperUpdated }: Props) {
    const navigate = useNavigate();
    const levelColor = LEVEL_COLORS[test.cefrLevel] ?? "bg-slate-100 text-slate-600";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${levelColor}`}>
                                {test.cefrLevel}
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    test.isActive
                                        ? "bg-green-50 text-green-600"
                                        : "bg-slate-100 text-slate-500"
                                }`}
                            >
                                {test.isActive ? "Active" : "Ẩn"}
                            </span>
                        </div>
                        <h2 className="font-semibold text-slate-800">{test.title}</h2>
                        {test.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{test.description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors shrink-0 ml-4"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
                            <Loader2 size={18} className="animate-spin" />
                            Đang tải...
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Meta info */}
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="bg-slate-50 rounded-xl py-3">
                                    <p className="text-xl font-bold text-slate-800">{test.testNumber}</p>
                                    <p className="text-xs text-slate-400">Test Number</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl py-3">
                                    <p className="text-xl font-bold text-slate-800">{test.papers.length}</p>
                                    <p className="text-xs text-slate-400">Papers</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl py-3">
                                    <p className="text-xl font-bold text-slate-800">{test.totalQuestions}</p>
                                    <p className="text-xs text-slate-400">Câu hỏi</p>
                                </div>
                            </div>

                            {/* Papers */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-2">Papers</h3>
                                <div className="space-y-2">
                                    {test.papers.map(paper => (
                                        <PaperSection
                                            key={paper.id}
                                            paper={paper}
                                            onPaperUpdated={onPaperUpdated}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <button
                        onClick={() => {
                            onClose();
                            navigate(`/admin/exam-management/${test.id}/questions`);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                    >
                        <List size={15} />
                        Xem chi tiết
                    </button>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
