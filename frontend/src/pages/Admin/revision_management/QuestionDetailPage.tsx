import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
    ArrowLeft, Loader2, Save, Plus, Trash2, Eye, Pencil,
    Image as ImageIcon, Music, AlignLeft, Layers, ChevronDown,
    Upload, Link as LinkIcon, X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
    revisionApi,
    type AdminQuestion,
    type AdminTaskDetail,
    type SaveQuestionRequest,
    type MatchingPair,
    type WritingCategory,
    type WritingImage,
} from "@/services/revisionService";
import { skipsTaskDetail, sortQuestions } from "./revisionNavigation";

type QuestionType = "VOCAB_IMAGE" | "LISTENING" | "MATCHING" | "WRITING";
type Mode = "view" | "edit" | "create";

// Internal form state mirrors AdminQuestion fields
interface QuestionForm {
    questionType: QuestionType;
    orderIndex: number;
    imageUrl: string;
    audioUrl: string;
    questionText: string;
    sentence: string;
    correctAnswer: string;
    pairs: MatchingPair[];
    categories: WritingCategory[];
    images: WritingImage[];
}

function emptyForm(): QuestionForm {
    return {
        questionType: "VOCAB_IMAGE",
        orderIndex: 1,
        imageUrl: "",
        audioUrl: "",
        questionText: "",
        sentence: "",
        correctAnswer: "",
        pairs: [],
        categories: [],
        images: [],
    };
}

function fromApi(q: AdminQuestion): QuestionForm {
    return {
        questionType: q.questionType,
        orderIndex: q.orderIndex ?? 1,
        imageUrl: q.imageUrl ?? "",
        audioUrl: q.audioUrl ?? "",
        questionText: q.questionText ?? "",
        sentence: q.sentence ?? "",
        correctAnswer: q.correctAnswer ?? "",
        pairs: (q.pairs ?? []) as MatchingPair[],
        categories: (q.categories ?? []) as WritingCategory[],
        images: (q.images ?? []) as WritingImage[],
    };
}

const TYPE_META: Record<QuestionType, { label: string; color: string; icon: React.ReactNode }> = {
    VOCAB_IMAGE: { label: "Vocab Image", color: "bg-violet-50 text-violet-600 border-violet-200", icon: <ImageIcon className="w-3.5 h-3.5" /> },
    LISTENING:   { label: "Listening",   color: "bg-sky-50 text-sky-600 border-sky-200",          icon: <Music className="w-3.5 h-3.5" /> },
    MATCHING:    { label: "Matching",    color: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: <Layers className="w-3.5 h-3.5" /> },
    WRITING:     { label: "Writing",     color: "bg-amber-50 text-amber-600 border-amber-200",     icon: <AlignLeft className="w-3.5 h-3.5" /> },
};

function TypeBadge({ type }: { type: QuestionType }) {
    const meta = TYPE_META[type] ?? { label: type, color: "bg-gray-100 text-gray-500 border-gray-200", icon: null };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${meta.color}`}>
            {meta.icon}{meta.label}
        </span>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">{children}</p>;
}

function ReadonlyBox({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 min-h-[40px] ${className ?? ""}`}>
            {children}
        </div>
    );
}

function TextInput({ value, onChange, placeholder, className }: {
    value: string; onChange?: (v: string) => void; placeholder?: string; className?: string;
}) {
    return (
        <input value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
            className={`w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:bg-white ${className ?? ""}`}
        />
    );
}

// ── MediaUploadInput: cho phép nhập URL hoặc upload file ──
type MediaType = "image" | "audio";

