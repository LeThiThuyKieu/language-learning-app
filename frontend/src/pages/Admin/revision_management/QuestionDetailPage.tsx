import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
    ArrowLeft, Loader2, Save, Plus, Trash2, Eye, Pencil,
    Image as ImageIcon, Music, AlignLeft, Layers,
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

//  VOCAB_IMAGE section 
function VocabImageSection({ form, setForm, mode }: { form: QuestionForm; setForm: (f: QuestionForm) => void; mode: Mode }) {
    const isView = mode === "view";
    return (
        <div className="space-y-4">
            <div>
                <FieldLabel>Image URL</FieldLabel>
                {isView
                    ? <ReadonlyBox>{form.imageUrl || <span className="italic text-gray-400">Chưa có ảnh</span>}</ReadonlyBox>
                    : <TextInput value={form.imageUrl} onChange={v => setForm({ ...form, imageUrl: v })} placeholder="https://..." />
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
function ListeningSection({ form, setForm, mode }: { form: QuestionForm; setForm: (f: QuestionForm) => void; mode: Mode }) {
    const isView = mode === "view";
    return (
        <div className="space-y-4">
            <div>
                <FieldLabel>Image URL</FieldLabel>
                {isView
                    ? <ReadonlyBox>{form.imageUrl || <span className="italic text-gray-400">Chưa có ảnh</span>}</ReadonlyBox>
                    : <TextInput value={form.imageUrl} onChange={v => setForm({ ...form, imageUrl: v })} placeholder="https://..." />
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
                    <TextInput value={form.audioUrl} onChange={v => setForm({ ...form, audioUrl: v })} placeholder="https://....mp3" />
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
function WritingSection({ form, setForm, mode, isMultiQuestion }: {
    form: QuestionForm;
    setForm: (f: QuestionForm) => void;
    mode: Mode;
    isMultiQuestion?: boolean;
}) {
    const isView     = mode === "view";
    const categories = form.categories;
    const images     = form.images;

    // ── Multi-question layout handled separately via WritingMultiSection ──
    if (isMultiQuestion) return null;

    // ── Single-question layout: categories + images (giữ nguyên) ──

    const addCat    = () => setForm({ ...form, categories: [...categories, { label: "", slots: 4 }] });
    const removeCat = (i: number) => setForm({ ...form, categories: categories.filter((_, idx) => idx !== i) });
    const updateCat = (i: number, field: keyof WritingCategory, val: string | number) =>
        setForm({ ...form, categories: categories.map((c, idx) => idx === i ? { ...c, [field]: val } : c) });

    const addImg    = () => setForm({ ...form, images: [...images, { url: "" }] });
    const removeImg = (i: number) => setForm({ ...form, images: images.filter((_, idx) => idx !== i) });
    const updateImg = (i: number, url: string) =>
        setForm({ ...form, images: images.map((img, idx) => idx === i ? { url } : img) });

    return (
        <div className="space-y-5">
            <div>
                <div className="mb-2 flex items-center justify-between">
                    <FieldLabel>Categories ({categories.length})</FieldLabel>
                    {!isView && (
                        <button type="button" onClick={addCat}
                            className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700">
                            <Plus className="w-3.5 h-3.5" /> Thêm category
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {categories.length === 0 && (
                        <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-400">
                            Chưa có category.
                        </div>
                    )}
                    {categories.map((cat, i) => (
                        <div key={i} className="relative rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                            {!isView && (
                                <button type="button" onClick={() => removeCat(i)}
                                    className="absolute right-2 top-2 p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                            {isView ? (
                                <>
                                    <p className="text-sm font-bold text-gray-800">{cat.label}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{cat.slots} slots</p>
                                </>
                            ) : (
                                <div className="space-y-2 pr-5">
                                    <TextInput value={cat.label} onChange={v => updateCat(i, "label", v)} placeholder="Label" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Slots:</span>
                                        <input type="number" min={1} value={cat.slots}
                                            onChange={e => updateCat(i, "slots", parseInt(e.target.value) || 1)}
                                            className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs outline-none focus:border-orange-400" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
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
                                <div className="flex items-center gap-2">
                                    <TextInput value={img.url} onChange={v => updateImg(i, v)} placeholder="https://..." className="flex-1" />
                                    <button type="button" onClick={() => removeImg(i)}
                                        className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
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

    useEffect(() => {
        if (mode === "create" || !questionId || !topicId || !taskId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
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
                            {mode === "view" ? (
                                <TypeBadge type={form.questionType} />
                            ) : (
                                <select value={form.questionType}
                                    onChange={e => setForm({ ...form, questionType: e.target.value as QuestionType })}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-400 focus:bg-white">
                                    <option value="VOCAB_IMAGE">VOCAB_IMAGE</option>
                                    <option value="LISTENING">LISTENING</option>
                                    <option value="MATCHING">MATCHING</option>
                                    <option value="WRITING">WRITING</option>
                                </select>
                            )}
                        </div>
                        <div>
                            <FieldLabel>Order Index</FieldLabel>
                            {mode === "view" ? (
                                <ReadonlyBox>{form.orderIndex}</ReadonlyBox>
                            ) : (
                                <input type="number" min={1} value={form.orderIndex}
                                    onChange={e => setForm({ ...form, orderIndex: parseInt(e.target.value) || 1 })}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:bg-white" />
                            )}
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Type-specific */}
                    {form.questionType === "VOCAB_IMAGE" && <VocabImageSection form={form} setForm={setForm} mode={mode} />}
                    {form.questionType === "LISTENING"   && <ListeningSection  form={form} setForm={setForm} mode={mode} />}
                    {form.questionType === "MATCHING"    && <MatchingSection   form={form} setForm={setForm} mode={mode} />}
                    {form.questionType === "WRITING"     && <WritingSection    form={form} setForm={setForm} mode={mode} isMultiQuestion={siblingQuestions.length > 1} />}
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
