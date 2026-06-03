import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ElementType } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
    BookOpen,
    Eye,
    FileUp,
    Headphones,
    Mic,
    MoreVertical,
    PencilLine,
    Search,
    Trash2,
    ClipboardList,
    Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminStatCard from "@/components/admin/common/AdminStatCard.tsx";
import { adminApi, adminMeta } from "@/services/learningService.ts";

type LearningLevel = "L1" | "L2" | "L3";
type LearningType = "Vocab" | "Listening" | "Speaking" | "Matching";

type LearningQuestion = {
    id: number;
    level: LearningLevel;
    type: LearningType;
    title: string;
    preview: string;
    audio?: string;
    note: string;
};

const levelLabelMap: Record<LearningLevel, string> = {
    L1: "L1",
    L2: "L2",
    L3: "L3",
};

const levelClassMap: Record<LearningLevel, string> = {
    L1: "bg-rose-100 text-rose-700",
    L2: "bg-blue-100 text-blue-700",
    L3: "bg-emerald-100 text-emerald-700",
};

const typeLabelMap: Record<string, LearningType> = {
    VOCAB: "Vocab",
    LISTENING: "Listening",
    SPEAKING: "Speaking",
    MATCHING: "Matching",
};

const typeIconMap: Record<LearningType, ElementType> = {
    Vocab: ClipboardList,
    Listening: Headphones,
    Speaking: Mic,
    Matching: BookOpen,
};