function MediaUploadInput({
    value,
    onChange,
    topicId,
    mediaType,
    placeholder,
}: {
    value: string;
    onChange: (url: string) => void;
    topicId: string | undefined;
    mediaType: MediaType;
    placeholder?: string;
}) {
    const [mode, setMode] = useState<"url" | "upload">("url");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const acceptAttr = mediaType === "image"
        ? "image/jpeg,image/png,image/webp,image/gif"
        : "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,.mp3,.wav,.ogg,.aac,.m4a";

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !topicId) return;
        setUploading(true);
        try {
            const url = mediaType === "image"
                ? await revisionApi.uploadQuestionImage(parseInt(topicId), file)
                : await revisionApi.uploadQuestionAudio(parseInt(topicId), file);
            onChange(url);
            toast.success("Upload thành công");
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg ?? "Upload thất bại");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    return (
        <div className="space-y-2">
            {/* Tab toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
                <button
                    type="button"
                    onClick={() => setMode("url")}
                    className={[
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                        mode === "url"
                            ? "bg-white text-orange-600 shadow-sm"
                            : "text-gray-400 hover:text-gray-600",
                    ].join(" ")}
                >
                    <LinkIcon className="w-3 h-3" /> Nhập URL
                </button>
                <button
                    type="button"
                    onClick={() => setMode("upload")}
                    className={[
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                        mode === "upload"
                            ? "bg-white text-orange-600 shadow-sm"
                            : "text-gray-400 hover:text-gray-600",
                    ].join(" ")}
                >
                    <Upload className="w-3 h-3" /> Upload file
                </button>
            </div>

            {/* URL input */}
            {mode === "url" && (
                <TextInput
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder ?? "https://..."}
                />
            )}

            {/* Upload area */}
            {mode === "upload" && (
                <div className="space-y-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={acceptAttr}
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <div
                        className={[
                            "flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-sm transition cursor-pointer",
                            uploading
                                ? "border-orange-200 bg-orange-50 text-orange-400"
                                : "border-gray-200 bg-gray-50 text-gray-400 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500",
                        ].join(" ")}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang upload...</>
                        ) : (
                            <><Upload className="w-4 h-4" />
                                {mediaType === "image"
                                    ? "Chọn ảnh (JPG, PNG, WEBP, GIF — tối đa 5MB)"
                                    : "Chọn audio (MP3, WAV, OGG, AAC — tối đa 10MB)"}
                            </>
                        )}
                    </div>
                    {/* Show current URL after upload */}
                    {value && (
                        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                            <span className="flex-1 truncate text-xs text-gray-500">{value}</span>
                            <button
                                type="button"
                                onClick={() => onChange("")}
                                className="shrink-0 p-1 rounded text-gray-300 hover:text-red-400 transition"
                                title="Xoá"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

//  VOCAB_IMAGE section 
function VocabImageSection({ form, setForm, mode, topicId }: { form: QuestionForm; setForm: (f: QuestionForm) => void; mode: Mode; topicId?: string }) {
    const isView = mode === "view";
    return (
        <div className="space-y-4">
            <div>
                <FieldLabel>Image URL</FieldLabel>
                {isView
                    ? <ReadonlyBox>{form.imageUrl || <span className="italic text-gray-400">Chưa có ảnh</span>}</ReadonlyBox>
                    : <MediaUploadInput
                        value={form.imageUrl}
                        onChange={v => setForm({ ...form, imageUrl: v })}
                        topicId={topicId}
                        mediaType="image"
                        placeholder="https://..."
                    />
                }
            </div>
            {form.imageUrl && (
                <div className="flex justify-center">
                    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                        <img src={form.imageUrl} alt="Vocab" className="max-h-64 w-auto object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                </div>
            )}
            <div>
                <FieldLabel>Đáp án đúng (correct_answer)</FieldLabel>
                {isView
                    ? <ReadonlyBox className="text-emerald-700 border-emerald-200 bg-emerald-50">{form.correctAnswer || <span className="italic text-gray-400">Chưa có</span>}</ReadonlyBox>
                    : <TextInput value={form.correctAnswer} onChange={v => setForm({ ...form, correctAnswer: v })} placeholder="Nhập từ/cụm từ đúng" />
                }
            </div>
        </div>
    );
}

//  LISTENING section
function ListeningSection({ form, setForm, mode, topicId }: { form: QuestionForm; setForm: (f: QuestionForm) => void; mode: Mode; topicId?: string }) {
    const isView = mode === "view";
    return (
        <div className="space-y-4">
            <div>
                <FieldLabel>Image URL</FieldLabel>
                {isView
                    ? <ReadonlyBox>{form.imageUrl || <span className="italic text-gray-400">Chưa có ảnh</span>}</ReadonlyBox>
                    : <MediaUploadInput
                        value={form.imageUrl}
                        onChange={v => setForm({ ...form, imageUrl: v })}
                        topicId={topicId}
                        mediaType="image"
                        placeholder="https://..."
                    />
                }
            </div>
            {form.imageUrl && (
                <div className="flex justify-center">
                    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                        <img src={form.imageUrl} alt="Listening" className="max-h-56 w-auto object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                </div>
            )}
            <div>
                <FieldLabel>Audio URL</FieldLabel>
                {isView ? (
                    <div className="space-y-2">
                        <ReadonlyBox>{form.audioUrl || <span className="italic text-gray-400">Chưa có audio</span>}</ReadonlyBox>
                        {form.audioUrl && <audio controls className="w-full" src={form.audioUrl} />}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <MediaUploadInput
                            value={form.audioUrl}
                            onChange={v => setForm({ ...form, audioUrl: v })}
                            topicId={topicId}
                            mediaType="audio"
                            placeholder="https://....mp3"
                        />
                        {form.audioUrl && <audio controls className="w-full" src={form.audioUrl} />}
                    </div>
                )}
            </div>
            <div>
                <FieldLabel>Đáp án đúng (correct_answer)</FieldLabel>
                {isView
                    ? <ReadonlyBox className="text-emerald-700 border-emerald-200 bg-emerald-50">{form.correctAnswer || <span className="italic text-gray-400">Chưa có</span>}</ReadonlyBox>
                    : <TextInput value={form.correctAnswer} onChange={v => setForm({ ...form, correctAnswer: v })} placeholder="Nhập đáp án" />
                }
            </div>
        </div>
    );
}

//  MATCHING section 
function MatchingSection({ form, setForm, mode }: { form: QuestionForm; setForm: (f: QuestionForm) => void; mode: Mode }) {
    const isView = mode === "view";
    const pairs  = form.pairs;
    const hasImageLeft = pairs.some(p => p.left.startsWith("http") && /\.(png|jpg|jpeg|webp|avif|gif)/i.test(p.left));

    const addPair    = () => setForm({ ...form, pairs: [...pairs, { left: "", right: "" }] });
    const removePair = (i: number) => setForm({ ...form, pairs: pairs.filter((_, idx) => idx !== i) });
    const updatePair = (i: number, side: "left" | "right", val: string) =>
        setForm({ ...form, pairs: pairs.map((p, idx) => idx === i ? { ...p, [side]: val } : p) });

    return (
        <div className="space-y-4">
            <div>
                <FieldLabel>Nội dung câu hỏi</FieldLabel>
                {isView
                    ? <ReadonlyBox>{form.questionText || <span className="italic text-gray-400">Chưa có</span>}</ReadonlyBox>
                    : <TextInput value={form.questionText} onChange={v => setForm({ ...form, questionText: v })} placeholder="vd: Match the definitions to the correct phrases" />
                }
            </div>
            <div>
                <div className="mb-2 flex items-center justify-between">
                    <FieldLabel>Pairs ({pairs.length})</FieldLabel>
                    {!isView && (
                        <button type="button" onClick={addPair}
                            className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700">
                            <Plus className="w-3.5 h-3.5" /> Thêm pair
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {pairs.length === 0 && (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-400">
                            Chưa có pair nào.
                        </div>
                    )}
                    {pairs.map((pair, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                            <span className="w-6 shrink-0 text-center text-xs font-bold text-gray-400">{i + 1}</span>
                            <div className="flex-1">
                                {isView ? (
                                    hasImageLeft && pair.left.startsWith("http") ? (
                                        <img src={pair.left} alt={`left-${i}`}
                                            className="h-16 w-auto rounded-lg object-contain border border-gray-200"
                                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                    ) : <ReadonlyBox>{pair.left}</ReadonlyBox>
                                ) : (
                                    <TextInput value={pair.left} onChange={v => updatePair(i, "left", v)} placeholder="Left (text hoặc URL ảnh)" />
                                )}
                            </div>
                            <span className="shrink-0 text-xs font-bold text-gray-300">→</span>
                            <div className="flex-1">
                                {isView
                                    ? <ReadonlyBox>{pair.right}</ReadonlyBox>
                                    : <TextInput value={pair.right} onChange={v => updatePair(i, "right", v)} placeholder="Right (text)" />
                                }
                            </div>
                            {!isView && (
                                <button type="button" onClick={() => removePair(i)}
                                    className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

//  WRITING section 
// ── Helper: parse correctAnswer JSON ──
function parseAnswerMap(raw: string): Record<string, string[][]> {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        return (typeof parsed === "object" && !Array.isArray(parsed)) ? parsed : {};
    } catch { return {}; }
}

// ── Helper: build correctAnswer JSON from editable state ──
// editableAnswers: { [catLabel]: string[][] }  (each inner array = variants for 1 slot)
function buildAnswerJson(editableAnswers: Record<string, string[][]>): string {
    const cleaned: Record<string, string[][]> = {};
    for (const [cat, slots] of Object.entries(editableAnswers)) {
        const validSlots = slots.map(variants => variants.map(v => v.trim()).filter(Boolean)).filter(s => s.length > 0);
        if (validSlots.length > 0) cleaned[cat] = validSlots;
    }
    return JSON.stringify(cleaned);
}

function WritingSection({ form, setForm, mode, isMultiQuestion, topicId }: {
    form: QuestionForm;
    setForm: (f: QuestionForm) => void;
    mode: Mode;
    isMultiQuestion?: boolean;
    topicId?: string;
}) {
    const isView     = mode === "view";
    const categories = form.categories;
    const images     = form.images;

    // Which category accordion is open
    const [expandedCat, setExpandedCat] = useState<string | null>(null);

    // Editable answer state (edit/create): { catLabel → string[][] }
    const [editableAnswers, setEditableAnswers] = useState<Record<string, string[][]>>({});

    // Sync editableAnswers ONLY ONCE when entering edit/create mode (not on every categories change)
    const initDoneRef = useRef(false);
    useEffect(() => {
        if (isView) { initDoneRef.current = false; return; }
        if (initDoneRef.current) return;
        initDoneRef.current = true;
        const parsed = parseAnswerMap(form.correctAnswer);
        const synced: Record<string, string[][]> = {};
        for (const cat of form.categories) {
            if (!cat.label) continue;
            const existing = parsed[cat.label];
            synced[cat.label] = existing ?? Array.from({ length: cat.slots }, () => [""]);
        }
        setEditableAnswers(synced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isView, form.correctAnswer]);

    // Whenever editableAnswers changes, write back to form.correctAnswer
    useEffect(() => {
        if (isView || !initDoneRef.current) return;
        setForm({ ...form, correctAnswer: buildAnswerJson(editableAnswers) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editableAnswers]);

    // ── helpers for editing slots ──
    const setSlotMain = (cat: string, slotIdx: number, val: string) => {
        setEditableAnswers(prev => {
            const slots = [...(prev[cat] ?? [])];
            const variants = [...(slots[slotIdx] ?? [""])];
            variants[0] = val;
            slots[slotIdx] = variants;
            return { ...prev, [cat]: slots };
        });
    };
    const setSlotAlt = (cat: string, slotIdx: number, altIdx: number, val: string) => {
        setEditableAnswers(prev => {
            const slots = [...(prev[cat] ?? [])];
            const variants = [...(slots[slotIdx] ?? [""])];
            variants[altIdx + 1] = val;
            slots[slotIdx] = variants;
            return { ...prev, [cat]: slots };
        });
    };
    const addSlotAlt = (cat: string, slotIdx: number) => {
        setEditableAnswers(prev => {
            const slots = [...(prev[cat] ?? [])];
            slots[slotIdx] = [...(slots[slotIdx] ?? [""]), ""];
            return { ...prev, [cat]: slots };
        });
    };
    const removeSlotAlt = (cat: string, slotIdx: number, altIdx: number) => {
        setEditableAnswers(prev => {
            const slots = [...(prev[cat] ?? [])];
            const variants = [...(slots[slotIdx] ?? [""])];
            variants.splice(altIdx + 1, 1);
            slots[slotIdx] = variants;
            return { ...prev, [cat]: slots };
        });
    };
    const addSlot = (cat: string, catIdx: number) => {
        setEditableAnswers(prev => ({ ...prev, [cat]: [...(prev[cat] ?? []), [""]] }));
        const newCats = categories.map((c, i) => i === catIdx ? { ...c, slots: c.slots + 1 } : c);
        setForm({ ...form, categories: newCats });
    };
    const removeSlot = (cat: string, catIdx: number, slotIdx: number) => {
        setEditableAnswers(prev => {
            const slots = [...(prev[cat] ?? [])];
            slots.splice(slotIdx, 1);
            return { ...prev, [cat]: slots };
        });
        const newCats = categories.map((c, i) => i === catIdx ? { ...c, slots: Math.max(0, c.slots - 1) } : c);
        setForm({ ...form, categories: newCats });
    };

    // ── Multi-question layout handled separately ──
    if (isMultiQuestion) return null;

    // ── Category management ──
    const addCat = () => {
        const newCat: WritingCategory = { label: "", slots: 4 };
        setForm({ ...form, categories: [...categories, newCat] });
        setEditableAnswers(prev => ({ ...prev, [""]: Array.from({ length: 4 }, () => [""]) }));
    };
    const removeCat = (i: number) => {
        const removed = categories[i].label;
        setForm({ ...form, categories: categories.filter((_, idx) => idx !== i) });
        setEditableAnswers(prev => { const next = { ...prev }; delete next[removed]; return next; });
    };
    const updateCatLabel = (i: number, newLabel: string) => {
        const oldLabel = categories[i].label;
        const newCats  = categories.map((c, idx) => idx === i ? { ...c, label: newLabel } : c);
        setForm({ ...form, categories: newCats });
        // rename key in editableAnswers
        setEditableAnswers(prev => {
            const next: Record<string, string[][]> = {};
            for (const [k, v] of Object.entries(prev)) {
                next[k === oldLabel ? newLabel : k] = v;
            }
            return next;
        });
    };
    // ── Image management ──
    const addImg    = () => setForm({ ...form, images: [...images, { url: "" }] });
    const removeImg = (i: number) => setForm({ ...form, images: images.filter((_, idx) => idx !== i) });
    const updateImg = (i: number, url: string) =>
        setForm({ ...form, images: images.map((img, idx) => idx === i ? { url } : img) });

    // View mode: parsed answer map
    const viewAnswerMap = isView ? parseAnswerMap(form.correctAnswer) : {};
    const hasAnswers    = Object.keys(viewAnswerMap).length > 0;

    return (
        <div className="space-y-6">
            {/* ── Categories ── */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <FieldLabel>Categories ({categories.length})</FieldLabel>
                    {!isView && (
                        <button type="button" onClick={addCat}
                            className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700">
                            <Plus className="w-3.5 h-3.5" /> Thêm category
                        </button>
                    )}
                </div>

                {categories.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
                        Chưa có category.
                    </div>
                )}

                <div className="space-y-3">
                    {categories.map((cat, ci) => {
                        const isOpen = expandedCat === cat.label;
                        // VIEW: answers from parsed JSON
                        const viewSlots: string[][] = viewAnswerMap[cat.label] ?? [];
                        // EDIT: answers from editable state
                        const editSlots: string[][] = editableAnswers[cat.label] ?? [];

                        return (
                            <div key={ci} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                                {/* ── Category header ── */}
                                <div
                                    className={[
                                        "flex items-center gap-3 px-4 py-3 transition",
                                        (isView && hasAnswers) || !isView
                                            ? "cursor-pointer hover:bg-gray-50"
                                            : "",
                                    ].join(" ")}
                                    onClick={() => setExpandedCat(prev => prev === cat.label ? null : cat.label)}
                                >
                                    {/* Chevron */}
                                    <ChevronDown className={[
                                        "w-4 h-4 shrink-0 transition-transform duration-200",
                                        isOpen ? "rotate-180 text-orange-500" : "text-gray-400",
                                    ].join(" ")} />

                                    {/* Label + slots — editable in place */}
                                    {isView ? (
                                        <div className="flex-1 flex items-center gap-3">
                                            <span className="text-sm font-bold text-gray-800">{cat.label || <span className="italic text-gray-400">Chưa đặt tên</span>}</span>
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                                {cat.slots} slots
                                            </span>
                                            {isView && (
                                                <span className="ml-auto text-xs text-gray-400">
                                                    {viewSlots.length > 0 ? `${viewSlots.length} đáp án` : "Chưa có đáp án"}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                            <input
                                                value={cat.label}
                                                onChange={e => updateCatLabel(ci, e.target.value)}
                                                placeholder="Tên category (vd: Kitchen)"
                                                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold outline-none transition focus:border-orange-400 focus:bg-white"
                                            />
                                            <span className="shrink-0 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-600">
                                                {cat.slots} slots
                                            </span>
                                        </div>
                                    )}

                                    {/* Remove category button */}
                                    {!isView && (
                                        <button type="button"
                                            onClick={e => { e.stopPropagation(); removeCat(ci); }}
                                            className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* ── Expanded panel ── */}
                                {isOpen && (
                                    <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 space-y-2">
                                        {/* VIEW mode */}
                                        {isView && (
                                            viewSlots.length === 0 ? (
                                                <p className="text-xs italic text-gray-400">Không có đáp án cho category này.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {viewSlots.map((variants, si) => (
                                                        <div key={si} className="flex flex-wrap items-center gap-1.5">
                                                            <span className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold">
                                                                {si + 1}
                                                            </span>
                                                            {variants.map((word, wi) => (
                                                                <span key={wi} className={[
                                                                    "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                                                                    wi === 0
                                                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                                                        : "border-gray-200 bg-white text-gray-500",
                                                                ].join(" ")}>
                                                                    {word}
                                                                    {wi > 0 && <span className="ml-1 text-[10px] text-gray-300">(alt)</span>}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        )}

                                        {/* EDIT mode */}
                                        {!isView && (
                                            <div className="space-y-3">
                                                {editSlots.map((variants, si) => (
                                                    <div key={si} className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                                                        {/* Slot header */}
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                                Slot {si + 1}
                                                            </span>
                                                            <button type="button"
                                                                onClick={() => removeSlot(cat.label, ci, si)}
                                                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition">
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>

                                                        {/* Main answer */}
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-14 shrink-0 text-xs text-emerald-600 font-semibold">Đáp án</span>
                                                            <input
                                                                value={variants[0] ?? ""}
                                                                onChange={e => setSlotMain(cat.label, si, e.target.value)}
                                                                placeholder="vd: dishwasher"
                                                                className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-1.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white placeholder:text-gray-300"
                                                            />
                                                        </div>

                                                        {/* Alt answers */}
                                                        {variants.slice(1).map((alt, ai) => (
                                                            <div key={ai} className="flex items-center gap-2">
                                                                <span className="w-14 shrink-0 text-xs text-gray-400 font-semibold">Alt {ai + 1}</span>
                                                                <input
                                                                    value={alt}
                                                                    onChange={e => setSlotAlt(cat.label, si, ai, e.target.value)}
                                                                    placeholder="Từ đồng nghĩa / chấp nhận thêm"
                                                                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none transition focus:border-orange-300 focus:bg-white placeholder:text-gray-300"
                                                                />
                                                                <button type="button"
                                                                    onClick={() => removeSlotAlt(cat.label, si, ai)}
                                                                    className="shrink-0 p-1 rounded text-gray-300 hover:text-red-400 transition">
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {/* Add alt button */}
                                                        <button type="button"
                                                            onClick={() => addSlotAlt(cat.label, si)}
                                                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition mt-1">
                                                            <Plus className="w-3 h-3" /> Thêm từ chấp nhận
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* Add slot button */}
                                                <button type="button"
                                                    onClick={() => addSlot(cat.label, ci)}
                                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-orange-300 py-2 text-xs font-bold text-orange-500 hover:bg-orange-50 transition">
                                                    <Plus className="w-3.5 h-3.5" /> Thêm slot
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Reference images ── */}
            <div>
                <div className="mb-2 flex items-center justify-between">
                    <FieldLabel>Ảnh tham khảo ({images.length})</FieldLabel>
                    {!isView && (
                        <button type="button" onClick={addImg}
                            className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700">
                            <Plus className="w-3.5 h-3.5" /> Thêm ảnh
                        </button>
                    )}
                </div>
                <div className="space-y-3">
                    {images.length === 0 && (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-400">
                            Chưa có ảnh tham khảo.
                        </div>
                    )}
                    {images.map((img, i) => (
                        <div key={i} className="space-y-2">
                            {!isView && (
                                <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                        <MediaUploadInput
                                            value={img.url}
                                            onChange={v => updateImg(i, v)}
                                            topicId={topicId}
                                            mediaType="image"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <button type="button" onClick={() => removeImg(i)}
                                        className="shrink-0 mt-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            {img.url && (
                                <div className="flex justify-center">
                                    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                                        <img src={img.url} alt={`writing-ref-${i}`} className="max-h-72 w-auto object-contain"
                                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── WRITING multi-question: hiển thị tất cả câu hỏi trên 1 trang (giống MATCHING) ──
function WritingMultiSection({
    questions,
    task,
    topicId,
    taskId,
    navigate,
}: {
    questions: AdminQuestion[];
    task: AdminTaskDetail | null;
    topicId: string;
    taskId: string;
    navigate: (path: string) => void;
}) {
    return (
        <div className="space-y-6">
            {/* Header: loại câu hỏi + nội dung câu hỏi */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">Loại câu hỏi</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-600">
                        <AlignLeft className="w-3.5 h-3.5" /> Writing
                    </span>
                </div>
                <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">Số câu hỏi</p>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 min-h-[40px]">
                        {questions.length}
                    </div>
                </div>
            </div>
            {task?.description && (
                <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">Nội dung câu hỏi</p>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 min-h-[40px]">
                        {task.description}
                    </div>
                </div>
            )}

            <hr className="border-gray-100" />

            {/* Questions list */}
            <div>
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Questions ({questions.length})
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate(`/admin/revision-management/topics/${topicId}/tasks/${taskId}/questions/new`)}
                        className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
                    >
                        <Plus className="w-3.5 h-3.5" /> Thêm câu hỏi
                    </button>
                </div>
                <div className="space-y-2">
                    {questions.length === 0 && (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-400">
                            Chưa có câu hỏi nào.
                        </div>
                    )}
                    {questions.map((q, i) => (
                        <div key={q.mongoId} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 group hover:border-orange-200 transition">
                            <span className="w-6 shrink-0 text-center text-xs font-bold text-gray-400">{i + 1}</span>
                            {/* Question text (left) */}
                            <div className="flex-1">
                                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 min-h-[40px]">
                                    {q.questionText || <span className="italic text-gray-400">Chưa có nội dung</span>}
                                </div>
                            </div>
                            <span className="shrink-0 text-xs font-bold text-gray-300">→</span>
                            {/* Correct answer (right) */}
                            <div className="flex-1">
                                {q.correctAnswer
                                    ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 min-h-[40px]">{q.correctAnswer}</div>
                                    : <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm min-h-[40px]"><span className="italic text-gray-400">Chưa có đáp án</span></div>
                                }
                            </div>
                            {/* Edit action */}
                            <button
                                type="button"
                                onClick={() => navigate(`/admin/revision-management/topics/${topicId}/tasks/${taskId}/questions/${q.mongoId}/edit`)}
                                title="Chỉnh sửa"
                                className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition opacity-0 group-hover:opacity-100"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function QuestionDetailPage() {
    const { topicId, taskId, questionId } = useParams<{
        topicId: string; taskId: string; questionId?: string;
    }>();
    const navigate = useNavigate();
    const location = useLocation();

    const pathname = location.pathname;
    const mode: Mode = pathname.endsWith("/new") ? "create"
        : pathname.endsWith("/edit") ? "edit"
        : "view";

    const [form, setForm]       = useState<QuestionForm>(emptyForm());
    const [task, setTask]       = useState<AdminTaskDetail | null>(null);
    const [siblingQuestions, setSiblingQuestions] = useState<AdminQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(mode !== "create");
    const [isSaving, setIsSaving]   = useState(false);

    useEffect(() => {
        if (!topicId || !taskId) return;
        revisionApi.getTaskDetail(parseInt(topicId), parseInt(taskId))
            .then(setTask)
            .catch(() => {});
    }, [topicId, taskId]);

    useEffect(() => {
        if (!topicId || !taskId || !task) return;
        if (task.questionType.toUpperCase() !== "WRITING" || task.questionCount <= 1) {
            setSiblingQuestions([]);
            return;
        }
        revisionApi.getQuestions(parseInt(topicId), parseInt(taskId))
            .then(qs => setSiblingQuestions(sortQuestions(qs)))
            .catch(() => setSiblingQuestions([]));
    }, [topicId, taskId, task]);

    // Set questionType from task when task is loaded
    useEffect(() => {
        if (!task) return;
        setForm(prev => ({
            ...prev,
            questionType: task.questionType.toUpperCase() as QuestionType,
            // create mode: default orderIndex = last + 1
            ...(mode === "create" ? { orderIndex: (task.questionCount ?? 0) + 1 } : {}),
        }));
    }, [task]);

    useEffect(() => {
        if (mode === "create" || !questionId || !topicId || !taskId) {
            setIsLoading(false);
            return;
        }        setIsLoading(true);
        revisionApi.getQuestion(parseInt(topicId), parseInt(taskId), questionId)
            .then(q => setForm(fromApi(q)))
            .catch(() => toast.error("Không tải được câu hỏi"))
            .finally(() => setIsLoading(false));
    }, [mode, questionId, topicId, taskId]);

    function validate(): boolean {
        if ((form.questionType === "VOCAB_IMAGE" || form.questionType === "LISTENING") && !form.imageUrl.trim()) {
            toast.error("Vui lòng nhập Image URL"); return false;
        }
        if (form.questionType === "LISTENING" && !form.audioUrl.trim()) {
            toast.error("Vui lòng nhập Audio URL"); return false;
        }
        if (form.questionType === "MATCHING") {
            if (form.pairs.length === 0) { toast.error("Vui lòng thêm ít nhất 1 pair"); return false; }
            if (form.pairs.some(p => !p.left.trim() || !p.right.trim())) {
                toast.error("Vui lòng điền đầy đủ left và right"); return false;
            }
        }
        if (form.questionType === "WRITING" && siblingQuestions.length <= 1 && form.categories.length === 0) {
            toast.error("Vui lòng thêm ít nhất 1 category"); return false;
        }
        if (form.questionType === "WRITING" && siblingQuestions.length > 1 && !form.correctAnswer.trim()) {
            toast.error("Vui lòng nhập đáp án đúng"); return false;
        }
        return true;
    }

    async function handleSave() {
        if (!validate()) return;
        setIsSaving(true);
        try {
            const req: SaveQuestionRequest = {
                questionType: form.questionType,
                orderIndex: form.orderIndex,
                imageUrl:     form.imageUrl   || undefined,
                audioUrl:     form.audioUrl   || undefined,
                questionText: form.questionText || undefined,
                sentence:     form.sentence   || undefined,
                correctAnswer: form.correctAnswer || undefined,
                pairs:        form.pairs.length > 0 ? form.pairs : undefined,
                categories:   form.categories.length > 0 ? form.categories : undefined,
                images:       form.images.length > 0 ? form.images : undefined,
            };

            if (mode === "create") {
                const created = await revisionApi.createQuestion(parseInt(topicId!), parseInt(taskId!), req);
                toast.success("Đã thêm câu hỏi");
                navigate(`/admin/revision-management/topics/${topicId}/tasks/${taskId}/questions/${created.mongoId}`);
            } else {
                await revisionApi.updateQuestion(parseInt(topicId!), parseInt(taskId!), questionId!, req);
                toast.success("Đã lưu thay đổi");
                navigate(`/admin/revision-management/topics/${topicId}/tasks/${taskId}/questions/${questionId}`);
            }
        } catch {
            toast.error("Có lỗi xảy ra khi lưu");
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
        );
    }

    const skipTaskDetail = task ? skipsTaskDetail(task.questionType) : false;
    const backPath = skipTaskDetail
        ? `/admin/revision-management/topics/${topicId}`
        : `/admin/revision-management/topics/${topicId}/tasks/${taskId}`;

    const isMultiWriting = task?.questionType === "WRITING" && siblingQuestions.length > 1;

    const ActionButtons = () => (
        <>
            {mode === "view" && questionId && (
                <button
                    onClick={() => navigate(`/admin/revision-management/topics/${topicId}/tasks/${taskId}/questions/${questionId}/edit`)}
                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600">
                    <Pencil className="w-4 h-4" /> Chỉnh sửa
                </button>
            )}
            {mode !== "view" && (
                <>
                    <button
                        onClick={() => mode === "edit" && questionId
                            ? navigate(`/admin/revision-management/topics/${topicId}/tasks/${taskId}/questions/${questionId}`)
                            : navigate(backPath)}
                        className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100">
                        Huỷ
                    </button>
                    <button onClick={handleSave} disabled={isSaving}
                        className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {mode === "create" ? "Thêm câu hỏi" : "Lưu thay đổi"}
                    </button>
                </>
            )}
        </>
    );

    return (
        <div className="space-y-6 p-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-gray-400">
                <Link to="/admin/revision-management/topics" className="hover:text-gray-600 transition">Revision Topics</Link>
                <span>›</span>
                <Link to={`/admin/revision-management/topics/${topicId}`} className="hover:text-gray-600 transition">Topic Detail</Link>
                <span>›</span>
                {skipTaskDetail ? (
                    <span className="text-gray-600">{task?.taskLabel ?? "Task"}</span>
                ) : (
                    <Link to={backPath} className="hover:text-gray-600 transition">Task Detail</Link>
                )}
                <span>›</span>
                <span className="text-gray-600">
                    {mode === "create" ? "New Question" : mode === "edit" ? "Edit Question" : "View Question"}
                </span>
            </nav>

            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(backPath)}
                        className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                                {mode === "create" ? "Thêm câu hỏi mới"
                                    : mode === "edit" ? "Chỉnh sửa câu hỏi"
                                    : "Chi tiết câu hỏi"}
                            </h1>
                            {mode === "view" && <TypeBadge type={form.questionType} />}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500">
                            {mode === "view" ? "Xem nội dung câu hỏi" : "Điền đầy đủ thông tin rồi lưu lại"}
                        </p>
                    </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                    {mode === "view" && (
                        <div className="text-sm text-gray-400 flex items-center gap-1.5">
                            <Eye className="w-4 h-4" /> View mode
                        </div>
                    )}
                    <ActionButtons />
                </div>
            </div>

            {siblingQuestions.length > 1 && questionId && !isMultiWriting && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Câu hỏi:</span>
                    {siblingQuestions.map(q => (
                        <button
                            key={q.mongoId}
                            type="button"
                            onClick={() => navigate(`/admin/revision-management/topics/${topicId}/tasks/${taskId}/questions/${q.mongoId}`)}
                            className={[
                                "rounded-xl border px-3 py-1.5 text-xs font-bold transition",
                                q.mongoId === questionId
                                    ? "border-orange-300 bg-orange-50 text-orange-600"
                                    : "border-gray-200 bg-white text-gray-500 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600",
                            ].join(" ")}
                        >
                            #{q.orderIndex}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => navigate(`/admin/revision-management/topics/${topicId}/tasks/${taskId}/questions/new`)}
                        className="rounded-xl border border-dashed border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-400 transition hover:border-orange-300 hover:text-orange-600"
                    >
                        + Thêm
                    </button>
                </div>
            )}

            {/* Writing multi-question: tất cả câu trên 1 trang */}
            {isMultiWriting && (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                        <h3 className="flex items-center gap-2 text-base font-extrabold text-gray-900">
                            <span className="inline-block w-1 h-5 rounded-full bg-orange-500" />
                            Thông tin câu hỏi
                        </h3>
                    </div>
                    <div className="p-6">
                        <WritingMultiSection
                            questions={siblingQuestions}
                            task={task}
                            topicId={topicId!}
                            taskId={taskId!}
                            navigate={navigate}
                        />
                    </div>
                </div>
            )}

            {/* Form card (ẩn khi writing multi) */}
            {!isMultiWriting && (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h3 className="flex items-center gap-2 text-base font-extrabold text-gray-900">
                        <span className="inline-block w-1 h-5 rounded-full bg-orange-500" />
                        {mode === "view" ? "Thông tin câu hỏi" : "Nội dung câu hỏi"}
                    </h3>
                </div>

                <div className="p-6 space-y-6">
                    {/* Common fields */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel>Loại câu hỏi</FieldLabel>
                            {mode !== "view" ? (
                                <div className="relative inline-flex group/qtype">
                                    <TypeBadge type={form.questionType} />
                                    <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-20
                                                    opacity-0 group-hover/qtype:opacity-100 transition-opacity duration-150
                                                    whitespace-nowrap rounded-xl border border-gray-100 bg-white shadow-lg px-3 py-2 text-xs text-gray-500">
                                        Loại câu hỏi được xác định theo task, không thể thay đổi
                                        <div className="absolute top-full left-4 w-0 h-0
                                                        border-l-4 border-r-4 border-t-4
                                                        border-l-transparent border-r-transparent border-t-white" />
                                    </div>
                                </div>
                            ) : (
                                <TypeBadge type={form.questionType} />
                            )}
                        </div>
                        <div>
                            <FieldLabel>Order Index</FieldLabel>
                            {mode !== "view" ? (
                                <div className="relative group/order">
                                    <ReadonlyBox>{form.orderIndex}</ReadonlyBox>
                                    <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-20
                                                    opacity-0 group-hover/order:opacity-100 transition-opacity duration-150
                                                    whitespace-nowrap rounded-xl border border-gray-100 bg-white shadow-lg px-3 py-2 text-xs text-gray-500">
                                        {mode === "create"
                                            ? "Tự động gán = cuối danh sách hiện tại"
                                            : "Thứ tự hiển thị của câu hỏi trong task"}
                                        <div className="absolute top-full left-4 w-0 h-0
                                                        border-l-4 border-r-4 border-t-4
                                                        border-l-transparent border-r-transparent border-t-white" />
                                    </div>
                                </div>
                            ) : (
                                <ReadonlyBox>{form.orderIndex}</ReadonlyBox>
                            )}
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Type-specific */}
                    {form.questionType === "VOCAB_IMAGE" && <VocabImageSection form={form} setForm={setForm} mode={mode} topicId={topicId} />}
                    {form.questionType === "LISTENING"   && <ListeningSection  form={form} setForm={setForm} mode={mode} topicId={topicId} />}
                    {form.questionType === "MATCHING"    && <MatchingSection   form={form} setForm={setForm} mode={mode} />}
                    {form.questionType === "WRITING"     && <WritingSection    form={form} setForm={setForm} mode={mode} isMultiQuestion={siblingQuestions.length > 1} topicId={topicId} />}
                </div>

                {/* Bottom actions */}
                {mode !== "view" && (
                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                        <ActionButtons />
                    </div>
                )}
                </div>
            )}
        </div>
    );
}
