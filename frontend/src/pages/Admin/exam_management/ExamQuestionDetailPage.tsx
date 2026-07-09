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
}

const QUESTION_TYPES = [
    { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
    { value: "FILL_IN_FORM", label: "Fill in Form" },
    { value: "MATCHING", label: "Matching" },
    { value: "FILL_IN_TEXT", label: "Fill in Text" },
    { value: "SHORT_WRITE", label: "Short Write" },
];

const SECTIONS = [
    { value: "LISTENING", label: "Listening" },
    { value: "READING_WRITING", label: "Reading & Writing" },
];

const WRITE_TYPES = [
    { value: "EMAIL", label: "Email" },
    { value: "STORY", label: "Story" },
];

const SECTION_PAPER: Record<string, string> = {
    LISTENING: "LISTENING",
    READING_WRITING: "READING_WRITING",
};

const SECTION_BADGE: Record<string, string> = {
    LISTENING: "bg-blue-50 text-blue-600",
    READING_WRITING: "bg-purple-50 text-purple-600",
};

const QTYPE_BADGE: Record<string, string> = {
    MULTIPLE_CHOICE: "bg-sky-100 text-sky-700",
    FILL_IN_FORM: "bg-amber-100 text-amber-700",
    FILL_IN_TEXT: "bg-amber-100 text-amber-700",
    MATCHING: "bg-teal-100 text-teal-700",
    SHORT_WRITE: "bg-pink-100 text-pink-700",
};

const QTYPE_HINTS: Record<string, string> = {
    MULTIPLE_CHOICE: 'Ví dụ: "B" hoặc JSON array ["A","B"]',
    FILL_IN_FORM: 'Ví dụ: {"1":"answer","2":"answer"} hoặc 25:["a","b"]26:["c"]',
    MATCHING: 'Ví dụ: {"1":"D","2":"A","3":"C"}',
    FILL_IN_TEXT: 'Ví dụ: ["word1","word2"]',
    SHORT_WRITE: "Không bắt buộc với dạng viết",
};

function buildEmptyForm(partId?: number, section?: string): QuestionForm {
    return {
        partId: partId ?? "",
        questionType: "MULTIPLE_CHOICE",
        questionNumberStart: "",
        questionNumberEnd: "",
        correctAnswer: "",
        orderIndex: "",
        section: section ?? "LISTENING",
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
    const label = section === "LISTENING" ? "Listening" : "Reading & Writing";
    const Icon = section === "LISTENING" ? Headphones : BookOpen;
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
                    Bạn có chắc muốn xóa câi hỏi này? Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
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

// MULTIPLE_CHOICE
function MultipleChoiceSection({
    form,
    mode,
    onChange,
}: {
    form: QuestionForm;
    mode: Mode;
    onChange: (patch: Partial<QuestionForm>) => void;
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
                    <ReadonlyBox value={form.text} />
                )}
            </div>

            {/* Passage Image URL */}
            <div>
                <FieldLabel>Passage Image URL</FieldLabel>
                {isEdit ? (
                    <input
                        type="text"
                        className={inputCls}
                        value={form.passageImageUrl}
                        onChange={e => onChange({ passageImageUrl: e.target.value })}
                        placeholder="https://..."
                    />
                ) : (
                    <ReadonlyBox value={form.passageImageUrl} />
                )}
                {form.passageImageUrl && (
                    <img
                        src={form.passageImageUrl}
                        alt="passage"
                        className="mt-2 rounded-xl border border-gray-200 max-h-48 object-contain"
                        onError={e => (e.currentTarget.style.display = "none")}
                    />
                )}
            </div>

            {/* Passage Text */}
            <div>
                <FieldLabel>Passage Text</FieldLabel>
                {isEdit ? (
                    <textarea
                        className={`${inputCls} min-h-[120px] resize-y font-mono text-xs`}
                        value={form.passageText}
                        onChange={e => onChange({ passageText: e.target.value })}
                        placeholder=" Nội dung passage (có thể dùng markdown)..."
                    />
                ) : (
                    <ReadonlyBox value={form.passageText} className="whitespace-pre-wrap min-h-[80px] font-mono text-xs" />
                )}
            </div>

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
                    {form.options.map((opt, idx) => (
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
                                    <span className="text-sm text-gray-800 flex-1">{opt.text}</span>
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
                                <input
                                    type="text"
                                    className={inputCls}
                                    value={opt.image_url ?? ""}
                                    onChange={e => updateOption(idx, { image_url: e.target.value || null })}
                                    placeholder="Image URL (tùy chọn)..."
                                />
                            ) : null}
                            {opt.image_url && (
                                <img
                                    src={opt.image_url}
                                    alt={`option ${opt.id}`}
                                    className="rounded-lg border border-gray-200 max-h-32 object-contain mt-1"
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
                        placeholder="Tieu de form..."
                    />
                ) : (
                    <ReadonlyBox value={form.formTitle} />
                )}
            </div>

            {/* Form Content */}
            <div>
                <FieldLabel>Form Content (dung ____ cho cho trong)</FieldLabel>
                {isEdit ? (
                    <textarea
                        className={`${inputCls} min-h-[140px] resize-y font-mono text-xs`}
                        value={form.formContent}
                        onChange={e => onChange({ formContent: e.target.value })}
                        placeholder="Noi dung form voi ____ la cho trong..."
                    />
                ) : (
                    <ReadonlyBox value={form.formContent} className="whitespace-pre-wrap min-h-[80px] font-mono text-xs" />
                )}
            </div>

            {/* Blanks Options */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <FieldLabel>Cac lua chon cho trong</FieldLabel>
                    {isEdit && (
                        <button
                            type="button"
                            onClick={addBlank}
                            className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600"
                        >
                            <Plus size={13} /> Them cho trong
                        </button>
                    )}
                </div>
                <div className="space-y-3">
                    {form.blanksOptions.length === 0 && (
                        <p className="text-xs text-gray-300 italic">Chua co cho trong nao.</p>
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
                                            <span className="text-sm text-gray-800">{opt}</span>
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
                                        <Plus size={11} /> Them
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
                        placeholder="Huong dan chi tiet..."
                    />
                ) : (
                    <ReadonlyBox value={form.instructionDetail} />
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
                            <p className="text-xs text-gray-300 italic">Trong.</p>
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
                                        <span className="text-sm text-gray-800 flex-1">{item.label}</span>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Items */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <FieldLabel>Right Items (dap an)</FieldLabel>
                        {isEdit && (
                            <button
                                type="button"
                                onClick={addRight}
                                className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600"
                            >
                                <Plus size={11} /> Them
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {form.rightItems.length === 0 && (
                            <p className="text-xs text-gray-300 italic">Trong.</p>
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
                                        <span className="text-sm text-gray-800 flex-1">{item.label}</span>
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
            <FieldLabel>Sentence (dung ____ cho cho trong)</FieldLabel>
            {isEdit ? (
                <textarea
                    className={`${inputCls} min-h-[100px] resize-y`}
                    value={form.sentence}
                    onChange={e => onChange({ sentence: e.target.value })}
                    placeholder="Vi du: The train leaves ____ ten minutes."
                />
            ) : (
                <ReadonlyBox value={form.sentence} className="whitespace-pre-wrap" />
            )}
            {form.sentence && (
                <p className="mt-1.5 text-xs text-gray-400">
                    So cho trong:{" "}
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
}: {
    form: QuestionForm;
    mode: Mode;
    onChange: (patch: Partial<QuestionForm>) => void;
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
                        placeholder="Yeu cau bai viet..."
                    />
                ) : (
                    <ReadonlyBox value={form.promptText} className="whitespace-pre-wrap" />
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
                            <Plus size={13} /> Them
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {form.bulletPoints.length === 0 && (
                        <p className="text-xs text-gray-300 italic">Chua co bullet point nao.</p>
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
                                <span className="text-sm text-gray-700 flex-1">{bp}</span>
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
                            <Plus size={13} /> Them anh
                        </button>
                    )}
                </div>
                <div className="space-y-3">
                    {form.storyImages.length === 0 && (
                        <p className="text-xs text-gray-300 italic">Chua co anh nao.</p>
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
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={img.image_url}
                                        onChange={e => updateImage(idx, { image_url: e.target.value })}
                                        placeholder="Image URL..."
                                    />
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={img.alt ?? ""}
                                        onChange={e => updateImage(idx, { alt: e.target.value })}
                                        placeholder="Alt text (tuy chon)..."
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

export default function ExamQuestionDetailPage() {
    const { testId, questionId } = useParams<{ testId: string; questionId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Detect mode
    const isNew = questionId === "new" || questionId === undefined;
    // Support editMode shortcut from navigation state
    const locationState = location.state as { partId?: number; section?: string; editMode?: boolean } | null;
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
            toast.error("Test ID khong hop le");
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
                }
            })
            .catch(err => {
                const msg = err instanceof Error ? err.message : "Loi tai du lieu";
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
        patchForm({ section: newSection, partId: "" });
    };

    const validate = (): string | null => {
        if (form.partId === "") return "Vui long chon Part.";
        if (!form.questionType) return "Vui long chon loai cau hoi.";
        if (form.questionNumberStart === "") return "So cau bat dau la bat buoc.";
        if (form.questionNumberEnd === "") return "So cau ket thuc la bat buoc.";
        if ((form.questionNumberEnd as number) < (form.questionNumberStart as number)) {
            return "So cau ket thuc phai >= so cau bat dau.";
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
                toast.success("Tao cau hoi thanh cong!");
            } else {
                await examQuestionApi.update(detail!.id, payload);
                toast.success("Cap nhat cau hoi thanh cong!");
            }
            navigate(`/admin/exam-management/${testId}/questions`);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Loi luu cau hoi";
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
            toast.success("Da xoa cau hoi.");
            navigate(`/admin/exam-management/${testId}/questions`);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Loi xoa cau hoi";
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

    const qRangeLabel = () => {
        if (isNew) return "Cau hoi moi";
        const s = form.questionNumberStart;
        const e = form.questionNumberEnd;
        if (s === "" && e === "") return "Cau hoi";
        if (s === e) return `Cau hoi Q${s}`;
        return `Cau hoi Q${s}-${e}`;
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
                        onClick={() => navigate(`/admin/exam-management/${testId}/questions`)}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 mb-4 transition-colors"
                    >
                        <ArrowLeft size={15} />
                        Quay lại danh sách câu hỏi
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

                    {/* — Question Content */}
                    <div className="flex-1 min-w-0 space-y-5">

                        {/* Common fields card */}
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

                            {/* Question numbers + order */}
                            <div className="grid grid-cols-3 gap-4">
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
                            </div>

                            {/* Instruction */}
                            <div>
                                <FieldLabel>Instruction</FieldLabel>
                                {mode !== "view" ? (
                                    <textarea
                                        className={`${inputCls} min-h-[72px] resize-y`}
                                        value={form.instruction}
                                        onChange={e => patchForm({ instruction: e.target.value })}
                                        placeholder="Hướng dẫn cho người làm bài..."
                                    />
                                ) : (
                                    <ReadonlyBox value={form.instruction} className="whitespace-pre-wrap" />
                                )}
                            </div>
                        </div>

                        {/* Type-specific card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-3 mb-5">
                                {form.questionType.replace(/_/g, " ")} — Nội dung
                            </h2>

                            {form.questionType === "MULTIPLE_CHOICE" && (
                                <MultipleChoiceSection form={form} mode={mode} onChange={patchForm} />
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
                                <ShortWriteSection form={form} mode={mode} onChange={patchForm} />
                            )}
                        </div>
                    </div>

                    {/* Answer*/}
                    <div className="w-80 shrink-0 space-y-5">

                        {/* Part selector */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h2 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4">
                                Part
                            </h2>
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
                        </div>

                        {/* Correct Answer */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h2 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4">
                                Đáp án đúng
                            </h2>
                            <div>
                                <FieldLabel>Correct Answer</FieldLabel>
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
                        </div>

                        {/* Meta info (view/edit only) */}
                        {detail && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                                <h2 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-3">
                                    Meta
                                </h2>
                                <div>
                                    <FieldLabel>Created At</FieldLabel>
                                    <ReadonlyBox
                                        value={
                                            detail.createdAt
                                                ? new Date(detail.createdAt).toLocaleString("vi-VN")
                                                : "—"
                                        }
                                    />
                                </div>
                                <div>
                                    <FieldLabel>MongoDB Doc ID</FieldLabel>
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-400 font-mono break-all">
                                        {detail.mongoDocId}
                                    </div>
                                </div>
                                <div>
                                    <FieldLabel>MySQL ID</FieldLabel>
                                    <ReadonlyBox value={detail.id} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
