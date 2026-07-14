import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Headphones, BookOpen, Mic, ChevronRight, Loader2, Pencil, Check, XCircle, List, Upload, Music } from "lucide-react";
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
    speakingPhaseCount?: number;
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

    // Parse format DB: {url1,url2,...} → string[]
    const [audioUrls, setAudioUrls] = useState<string[]>(() => {
        if (!paper.audioUrl) return [];
        const raw = paper.audioUrl.trim();
        // Strip dấu {} nếu có
        const inner = raw.startsWith("{") && raw.endsWith("}")
            ? raw.slice(1, -1)
            : raw;
        return inner.split(",").map(u => u.trim()).filter(Boolean);
    });

    const [saving, setSaving] = useState(false);
    const [uploadingIndexes, setUploadingIndexes] = useState<Set<number>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isUploading = uploadingIndexes.size > 0;

    // Upload nhiều file, từng file một, append vào danh sách
    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;

        // Tạo placeholder indexes để track loading
        const startIdx = audioUrls.length;
        const placeholderIndexes = files.map((_, i) => startIdx + i);
        setUploadingIndexes(prev => new Set([...prev, ...placeholderIndexes]));

        // Upload tuần tự từng file
        const newUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
            try {
                const url = await examManagementService.uploadPaperAudio(paper.id, files[i]);
                newUrls.push(url);
                toast.success(`Upload "${files[i].name}" thành công`);
            } catch (err) {
                toast.error(`Upload "${files[i].name}" thất bại: ${getErrorMessage(err, "")}`);
            } finally {
                setUploadingIndexes(prev => {
                    const next = new Set(prev);
                    next.delete(startIdx + i);
                    return next;
                });
            }
        }

        if (newUrls.length > 0) {
            setAudioUrls(prev => [...prev, ...newUrls]);
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveAudio = (idx: number) => {
        setAudioUrls(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        const mins = parseInt(duration, 10);
        if (!mins || mins < 1) {
            toast.error("Thời lượng phải là số dương");
            return;
        }
        setSaving(true);
        try {
            // Serialize thành format DB: {url1,url2,...}
            const combinedUrl = audioUrls.length > 0
                ? "{" + audioUrls.join(",") + "}"
                : null;
            const updated = await examManagementService.updatePaper(paper.id, {
                durationMinutes: mins,
                audioUrl: combinedUrl,
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
                        disabled={saving || isUploading}
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
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-slate-600">
                            Audio files ({audioUrls.length})
                        </label>
                        <span className="text-xs text-slate-400">MP3, WAV, OGG, AAC · tối đa 10MB/file</span>
                    </div>

                    {/* Upload button — multiple */}
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,.mp3,.wav,.ogg,.aac,.m4a"
                            className="hidden"
                            onChange={handleAudioUpload}
                        />
                        <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-medium disabled:opacity-60 transition-colors"
                        >
                            {isUploading
                                ? <Loader2 size={13} className="animate-spin" />
                                : <Upload size={13} />
                            }
                            {isUploading
                                ? `Đang upload (${uploadingIndexes.size} còn lại)...`
                                : "Chọn file audio (có thể chọn nhiều)"
                            }
                        </button>
                    </div>

                    {/* Danh sách audio đã upload */}
                    {audioUrls.length > 0 && (
                        <div className="space-y-1.5">
                            {audioUrls.map((url, idx) => (
                                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Music size={12} className="text-blue-500 shrink-0" />
                                            <span className="text-xs font-medium text-slate-600 truncate">
                                                Part {idx + 1} — {url.split("/").pop()?.split("?")[0]}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAudio(idx)}
                                            className="p-1 text-slate-300 hover:text-red-400 rounded transition-colors shrink-0"
                                            title="Xóa audio này"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                    <audio key={url} controls className="w-full" style={{ height: 32 }}>
                                        <source src={url} />
                                    </audio>
                                </div>
                            ))}
                        </div>
                    )}

                    {audioUrls.length === 0 && !isUploading && (
                        <p className="text-xs text-slate-400 italic">Chưa có audio nào.</p>
                    )}

                    {/* Nhập URL thủ công */}
                    <details className="group">
                        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 list-none flex items-center gap-1">
                            <ChevronRight size={11} className="group-open:rotate-90 transition-transform" />
                            Nhập URL thủ công
                        </summary>
                        <div className="mt-1.5">
                            <textarea
                                rows={5}
                                value={audioUrls.join("\n")}
                                onChange={e => {
                                    const raw = e.target.value;
                                    // Split theo newline hoặc dấu phẩy, bỏ {} nếu có
                                    const urls = raw
                                        .split(/[\n,]/)
                                        .map(u => u.trim().replace(/^\{/, "").replace(/\}$/, ""))
                                        .filter(Boolean);
                                    setAudioUrls(urls);
                                }}
                                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 font-mono break-all"
                                placeholder={"https://res.cloudinary.com/.../audio1.mp3\nhttps://res.cloudinary.com/.../audio2.mp3"}
                            />
                            <p className="text-xs text-slate-400 mt-0.5">Nhiều URL phân cách bằng dấu phẩy</p>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
}

function PaperSection({
    paper,
    speakingPhaseCount,
    onPaperUpdated,
}: {
    paper: AdminExamPaperDto;
    speakingPhaseCount?: number;
    onPaperUpdated: (p: AdminExamPaperDto) => void;
}) {
    const [editing, setEditing] = useState(false);
    const Icon = PAPER_ICONS[paper.paperType] ?? BookOpen;
    const colorClass = PAPER_COLORS[paper.paperType] ?? "bg-slate-50 text-slate-600 border-slate-200";

    const questionCount = paper.paperType === "SPEAKING"
        ? (speakingPhaseCount ?? 0)
        : paper.totalQuestions;
    const questionLabel = paper.paperType === "SPEAKING" ? "phrase" : "câu";

    return (
        <div className={`border rounded-xl overflow-hidden ${colorClass}`}>
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <Icon size={15} />
                    <span className="font-medium text-sm">{PAPER_LABELS[paper.paperType]}</span>
                    <span className="text-xs opacity-70">
                        {paper.durationMinutes} phút · {questionCount} {questionLabel}
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
        </div>
    );
}

export default function ExamTestDetailModal({ test, loading, onClose, onPaperUpdated, speakingPhaseCount }: Props) {
    const navigate = useNavigate();
    const levelColor = LEVEL_COLORS[test.cefrLevel] ?? "bg-slate-100 text-slate-600";

    // Tổng câu hỏi: speaking dùng phase count nếu có, còn lại dùng totalQuestions từ backend
    const nonSpeakingTotal = test.papers
        .filter(p => p.paperType !== "SPEAKING")
        .reduce((sum, p) => sum + p.totalQuestions, 0);
    const computedTotalQuestions = nonSpeakingTotal + (speakingPhaseCount ?? 0);

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
                                    <p className="text-xl font-bold text-slate-800">{computedTotalQuestions}</p>
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
                                            speakingPhaseCount={paper.paperType === "SPEAKING" ? speakingPhaseCount : undefined}
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
                            navigate(`/admin/exam-management/${test.id}/parts`);
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
