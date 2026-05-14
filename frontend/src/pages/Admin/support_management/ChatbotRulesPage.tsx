import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Bot, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, X, Save, ChevronDown, ChevronUp } from "lucide-react";
import apiClient from "@/config/api";

interface Category {
    id: number;
    displayName: string;
}

interface ChatbotRule {
    id: number;
    ruleName: string;
    keywords: string;
    botResponse: string;
    categoryId: number | null;
    categoryDisplayName: string | null;
    priority: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface RuleForm {
    ruleName: string;
    keywordTags: string[];   
    botResponse: string;
    categoryId: number | null;
    priority: number;
    isActive: boolean;
}

const EMPTY_FORM: RuleForm = {
    ruleName: "",
    keywordTags: [],
    botResponse: "",
    categoryId: null,
    priority: 0,
    isActive: true,
};

/** Convert pipe-separated string → tag array */
const toTags = (s: string) =>
    s.split("|").map((k) => k.trim()).filter(Boolean);

/** Convert tag array → pipe-separated string for API */
const toKeywordString = (tags: string[]) => tags.join("|");

type ApiResponse<T> = { success: boolean; message: string; data: T };

const api = {
    getRules: () =>
        apiClient.get<ApiResponse<ChatbotRule[]>>("/admin/chatbot/rules").then((r) => r.data.data),
    createRule: (body: { ruleName: string; keywords: string; botResponse: string; categoryId: number | null; priority: number; isActive: boolean }) =>
        apiClient.post<ApiResponse<ChatbotRule>>("/admin/chatbot/rules", body).then((r) => r.data.data),
    updateRule: (id: number, body: { ruleName: string; keywords: string; botResponse: string; categoryId: number | null; priority: number; isActive: boolean }) =>
        apiClient.put<ApiResponse<ChatbotRule>>(`/admin/chatbot/rules/${id}`, body).then((r) => r.data.data),
    deleteRule: (id: number) =>
        apiClient.delete(`/admin/chatbot/rules/${id}`),
    toggleRule: (id: number) =>
        apiClient.patch<ApiResponse<ChatbotRule>>(`/admin/chatbot/rules/${id}/toggle`).then((r) => r.data.data),
    getCategories: () =>
        apiClient.get<ApiResponse<Category[]>>("/public/support/categories").then((r) => r.data.data),
};

interface KeywordChipInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
}

function KeywordChipInput({ tags, onChange }: KeywordChipInputProps) {
    const [inputVal, setInputVal] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const addTag = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) return;
        // Cho phép nhập nhiều keyword cùng lúc phân cách bởi |
        const newTags = trimmed.split("|").map((k) => k.trim()).filter(Boolean);
        const unique = newTags.filter((t) => !tags.includes(t));
        if (unique.length) onChange([...tags, ...unique]);
        setInputVal("");
    };

    const removeTag = (idx: number) => {
        onChange(tags.filter((_, i) => i !== idx));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === "|") {
            e.preventDefault();
            addTag(inputVal);
        } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
            // Xóa tag cuối khi Backspace và input rỗng
            onChange(tags.slice(0, -1));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Nếu user gõ | thì tự động tách thành tag
        if (val.includes("|")) {
            const parts = val.split("|");
            // Phần cuối còn lại trong input
            const last = parts.pop() ?? "";
            parts.forEach((p) => addTag(p));
            setInputVal(last);
        } else {
            setInputVal(val);
        }
    };

    const handleBlur = () => {
        if (inputVal.trim()) addTag(inputVal);
    };

    return (
        <div
            className="flex flex-wrap gap-1.5 min-h-[44px] w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-orange-300 focus-within:bg-white transition cursor-text"
            onClick={() => inputRef.current?.focus()}
        >
            {tags.map((tag, idx) => (
                <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 border border-orange-200 rounded-full pl-2.5 pr-1.5 py-0.5 text-xs font-semibold"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeTag(idx); }}
                        className="w-3.5 h-3.5 rounded-full bg-orange-200 hover:bg-orange-300 flex items-center justify-center transition"
                    >
                        <X className="w-2 h-2 text-orange-700" />
                    </button>
                </span>
            ))}
            <input
                ref={inputRef}
                value={inputVal}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={tags.length === 0 ? "Nhập keyword rồi nhấn Enter hoặc |..." : ""}
                className="flex-1 min-w-[120px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
        </div>
    );
}

