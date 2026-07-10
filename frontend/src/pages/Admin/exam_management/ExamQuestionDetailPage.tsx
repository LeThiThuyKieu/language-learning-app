import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    Trash2,
    Pencil,
    Plus,
    X,
    Loader2,
    Headphones,
    BookOpen,
    ChevronRight,
    Mic,
    Clock,
    Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    examQuestionApi,
    examManagementService,
    type ExamQuestionDetailDto,
    type ExamQuestionSaveRequest,
    type ExamOption,
    type ExamBlankOption,
    type ExamMatchItem,
    type ExamStoryImage,
    type AdminExamTestDto,
} from "@/services/admin/examManagementService";
import ExamImageUploadInput from "@/components/admin/exam_management/ExamImageUploadInput";

type Mode = "view" | "edit" | "create";

interface QuestionForm {
    partId: number | "";
    questionType: string;
    questionNumberStart: number | "";
    questionNumberEnd: number | "";
    correctAnswer: string;
    orderIndex: number | "";
    section: string;
    instruction: string;
    text: string;
    passageImageUrl: string;
    passageText: string;
    formTitle: string;
    formContent: string;
    instructionDetail: string;
    sentence: string;
    writeType: string;
    minWords: number | "";
    maxWords: number | "";
    promptText: string;
    bulletPoints: string[];
    options: ExamOption[];
    blanksOptions: ExamBlankOption[];
    leftItems: ExamMatchItem[];
    rightItems: ExamMatchItem[];
    storyImages: ExamStoryImage[];
    // SPEAKING_TASK
    partTitle: string;
    prompt: string;
    prepTimeSec: number | "";
    speakTimeSec: number | "";
    imageUrl: string;
    speakingParts: Record<string, unknown>[] | null;
}

const QUESTION_TYPES = [
    { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
    { value: "FILL_IN_FORM", label: "Fill in Form" },
    { value: "MATCHING", label: "Matching" },
    { value: "FILL_IN_TEXT", label: "Fill in Text" },
    { value: "SHORT_WRITE", label: "Short Write" },
    { value: "SPEAKING_TASK", label: "Speaking Task" },
];

const SECTIONS = [
    { value: "LISTENING", label: "Listening" },
    { value: "READING_WRITING", label: "Reading & Writing" },
    { value: "SPEAKING", label: "Speaking" },
];

const WRITE_TYPES = [
    { value: "EMAIL", label: "Email" },
    { value: "STORY", label: "Story" },
];

const SECTION_PAPER: Record<string, string> = {
    LISTENING: "LISTENING",
    READING_WRITING: "READING_WRITING",
    SPEAKING: "SPEAKING",
};

const SECTION_BADGE: Record<string, string> = {
    LISTENING: "bg-blue-50 text-blue-600",
    READING_WRITING: "bg-purple-50 text-purple-600",
    SPEAKING: "bg-emerald-50 text-emerald-600",
};

const QTYPE_BADGE: Record<string, string> = {
    MULTIPLE_CHOICE: "bg-sky-100 text-sky-700",
    FILL_IN_FORM: "bg-amber-100 text-amber-700",
    FILL_IN_TEXT: "bg-amber-100 text-amber-700",
    MATCHING: "bg-teal-100 text-teal-700",
    SHORT_WRITE: "bg-pink-100 text-pink-700",
    SPEAKING_TASK: "bg-emerald-100 text-emerald-700",
};

const QTYPE_HINTS: Record<string, string> = {
    MULTIPLE_CHOICE: 'Ví dụ: "B" hoặc JSON array ["A","B"]',
    FILL_IN_FORM: 'Ví dụ: {"1":"answer","2":"answer"} hoặc 25:["a","b"]26:["c"]',
    MATCHING: 'Ví dụ: {"1":"D","2":"A","3":"C"}',
    FILL_IN_TEXT: 'Ví dụ: ["word1","word2"]',
    SHORT_WRITE: "Không bắt buộc với dạng viết",
    SPEAKING_TASK: "Không bắt buộc — LLM đánh giá",
};

function buildEmptyForm(partId?: number, section?: string): QuestionForm {
    const resolvedSection = section ?? "LISTENING";
    // Speaking paper mặc định dùng SPEAKING_TASK
    const defaultType = resolvedSection === "SPEAKING" ? "SPEAKING_TASK" : "MULTIPLE_CHOICE";
    return {
        partId: partId ?? "",
        questionType: defaultType,
        questionNumberStart: "",
        questionNumberEnd: "",
        correctAnswer: "",
        orderIndex: "",
        section: resolvedSection,
        instruction: "",
        text: "",
        passageImageUrl: "",
        passageText: "",
        formTitle: "",
        formContent: "",
        instructionDetail: "",
        sentence: "",
        writeType: "EMAIL",
        minWords: "",
        maxWords: "",
        promptText: "",
        bulletPoints: [],
        options: [],
        blanksOptions: [],
        leftItems: [],
        rightItems: [],
        storyImages: [],
        // SPEAKING_TASK
        partTitle: "",
        prompt: "",
        prepTimeSec: 0,
        speakTimeSec: 60,
        imageUrl: "",
        speakingParts: null,
    };
}

function fromApiToForm(dto: ExamQuestionDetailDto): QuestionForm {
    return {
        partId: dto.partId,
        questionType: dto.questionType,
        questionNumberStart: dto.questionNumberStart,
        questionNumberEnd: dto.questionNumberEnd,
        correctAnswer: dto.correctAnswer ?? "",
        orderIndex: dto.orderIndex,
        section: dto.section,
        instruction: dto.instruction ?? "",
        text: dto.text ?? "",
        passageImageUrl: dto.passageImageUrl ?? "",
        passageText: dto.passageText ?? "",
        formTitle: dto.formTitle ?? "",
        formContent: dto.formContent ?? "",
        instructionDetail: dto.instructionDetail ?? "",
        sentence: dto.sentence ?? "",
        writeType: dto.writeType ?? "EMAIL",
        minWords: dto.minWords ?? "",
        maxWords: dto.maxWords ?? "",
        promptText: dto.promptText ?? "",
        bulletPoints: dto.bulletPoints ?? [],
        options: dto.options ?? [],
        blanksOptions: dto.blanksOptions ?? [],
        leftItems: dto.leftItems ?? [],
        rightItems: dto.rightItems ?? [],
        storyImages: dto.storyImages ?? [],
        // SPEAKING_TASK
        partTitle: dto.partTitle ?? "",
        prompt: dto.prompt ?? "",
        prepTimeSec: dto.prepTimeSec ?? 0,
        speakTimeSec: dto.speakTimeSec ?? 60,
        imageUrl: dto.imageUrl ?? "",
        speakingParts: dto.speakingParts ?? null,
    };
}

function buildSaveRequest(form: QuestionForm): ExamQuestionSaveRequest {
    const base: ExamQuestionSaveRequest = {
        partId: form.partId as number,
        questionType: form.questionType,
        questionNumberStart: form.questionNumberStart as number,
        questionNumberEnd: form.questionNumberEnd as number,
        correctAnswer: form.correctAnswer || null,
        orderIndex: form.orderIndex === "" ? 0 : (form.orderIndex as number),
        section: form.section,
        instruction: form.instruction || null,
    };

    if (form.questionType === "MULTIPLE_CHOICE") {
        return {
            ...base,
            text: form.text || null,
            options: form.options.length > 0 ? form.options : null,
            passageImageUrl: form.passageImageUrl || null,
            passageText: form.passageText || null,
        };
    }
    if (form.questionType === "FILL_IN_FORM") {
        return {
            ...base,
            formTitle: form.formTitle || null,
            formContent: form.formContent || null,
            blanksOptions: form.blanksOptions.length > 0 ? form.blanksOptions : null,
        };
    }
    if (form.questionType === "MATCHING") {
        return {
            ...base,
            instructionDetail: form.instructionDetail || null,
            leftItems: form.leftItems.length > 0 ? form.leftItems : null,
            rightItems: form.rightItems.length > 0 ? form.rightItems : null,
        };
    }
    if (form.questionType === "FILL_IN_TEXT") {
        return {
            ...base,
            sentence: form.sentence || null,
        };
    }
    if (form.questionType === "SHORT_WRITE") {
        return {
            ...base,
            writeType: form.writeType || null,
            minWords: form.minWords === "" ? null : (form.minWords as number),
            maxWords: form.maxWords === "" ? null : (form.maxWords as number),
            promptText: form.promptText || null,
            bulletPoints: form.bulletPoints.length > 0 ? form.bulletPoints : null,
            storyImages: form.storyImages.length > 0 ? form.storyImages : null,
        };
    }
    if (form.questionType === "SPEAKING_TASK") {
        return {
            ...base,
            partTitle: form.partTitle || null,
            prompt: form.prompt || null,
            prepTimeSec: form.prepTimeSec === "" ? null : (form.prepTimeSec as number),
            speakTimeSec: form.speakTimeSec === "" ? null : (form.speakTimeSec as number),
            imageUrl: form.imageUrl || null,
            speakingParts: form.speakingParts && form.speakingParts.length > 0 ? form.speakingParts : null,
        };
    }
    return base;
}

function resetTypeSpecificFields(form: QuestionForm): QuestionForm {
    return {
        ...form,
        text: "",
        passageImageUrl: "",
        passageText: "",
        options: [],
        formTitle: "",
        formContent: "",
        blanksOptions: [],
        instructionDetail: "",
        leftItems: [],
        rightItems: [],
        sentence: "",
        writeType: "EMAIL",
        minWords: "",
        maxWords: "",
        promptText: "",
        bulletPoints: [],
        storyImages: [],
        // speaking
        partTitle: "",
        prompt: "",
        prepTimeSec: 0,
        speakTimeSec: 60,
        imageUrl: "",
        speakingParts: null,
    };
}

const labelCls = "text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block";
const inputCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:bg-white";
function FieldLabel({ children }: { children: React.ReactNode }) {
    return <label className={labelCls}>{children}</label>;
}

function ReadonlyBox({ value, className }: { value?: string | number | null; className?: string }) {
    const hasValue = value !== null && value !== undefined && value !== "";
    return (
        <p className={`text-sm text-gray-800 leading-relaxed ${className ?? ""}`}>
            {hasValue ? value : <span className="text-gray-300 italic">—</span>}
        </p>
    );
}

function SectionBadge({ section }: { section: string }) {
    const cls = SECTION_BADGE[section] ?? "bg-gray-100 text-gray-500";
    const label = section === "LISTENING" ? "Listening" : section === "SPEAKING" ? "Speaking" : "Reading & Writing";
    const Icon = section === "LISTENING" ? Headphones : section === "SPEAKING" ? Mic : BookOpen;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cls}`}>
            <Icon size={11} />
            {label}
        </span>
    );
}

function QTypeBadge({ type }: { type: string }) {
    const cls = QTYPE_BADGE[type] ?? "bg-gray-100 text-gray-500";
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${cls}`}>
            {type.replace(/_/g, " ")}
        </span>
    );
}

