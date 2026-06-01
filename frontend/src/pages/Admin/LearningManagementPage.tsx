import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { Link } from "react-router-dom";
import {
    BookOpen,
    Copy,
    Eye,
    FileUp,
    Headphones,
    Mic,
    MoreVertical,
    PencilLine,
    PlusCircle,
    Search,
    Trash2,
    Upload,
    X,
    ClipboardList,
    PenLine,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminStatCard from "@/components/admin/common/AdminStatCard";

type LearningLevel = "L1" | "L2" | "L3";
type LearningType = "Trắc nghiệm" | "Nghe" | "Nói" | "Đọc" | "Viết";
type LearningStatus = "Hiển thị" | "Ẩn";

type LearningQuestion = {
    id: number;
    level: LearningLevel;
    type: LearningType;
    title: string;
    preview: string;
    audio?: string;
    status: LearningStatus;
    note: string;
};

type LearningQuestionForm = {
    level: LearningLevel;
    type: LearningType;
    title: string;
    preview: string;
    audio: string;
    status: LearningStatus;
    note: string;
};

const initialQuestions: LearningQuestion[] = [
    {
        id: 1,
        level: "L1",
        type: "Trắc nghiệm",
        title: "Hello nghĩa là gì?",
        preview: "Học viên chọn đáp án đúng cho từ chào hỏi cơ bản.",
        status: "Hiển thị",
        note: "4 phương án, 1 đáp án đúng",
    },
    {
        id: 2,
        level: "L2",
        type: "Nghe",
        title: "Conversation greeting",
        preview: "Nghe đoạn hội thoại ngắn và chọn phản hồi phù hợp.",
        audio: "greeting.mp3",
        status: "Hiển thị",
        note: "Có file audio đính kèm",
    },
    {
        id: 3,
        level: "L3",
        type: "Nói",
        title: "Introduce yourself",
        preview: "Thực hành giới thiệu bản thân bằng 3 câu ngắn.",
        audio: "speaking_intro.mp3",
        status: "Ẩn",
        note: "Bài nói ghi âm",
    },
    {
        id: 4,
        level: "L1",
        type: "Đọc",
        title: "Read the dialogue",
        preview: "Đọc đoạn hội thoại và xác định ngữ cảnh giao tiếp.",
        status: "Hiển thị",
        note: "Bài đọc hiểu ngắn",
    },
    {
        id: 5,
        level: "L2",
        type: "Viết",
        title: "Write a short reply",
        preview: "Viết câu trả lời ngắn theo ngữ cảnh đã cho.",
        status: "Hiển thị",
        note: "Luyện câu phản hồi",
    },
];

const levelOptions: Array<"all" | LearningLevel> = ["all", "L1", "L2", "L3"];
const typeOptions: Array<"all" | LearningType> = ["all", "Trắc nghiệm", "Nghe", "Nói", "Đọc", "Viết"];
const statusOptions: Array<"all" | LearningStatus> = ["all", "Hiển thị", "Ẩn"];

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

const typeIconMap: Record<LearningType, ElementType> = {
    "Trắc nghiệm": ClipboardList,
    "Nghe": Headphones,
    "Nói": Mic,
    "Đọc": BookOpen,
    "Viết": PenLine,
};

export default function LearningManagementPage() {
    const [questions, setQuestions] = useState<LearningQuestion[]>(initialQuestions);
    const [searchText, setSearchText] = useState("");
    const [levelFilter, setLevelFilter] = useState<"all" | LearningLevel>("all");
    const [typeFilter, setTypeFilter] = useState<"all" | LearningType>("all");
    const [statusFilter, setStatusFilter] = useState<"all" | LearningStatus>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("view");
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
    const [questionForm, setQuestionForm] = useState<LearningQuestionForm>({
        level: "L1",
        type: "Trắc nghiệm",
        title: "",
        preview: "",
        audio: "",
        status: "Hiển thị",
        note: "",
    });
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<LearningQuestion | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function openQuestionModal(mode: "add" | "edit" | "view", question?: LearningQuestion) {
        setModalMode(mode);
        setEditingQuestionId(question?.id ?? null);
        setQuestionForm({
            level: question?.level ?? "L1",
            type: question?.type ?? "Trắc nghiệm",
            title: question?.title ?? "",
            preview: question?.preview ?? "",
            audio: question?.audio ?? "",
            status: question?.status ?? "Hiển thị",
            note: question?.note ?? "",
        });
        setIsModalOpen(true);
        setOpenMenuId(null);
    }

    function closeQuestionModal() {
        setIsModalOpen(false);
        setEditingQuestionId(null);
    }

    function saveQuestion() {
        const nextQuestion: LearningQuestion = {
            id: editingQuestionId ?? Date.now(),
            level: questionForm.level,
            type: questionForm.type,
            title: questionForm.title.trim(),
            preview: questionForm.preview.trim(),
            audio: questionForm.audio.trim() || undefined,
            status: questionForm.status,
            note: questionForm.note.trim(),
        };

        setQuestions((current) => {
            if (editingQuestionId === null) {
                return [nextQuestion, ...current];
            }

            return current.map((item) => (item.id === editingQuestionId ? nextQuestion : item));
        });

        toast.success(modalMode === "add" ? "Đã thêm câu hỏi" : "Đã lưu thay đổi");
        closeQuestionModal();
    }

    function handleDuplicateQuestion(question: LearningQuestion) {
        const duplicated: LearningQuestion = {
            ...question,
            id: Date.now(),
            title: `${question.title} (Bản sao)`,
        };

        setQuestions((current) => [duplicated, ...current]);
        setOpenMenuId(null);
        toast.success("Đã nhân bản câu hỏi");
    }

    function handleDeleteQuestion() {
        if (!deleteTarget) {
            return;
        }

        setQuestions((current) => current.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        setOpenMenuId(null);
        toast.success("Đã xoá câu hỏi");
    }

    function toggleQuestionStatus(questionId: number) {
        setQuestions((current) =>
            current.map((item) =>
                item.id === questionId
                    ? { ...item, status: item.status === "Hiển thị" ? "Ẩn" : "Hiển thị" }
                    : item,
            ),
        );
    }

    const filteredQuestions = useMemo(() => {
        const search = searchText.trim().toLowerCase();

        return questions.filter((item) => {
            const matchesSearch =
                search.length === 0 ||
                item.title.toLowerCase().includes(search) ||
                item.preview.toLowerCase().includes(search) ||
                item.audio?.toLowerCase().includes(search) ||
                item.note.toLowerCase().includes(search);

            const matchesLevel = levelFilter === "all" || item.level === levelFilter;
            const matchesType = typeFilter === "all" || item.type === typeFilter;
            const matchesStatus = statusFilter === "all" || item.status === statusFilter;

            return matchesSearch && matchesLevel && matchesType && matchesStatus;
        });
    }, [levelFilter, questions, searchText, statusFilter, typeFilter]);

    const stats = useMemo(() => {
        const totalQuestions = questions.length;
        const visibleQuestions = questions.filter((item) => item.status === "Hiển thị").length;
        const audioQuestions = questions.filter((item) => Boolean(item.audio)).length;

        return [
            {
                label: "Tổng câu hỏi",
                value: totalQuestions.toLocaleString(),
                icon: <BookOpen size={24} />,
                iconBg: "bg-orange-50",
                iconText: "text-orange-500",
                borderColor: "border-l-orange-500",
                change: "Toàn bộ dữ liệu đang quản lý",
                trend: "up" as const,
            },
            {
                label: "Đang hiển thị",
                value: visibleQuestions.toLocaleString(),
                icon: <Eye size={24} />,
                iconBg: "bg-blue-50",
                iconText: "text-blue-500",
                borderColor: "border-l-blue-500",
                change: "Câu hỏi đang bật trên giao diện",
                pulsing: true,
            },
            {
                label: "Có audio",
                value: audioQuestions.toLocaleString(),
                icon: <Headphones size={24} />,
                iconBg: "bg-green-50",
                iconText: "text-green-600",
                borderColor: "border-l-green-500",
                change: "Mục có file âm thanh đi kèm",
                trend: "up" as const,
            },
        ];
    }, [questions]);

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
                        onClick={() => openQuestionModal("add")}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#b56b47] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#9c5636]"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Thêm câu hỏi
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {stats.map((stat) => (
                    <AdminStatCard key={stat.label} {...stat} />
                ))}
            </div>

            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                    <label className="lg:col-span-2">
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

                    <label>
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Level</span>
                        <select
                            value={levelFilter}
                            onChange={(event) => setLevelFilter(event.target.value as "all" | LearningLevel)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:bg-white"
                        >
                            {levelOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option === "all" ? "Tất cả" : option}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Loại</span>
                        <select
                            value={typeFilter}
                            onChange={(event) => setTypeFilter(event.target.value as "all" | LearningType)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:bg-white"
                        >
                            {typeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option === "all" ? "Tất cả" : option}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Trạng thái</span>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value as "all" | LearningStatus)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:bg-white"
                        >
                            {statusOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option === "all" ? "Tất cả" : option}
                                </option>
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
                                <th className="px-5 py-4 text-left">Level</th>
                                <th className="px-5 py-4 text-left">Loại</th>
                                <th className="px-5 py-4 text-left">Nội dung preview</th>
                                <th className="px-5 py-4 text-left">Audio</th>
                                <th className="px-5 py-4 text-left">Trạng thái</th>
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
                                                    <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                                        <FileUp className="h-3.5 w-3.5" />
                                                        {question.audio}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleQuestionStatus(question.id)}
                                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                                                        question.status === "Hiển thị"
                                                            ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-3 w-3 rounded-full ${question.status === "Hiển thị" ? "bg-orange-500" : "bg-slate-400"}`}
                                                    />
                                                    {question.status}
                                                </button>
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
                                                                onClick={() => openQuestionModal("view", question)}
                                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                Xem
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openQuestionModal("edit", question)}
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
                                                            <div className="group relative">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDuplicateQuestion(question)}
                                                                    title="Nhân bản câu hỏi này"
                                                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                                                >
                                                                    <Copy className="h-4 w-4" />
                                                                    Nhân bản
                                                                </button>
                                                                <div className="pointer-events-none absolute right-full top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block">
                                                                    Tạo bản sao câu hỏi này
                                                                </div>
                                                            </div>
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
                    <p className="text-sm text-slate-500">
                        Hiển thị {filteredQuestions.length} trên tổng số {questions.length} câu hỏi
                    </p>
                    <div className="flex items-center gap-2">
                        <button type="button" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-400 transition hover:bg-gray-50">
                            &lt;
                        </button>
                        <button type="button" className="rounded-lg bg-[#9f5f43] px-3 py-2 text-sm font-bold text-white shadow-sm">
                            1
                        </button>
                        <button type="button" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500 transition hover:bg-gray-50">
                            2
                        </button>
                        <button type="button" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500 transition hover:bg-gray-50">
                            3
                        </button>
                        <button type="button" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-400 transition hover:bg-gray-50">
                            &gt;
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-start justify-between px-7 pt-6 pb-4">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900">
                                    {modalMode === "add" ? "Thêm câu hỏi" : modalMode === "edit" ? "Sửa câu hỏi" : "Xem câu hỏi"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {modalMode === "view"
                                        ? "Xem nhanh nội dung câu hỏi đang được quản lý."
                                        : "Chỉnh sửa dữ liệu cục bộ theo đúng style admin hiện tại."}
                                </p>
                            </div>
                            <button type="button" onClick={closeQuestionModal} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-5 px-7 pb-7">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Level</label>
                                    <select
                                        value={questionForm.level}
                                        disabled={modalMode === "view"}
                                        onChange={(event) => setQuestionForm((current) => ({ ...current, level: event.target.value as LearningLevel }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                                    >
                                        <option value="L1">L1</option>
                                        <option value="L2">L2</option>
                                        <option value="L3">L3</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Loại</label>
                                    <select
                                        value={questionForm.type}
                                        disabled={modalMode === "view"}
                                        onChange={(event) => setQuestionForm((current) => ({ ...current, type: event.target.value as LearningType }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                                    >
                                        <option value="Trắc nghiệm">Trắc nghiệm</option>
                                        <option value="Nghe">Nghe</option>
                                        <option value="Nói">Nói</option>
                                        <option value="Đọc">Đọc</option>
                                        <option value="Viết">Viết</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Câu hỏi</label>
                                <input
                                    value={questionForm.title}
                                    disabled={modalMode === "view"}
                                    onChange={(event) => setQuestionForm((current) => ({ ...current, title: event.target.value }))}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nội dung preview</label>
                                <textarea
                                    value={questionForm.preview}
                                    disabled={modalMode === "view"}
                                    onChange={(event) => setQuestionForm((current) => ({ ...current, preview: event.target.value }))}
                                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Audio</label>
                                    <input
                                        value={questionForm.audio}
                                        disabled={modalMode === "view"}
                                        onChange={(event) => setQuestionForm((current) => ({ ...current, audio: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Trạng thái</label>
                                    <select
                                        value={questionForm.status}
                                        disabled={modalMode === "view"}
                                        onChange={(event) => setQuestionForm((current) => ({ ...current, status: event.target.value as LearningStatus }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                                    >
                                        <option value="Hiển thị">Hiển thị</option>
                                        <option value="Ẩn">Ẩn</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Ghi chú</label>
                                <textarea
                                    value={questionForm.note}
                                    disabled={modalMode === "view"}
                                    onChange={(event) => setQuestionForm((current) => ({ ...current, note: event.target.value }))}
                                    className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-orange-700">Ngữ cảnh</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-800">Learning</div>
                                </div>
                                <div className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-orange-100">{modalMode.toUpperCase()}</div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={closeQuestionModal} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                                    {modalMode === "view" ? "Đóng" : "Huỷ"}
                                </button>
                                {modalMode !== "view" && (
                                    <button
                                        type="button"
                                        onClick={saveQuestion}
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#b56b47] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#9c5636]"
                                    >
                                        <Upload className="h-4 w-4" />
                                        {modalMode === "add" ? "Thêm câu hỏi" : "Lưu thay đổi"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body,
            )}

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