export default function LearningManagementPage() {
    const [questions, setQuestions] = useState<LearningQuestion[]>([]);
    const [searchText, setSearchText] = useState("");
    const [levelFilter, setLevelFilter] = useState<"all" | number>("all");
    const [typeFilter, setTypeFilter] = useState<"all" | string>("all");
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [levelOptions, setLevelOptions] = useState<Array<{ id: number; label: string }>>([]);
    const [typeOptionsState, setTypeOptionsState] = useState<Array<string>>([]);
    const navigate = useNavigate();
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [stats, setStats] = useState<{ vocab: number; listening: number; speaking: number; matching: number }>({
        vocab: 0, listening: 0, speaking: 0, matching: 0,
    });
    const [deleteTarget, setDeleteTarget] = useState<LearningQuestion | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const size = 20;
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // navigation will open dedicated pages for view/edit/add

    function handleDeleteQuestion() {
        if (!deleteTarget) {
            return;
        }

        setQuestions((current) => current.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        setOpenMenuId(null);
        toast.success("Đã xoá câu hỏi");
    }

    // Map between Vietnamese UI types and backend QuestionType enum
    const uiToBackendType: Record<LearningType, string> = {
        Vocab: "VOCAB",
        Listening: "LISTENING",
        Speaking: "SPEAKING",
        Matching: "MATCHING",
    };

    useEffect(() => {
        let active = true;
        const fetchList = async () => {
            setLoading(true);
            try {
                const params: Record<string, string | number> = {
                    page,
                    size,
                };
                if (searchText.trim()) params.q = searchText.trim();
                if (levelFilter !== "all") params.levelId = levelFilter;
                if (typeFilter !== "all") params.type = typeFilter;
                const res = await adminApi.listQuestions(params);
                if (!active) return;
                setQuestions(res.items.map((it) => ({
                    id: it.id,
                    level: it.levelId ? (`L${it.levelId}` as LearningLevel) : "L1",
                    type: (Object.keys(uiToBackendType).find(k => uiToBackendType[k as LearningType] === it.questionType) as LearningType) || "Trắc nghiệm",
                    title: it.questionText || "",
                    preview: it.correctAnswer || (it.options ? it.options.join(' | ') : ""),
                    audio: it.audioUrl || undefined,
                    note: it.phonetic || "",
                })));
                setTotal(res.total || 0);
            } catch (e) {
                console.error(e);
                toast.error('Không thể tải danh sách câu hỏi');
            } finally {
                setLoading(false);
            }
        };
        fetchList();
        return () => { active = false; };
    }, [page, size, searchText, levelFilter, typeFilter]);

    useEffect(() => {
        let active = true;
        const fetchMeta = async () => {
            try {
                const [types, levels] = await Promise.all([adminMeta.getTypes(), adminMeta.getLevels()]);
                if (!active) return;
                setTypeOptionsState(types.filter(Boolean));
                setLevelOptions(levels.map((level) => ({ id: level.id, label: level.levelName || `L${level.id}`})));
            } catch (e) {
                console.error(e);
                toast.error('Không thể lấy dữ liệu bộ lọc');
            }
        };
        fetchMeta();
        return () => { active = false; };
    }, []);

    const filteredQuestions = questions;

    // Fetch stats theo type từ backend
    useEffect(() => {
        let active = true;
        adminMeta.getStats()
            .then((s) => { if (active) setStats(s); })
            .catch(() => {/* silent */});
        return () => { active = false; };
    }, []);

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <nav className="mb-2 text-sm text-slate-400">
                        <Link to="/admin/learning" className="hover:text-slate-600">
                            Learning
                        </Link>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Quản lý câu hỏi</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Quản lý và cập nhật nội dung bài kiểm tra học thuật.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => toast.success("Sẽ kết nối import file sau")}
                        className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-orange-50 hover:text-orange-700"
                    >
                        <FileUp className="h-4 w-4" />
                        Import File
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/learning/new')}
                        className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
                    >
                        <Plus size={16} />
                        Thêm câu hỏi
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                <AdminStatCard
                    label="Vocab"
                    value={stats.vocab.toLocaleString()}
                    icon={<ClipboardList size={24} />}
                    iconBg="bg-orange-50"
                    iconText="text-orange-500"
                    borderColor="border-l-orange-500"
                    change="Câu hỏi từ vựng"
                    trend="up"
                />
                <AdminStatCard
                    label="Listening"
                    value={stats.listening.toLocaleString()}
                    icon={<Headphones size={24} />}
                    iconBg="bg-blue-50"
                    iconText="text-blue-500"
                    borderColor="border-l-blue-500"
                    change="Câu hỏi nghe điền"
                    trend="up"
                />
                <AdminStatCard
                    label="Speaking"
                    value={stats.speaking.toLocaleString()}
                    icon={<Mic size={24} />}
                    iconBg="bg-emerald-50"
                    iconText="text-emerald-500"
                    borderColor="border-l-emerald-500"
                    change="Câu hỏi luyện nói"
                    trend="up"
                />
                <AdminStatCard
                    label="Matching"
                    value={stats.matching.toLocaleString()}
                    icon={<BookOpen size={24} />}
                    iconBg="bg-purple-50"
                    iconText="text-purple-500"
                    borderColor="border-l-purple-500"
                    change="Câu hỏi nối từ"
                    trend="up"
                />
            </div>

            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4 overflow-x-auto">
                    <label className="flex-1 min-w-0">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Tìm kiếm</span>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Tìm kiếm nội dung câu hỏi..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                            />
                        </div>
                    </label>

                    <label className="w-40 flex-shrink-0">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Level</span>
                        <select
                            value={levelFilter}
                            onChange={(event) => setLevelFilter(event.target.value === 'all' ? 'all' : parseInt(event.target.value))}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:bg-white"
                        >
                            <option value="all">Tất cả</option>
                            {levelOptions.map((option) => (
                                <option key={option.id} value={String(option.id)}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="w-44 flex-shrink-0">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Loại</span>
                        <select
                            value={typeFilter}
                            onChange={(event) => setTypeFilter(event.target.value === 'all' ? 'all' : event.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:bg-white"
                        >
                            <option value="all">Tất cả</option>
                            {typeOptionsState.map((option) => (
                                <option key={option} value={option}>{typeLabelMap[option] ?? option}</option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-5 py-4 text-left">
                                    <input type="checkbox" className="h-4 w-4" checked={selectedIds.length === questions.length && questions.length>0} onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(questions.map(q => q.id)); else setSelectedIds([]);
                                    }} />
                                </th>
                                <th className="px-5 py-4 text-left">Level</th>
                                <th className="px-5 py-4 text-left">Loại</th>
                                <th className="px-5 py-4 text-left">Nội dung preview</th>
                                <th className="px-5 py-4 text-left">Audio</th>
                                <th className="px-5 py-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredQuestions.length === 0 ? (
                                <tr>
                                    <td className="px-5 py-10 text-center text-sm text-gray-500" colSpan={6}>
                                        Không tìm thấy câu hỏi phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredQuestions.map((question) => {
                                    const TypeIcon = typeIconMap[question.type];

                                    return (
                                        <tr key={question.id} className="transition hover:bg-orange-50/40">
                                            <td className="px-5 py-4">
                                                <input type="checkbox" className="h-4 w-4" checked={selectedIds.includes(question.id)} onChange={(e) => {
                                                    if (e.target.checked) setSelectedIds((cur) => [...cur, question.id]); else setSelectedIds((cur) => cur.filter(x => x !== question.id));
                                                }} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${levelClassMap[question.level]}`}>
                                                    {levelLabelMap[question.level]}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                                                        <TypeIcon className="h-4 w-4" />
                                                    </span>
                                                    {question.type}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900">{question.title}</div>
                                                    <div className="mt-1 text-sm text-slate-500">{question.preview}</div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {question.audio ? (
                                                    <span
                                                        className="inline-flex max-w-[180px] items-center gap-2 overflow-hidden rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                                                        title={question.audio}
                                                    >
                                                        <FileUp className="h-3.5 w-3.5 flex-shrink-0" />
                                                        <span className="truncate">{question.audio}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="relative inline-flex" ref={openMenuId === question.id ? menuRef : undefined}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenMenuId((current) => (current === question.id ? null : question.id))}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                                                        aria-label="Mở menu hành động"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>

                                                    {openMenuId === question.id && (
                                                        <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-gray-100 bg-white p-1 shadow-xl">
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/admin/learning/${question.id}`, { state: { question } })}
                                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                Xem
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/admin/learning/${question.id}/edit`, { state: { question } })}
                                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                                            >
                                                                <PencilLine className="h-4 w-4" />
                                                                Sửa
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteTarget(question)}
                                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Xoá
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-slate-500">
                            Hiển thị {filteredQuestions.length} trên tổng số {questions.length} câu hỏi
                        </p>
                        <button disabled={selectedIds.length===0} onClick={async () => {
                            if (!confirm(`Xác nhận xoá ${selectedIds.length} câu hỏi?`)) return;
                            try {
                                const svc = (await import("@/services/learningService.ts")).adminApi;
                                await svc.bulkAction({ action: 'delete', ids: selectedIds });
                                setQuestions((cur) => cur.filter(q => !selectedIds.includes(q.id)));
                                setSelectedIds([]);
                                toast.success('Đã xoá');
                            } catch (e) { toast.error('Lỗi khi xoá'); }
                        }} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-rose-600">Xoá đã chọn</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setPage((p) => Math.max(0, p-1))} disabled={page<=0} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-400 transition hover:bg-gray-50">
                            &lt;
                        </button>
                        <div className="px-3 py-2 text-sm">Trang {page+1} / {Math.max(1, Math.ceil(total / size))}</div>
                        <button type="button" onClick={() => setPage((p) => p+1)} disabled={(page+1)*size>=total} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500 transition hover:bg-gray-50">
                            &gt;
                        </button>
                    </div>
                </div>
            </div>

            {/* View/Edit/Add now use dedicated pages; modal removed */}

            {deleteTarget && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-extrabold text-slate-900">Xoá câu hỏi</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Bạn có chắc chắn muốn xoá câu hỏi <span className="font-semibold text-slate-800">{deleteTarget.title}</span> không?
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Huỷ
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteQuestion}
                                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700"
                            >
                                Xoá
                            </button>
                        </div>
                    </div>
                </div>,
                document.body,
            )}
        </div>
    );
}