function KeywordBadge({ keyword }: { keyword: string }) {
    return (
        <span className="inline-block bg-orange-50 text-orange-700 border border-orange-100 rounded-full px-2 py-0.5 text-[11px] font-medium">
            {keyword.trim()}
        </span>
    );
}

/** Hiện tối đa 4 keyword, hover vào "+N nữa" để thấy tất cả */
function KeywordsWithTooltip({ keywords }: { keywords: string }) {
    const [show, setShow] = useState(false);
    const tags = keywords.split("|").map((k) => k.trim()).filter(Boolean);
    const visible = tags.slice(0, 4);
    const hidden  = tags.slice(4);

    return (
        <div className="flex flex-wrap gap-1 mt-1.5 items-center">
            {visible.map((k, i) => <KeywordBadge key={i} keyword={k} />)}
            {hidden.length > 0 && (
                <div className="relative">
                    <span
                        className="text-[11px] text-gray-400 cursor-pointer hover:text-orange-600 transition"
                        onMouseEnter={() => setShow(true)}
                        onMouseLeave={() => setShow(false)}
                    >
                        +{hidden.length}
                    </span>
                    {show && (
                        <div className="absolute bottom-full left-0 mb-1.5 z-20 bg-white border border-gray-100 rounded-2xl shadow-lg px-3 py-2.5 flex flex-wrap gap-1.5 w-max max-w-xs">
                            {hidden.map((k, i) => <KeywordBadge key={i} keyword={k} />)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Bật
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Tắt
        </span>
    );
}

interface RuleModalProps {
    rule: ChatbotRule | null;
    categories: Category[];
    onClose: () => void;
    onSaved: (rule: ChatbotRule) => void;
}

function RuleModal({ rule, categories, onClose, onSaved }: RuleModalProps) {
    const isEdit = rule !== null;
    const [form, setForm] = useState<RuleForm>(
        isEdit
            ? {
                  ruleName:    rule.ruleName,
                  keywordTags: toTags(rule.keywords),
                  botResponse: rule.botResponse,
                  categoryId:  rule.categoryId,
                  priority:    rule.priority,
                  isActive:    rule.isActive,
              }
            : { ...EMPTY_FORM },
    );
    const [saving, setSaving] = useState(false);

    const set = <K extends keyof RuleForm>(key: K, value: RuleForm[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.ruleName.trim()) { toast.error("Vui lòng nhập tên rule"); return; }
        if (form.keywordTags.length === 0) { toast.error("Vui lòng nhập ít nhất 1 keyword"); return; }
        if (!form.botResponse.trim()) { toast.error("Vui lòng nhập câu trả lời"); return; }
        try {
            setSaving(true);
            const payload = {
                ruleName:    form.ruleName.trim(),
                keywords:    toKeywordString(form.keywordTags),
                botResponse: form.botResponse.trim(),
                categoryId:  form.categoryId,
                priority:    form.priority,
                isActive:    form.isActive,
            };
            const saved = isEdit
                ? await api.updateRule(rule!.id, payload)
                : await api.createRule(payload);
            onSaved(saved);
            toast.success(isEdit ? "Đã cập nhật rule" : "Đã tạo rule mới");
        } catch {
            toast.error("Không thể lưu rule");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-primary-600" />
                        <h2 className="text-base font-bold text-gray-900">
                            {isEdit ? "Chỉnh sửa rule" : "Tạo rule mới"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={(e) => void handleSubmit(e)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    {/* Rule name */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tên rule *</label>
                        <input
                            value={form.ruleName}
                            onChange={(e) => set("ruleName", e.target.value)}
                            placeholder="vd: Quên mật khẩu"
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition"
                        />
                    </div>

                    {/* Keywords — chip input */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Keywords *
                            <span className="ml-1.5 font-normal text-gray-400">
                                Nhấn <kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 text-[10px]">Enter</kbd> hoặc{" "}
                                <kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 text-[10px]">|</kbd> để thêm
                            </span>
                        </label>
                        <KeywordChipInput
                            tags={form.keywordTags}
                            onChange={(tags) => set("keywordTags", tags)}
                        />
                        {form.keywordTags.length > 0 && (
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                {form.keywordTags.length} keyword · lưu dạng: <code className="bg-gray-100 px-1 rounded text-[10px]">{toKeywordString(form.keywordTags)}</code>
                            </p>
                        )}
                    </div>

                    {/* Bot response */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Câu trả lời tự động *</label>
                        <textarea
                            value={form.botResponse}
                            onChange={(e) => set("botResponse", e.target.value)}
                            placeholder="Nhập nội dung bot sẽ trả lời khi khớp keyword..."
                            rows={4}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition resize-none"
                        />
                    </div>

                    {/* Category + Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                            <select
                                value={form.categoryId ?? ""}
                                onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition"
                            >
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.displayName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Priority</label>
                            <input
                                type="number"
                                value={form.priority}
                                onChange={(e) => set("priority", Number(e.target.value))}
                                min={0}
                                max={100}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Cao hơn = ưu tiên hơn</p>
                        </div>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-700">Kích hoạt rule</p>
                            <p className="text-xs text-gray-400">Rule tắt sẽ không được dùng để match</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => set("isActive", !form.isActive)}
                            className="shrink-0"
                        >
                            {form.isActive
                                ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                                : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isEdit ? "Lưu thay đổi" : "Tạo rule"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ChatbotRulesPage() {
    const [rules, setRules]           = useState<ChatbotRule[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading]   = useState(true);
    const [modalRule, setModalRule]   = useState<ChatbotRule | null | undefined>(undefined); // undefined=closed, null=create, ChatbotRule=edit
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
    const [filterCategory, setFilterCategory] = useState<number | "all">("all");

    useEffect(() => {
        Promise.all([api.getRules(), api.getCategories()])
            .then(([r, c]) => { setRules(r); setCategories(c); })
            .catch(() => toast.error("Không tải được dữ liệu"))
            .finally(() => setIsLoading(false));
    }, []);

    const filteredRules = rules.filter((r) => {
        const matchActive =
            filterActive === "all" ||
            (filterActive === "active" && r.isActive) ||
            (filterActive === "inactive" && !r.isActive);
        const matchCat =
            filterCategory === "all" ||
            (filterCategory === null && r.categoryId === null) ||
            r.categoryId === filterCategory;
        return matchActive && matchCat;
    });

    const handleSaved = (saved: ChatbotRule) => {
        setRules((prev) => {
            const exists = prev.find((r) => r.id === saved.id);
            return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev];
        });
        setModalRule(undefined);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Xóa rule này?")) return;
        try {
            setDeletingId(id);
            await api.deleteRule(id);
            setRules((prev) => prev.filter((r) => r.id !== id));
            toast.success("Đã xóa rule");
        } catch {
            toast.error("Không thể xóa rule");
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            setTogglingId(id);
            const updated = await api.toggleRule(id);
            setRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
        } catch {
            toast.error("Không thể cập nhật trạng thái");
        } finally {
            setTogglingId(null);
        }
    };

    const activeCount   = rules.filter((r) => r.isActive).length;
    const inactiveCount = rules.filter((r) => !r.isActive).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">Chatbot Rules</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Quản lý keyword matching — bot tự động trả lời khi user nhắn đúng từ khóa
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setModalRule(null)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Thêm rule
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Tổng rule",  value: rules.length,  color: "text-gray-900",    bg: "bg-gray-50"     },
                    { label: "Đang bật",   value: activeCount,   color: "text-emerald-700", bg: "bg-emerald-50"  },
                    { label: "Đang tắt",   value: inactiveCount, color: "text-gray-500",    bg: "bg-gray-100"    },
                ].map((s) => (
                    <div key={s.label} className={`${s.bg} rounded-2xl px-5 py-4`}>
                        <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                        <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Active filter */}
                {(["all", "active", "inactive"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilterActive(f)}
                        className={[
                            "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                            filterActive === f
                                ? "bg-primary-600 text-white shadow-sm"
                                : "bg-gray-100 text-slate-600 hover:bg-gray-200",
                        ].join(" ")}
                    >
                        {f === "all" ? "Tất cả" : f === "active" ? "Đang bật" : "Đang tắt"}
                    </button>
                ))}
                <div className="w-px h-4 bg-gray-200 mx-1" />
                {/* Category filter */}
                <button
                    onClick={() => setFilterCategory("all")}
                    className={[
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                        filterCategory === "all"
                            ? "bg-orange-500 text-white shadow-sm"
                            : "bg-gray-100 text-slate-600 hover:bg-gray-200",
                    ].join(" ")}
                >
                    Tất cả category
                </button>
                <button
                    onClick={() => setFilterCategory(null as unknown as number)}
                    className={[
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                        filterCategory === null
                            ? "bg-orange-500 text-white shadow-sm"
                            : "bg-gray-100 text-slate-600 hover:bg-gray-200",
                    ].join(" ")}
                >
                   General 
                </button>
                {categories.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => setFilterCategory(c.id)}
                        className={[
                            "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                            filterCategory === c.id
                                ? "bg-orange-500 text-white shadow-sm"
                                : "bg-gray-100 text-slate-600 hover:bg-gray-200",
                        ].join(" ")}
                    >
                        {c.displayName}
                    </button>
                ))}
            </div>

            {/* Rules list */}
            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
            ) : filteredRules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                    <Bot className="w-10 h-10" />
                    <p className="text-sm">Không có rule nào</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredRules.map((rule) => {
                        const isExpanded = expandedId === rule.id;
                        return (
                            <div
                                key={rule.id}
                                className={`bg-white rounded-3xl border transition-all ${rule.isActive ? "border-gray-100" : "border-gray-100 opacity-60"} shadow-sm`}
                            >
                                {/* Rule header row */}
                                <div className="flex items-center gap-3 px-5 py-4">
                                    {/* Priority badge */}
                                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-bold text-orange-600">{rule.priority}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-bold text-gray-900">{rule.ruleName}</p>
                                            <StatusBadge active={rule.isActive} />
                                            {rule.categoryDisplayName ? (
                                                <span className="bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                                                    {rule.categoryDisplayName}
                                                </span>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                                                    General
                                                </span>
                                            )}
                                        </div>
                                        {/* Keywords preview với tooltip */}
                                        <KeywordsWithTooltip keywords={rule.keywords} />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {/* Toggle */}
                                        <button
                                            onClick={() => void handleToggle(rule.id)}
                                            disabled={togglingId === rule.id}
                                            title={rule.isActive ? "Tắt rule" : "Bật rule"}
                                            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 disabled:opacity-50"
                                        >
                                            {togglingId === rule.id
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : rule.isActive
                                                    ? <ToggleRight className="w-4 h-4 text-emerald-500" />
                                                    : <ToggleLeft className="w-4 h-4" />}
                                        </button>
                                        {/* Edit */}
                                        <button
                                            onClick={() => setModalRule(rule)}
                                            title="Chỉnh sửa"
                                            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        {/* Delete */}
                                        <button
                                            onClick={() => void handleDelete(rule.id)}
                                            disabled={deletingId === rule.id}
                                            title="Xóa"
                                            className="p-2 rounded-xl hover:bg-red-50 transition text-gray-400 hover:text-red-500 disabled:opacity-50"
                                        >
                                            {deletingId === rule.id
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Trash2 className="w-4 h-4" />}
                                        </button>
                                        {/* Expand */}
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                                            title="Xem câu trả lời"
                                            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400"
                                        >
                                            {isExpanded
                                                ? <ChevronUp className="w-4 h-4" />
                                                : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded: bot response */}
                                {isExpanded && (
                                    <div className="px-5 pb-4 border-t border-gray-50 pt-3">
                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                            Câu trả lời tự động
                                        </p>
                                        <div className="bg-primary-50 border border-primary-100 rounded-2xl px-4 py-3 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                            {rule.botResponse}
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-2">
                                            Cập nhật: {rule.updatedAt ? new Date(rule.updatedAt).toLocaleString("vi-VN") : "—"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {modalRule !== undefined && (
                <RuleModal
                    rule={modalRule}
                    categories={categories}
                    onClose={() => setModalRule(undefined)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
