import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
    HelpCircle, Loader2, Eye, Pencil, Trash2, Plus,
    ChevronLeft, ChevronRight, X, Save, ToggleLeft, ToggleRight,
} from "lucide-react";
import AdminStatCard from "@/components/admin/common/AdminStatCard";
import ConfirmModal from "@/components/user/layout/ConfirmModal";
import apiClient from "@/config/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FaqItem {
    id: number;
    question: string;
    answer: string[];
    displayOrder: number;
    status: "ACTIVE" | "INACTIVE";
    updatedAt: string;
}

interface FaqForm {
    question: string;
    answer: string;        // raw text, dòng ngăn cách \n
    displayOrder: number;
    isActive: boolean;
}

type ApiResponse<T> = { success: boolean; message: string; data: T };

const PAGE_SIZE = 10;
const EMPTY_FORM: FaqForm = { question: "", answer: "", displayOrder: 1, isActive: true };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "ACTIVE" | "INACTIVE" }) {
    return status === "ACTIVE" ? (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Inactive
        </span>
    );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ faq, onClose }: { faq: FaqItem; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-primary-600" />
                        <h2 className="text-base font-bold text-gray-900">Chi tiết FAQ #{faq.id}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400">Thứ tự: {faq.displayOrder}</span>
                        <StatusBadge status={faq.status} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Câu hỏi</p>
                        <p className="text-sm font-bold text-gray-900">{faq.question}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Câu trả lời</p>
                        <ul className="space-y-1.5">
                            {faq.answer.map((line, i) => (
                                <li key={i} className="flex gap-2 text-sm text-slate-600">
                                    <span className="text-orange-400 shrink-0">•</span><span>{line}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {faq.updatedAt && <p className="text-xs text-gray-400">Cập nhật lúc: {faq.updatedAt}</p>}
                </div>
                <div className="flex justify-end px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-5 py-2 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition">Đóng</button>
                </div>
            </div>
        </div>
    );
}

// ─── Edit/Create Modal ────────────────────────────────────────────────────────
function FaqModal({
    faq,
    onClose,
    onSaved,
}: {
    faq: FaqItem | null;   // null = tạo mới
    onClose: () => void;
    onSaved: (saved: FaqItem) => void;
}) {
    const isEdit = faq !== null;

    const [form, setForm] = useState<FaqForm>(
        isEdit
            ? {
                question:     faq.question,
                answer:       faq.answer.join("\n"),
                displayOrder: faq.displayOrder,
                isActive:     faq.status === "ACTIVE",
              }
            : { ...EMPTY_FORM },
    );
    const [saving, setSaving] = useState(false);

    const set = <K extends keyof FaqForm>(key: K, val: FaqForm[K]) =>
        setForm(prev => ({ ...prev, [key]: val }));

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.question.trim()) { toast.error("Vui lòng nhập câu hỏi"); return; }
        if (!form.answer.trim())   { toast.error("Vui lòng nhập câu trả lời"); return; }

        try {
            setSaving(true);
            const payload = {
                question:     form.question.trim(),
                answer:       form.answer.trim(),
                displayOrder: form.displayOrder,
                status:       form.isActive ? "ACTIVE" : "INACTIVE",
            };
            const res = isEdit
                ? await apiClient.put<ApiResponse<FaqItem>>(`/admin/faq/${faq!.id}`, payload)
                : await apiClient.post<ApiResponse<FaqItem>>("/admin/faq", payload);
            onSaved(res.data.data);
            toast.success(isEdit ? "Đã cập nhật FAQ" : "Đã tạo FAQ mới");
        } catch {
            toast.error("Không thể lưu FAQ");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-base font-bold text-gray-900">
                        {isEdit ? "Sửa câu hỏi FAQ" : "Thêm/Sửa câu hỏi FAQ"}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={e => void handleSubmit(e)} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* Câu hỏi */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Câu hỏi <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={form.question}
                            onChange={e => set("question", e.target.value)}
                            placeholder="Nhập tiêu đề câu hỏi..."
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition"
                        />
                    </div>

                    {/* Câu trả lời + toolbar */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Câu trả lời <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.answer}
                            onChange={e => set("answer", e.target.value)}
                            placeholder="Nhập nội dung câu trả lời chi tiết tại đây..."
                            rows={4}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition resize-none"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">Mỗi dòng = 1 bullet khi hiển thị</p>
                    </div>

                    {/* Thứ tự + Toggle */}
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Thứ tự hiển thị</label>
                            <input
                                type="number"
                                min={1}
                                value={form.displayOrder}
                                onChange={e => set("displayOrder", Number(e.target.value))}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition"
                            />
                        </div>
                        <div className="flex items-center justify-between flex-1 bg-gray-50 rounded-2xl px-4 py-3">
                            <div>
                                <p className="text-xs font-semibold text-gray-700">Trạng thái</p>
                                <p className="text-[11px] text-gray-400">Công khai câu hỏi</p>
                            </div>
                            <button type="button" onClick={() => set("isActive", !form.isActive)} className="shrink-0">
                                {form.isActive
                                    ? <ToggleRight className="w-8 h-8 text-primary-600" />
                                    : <ToggleLeft  className="w-8 h-8 text-gray-300" />}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
                        Hủy
                    </button>
                    <button
                        onClick={e => void handleSubmit(e as unknown as React.FormEvent)}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FaqManagementPage() {
    const [faqs, setFaqs]           = useState<FaqItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewFaq, setViewFaq]     = useState<FaqItem | null>(null);
    // undefined=closed | null=create | FaqItem=edit
    const [modalFaq, setModalFaq]   = useState<FaqItem | null | undefined>(undefined);
    const [filterStatus, setFilterStatus] = useState<"all" | "ACTIVE" | "INACTIVE">("all");
    const [search, setSearch]       = useState("");
    const [page, setPage]           = useState(1);
    const [faqToDelete, setFaqToDelete] = useState<FaqItem | null>(null);
    const [isDeleting, setIsDeleting]   = useState(false);

    const loadFaqs = () => {
        setIsLoading(true);
        apiClient.get<ApiResponse<FaqItem[]>>("/admin/faq")
            .then(res => setFaqs(res.data.data ?? []))
            .catch(() => toast.error("Không tải được danh sách FAQ"))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => { loadFaqs(); }, []);
    useEffect(() => { setPage(1); }, [filterStatus, search]);

    const handleSaved = (saved: FaqItem) => {
        setFaqs(prev => {
            const exists = prev.find(f => f.id === saved.id);
            return exists ? prev.map(f => f.id === saved.id ? saved : f) : [saved, ...prev];
        });
        setModalFaq(undefined);
    };

    const handleDeleteFaq = async () => {
        if (!faqToDelete) return;
        try {
            setIsDeleting(true);
            await apiClient.delete<ApiResponse<null>>(`/admin/faq/${faqToDelete.id}`);
            setFaqs(prev => prev.filter(f => f.id !== faqToDelete.id));
            if (viewFaq?.id === faqToDelete.id) setViewFaq(null);
            if (modalFaq?.id === faqToDelete.id) setModalFaq(undefined);
            toast.success("Đã xóa FAQ");
            setFaqToDelete(null);
        } catch {
            toast.error("Không thể xóa FAQ");
        } finally {
            setIsDeleting(false);
        }
    };

    const filtered = faqs.filter(f => {
        const matchStatus = filterStatus === "all" || f.status === filterStatus;
        const matchSearch = !search.trim() || f.question.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    const totalPages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage      = Math.min(page, totalPages);

    useEffect(() => {
        setPage(p => Math.min(p, totalPages));
    }, [totalPages]);
    const paginated     = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const activeCount   = faqs.filter(f => f.status === "ACTIVE").length;
    const inactiveCount = faqs.filter(f => f.status === "INACTIVE").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">FAQ Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Danh sách câu hỏi thường gặp hiển thị trên trang Help</p>
                </div>
                <button
                    onClick={() => setModalFaq(null)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition shrink-0"
                >
                    <Plus className="w-4 h-4" />Thêm FAQ
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    { label: "Tổng FAQ",        value: faqs.length.toLocaleString(),        icon: <HelpCircle size={24} />, iconBg: "bg-gray-50",    iconText: "text-gray-900",    borderColor: "border-l-orange-500" },
                    { label: "Đang hiển thị",   value: activeCount.toLocaleString(),        icon: <HelpCircle size={24} />, iconBg: "bg-emerald-50", iconText: "text-emerald-700", borderColor: "border-l-emerald-500", change: "Số FAQ đang Active",   trend: "up"   as const },
                    { label: "Đã ẩn",           value: inactiveCount.toLocaleString(),      icon: <HelpCircle size={24} />, iconBg: "bg-gray-50",    iconText: "text-gray-500",    borderColor: "border-l-gray-400",   change: "Số FAQ Inactive",      trend: "down" as const },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ].map(s => <AdminStatCard key={s.label} {...s as any} />)}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                {(["all", "ACTIVE", "INACTIVE"] as const).map(f => (
                    <button key={f} onClick={() => setFilterStatus(f)}
                        className={["rounded-full px-3 py-1.5 text-xs font-semibold transition",
                            filterStatus === f ? "bg-primary-600 text-white shadow-sm" : "bg-gray-100 text-slate-600 hover:bg-gray-200"].join(" ")}>
                        {f === "all" ? "Tất cả" : f === "ACTIVE" ? "Active" : "Inactive"}
                    </button>
                ))}
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm câu hỏi..."
                    className="ml-auto rounded-2xl border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition w-60" />
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                    <HelpCircle className="w-10 h-10" /><p className="text-sm">Không có FAQ nào</p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {paginated.map(faq => (
                            <div key={faq.id}
                                className={`bg-white rounded-2xl border shadow-sm px-5 py-4 transition-all border-gray-100 ${faq.status === "INACTIVE" ? "opacity-60" : ""}`}>
                                {/* Top row */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-orange-50 text-orange-600 border border-orange-100 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                            Thứ tự: {faq.displayOrder}
                                        </span>
                                        <StatusBadge status={faq.status} />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setViewFaq(faq)} title="Xem chi tiết"
                                            className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-primary-600">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setModalFaq(faq)} title="Chỉnh sửa"
                                            className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-blue-600">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setFaqToDelete(faq)}
                                            disabled={isDeleting}
                                            title="Xóa"
                                            className="p-1.5 rounded-xl hover:bg-red-50 transition text-gray-400 hover:text-red-500 disabled:opacity-40"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {/* Question */}
                                <p className="text-base font-bold text-gray-900 mb-2">{faq.question}</p>
                                {/* Answer */}
                                <div className="space-y-1">
                                    {faq.answer.map((line, i) => (
                                        <p key={i} className="text-sm text-gray-500">• {line}</p>
                                    ))}
                                </div>
                                {faq.updatedAt && <p className="text-xs text-gray-400 mt-2">Cập nhật lúc: {faq.updatedAt}</p>}
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
                        <span>Hiển thị {filtered.length === 0 ? 0 : Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(safePage * PAGE_SIZE, filtered.length)} của {filtered.length} câu hỏi</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                                className="p-1.5 rounded-xl hover:bg-gray-100 disabled:opacity-30 transition">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={["w-8 h-8 rounded-full text-xs font-semibold transition",
                                        p === safePage ? "bg-primary-600 text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"].join(" ")}>
                                    {p}
                                </button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                                className="p-1.5 rounded-xl hover:bg-gray-100 disabled:opacity-30 transition">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Modals */}
            {viewFaq && <ViewModal faq={viewFaq} onClose={() => setViewFaq(null)} />}
            {modalFaq !== undefined && (
                <FaqModal
                    faq={modalFaq}
                    onClose={() => setModalFaq(undefined)}
                    onSaved={handleSaved}
                />
            )}

            <ConfirmModal
                isOpen={faqToDelete !== null}
                onClose={() => !isDeleting && setFaqToDelete(null)}
                onConfirm={() => void handleDeleteFaq()}
                message={
                    faqToDelete
                        ? `Bạn có chắc muốn xóa FAQ "${faqToDelete.question}"? Hành động này không thể hoàn tác.`
                        : ""
                }
            />
        </div>
    );
}