function DeleteModal({
    onConfirm,
    onCancel,
    loading,
}: {
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <Trash2 size={18} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-gray-900">Xác nhận xóa</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Hành động này không thể hoàn tác</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                    Bạn có chắc muốn xóa câu hỏi này? Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper: render inline markdown — **text** → <strong>, \n → <br/>, \t → indent
// (Tham khảo từ ExamListeningPage RichText)
function RichText({ text, className }: { text: string; className?: string }) {
    const normalized = text.replace(/\\t/g, "\t").replace(/\\n/g, "\n");
    const parts = normalized.split(/(\*\*.+?\*\*|\n|\t)/g);
    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (part === "\n") return <br key={i} />;
                if (part === "\t") return <span key={i} style={{ marginRight: "2em" }}>&nbsp;</span>;
                if (part.startsWith("**") && part.endsWith("**"))
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
}

// Helper: render inline markdown bold (**text**)
function renderInlineMd(text: string): React.ReactNode {
    return <RichText text={text} />;
}

// MULTIPLE_CHOICE
function MultipleChoiceSection({
    form,
    mode,
    onChange,
    partId,
}: {
    form: QuestionForm;
    mode: Mode;
    onChange: (patch: Partial<QuestionForm>) => void;
    partId?: number;
}) {
    const isEdit = mode !== "view";

    const addOption = () => {
        const ids = ["A", "B", "C", "D", "E", "F", "G", "H"];
        const nextId = ids[form.options.length] ?? String(form.options.length + 1);
        onChange({ options: [...form.options, { id: nextId, text: "", image_url: null }] });
    };

    const updateOption = (idx: number, patch: Partial<ExamOption>) => {
        const next = form.options.map((o, i) => (i === idx ? { ...o, ...patch } : o));
        onChange({ options: next });
    };

    const removeOption = (idx: number) => {
        onChange({ options: form.options.filter((_, i) => i !== idx) });
    };

    return (
        <div className="space-y-5">
            {/* Text */}
            <div>
                <FieldLabel>Câu hỏi (text)</FieldLabel>
                {isEdit ? (
                    <textarea
                        className={`${inputCls} min-h-[80px] resize-y`}
                        value={form.text}
                        onChange={e => onChange({ text: e.target.value })}
                        placeholder="Nội dung câu hỏi..."
                    />
                ) : (
                    <p className="text-sm text-gray-800 leading-relaxed">
                        <RichText text={form.text ?? ""} />
                    </p>
                )}
            </div>

            {/* Passage Image URL & Passage Text — chỉ hiển thị khi edit (view mode đã có Passage block bên trên) */}
            {isEdit && (
                <>
                    <div>
                        <FieldLabel>Passage Image URL</FieldLabel>
                        <ExamImageUploadInput
                            value={form.passageImageUrl}
                            onChange={url => onChange({ passageImageUrl: url })}
                            partId={partId}
                            placeholder="https://..."
                        />
                        {form.passageImageUrl && (
                            <img
                                src={form.passageImageUrl}
                                alt="passage"
                                className="mt-2 rounded-xl border border-gray-200 max-h-48 object-contain"
                                onError={e => (e.currentTarget.style.display = "none")}
                            />
                        )}
                    </div>

                    <div>
                        <FieldLabel>Passage Text</FieldLabel>
                        <textarea
                            className={`${inputCls} min-h-[120px] resize-y font-mono text-xs`}
                            value={form.passageText}
                            onChange={e => onChange({ passageText: e.target.value })}
                            placeholder="Nội dung passage (có thể dùng markdown)..."
                        />
                    </div>
                </>
            )}

            {/* Options */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <FieldLabel>Các lựa chọn</FieldLabel>
                    {isEdit && (
                        <button
                            type="button"
                            onClick={addOption}
                            className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600"
                        >
                            <Plus size={13} /> Thêm lựa chọn
                        </button>
                    )}
                </div>
                <div className="space-y-3">
                    {form.options.length === 0 && (
                        <p className="text-xs text-gray-300 italic">Chưa có lựa chọn nào.</p>
                    )}
                    {/* VIEW mode: if any option has image → 2-col grid */}
                    {!isEdit && form.options.some(o => o.image_url) ? (
                        <div className="grid grid-cols-2 gap-3">
                            {form.options.map((opt, idx) => (
                                <div key={idx} className="p-2 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 text-xs font-extrabold flex items-center justify-center shrink-0">
                                            {opt.id}
                                        </span>
                                        {opt.text && (
                                            <span className="text-sm text-gray-800 flex-1">
                                                {renderInlineMd(opt.text)}
                                            </span>
                                        )}
                                    </div>
                                    {opt.image_url && (
                                        <img
                                            src={opt.image_url}
                                            alt={`option ${opt.id}`}
                                            className="w-full max-h-40 object-contain"
                                            onError={e => (e.currentTarget.style.display = "none")}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        form.options.map((opt, idx) => (
                            <div key={idx} className={isEdit ? "rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2" : "flex items-center gap-3 py-1.5"}>
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 text-xs font-extrabold flex items-center justify-center shrink-0">
                                        {opt.id}
                                    </span>
                                    {isEdit ? (
                                        <input
                                            type="text"
                                            className={`${inputCls} flex-1`}
                                            value={opt.text ?? ""}
                                            onChange={e => updateOption(idx, { text: e.target.value })}
                                            placeholder="Nội dung lựa chọn..."
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-800 flex-1">
                                            {renderInlineMd(opt.text ?? "")}
                                        </span>
                                    )}
                                    {isEdit && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(idx)}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>
                                {isEdit ? (
                                    <ExamImageUploadInput
                                        value={opt.image_url ?? ""}
                                        onChange={url => updateOption(idx, { image_url: url || null })}
                                        partId={partId}
                                        placeholder="Image URL (tùy chọn)..."
                                    />
                                ) : null}
                                {!isEdit && opt.image_url && (
                                    <img
                                        src={opt.image_url}
                                        alt={`option ${opt.id}`}
                                        className="rounded-lg border border-gray-200 max-h-32 object-contain mt-1"
                                        onError={e => (e.currentTarget.style.display = "none")}
                                    />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// FILL_IN_FORM
function FillInFormSection({
    form,
    mode,
    onChange,
}: {
    form: QuestionForm;
    mode: Mode;
    onChange: (patch: Partial<QuestionForm>) => void;
}) {
    const isEdit = mode !== "view";

    const addBlank = () => {
        const nextNum = (form.blanksOptions[form.blanksOptions.length - 1]?.number ?? 0) + 1;
        onChange({ blanksOptions: [...form.blanksOptions, { number: nextNum, options: [] }] });
    };

    const removeBlank = (idx: number) => {
        onChange({ blanksOptions: form.blanksOptions.filter((_, i) => i !== idx) });
    };

    const updateBlankNumber = (idx: number, val: number) => {
        const next = form.blanksOptions.map((b, i) => (i === idx ? { ...b, number: val } : b));
        onChange({ blanksOptions: next });
    };

    const addBlankOption = (blankIdx: number) => {
        const next = form.blanksOptions.map((b, i) =>
            i === blankIdx ? { ...b, options: [...b.options, ""] } : b
        );
        onChange({ blanksOptions: next });
    };

    const updateBlankOption = (blankIdx: number, optIdx: number, val: string) => {
        const next = form.blanksOptions.map((b, i) => {
            if (i !== blankIdx) return b;
            const opts = b.options.map((o, oi) => (oi === optIdx ? val : o));
            return { ...b, options: opts };
        });
        onChange({ blanksOptions: next });
    };

    const removeBlankOption = (blankIdx: number, optIdx: number) => {
        const next = form.blanksOptions.map((b, i) => {
            if (i !== blankIdx) return b;
            return { ...b, options: b.options.filter((_, oi) => oi !== optIdx) };
        });
        onChange({ blanksOptions: next });
    };

    return (
        <div className="space-y-5">
            {/* Form Title */}
            <div>
                <FieldLabel>Form Title</FieldLabel>
                {isEdit ? (
                    <input
                        type="text"
                        className={inputCls}
                        value={form.formTitle}
                        onChange={e => onChange({ formTitle: e.target.value })}
                        placeholder="Tiêu đề form..."
                    />
                ) : (
                    <p className="text-sm text-gray-800 leading-relaxed">
                        <RichText text={form.formTitle ?? ""} />
                    </p>
                )}
            </div>

            {/* Form Content */}
            <div>
                <FieldLabel>Form Content (dùng ____ cho chỗ trống)</FieldLabel>
                {isEdit ? (
                    <textarea
                        className={`${inputCls} min-h-[140px] resize-y font-mono text-xs`}
                        value={form.formContent}
                        onChange={e => onChange({ formContent: e.target.value })}
                        placeholder="Nội dung form với ____ là chỗ trống..."
                    />
                ) : (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap min-h-[80px] leading-relaxed">
                        <RichText text={form.formContent ?? ""} />
                    </p>
                )}
            </div>

            {/* Blanks Options */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <FieldLabel>Các lựa chọn cho chỗ trống</FieldLabel>
                    {isEdit && (
                        <button
                            type="button"
                            onClick={addBlank}
                            className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600"
                        >
                            <Plus size={13} /> Thêm chỗ trống
                        </button>
                    )}
                </div>
                <div className="space-y-3">
                    {form.blanksOptions.length === 0 && (
                        <p className="text-xs text-gray-300 italic">Chưa có chỗ trống nào.</p>
                    )}
                    {form.blanksOptions.map((blank, bIdx) => (
                        <div key={bIdx} className={isEdit ? "rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2" : "py-1.5 space-y-1.5"}>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500 shrink-0">Blank #</span>
                                {isEdit ? (
                                    <input
                                        type="number"
                                        className={`${inputCls} w-24`}
                                        value={blank.number}
                                        onChange={e => updateBlankNumber(bIdx, Number(e.target.value))}
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-gray-700">{blank.number}</span>
                                )}
                                {isEdit && (
                                    <button
                                        type="button"
                                        onClick={() => removeBlank(bIdx)}
                                        className="ml-auto p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                                {blank.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center gap-1">
                                        {isEdit ? (
                                            <input
                                                type="text"
                                                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-orange-400"
                                                value={opt}
                                                onChange={e => updateBlankOption(bIdx, oIdx, e.target.value)}
                                                placeholder="Option..."
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-800">
                                                <RichText text={opt} />
                                            </span>
                                        )}
                                        {isEdit && (
                                            <button
                                                type="button"
                                                onClick={() => removeBlankOption(bIdx, oIdx)}
                                                className="p-1 text-gray-300 hover:text-red-500 transition"
                                            >
                                                <X size={11} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {!isEdit && blank.options.length === 0 && (
                                    <span className="text-xs text-gray-300 italic">Chưa có lựa chọn</span>
                                )}
                                {isEdit && (
                                    <button
                                        type="button"
                                        onClick={() => addBlankOption(bIdx)}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-orange-300 text-orange-400 text-xs font-bold hover:border-orange-500 transition"
                                    >
                                        <Plus size={11} /> Thêm
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// MATCHING
function MatchingSection({
    form,
    mode,
    onChange,
}: {
    form: QuestionForm;
    mode: Mode;
    onChange: (patch: Partial<QuestionForm>) => void;
}) {
    const isEdit = mode !== "view";

    const addLeft = () => {
        const nextNum = (form.leftItems[form.leftItems.length - 1]?.question_number ?? 0) + 1;
        onChange({ leftItems: [...form.leftItems, { question_number: nextNum, label: "" }] });
    };
    const removeLeft = (idx: number) => onChange({ leftItems: form.leftItems.filter((_, i) => i !== idx) });
    const updateLeft = (idx: number, patch: Partial<ExamMatchItem>) => {
        onChange({ leftItems: form.leftItems.map((item, i) => (i === idx ? { ...item, ...patch } : item)) });
    };

    const addRight = () => {
        const ids = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
        const nextId = ids[form.rightItems.length] ?? String(form.rightItems.length + 1);
        onChange({ rightItems: [...form.rightItems, { id: nextId, label: "" }] });
    };
    const removeRight = (idx: number) => onChange({ rightItems: form.rightItems.filter((_, i) => i !== idx) });
    const updateRight = (idx: number, patch: Partial<ExamMatchItem>) => {
        onChange({ rightItems: form.rightItems.map((item, i) => (i === idx ? { ...item, ...patch } : item)) });
    };

    return (
        <div className="space-y-5">
            {/* Instruction Detail */}
            <div>
                <FieldLabel>Instruction Detail</FieldLabel>
                {isEdit ? (
                    <textarea
                        className={`${inputCls} min-h-[80px] resize-y`}
                        value={form.instructionDetail}
                        onChange={e => onChange({ instructionDetail: e.target.value })}
                        placeholder="Hướng dẫn chi tiết..."
                    />
                ) : (
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        <RichText text={form.instructionDetail ?? ""} />
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Left Items */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <FieldLabel>Left Items (câu hỏi)</FieldLabel>
                        {isEdit && (
                            <button
                                type="button"
                                onClick={addLeft}
                                className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600"
                            >
                                <Plus size={11} /> Thêm
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {form.leftItems.length === 0 && (
                            <p className="text-xs text-gray-300 italic">Trống.</p>
                        )}
                        {form.leftItems.map((item, idx) => (
                            <div key={idx} className={isEdit ? "flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2" : "flex items-center gap-2 py-1"}>
                                {isEdit ? (
                                    <>
                                        <input
                                            type="number"
                                            className="w-14 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                                            value={item.question_number ?? ""}
                                            onChange={e => updateLeft(idx, { question_number: Number(e.target.value) })}
                                            placeholder="Q#"
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                                            value={item.label}
                                            onChange={e => updateLeft(idx, { label: e.target.value })}
                                            placeholder="Label..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeLeft(idx)}
                                            className="p-1 text-gray-300 hover:text-red-500 transition"
                                        >
                                            <X size={11} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-8 text-xs font-bold text-orange-500 shrink-0">Q{item.question_number}</span>
                                        <span className="text-sm text-gray-800 flex-1"><RichText text={item.label ?? ""} /></span>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Items */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <FieldLabel>Right Items (đáp án)</FieldLabel>
                        {isEdit && (
                            <button
                                type="button"
                                onClick={addRight}
                                className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600"
                            >
                                <Plus size={11} /> Thêm
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {form.rightItems.length === 0 && (
                            <p className="text-xs text-gray-300 italic">Trống.</p>
                        )}
                        {form.rightItems.map((item, idx) => (
                            <div key={idx} className={isEdit ? "flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2" : "flex items-center gap-2 py-1"}>
                                {isEdit ? (
                                    <>
                                        <input
                                            type="text"
                                            className="w-12 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                                            value={item.id ?? ""}
                                            onChange={e => updateRight(idx, { id: e.target.value })}
                                            placeholder="ID"
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                                            value={item.label}
                                            onChange={e => updateRight(idx, { label: e.target.value })}
                                            placeholder="Label..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeRight(idx)}
                                            className="p-1 text-gray-300 hover:text-red-500 transition"
                                        >
                                            <X size={11} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-8 text-xs font-bold text-teal-600 shrink-0">{item.id}</span>
                                        <span className="text-sm text-gray-800 flex-1"><RichText text={item.label ?? ""} /></span>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// FILL_IN_TEXT
function FillInTextSection({
    form,
    mode,
    onChange,
}: {
    form: QuestionForm;
    mode: Mode;
    onChange: (patch: Partial<QuestionForm>) => void;
}) {
    const isEdit = mode !== "view";
    return (
        <div>
            <FieldLabel>Sentence (dùng ____ cho chỗ trống)</FieldLabel>
            {isEdit ? (
                <textarea
                    className={`${inputCls} min-h-[100px] resize-y`}
                    value={form.sentence}
                    onChange={e => onChange({ sentence: e.target.value })}
                    placeholder="Ví dụ: The train leaves ____ ten minutes."
                />
            ) : (
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    <RichText text={form.sentence ?? ""} />
                </p>
            )}
            {form.sentence && (
                <p className="mt-1.5 text-xs text-gray-400">
                    Số chỗ trống:{" "}
                    <span className="font-bold text-orange-500">
                        {(form.sentence.match(/____/g) || []).length}
                    </span>
                </p>
            )}
        </div>
    );
}

// SHORT_WRITE
function ShortWriteSection({
    form,
    mode,
    onChange,
    partId,
}: {
    form: QuestionForm;
    mode: Mode;
    onChange: (patch: Partial<QuestionForm>) => void;
    partId?: number;
}) {
    const isEdit = mode !== "view";

    const addBullet = () => onChange({ bulletPoints: [...form.bulletPoints, ""] });
    const updateBullet = (idx: number, val: string) =>
        onChange({ bulletPoints: form.bulletPoints.map((b, i) => (i === idx ? val : b)) });
    const removeBullet = (idx: number) =>
        onChange({ bulletPoints: form.bulletPoints.filter((_, i) => i !== idx) });

    const addImage = () =>
        onChange({ storyImages: [...form.storyImages, { order: form.storyImages.length + 1, image_url: "", alt: "" }] });
    const removeImage = (idx: number) =>
        onChange({ storyImages: form.storyImages.filter((_, i) => i !== idx) });
    const updateImage = (idx: number, patch: Partial<ExamStoryImage>) =>
        onChange({ storyImages: form.storyImages.map((img, i) => (i === idx ? { ...img, ...patch } : img)) });

    return (
        <div className="space-y-5">
            {/* Write Type */}
            <div>
                <FieldLabel>Write Type</FieldLabel>
                {isEdit ? (
                    <select
                        className={inputCls}
                        value={form.writeType}
                        onChange={e => onChange({ writeType: e.target.value })}
                    >
                        {WRITE_TYPES.map(wt => (
                            <option key={wt.value} value={wt.value}>{wt.label}</option>
                        ))}
                    </select>
                ) : (
                    <ReadonlyBox value={form.writeType} />
                )}
            </div>

            {/* Min / Max Words */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <FieldLabel>Min Words</FieldLabel>
                    {isEdit ? (
                        <input
                            type="number"
                            className={inputCls}
                            value={form.minWords}
                            onChange={e => onChange({ minWords: e.target.value === "" ? "" : Number(e.target.value) })}
                            placeholder="0"
                            min={0}
                        />
                    ) : (
                        <ReadonlyBox value={form.minWords} />
                    )}
                </div>
                <div>
                    <FieldLabel>Max Words</FieldLabel>
                    {isEdit ? (
                        <input
                            type="number"
                            className={inputCls}
                            value={form.maxWords}
                            onChange={e => onChange({ maxWords: e.target.value === "" ? "" : Number(e.target.value) })}
                            placeholder="0"
                            min={0}
                        />
                    ) : (
                        <ReadonlyBox value={form.maxWords} />
                    )}
                </div>
            </div>

            {/* Prompt Text */}
            <div>
                <FieldLabel>Prompt Text</FieldLabel>
                {isEdit ? (
                    <textarea
                        className={`${inputCls} min-h-[100px] resize-y`}
                        value={form.promptText}
                        onChange={e => onChange({ promptText: e.target.value })}
                        placeholder="Yêu cầu bài viết..."
                    />
                ) : (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        <RichText text={form.promptText ?? ""} />
                    </p>
                )}
            </div>

            {/* Bullet Points */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <FieldLabel>Bullet Points</FieldLabel>
                    {isEdit && (
                        <button
                            type="button"
                            onClick={addBullet}
                            className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600"
                        >
                            <Plus size={13} /> Thêm
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {form.bulletPoints.length === 0 && (
                        <p className="text-xs text-gray-300 italic">Chưa có bullet point nào.</p>
                    )}
                    {form.bulletPoints.map((bp, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                            {isEdit ? (
                                <input
                                    type="text"
                                    className={`${inputCls} flex-1`}
                                    value={bp}
                                    onChange={e => updateBullet(idx, e.target.value)}
                                    placeholder="Bullet point..."
                                />
                            ) : (
                                <span className="text-sm text-gray-700 flex-1"><RichText text={bp} /></span>
                            )}
                            {isEdit && (
                                <button
                                    type="button"
                                    onClick={() => removeBullet(idx)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 transition"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Story Images */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <FieldLabel>Story Images</FieldLabel>
                    {isEdit && (
                        <button
                            type="button"
                            onClick={addImage}
                            className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600"
                        >
                            <Plus size={13} /> Thêm ảnh
                        </button>
                    )}
                </div>
                <div className="space-y-3">
                    {form.storyImages.length === 0 && (
                        <p className="text-xs text-gray-300 italic">Chưa có ảnh nào.</p>
                    )}
                    {form.storyImages.map((img, idx) => (
                        <div key={idx} className={isEdit ? "rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2" : "space-y-1.5 py-1"}>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400 shrink-0">Order:</span>
                                {isEdit ? (
                                    <input
                                        type="number"
                                        className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                                        value={img.order}
                                        onChange={e => updateImage(idx, { order: Number(e.target.value) })}
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-gray-700">{img.order}</span>
                                )}
                                {isEdit && (
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="ml-auto p-1.5 text-gray-300 hover:text-red-500 transition"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                            {isEdit ? (
                                <>
                                    <ExamImageUploadInput
                                        value={img.image_url}
                                        onChange={url => updateImage(idx, { image_url: url })}
                                        partId={partId}
                                        placeholder="Image URL..."
                                    />
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={img.alt ?? ""}
                                        onChange={e => updateImage(idx, { alt: e.target.value })}
                                        placeholder="Alt text (tùy chọn)..."
                                    />
                                </>
                            ) : img.image_url ? (
                                <p className="text-xs text-gray-400 break-all">{img.image_url}</p>
                            ) : null}
                            {img.image_url && (
                                <img
                                    src={img.image_url}
                                    alt={img.alt ?? "story"}
                                    className="rounded-xl border border-gray-200 max-h-40 object-contain"
                                    onError={e => (e.currentTarget.style.display = "none")}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// SPEAKING_TASK
function SpeakingTaskSection({
    form,
    mode,
    onChange,
    partId,
}: {
    form: QuestionForm;
    mode: Mode;
    onChange: (patch: Partial<QuestionForm>) => void;
    partId?: number;
}) {
    const isEdit = mode !== "view";
    const hasSpeakingParts = !!(form.speakingParts && form.speakingParts.length > 0);

    // JSON editor state for speakingParts
    const [jsonText, setJsonText] = useState<string>(() =>
        hasSpeakingParts ? JSON.stringify(form.speakingParts, null, 2) : ""
    );
    const [jsonError, setJsonError] = useState<string | null>(null);

    // Sync jsonText khi chuyển mode (view <-> edit)
    useEffect(() => {
        if (form.speakingParts && form.speakingParts.length > 0) {
            setJsonText(JSON.stringify(form.speakingParts, null, 2));
        } else {
            setJsonText("");
        }
        setJsonError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    const handleJsonChange = (val: string) => {
        setJsonText(val);
        if (!val.trim()) {
            setJsonError(null);
            onChange({ speakingParts: null });
            return;
        }
        try {
            const parsed = JSON.parse(val);
            if (!Array.isArray(parsed)) {
                setJsonError("Phải là JSON array [ ... ]");
                return;
            }
            setJsonError(null);
            onChange({ speakingParts: parsed as Record<string, unknown>[] });
        } catch (e) {
            setJsonError("JSON không hợp lệ: " + (e instanceof Error ? e.message : String(e)));
        }
    };

    return (
        <div className="space-y-5">
            {/* Part Title */}
            <div>
                <FieldLabel>Part Title</FieldLabel>
                {isEdit ? (
                    <input
                        type="text"
                        className={inputCls}
                        value={form.partTitle}
                        onChange={e => onChange({ partTitle: e.target.value })}
                        placeholder="Ví dụ: Part 1 — Introduction"
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <Mic size={14} className="text-emerald-500 shrink-0" />
                        <span className="text-sm font-semibold text-gray-800">{form.partTitle || <span className="text-gray-300 italic">—</span>}</span>
                    </div>
                )}
            </div>

            {/* Prompt — chỉ hiện khi không có speakingParts hoặc trong edit mode */}
            {(!hasSpeakingParts || isEdit) && (
                <div>
                    <FieldLabel>Prompt đơn giản (câu hỏi / yêu cầu nói)</FieldLabel>
                    {isEdit ? (
                        <textarea
                            className={`${inputCls} min-h-[120px] resize-y`}
                            value={form.prompt}
                            onChange={e => onChange({ prompt: e.target.value })}
                            placeholder="Ví dụ: Tell me about your hobbies. What do you enjoy doing in your free time?"
                        />
                    ) : (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {form.prompt ? <RichText text={form.prompt} /> : <span className="text-gray-300 italic">—</span>}
                        </p>
                    )}
                </div>
            )}

            {/* Prep Time + Speak Time */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <FieldLabel>Thời gian chuẩn bị (giây)</FieldLabel>
                    {isEdit ? (
                        <div className="relative">
                            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                className={`${inputCls} pl-8`}
                                value={form.prepTimeSec}
                                onChange={e => onChange({ prepTimeSec: e.target.value === "" ? "" : Number(e.target.value) })}
                                placeholder="0"
                                min={0}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">{form.prepTimeSec ?? 0}s</span>
                        </div>
                    )}
                </div>
                <div>
                    <FieldLabel>Thời gian nói (giây)</FieldLabel>
                    {isEdit ? (
                        <div className="relative">
                            <Mic size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                className={`${inputCls} pl-8`}
                                value={form.speakTimeSec}
                                onChange={e => onChange({ speakTimeSec: e.target.value === "" ? "" : Number(e.target.value) })}
                                placeholder="60"
                                min={0}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <Mic size={13} className="text-emerald-500" />
                            <span className="text-sm font-medium text-gray-700">{form.speakTimeSec ?? 60}s</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Image URL */}
            <div>
                <FieldLabel>Ảnh minh họa (tùy chọn)</FieldLabel>
                {isEdit ? (
                    <>
                        <ExamImageUploadInput
                            value={form.imageUrl}
                            onChange={url => onChange({ imageUrl: url })}
                            partId={partId}
                            placeholder="https://..."
                        />
                        {form.imageUrl && (
                            <img
                                src={form.imageUrl}
                                alt="speaking illustration"
                                className="mt-2 rounded-xl border border-gray-200 max-h-48 object-contain"
                                onError={e => (e.currentTarget.style.display = "none")}
                            />
                        )}
                    </>
                ) : form.imageUrl ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                            <ImageIcon size={13} className="text-gray-400" />
                            <p className="text-xs text-gray-400 break-all">{form.imageUrl}</p>
                        </div>
                        <img
                            src={form.imageUrl}
                            alt="speaking"
                            className="rounded-xl border border-gray-200 max-h-48 object-contain"
                            onError={e => (e.currentTarget.style.display = "none")}
                        />
                    </div>
                ) : (
                    <p className="text-sm text-gray-300 italic">Không có ảnh</p>
                )}
            </div>

            {/* ── Speaking Parts (structured Cambridge format) ── */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <FieldLabel>Speaking Parts (cấu trúc Cambridge)</FieldLabel>
                    {hasSpeakingParts && !isEdit && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {(form.speakingParts as Record<string, unknown>[]).length} parts
                        </span>
                    )}
                </div>

                {/* VIEW MODE — render structured speakingParts */}
                {!isEdit && hasSpeakingParts && (
                    <SpeakingPartsView parts={form.speakingParts as Record<string, unknown>[]} />
                )}

                {!isEdit && !hasSpeakingParts && (
                    <p className="text-xs text-gray-300 italic">Không có dữ liệu Speaking Parts.</p>
                )}

                {/* EDIT MODE — JSON editor */}
                {isEdit && (
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400">
                            Chỉnh sửa JSON trực tiếp. Cấu trúc:{" "}
                            <code className="text-orange-500 text-[10px]">
                                [{"{"}partNumber, partTitle, duration, phases: [{"{"}phaseNumber, interlocutorIntro, questions, mediaUrl, allowedTime{"}"}]{"}"}]
                            </code>
                        </p>
                        <textarea
                            className={`${inputCls} min-h-[320px] resize-y font-mono text-xs leading-relaxed${jsonError ? " border-red-400 focus:border-red-400" : ""}`}
                            value={jsonText}
                            onChange={e => handleJsonChange(e.target.value)}
                            placeholder={'[\n  {\n    "partNumber": 1,\n    "partTitle": "Part 1",\n    "duration": 4,\n    "phases": [...]\n  }\n]'}
                            spellCheck={false}
                        />
                        {jsonError && (
                            <p className="text-xs text-red-500 font-medium">{jsonError}</p>
                        )}
                        {!jsonError && jsonText.trim() && (
                            <p className="text-xs text-emerald-600 font-medium">JSON hợp lệ</p>
                        )}
                    </div>
                )}
            </div>

            {/* Preview card — view mode (chỉ khi không có speakingParts) */}
            {!isEdit && !hasSpeakingParts && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <Mic size={16} className="text-emerald-500" />
                        <span className="text-sm font-extrabold text-emerald-700">Preview Speaking Task</span>
                    </div>
                    {form.partTitle && (
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{form.partTitle}</p>
                    )}
                    {form.prompt && (
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{form.prompt}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs font-medium text-emerald-600">
                        {(form.prepTimeSec !== "" && (form.prepTimeSec as number) > 0) && (
                            <span className="flex items-center gap-1">
                                <Clock size={11} />
                                Chuẩn bị {form.prepTimeSec}s
                            </span>
                        )}
                        {form.speakTimeSec !== "" && (
                            <span className="flex items-center gap-1">
                                <Mic size={11} />
                                Nói {form.speakTimeSec}s
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── SpeakingPartsView — hiển thị cấu trúc Cambridge speaking_parts ────────────
function SpeakingPartsView({ parts }: { parts: Record<string, unknown>[] }) {
    const [expandedParts, setExpandedParts] = useState<Set<number>>(() => new Set([0]));
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(() => new Set(["0-0"]));

    const togglePart = (idx: number) => {
        setExpandedParts(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            return next;
        });
    };

    const togglePhase = (key: string) => {
        setExpandedPhases(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    return (
        <div className="space-y-3">
            {parts.map((part, pIdx) => {
                const partNumber = part.partNumber as number;
                const partTitle = part.partTitle as string;
                const duration = part.duration as number | undefined;
                const phases = (part.phases as Record<string, unknown>[] | undefined) ?? [];
                const isPartOpen = expandedParts.has(pIdx);

                return (
                    <div key={pIdx} className="rounded-xl border border-emerald-200 bg-emerald-50/40 overflow-hidden">
                        {/* Part header */}
                        <button
                            type="button"
                            onClick={() => togglePart(pIdx)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50 transition"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                                    {partNumber}
                                </span>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-emerald-800">{partTitle || `Part ${partNumber}`}</p>
                                    {duration !== undefined && (
                                        <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                            <Clock size={9} />
                                            {duration} phút · {phases.length} phase{phases.length !== 1 ? "s" : ""}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <ChevronRight
                                size={14}
                                className={`text-emerald-400 transition-transform ${isPartOpen ? "rotate-90" : ""}`}
                            />
                        </button>

                        {/* Part body */}
                        {isPartOpen && (
                            <div className="border-t border-emerald-200 divide-y divide-emerald-100">
                                {phases.map((phase, phIdx) => {
                                    const phaseKey = `${pIdx}-${phIdx}`;
                                    const phaseNumber = phase.phaseNumber as number;
                                    const intro = phase.interlocutorIntro as string | null;
                                    const questions = (phase.questions as Record<string, unknown>[] | undefined) ?? [];
                                    const backupPrompts = (phase.backupPrompts as string[] | undefined) ?? [];
                                    const extendedResponse = phase.extendedResponse as Record<string, unknown> | null;
                                    const mediaUrl = phase.mediaUrl as string | null;
                                    const mediaUrls = phase.mediaUrls as string[] | null;
                                    const allowedTime = phase.allowedTime as number | null;
                                    const isPhaseOpen = expandedPhases.has(phaseKey);

                                    return (
                                        <div key={phIdx} className="bg-white">
                                            {/* Phase header */}
                                            <button
                                                type="button"
                                                onClick={() => togglePhase(phaseKey)}
                                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                        {phaseNumber}
                                                    </span>
                                                    <span className="text-xs font-semibold text-gray-600">
                                                        Phase {phaseNumber}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        · {questions.length} câu hỏi
                                                        {allowedTime !== null && allowedTime !== undefined && ` · ${allowedTime} phút`}
                                                    </span>
                                                    {mediaUrl && (
                                                        <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-medium">
                                                            Ảnh
                                                        </span>
                                                    )}
                                                    {mediaUrls && mediaUrls.length > 0 && (
                                                        <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-medium">
                                                            {mediaUrls.length} ảnh
                                                        </span>
                                                    )}
                                                </div>
                                                <ChevronRight
                                                    size={12}
                                                    className={`text-gray-300 transition-transform ${isPhaseOpen ? "rotate-90" : ""}`}
                                                />
                                            </button>

                                            {/* Phase body */}
                                            {isPhaseOpen && (
                                                <div className="px-4 pb-4 space-y-3">
                                                    {/* Interlocutor intro */}
                                                    {intro && (
                                                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                                                                Interlocutor Intro
                                                            </p>
                                                            <p className="text-xs text-gray-700 leading-relaxed italic">"{intro}"</p>
                                                        </div>
                                                    )}

                                                    {/* Media */}
                                                    {mediaUrl && (
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Hình ảnh</p>
                                                            <img
                                                                src={mediaUrl}
                                                                alt="phase media"
                                                                className="rounded-xl border border-gray-200 max-h-52 object-contain"
                                                                onError={e => (e.currentTarget.style.display = "none")}
                                                            />
                                                        </div>
                                                    )}
                                                    {mediaUrls && mediaUrls.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                                                Hình ảnh ({mediaUrls.length})
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {mediaUrls.map((url, uIdx) => (
                                                                    <img
                                                                        key={uIdx}
                                                                        src={url}
                                                                        alt={`media ${uIdx + 1}`}
                                                                        className="rounded-xl border border-gray-200 max-h-40 object-contain"
                                                                        onError={e => (e.currentTarget.style.display = "none")}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Questions */}
                                                    {questions.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                                                Câu hỏi ({questions.length})
                                                            </p>
                                                            <div className="space-y-2">
                                                                {questions.map((q, qIdx) => {
                                                                    const target = q.candidateTarget as string;
                                                                    const qText = q.questionText as string;
                                                                    const qType = q.type as string;
                                                                    const backups = (q.backupQuestions as string[] | undefined) ?? [];
                                                                    return (
                                                                        <div key={qIdx} className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
                                                                            <div className="flex gap-1 shrink-0 mt-0.5">
                                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                                                    target === "both"
                                                                                        ? "bg-purple-100 text-purple-600"
                                                                                        : target === "A"
                                                                                        ? "bg-blue-100 text-blue-600"
                                                                                        : "bg-pink-100 text-pink-600"
                                                                                }`}>
                                                                                    {target}
                                                                                </span>
                                                                                {qType && qType !== "direct" && (
                                                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">
                                                                                        {qType}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm text-gray-800 leading-snug">{qText}</p>
                                                                                {backups.length > 0 && (
                                                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                                                        {backups.map((bq, bIdx) => (
                                                                                            <span key={bIdx} className="text-[10px] text-gray-400 italic bg-gray-50 px-2 py-0.5 rounded">
                                                                                                {bq}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Extended Response */}
                                                    {extendedResponse && (
                                                        <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 space-y-1.5">
                                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Extended Response</p>
                                                            <p className="text-xs text-gray-700 italic">
                                                                "{extendedResponse.prompt as string}"
                                                            </p>
                                                            {(extendedResponse.backupQuestions as string[] | undefined)?.map((bq, bIdx) => (
                                                                <span key={bIdx} className="text-[10px] text-gray-400 italic bg-white px-2 py-0.5 rounded inline-block mr-1">
                                                                    {bq}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Backup Prompts */}
                                                    {backupPrompts.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Backup Prompts</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {backupPrompts.map((bp, bpIdx) => (
                                                                    <span key={bpIdx} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                                        {bp}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function ExamQuestionDetailPage() {
    const { testId, questionId } = useParams<{ testId: string; questionId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Detect mode
    const isNew = questionId === "new" || questionId === undefined;
    // Support editMode shortcut from navigation state
    const locationState = location.state as { partId?: number; section?: string; editMode?: boolean; fromPartId?: number } | null;
    const fromPartId = locationState?.fromPartId ?? null;

    const [mode, setMode] = useState<Mode>(
        isNew ? "create" : locationState?.editMode ? "edit" : "view"
    );

    // Data
    const [test, setTest] = useState<AdminExamTestDto | null>(null);
    const [detail, setDetail] = useState<ExamQuestionDetailDto | null>(null);
    const [form, setForm] = useState<QuestionForm>(
        buildEmptyForm(locationState?.partId, locationState?.section)
    );
    const [originalForm, setOriginalForm] = useState<QuestionForm>(
        buildEmptyForm(locationState?.partId, locationState?.section)
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Tất cả câu hỏi trong cùng part (để resolve passageText/URL)
    const [partSiblings, setPartSiblings] = useState<ExamQuestionDetailDto[]>([]);

    // partId -> { partNumber, paperType }
    const partMap = useCallback((): Map<number, { partNumber: number; paperType: string }> => {
        const map = new Map<number, { partNumber: number; paperType: string }>();
        if (!test) return map;
        for (const paper of test.papers) {
            for (const part of paper.parts ?? []) {
                map.set(part.id, { partNumber: part.partNumber, paperType: paper.paperType });
            }
        }
        return map;
    }, [test]);

    // Parts filtered by selected section
    const filteredParts = useCallback((): Array<{ id: number; partNumber: number; paperType: string }> => {
        if (!test) return [];
        const targetPaper = SECTION_PAPER[form.section];
        const result: Array<{ id: number; partNumber: number; paperType: string }> = [];
        for (const paper of test.papers) {
            if (paper.paperType !== targetPaper) continue;
            for (const part of paper.parts ?? []) {
                result.push({ id: part.id, partNumber: part.partNumber, paperType: paper.paperType });
            }
        }
        return result;
    }, [test, form.section]);

    useEffect(() => {
        if (!testId) return;
        const tid = parseInt(testId, 10);
        if (isNaN(tid)) {
            toast.error("Test ID không hợp lệ");
            navigate("/admin/exam-management");
            return;
        }

        const fetches: Promise<unknown>[] = [examManagementService.getTestDetail(tid)];
        if (!isNew && questionId) {
            fetches.push(examQuestionApi.getDetail(Number(questionId)));
        }

        setLoading(true);
        Promise.all(fetches)
            .then(([testData, qData]) => {
                setTest(testData as AdminExamTestDto);
                if (qData) {
                    const dto = qData as ExamQuestionDetailDto;
                    setDetail(dto);
                    const f = fromApiToForm(dto);
                    setForm(f);
                    setOriginalForm(f);
                    // Load siblings để resolve passageText/URL
                    examQuestionApi.getByPart(dto.partId).then(siblings => {
                        setPartSiblings(siblings);
                    }).catch(() => {});
                }
            })
            .catch(err => {
                const msg = err instanceof Error ? err.message : "Lỗi tải dữ liệu";
                toast.error(msg);
                navigate(`/admin/exam-management/${testId}/questions`);
            })
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testId, questionId]);

    const patchForm = (patch: Partial<QuestionForm>) => {
        setForm(prev => ({ ...prev, ...patch }));
    };

    const handleTypeChange = (newType: string) => {
        setForm(prev => resetTypeSpecificFields({ ...prev, questionType: newType }));
    };

    const handleSectionChange = (newSection: string) => {
        // Reset partId when section changes
        // Auto-switch questionType: SPEAKING → SPEAKING_TASK, others → MULTIPLE_CHOICE
        const newType = newSection === "SPEAKING" ? "SPEAKING_TASK" : "MULTIPLE_CHOICE";
        patchForm(resetTypeSpecificFields({ ...form, section: newSection, partId: "", questionType: newType }));
    };

    const validate = (): string | null => {
        if (form.partId === "") return "Vui lòng chọn Part.";
        if (!form.questionType) return "Vui lòng chọn loại câu hỏi.";
        if (form.questionNumberStart === "") return "Số câu bắt đầu là bắt buộc.";
        if (form.questionNumberEnd === "") return "Số câu kết thúc là bắt buộc.";
        if ((form.questionNumberEnd as number) < (form.questionNumberStart as number)) {
            return "Số câu kết thúc phải >= số câu bắt đầu.";
        }
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) { toast.error(err); return; }

        setSaving(true);
        try {
            const payload = buildSaveRequest(form);
            if (mode === "create") {
                await examQuestionApi.create(payload);
                toast.success("Tạo câu hỏi thành công!");
            } else {
                await examQuestionApi.update(detail!.id, payload);
                toast.success("Cập nhật câu hỏi thành công!");
            }
            // Quay lại đúng part nếu có
            const targetPartId = fromPartId ?? (mode === "create" ? (form.partId !== "" ? form.partId : null) : null);
            if (targetPartId) {
                navigate(`/admin/exam-management/${testId}/questions?partId=${targetPartId}`);
            } else {
                navigate(`/admin/exam-management/${testId}/questions`);
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Lỗi lưu câu hỏi";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!detail) return;
        setDeleting(true);
        try {
            await examQuestionApi.delete(detail.id);
            toast.success("Đã xóa câu hỏi.");
            if (fromPartId) {
                navigate(`/admin/exam-management/${testId}/questions?partId=${fromPartId}`);
            } else {
                navigate(`/admin/exam-management/${testId}/questions`);
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Lỗi xóa câu hỏi";
            toast.error(msg);
            setShowDeleteModal(false);
        } finally {
            setDeleting(false);
        }
    };

    const handleCancelEdit = () => {
        setForm(originalForm);
        setMode("view");
    };

    /** Tính passageText / passageImageUrl để hiển thị:
     *  1. Ưu tiên của câu hỏi hiện tại
     *  2. Câu hỏi đứng trước (order nhỏ hơn, gần nhất)
     *  3. Câu hỏi có order nhỏ nhất trong part có passageText/URL
     */
    type ResolvedField<T extends object> = T & {
        isInherited: boolean;
        sourceQ: { id: number; questionNumberStart: number; questionNumberEnd: number; orderIndex: number } | null;
    };

    const resolvedPassage: ResolvedField<{ passageText: string | null; passageImageUrl: string | null }> = (() => {
        const ownPassageText = form.passageText?.trim() ? form.passageText : null;
        const ownPassageImg = form.passageImageUrl?.trim() ? form.passageImageUrl : null;
        if (ownPassageText || ownPassageImg) {
            return { passageText: ownPassageText, passageImageUrl: ownPassageImg, isInherited: false, sourceQ: null };
        }
        if (partSiblings.length === 0) {
            return { passageText: null, passageImageUrl: null, isInherited: false, sourceQ: null };
        }
        const currentOrder = typeof form.orderIndex === "number" ? form.orderIndex : -1;
        const sorted = [...partSiblings].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        // Tìm câu đứng trước (order < current, gần nhất)
        const before = [...sorted].reverse().find(
            s => (s.orderIndex ?? 0) < currentOrder && (s.passageText?.trim() || s.passageImageUrl?.trim())
        );
        const src = before ?? sorted.find(s => s.passageText?.trim() || s.passageImageUrl?.trim()) ?? null;
        if (src) {
            return {
                passageText: src.passageText?.trim() ? src.passageText : null,
                passageImageUrl: src.passageImageUrl?.trim() ? src.passageImageUrl : null,
                isInherited: true,
                sourceQ: { id: src.id, questionNumberStart: src.questionNumberStart, questionNumberEnd: src.questionNumberEnd, orderIndex: src.orderIndex },
            };
        }
        return { passageText: null, passageImageUrl: null, isInherited: false, sourceQ: null };
    })();

    /** Tính instruction kế thừa tương tự passage */
    const resolvedInstruction: ResolvedField<{ instruction: string | null }> = (() => {
        const own = form.instruction?.trim() ? form.instruction : null;
        if (own) return { instruction: own, isInherited: false, sourceQ: null };
        if (partSiblings.length === 0) return { instruction: null, isInherited: false, sourceQ: null };
        const currentOrder = typeof form.orderIndex === "number" ? form.orderIndex : -1;
        const sorted = [...partSiblings].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        const before = [...sorted].reverse().find(
            s => (s.orderIndex ?? 0) < currentOrder && s.instruction?.trim()
        );
        const src = before ?? sorted.find(s => s.instruction?.trim()) ?? null;
        if (src) {
            return {
                instruction: src.instruction?.trim() ? src.instruction : null,
                isInherited: true,
                sourceQ: { id: src.id, questionNumberStart: src.questionNumberStart, questionNumberEnd: src.questionNumberEnd, orderIndex: src.orderIndex },
            };
        }
        return { instruction: null, isInherited: false, sourceQ: null };
    })();

    const backUrl = fromPartId
        ? `/admin/exam-management/${testId}/questions?partId=${fromPartId}`
        : `/admin/exam-management/${testId}/questions`;

    const qRangeLabel = () => {
        if (isNew) return "Câu hỏi mới";
        const s = form.questionNumberStart;
        const e = form.questionNumberEnd;
        if (s === "" && e === "") return "Câu hỏi";
        if (s === e) return `Câu hỏi Q${s}`;
        return `Câu hỏi Q${s}-${e}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Dang tai...</span>
            </div>
        );
    }

    const parts = filteredParts();
    const pMap = partMap();
    const currentPartInfo = form.partId !== "" ? pMap.get(form.partId as number) : null;

    return (
        <>
            {showDeleteModal && (
                <DeleteModal
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteModal(false)}
                    loading={deleting}
                />
            )}

            <div className="p-6 space-y-6 max-w-screen-xl mx-auto">

                <div>
                    {/* Back button */}
                    <button
                        onClick={() => navigate(backUrl)}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 mb-4 transition-colors"
                    >
                        <ArrowLeft size={15} />
                        {fromPartId ? "Quay lại danh sách Part" : "Quay lại danh sách câu hỏi"}
                    </button>

                    {/* Breadcrumb + actions */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-1.5 flex-wrap">
                                <span className="font-bold text-gray-600">{test?.title ?? `Test #${testId}`}</span>
                                <ChevronRight size={12} />
                                <SectionBadge section={form.section} />
                                <ChevronRight size={12} />
                                <span>{qRangeLabel()}</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-gray-900">{qRangeLabel()}</h1>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                            {mode === "view" && (
                                <>
                                    <button
                                        onClick={() => setMode("edit")}
                                        className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 text-sm transition shadow-sm"
                                    >
                                        <Pencil size={14} />
                                        Chỉnh sửa
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 text-sm transition shadow-sm"
                                    >
                                        <Trash2 size={14} />
                                        Xóa
                                    </button>
                                </>
                            )}
                            {mode === "edit" && (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 text-sm transition shadow-sm disabled:opacity-60"
                                    >
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        Lưu thay đổi
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={saving}
                                        className="flex items-center gap-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 text-sm transition disabled:opacity-60"
                                    >
                                        <X size={14} />
                                        Hủy
                                    </button>
                                </>
                            )}
                            {mode === "create" && (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 text-sm transition shadow-sm disabled:opacity-60"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    Tạo câu hỏi
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 items-start">

                    {/* LEFT — Thông tin chung (sticky sidebar) */}
                    <div className="w-2/5 shrink-0 sticky top-6">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                            <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-3">
                                Thông tin chung
                            </h2>

                            {/* Section + Question Type row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>Section</FieldLabel>
                                    {mode !== "view" ? (
                                        <select
                                            className={inputCls}
                                            value={form.section}
                                            onChange={e => handleSectionChange(e.target.value)}
                                        >
                                            {SECTIONS.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="mt-0.5">
                                            <SectionBadge section={form.section} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <FieldLabel>Loại câu hỏi</FieldLabel>
                                    {mode !== "view" ? (
                                        <select
                                            className={inputCls}
                                            value={form.questionType}
                                            onChange={e => handleTypeChange(e.target.value)}
                                        >
                                            {QUESTION_TYPES.map(qt => (
                                                <option key={qt.value} value={qt.value}>{qt.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="mt-0.5">
                                            <QTypeBadge type={form.questionType} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Part selector */}
                            <div>
                                <FieldLabel>Part (theo section)</FieldLabel>
                                {mode !== "view" ? (
                                    <select
                                        className={inputCls}
                                        value={form.partId}
                                        onChange={e => patchForm({ partId: e.target.value === "" ? "" : Number(e.target.value) })}
                                    >
                                        <option value="">-- Chọn Part --</option>
                                        {parts.map(p => (
                                            <option key={p.id} value={p.id}>
                                                Part {p.partNumber} ({p.paperType.replace("_", " ")})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <ReadonlyBox
                                        value={
                                            currentPartInfo
                                                ? `Part ${currentPartInfo.partNumber} (${currentPartInfo.paperType.replace("_", " ")})`
                                                : String(form.partId)
                                        }
                                    />
                                )}
                            </div>

                            {/* Question numbers + order */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <FieldLabel>Số câu bắt đầu</FieldLabel>
                                    {mode !== "view" ? (
                                        <input
                                            type="number"
                                            className={inputCls}
                                            value={form.questionNumberStart}
                                            onChange={e => patchForm({ questionNumberStart: e.target.value === "" ? "" : Number(e.target.value) })}
                                            placeholder="1"
                                            min={1}
                                        />
                                    ) : (
                                        <ReadonlyBox value={form.questionNumberStart} />
                                    )}
                                </div>
                                <div>
                                    <FieldLabel>Số câu kết thúc</FieldLabel>
                                    {mode !== "view" ? (
                                        <input
                                            type="number"
                                            className={inputCls}
                                            value={form.questionNumberEnd}
                                            onChange={e => patchForm({ questionNumberEnd: e.target.value === "" ? "" : Number(e.target.value) })}
                                            placeholder="1"
                                            min={1}
                                        />
                                    ) : (
                                        <ReadonlyBox value={form.questionNumberEnd} />
                                    )}
                                </div>
                            </div>

                            {/* Order Index */}
                            <div>
                                <FieldLabel>Order Index</FieldLabel>
                                {mode !== "view" ? (
                                    <input
                                        type="number"
                                        className={inputCls}
                                        value={form.orderIndex}
                                        onChange={e => patchForm({ orderIndex: e.target.value === "" ? "" : Number(e.target.value) })}
                                        placeholder="0"
                                        min={0}
                                    />
                                ) : (
                                    <ReadonlyBox value={form.orderIndex} />
                                )}
                            </div>

                            {/* Instruction — ẩn với SPEAKING_TASK (đã nằm trong SpeakingTaskSection) */}
                            {form.questionType !== "SPEAKING_TASK" && (
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <label className={labelCls} style={{ margin: 0 }}>Instruction</label>
                                    {resolvedInstruction.isInherited && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                            Kế thừa
                                        </span>
                                    )}
                                </div>

                                {/* View mode: hiện instruction resolved */}
                                {mode === "view" ? (
                                    resolvedInstruction.instruction ? (
                                        <>
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                <RichText text={resolvedInstruction.instruction} />
                                            </p>
                                            {resolvedInstruction.isInherited && resolvedInstruction.sourceQ && (
                                                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-blue-500 font-medium">
                                                    <span className="text-blue-400">↑</span>
                                                    Lấy từ câu{" "}
                                                    <span className="font-bold">
                                                        Q{resolvedInstruction.sourceQ.questionNumberStart}
                                                        {resolvedInstruction.sourceQ.questionNumberEnd !== resolvedInstruction.sourceQ.questionNumberStart
                                                            ? `–${resolvedInstruction.sourceQ.questionNumberEnd}`
                                                            : ""}
                                                    </span>
                                                    <span className="text-gray-300">·</span>
                                                    <span className="text-gray-400">order {resolvedInstruction.sourceQ.orderIndex}</span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-300 italic">—</p>
                                    )
                                ) : (
                                    /* Edit/Create mode */
                                    <>
                                        <textarea
                                            className={`${inputCls} min-h-[72px] resize-y`}
                                            value={form.instruction}
                                            onChange={e => patchForm({ instruction: e.target.value })}
                                            placeholder="Hướng dẫn cho người làm bài..."
                                        />
                                        {resolvedInstruction.isInherited && resolvedInstruction.sourceQ && (
                                            <div className="mt-2 space-y-1.5">
                                                <div className="flex items-center gap-1.5 text-[10px] text-blue-500 font-medium">
                                                    <span className="text-blue-400">↑</span>
                                                    Đang hiển thị instruction từ câu{" "}
                                                    <span className="font-bold">
                                                        Q{resolvedInstruction.sourceQ.questionNumberStart}
                                                        {resolvedInstruction.sourceQ.questionNumberEnd !== resolvedInstruction.sourceQ.questionNumberStart
                                                            ? `–${resolvedInstruction.sourceQ.questionNumberEnd}`
                                                            : ""}
                                                    </span>
                                                    <span className="text-gray-300">·</span>
                                                    <span className="text-gray-400">order {resolvedInstruction.sourceQ.orderIndex}</span>
                                                </div>
                                                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                                                    <span className="text-amber-500 text-xs leading-none shrink-0 mt-0.5">⚠️</span>
                                                    <p className="text-xs text-amber-700 leading-relaxed">
                                                        <strong>Lưu ý:</strong> Câu hỏi này không có Instruction riêng — đang kế thừa từ câu Q{resolvedInstruction.sourceQ.questionNumberStart}. Nếu bạn nhập Instruction ở đây, chỉ câu hỏi này bị ảnh hưởng. Để thay đổi cho cả Part, hãy sửa câu nguồn.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            )}

                            {/* Correct Answer — ẩn với SPEAKING_TASK / SHORT_WRITE (LLM chấm) */}
                            {form.questionType !== "SPEAKING_TASK" && form.questionType !== "SHORT_WRITE" && (
                            <div>
                                <FieldLabel>Đáp án đúng</FieldLabel>
                                {mode !== "view" ? (
                                    <>
                                        <textarea
                                            className={`${inputCls} min-h-[80px] resize-y font-mono text-xs`}
                                            value={form.correctAnswer}
                                            onChange={e => patchForm({ correctAnswer: e.target.value })}
                                            placeholder='Ví dụ: "B" hoặc {"1":"A","2":"C"}'
                                        />
                                        {QTYPE_HINTS[form.questionType] && (
                                            <p className="mt-1.5 text-xs text-gray-400">
                                                {QTYPE_HINTS[form.questionType]}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <ReadonlyBox
                                        value={form.correctAnswer}
                                        className="font-mono text-xs whitespace-pre-wrap break-all"
                                    />
                                )}
                            </div>
                            )}

                            {/* Với SPEAKING_TASK / SHORT_WRITE — note LLM chấm */}
                            {(form.questionType === "SPEAKING_TASK" || form.questionType === "SHORT_WRITE") && (
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                                    <Mic size={13} className="text-emerald-500 shrink-0" />
                                    <p className="text-xs text-emerald-600 font-medium">
                                        Bài làm được chấm tự động bởi AI — không cần đáp án cứng.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT — Nội dung câu hỏi */}
                    <div className="w-3/5 min-w-0 space-y-4">

                        {/* Passage block (passageText / passageImageUrl) */}
                        {form.questionType === "MULTIPLE_CHOICE" && (resolvedPassage.passageText || resolvedPassage.passageImageUrl) && (
                            <div className={`rounded-2xl border shadow-sm p-5 ${resolvedPassage.isInherited ? "bg-blue-50/40 border-blue-100" : "bg-white border-gray-100"}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">
                                        Passage
                                    </h3>
                                    {resolvedPassage.isInherited && (
                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                                            Kế thừa từ part
                                        </span>
                                    )}
                                </div>
                                {resolvedPassage.passageImageUrl && (
                                    <img
                                        src={resolvedPassage.passageImageUrl}
                                        alt="passage"
                                        className="rounded-xl border border-gray-200 max-h-48 object-contain mb-3"
                                        onError={e => (e.currentTarget.style.display = "none")}
                                    />
                                )}
                                {resolvedPassage.passageText && (
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                        <RichText text={resolvedPassage.passageText} />
                                    </p>
                                )}
                                {/* Source info */}
                                {resolvedPassage.isInherited && resolvedPassage.sourceQ && (
                                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-blue-500 font-medium">
                                        <span className="text-blue-400">↑</span>
                                        Lấy từ câu{" "}
                                        <span className="font-bold">
                                            Q{resolvedPassage.sourceQ.questionNumberStart}
                                            {resolvedPassage.sourceQ.questionNumberEnd !== resolvedPassage.sourceQ.questionNumberStart
                                                ? `–${resolvedPassage.sourceQ.questionNumberEnd}`
                                                : ""}
                                        </span>
                                        <span className="text-gray-300">·</span>
                                        <span className="text-gray-400">order {resolvedPassage.sourceQ.orderIndex}</span>
                                    </div>
                                )}
                                {/* Warning khi edit mà passage là kế thừa */}
                                {resolvedPassage.isInherited && mode !== "view" && resolvedPassage.sourceQ && (
                                    <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                                        <span className="text-amber-500 text-xs leading-none shrink-0 mt-0.5">⚠️</span>
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            <strong>Lưu ý:</strong> Câu hỏi này đang dùng Passage từ câu Q{resolvedPassage.sourceQ.questionNumberStart}. Nếu bạn chỉnh sửa Passage Text / Passage Image URL trong mục bên dưới, thay đổi chỉ ảnh hưởng đến câu hỏi này. Để thay đổi passage chung cho toàn Part, hãy sửa câu Q{resolvedPassage.sourceQ.questionNumberStart} đó.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-3 mb-5">
                                {form.questionType.replace(/_/g, " ")} — Nội dung
                            </h2>

                            {form.questionType === "MULTIPLE_CHOICE" && (
                                <MultipleChoiceSection form={form} mode={mode} onChange={patchForm} partId={form.partId !== "" ? (form.partId as number) : undefined} />
                            )}
                            {form.questionType === "FILL_IN_FORM" && (
                                <FillInFormSection form={form} mode={mode} onChange={patchForm} />
                            )}
                            {form.questionType === "MATCHING" && (
                                <MatchingSection form={form} mode={mode} onChange={patchForm} />
                            )}
                            {form.questionType === "FILL_IN_TEXT" && (
                                <FillInTextSection form={form} mode={mode} onChange={patchForm} />
                            )}
                            {form.questionType === "SHORT_WRITE" && (
                                <ShortWriteSection form={form} mode={mode} onChange={patchForm} partId={form.partId !== "" ? (form.partId as number) : undefined} />
                            )}
                            {form.questionType === "SPEAKING_TASK" && (
                                <SpeakingTaskSection form={form} mode={mode} onChange={patchForm} partId={form.partId !== "" ? (form.partId as number) : undefined} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
