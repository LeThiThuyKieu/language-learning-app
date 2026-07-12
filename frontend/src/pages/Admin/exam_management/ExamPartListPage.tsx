import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Headphones,
    BookOpen,
    Mic,
    Loader2,
    FileQuestion,
    Plus,
    Eye,
    AlignLeft,
    Pencil,
    X,
    Save,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    examManagementService,
    examQuestionApi,
    type AdminExamTestDto,
    type AdminExamPaperDto,
    type AdminExamPartDto,
} from "@/services/admin/examManagementService";
import { getErrorMessage } from "@/utils/errorMessage";
import AdminStatCard from "@/components/admin/common/AdminStatCard.tsx";


// ── Constants ────────────────────────────────────────────────────────────────

const PAPER_ICONS: Record<string, React.ElementType> = {
    LISTENING: Headphones,
    READING_WRITING: BookOpen,
    SPEAKING: Mic,
};

const PAPER_LABELS: Record<string, string> = {
    LISTENING: "Listening",
    READING_WRITING: "Reading & Writing",
    SPEAKING: "Speaking",
};

const PAPER_BADGE: Record<string, string> = {
    LISTENING: "bg-blue-50 text-blue-600 border-blue-100",
    READING_WRITING: "bg-purple-50 text-purple-600 border-purple-100",
    SPEAKING: "bg-green-50 text-green-600 border-green-100",
};

const PAPER_ACCENT: Record<string, { iconBg: string; iconText: string; border: string }> = {
    LISTENING:       { iconBg: "bg-blue-50",   iconText: "text-blue-500",   border: "border-l-blue-500"    },
    READING_WRITING: { iconBg: "bg-purple-50", iconText: "text-purple-500", border: "border-l-purple-500"  },
    SPEAKING:        { iconBg: "bg-green-50",  iconText: "text-green-500",  border: "border-l-emerald-500" },
};

const LEVEL_COLORS: Record<string, string> = {
    A2: "bg-green-100 text-green-700",
    B1: "bg-blue-100 text-blue-700",
    B2: "bg-indigo-100 text-indigo-700",
    C1: "bg-purple-100 text-purple-700",
    C2: "bg-rose-100 text-rose-700",
};

const inputCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-orange-400 focus:bg-white";

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

// Speaking part row (virtual — không phải DB row)
interface SpeakingPartRow {
    partNumber: number;
    partTitle: string;
    phaseCount: number;
    questionId: number;  // id của SPEAKING_TASK question
    partIndex: number;   // index trong speakingParts[]
}

interface PartPreview {
    part: AdminExamPartDto;
    paper: AdminExamPaperDto;
    instruction: string | null;
    maxQuestionEnd: number;
    loadingDetail: boolean;
    // populated for SPEAKING paper
    speakingRows: SpeakingPartRow[];
}

// Modal thêm/sửa part
interface PartFormModal {
    mode: "create" | "edit";
    paperId: number;
    paperLabel: string;
    partId?: number;
    partNumber: number | "";
    orderIndex: number | "";
    saving: boolean;
}

export default function ExamPartListPage() {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();

    const [test, setTest] = useState<AdminExamTestDto | null>(null);
    const [previews, setPreviews] = useState<PartPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [partModal, setPartModal] = useState<PartFormModal | null>(null);

    const loadTestData = async (tid: number) => {
        const data = await examManagementService.getTestDetail(tid);
        setTest(data);

        const allParts: PartPreview[] = [];
        for (const paper of data.papers) {
            for (const part of paper.parts ?? []) {
                const maxEnd = part.questions.reduce(
                    (max, q) => Math.max(max, q.questionNumberEnd ?? 0),
                    0
                );
                allParts.push({
                    part,
                    paper,
                    instruction: null,
                    maxQuestionEnd: maxEnd,
                    loadingDetail: true,
                    speakingRows: [],
                });
            }
        }

        setPreviews(allParts);

        // Load instruction từ câu hỏi order nhỏ nhất của từng part
        const withDetails = await Promise.all(
            allParts.map(async (pv): Promise<PartPreview> => {
                // Speaking paper: extract speakingParts from the single SPEAKING_TASK question
                if (pv.paper.paperType === "SPEAKING") {
                    try {
                        const details = await examQuestionApi.getByPart(pv.part.id);
                        const taskQ = details.find(d => d.questionType === "SPEAKING_TASK");
                        if (taskQ && taskQ.speakingParts && taskQ.speakingParts.length > 0) {
                            const rows: SpeakingPartRow[] = taskQ.speakingParts.map((sp, idx) => {
                                const p = sp as Record<string, unknown>;
                                const phases = (p.phases as unknown[] | undefined) ?? [];
                                return {
                                    partNumber: (p.partNumber as number) ?? idx + 1,
                                    partTitle: (p.partTitle as string) || `Part ${idx + 1}`,
                                    phaseCount: phases.length,
                                    questionId: taskQ.id,
                                    partIndex: idx,
                                };
                            });
                            return { ...pv, speakingRows: rows, loadingDetail: false };
                        }
                    } catch { /* ignore */ }
                    return { ...pv, loadingDetail: false };
                }

                // Non-speaking: load instruction as before
                let instruction: string | null = null;
                try {
                    const details = await examQuestionApi.getByPart(pv.part.id);
                    const sorted = [...details].sort(
                        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
                    );
                    for (const d of sorted) {
                        if (d.instruction) { instruction = d.instruction; break; }
                    }
                } catch { /* ignore */ }
                return { ...pv, instruction, loadingDetail: false };
            })
        );

        setPreviews(withDetails);
        return data;
    };

    useEffect(() => {
        if (!testId) return;
        const tid = parseInt(testId, 10);
        if (isNaN(tid)) {
            toast.error("Test ID không hợp lệ");
            navigate("/admin/exam-management");
            return;
        }

        setLoading(true);
        loadTestData(tid)
            .catch(err => {
                toast.error(getErrorMessage(err, "Không thể tải dữ liệu"));
                navigate("/admin/exam-management");
            })
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testId]);

    // Scroll to hash anchor after data is loaded
    const hasScrolled = useRef(false);
    useEffect(() => {
        if (loading || hasScrolled.current) return;
        const hash = window.location.hash;
        if (!hash) return;
        const el = document.getElementById(hash.slice(1));
        if (el) {
            hasScrolled.current = true;
            setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        }
    }, [loading]);

    const handlePartClick = (partId: number) => {
        navigate(`/admin/exam-management/${testId}/questions?partId=${partId}`);
    };

    const handleSpeakingPartClick = (questionId: number, partIndex: number) => {
        navigate(`/admin/exam-management/${testId}/questions/${questionId}`, {
            state: { speakingPartIndex: partIndex },
        });
    };

    const handleSpeakingPartEditClick = (questionId: number, partIndex: number) => {
        navigate(`/admin/exam-management/${testId}/questions/${questionId}`, {
            state: { editMode: true, speakingPartIndex: partIndex },
        });
    };

    // Mở modal thêm part
    const openAddPartModal = (paper: AdminExamPaperDto) => {
        const existingParts = previews.filter(pv => pv.paper.id === paper.id);
        const nextPartNumber = existingParts.length + 1;
        const nextOrder = existingParts.length;
        setPartModal({
            mode: "create",
            paperId: paper.id,
            paperLabel: PAPER_LABELS[paper.paperType] ?? paper.paperType,
            partNumber: nextPartNumber,
            orderIndex: nextOrder,
            saving: false,
        });
    };

    // Mở modal sửa part
    const openEditPartModal = (pv: PartPreview) => {
        setPartModal({
            mode: "edit",
            paperId: pv.paper.id,
            paperLabel: PAPER_LABELS[pv.paper.paperType] ?? pv.paper.paperType,
            partId: pv.part.id,
            partNumber: pv.part.partNumber,
            orderIndex: pv.part.orderIndex,
            saving: false,
        });
    };

    const handleSavePart = async () => {
        if (!partModal || !testId) return;
        if (partModal.partNumber === "") {
            toast.error("Vui lòng nhập số part");
            return;
        }

        setPartModal(prev => prev ? { ...prev, saving: true } : null);
        try {
            if (partModal.mode === "create") {
                await examManagementService.createPart(partModal.paperId, {
                    partNumber: partModal.partNumber as number,
                    orderIndex: partModal.orderIndex === "" ? 0 : partModal.orderIndex as number,
                });
                toast.success("Tạo part thành công");
            } else {
                await examManagementService.updatePart(partModal.partId!, {
                    partNumber: partModal.partNumber as number,
                    orderIndex: partModal.orderIndex === "" ? 0 : partModal.orderIndex as number,
                });
                toast.success("Cập nhật part thành công");
            }
            setPartModal(null);
            // Reload
            setLoading(true);
            await loadTestData(parseInt(testId, 10));
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể lưu part"));
            setPartModal(prev => prev ? { ...prev, saving: false } : null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Đang tải...</span>
            </div>
        );
    }

    if (!test) return null;

    const levelColor = LEVEL_COLORS[test.cefrLevel] ?? "bg-slate-100 text-slate-600";

    // Group previews by paper — phải khai báo TRƯỚC paperStats
    const previewsByPaper: Record<string, PartPreview[]> = {};
    for (const pv of previews) {
        const key = pv.paper.paperType;
        if (!previewsByPaper[key]) previewsByPaper[key] = [];
        previewsByPaper[key].push(pv);
    }

    // All previews flattened in paper order
    const allPreviews: PartPreview[] = [];
    for (const paper of test.papers) {
        const pvs = previewsByPaper[paper.paperType] ?? [];
        allPreviews.push(...pvs);
    }

    const paperStats: Record<string, { parts: number; questions: number }> = {};
    for (const paper of test.papers) {
        if (paper.paperType === "SPEAKING") {
            // Đếm tổng phrases từ speakingRows đã loaded
            const pvs = previewsByPaper["SPEAKING"] ?? [];
            const phaseTotal = pvs.reduce((sum, pv) =>
                sum + pv.speakingRows.reduce((s, sr) => s + sr.phaseCount, 0), 0
            );
            paperStats[paper.paperType] = {
                parts: pvs.reduce((s, pv) => s + pv.speakingRows.length, 0),
                questions: phaseTotal,
            };
        } else {
            let maxEnd = 0;
            for (const part of paper.parts ?? []) {
                for (const q of part.questions) {
                    if ((q.questionNumberEnd ?? 0) > maxEnd) maxEnd = q.questionNumberEnd ?? 0;
                }
            }
            paperStats[paper.paperType] = {
                parts: paper.parts?.length ?? 0,
                questions: maxEnd,
            };
        }
    }
    const totalParts = test.papers.reduce((acc, p) => acc + (p.parts?.length ?? 0), 0);
    const totalQuestions = Object.values(paperStats).reduce((a, b) => a + b.questions, 0);

    return (
        <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
            {/* Part Form Modal */}
            {partModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-extrabold text-gray-900">
                                {partModal.mode === "create" ? "Thêm Part mới" : "Sửa Part"}
                            </h3>
                            <button
                                onClick={() => setPartModal(null)}
                                disabled={partModal.saving}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Paper badge */}
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Paper</p>
                                <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                                    {partModal.paperLabel}
                                </span>
                            </div>

                            {/* Part Number */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
                                    Số Part <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    className={inputCls}
                                    value={partModal.partNumber}
                                    min={1}
                                    onChange={e =>
                                        setPartModal(prev =>
                                            prev ? { ...prev, partNumber: e.target.value === "" ? "" : Number(e.target.value) } : null
                                        )
                                    }
                                    placeholder="1"
                                    autoFocus
                                />
                            </div>

                            {/* Order Index */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
                                    Order Index
                                </label>
                                <input
                                    type="number"
                                    className={inputCls}
                                    value={partModal.orderIndex}
                                    min={0}
                                    onChange={e =>
                                        setPartModal(prev =>
                                            prev ? { ...prev, orderIndex: e.target.value === "" ? "" : Number(e.target.value) } : null
                                        )
                                    }
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setPartModal(null)}
                                disabled={partModal.saving}
                                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSavePart}
                                disabled={partModal.saving}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 text-sm transition disabled:opacity-60"
                            >
                                {partModal.saving
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <Save size={14} />
                                }
                                {partModal.mode === "create" ? "Tạo Part" : "Lưu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Back + Header */}
            <div>
                <button
                    onClick={() => navigate("/admin/exam-management")}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 mb-4 transition-colors"
                >
                    <ArrowLeft size={15} />
                    Quay lại Exam Management
                </button>

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${levelColor}`}>
                                {test.cefrLevel}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${test.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                                {test.isActive ? "Active" : "Ẩn"}
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900">{test.title}</h1>
                        {test.description && (
                            <p className="text-sm text-gray-500 mt-1">{test.description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                {(["LISTENING", "READING_WRITING", "SPEAKING"] as const).map(pt => {
                    const acc = PAPER_ACCENT[pt];
                    const Icon = PAPER_ICONS[pt];
                    const isSpeaking = pt === "SPEAKING";
                    return (
                        <AdminStatCard
                            key={pt}
                            label={PAPER_LABELS[pt]}
                            value={String(paperStats[pt]?.questions ?? 0)}
                            icon={<Icon size={24} />}
                            iconBg={acc.iconBg}
                            iconText={acc.iconText}
                            borderColor={acc.border}
                            change={`${paperStats[pt]?.parts ?? 0} part · ${isSpeaking ? "phrase" : "câu hỏi"}`}
                            changeClassName="text-orange-500"
                        />
                    );
                })}
                <AdminStatCard
                    label="Tổng câu hỏi"
                    value={String(totalQuestions)}
                    icon={<FileQuestion size={24} />}
                    iconBg="bg-orange-50"
                    iconText="text-orange-500"
                    borderColor="border-l-orange-500"
                    change={`${totalParts} part`}
                    changeClassName="text-orange-500"
                />
            </div>

            {/* Parts Table — grouped by paper */}
            {test.papers.map(paper => {
                const pvs = previewsByPaper[paper.paperType] ?? [];
                const PaperIcon = PAPER_ICONS[paper.paperType] ?? BookOpen;
                const badgeCls = PAPER_BADGE[paper.paperType] ?? "bg-gray-50 text-gray-500 border-gray-100";

                return (
                    <div key={paper.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    id={paper.paperType === "SPEAKING" ? "speaking" : undefined}>
                        {/* Toolbar */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeCls}`}>
                                    <PaperIcon size={11} />
                                    {PAPER_LABELS[paper.paperType] ?? paper.paperType}
                                </span>
                                <div>
                                    <h2 className="text-base font-extrabold text-gray-900">
                                        Danh sách Part
                                    </h2>
                                    <p className="text-xs font-medium text-gray-400 mt-0.5">
                                        {paperStats[paper.paperType]?.parts ?? pvs.length} part · {paperStats[paper.paperType]?.questions ?? 0} {paper.paperType === "SPEAKING" ? "phase" : "câu hỏi"} · {paper.durationMinutes} phút
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => openAddPartModal(paper)}
                                className="flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors border border-orange-200 hover:border-orange-400 px-3 py-1.5 rounded-lg"
                            >
                                <Plus size={13} />
                                Thêm Part
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <colgroup>
                                    <col style={{ width: 52 }} />   {/* # */}
                                    <col style={{ width: 100 }} />  {/* Part */}
                                    <col style={{ width: 80 }} />   {/* Order */}
                                    <col style={{ width: 80 }} />   {/* Số câu */}
                                    <col />                          {/* Instruction */}
                                    <col style={{ width: 140 }} />  {/* Thao tác */}
                                </colgroup>
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <th className="px-6 py-4 text-center">#</th>
                                        <th className="px-4 py-4 text-center">Part</th>
                                        <th className="px-4 py-4 text-center">Order</th>
                                        <th className="px-4 py-4 text-center">Số câu</th>
                                        <th className="px-4 py-4 text-left">Instruction</th>
                                        <th className="px-4 py-4 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {pvs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center">
                                                <div className="flex flex-col items-center gap-2 text-gray-300">
                                                    <FileQuestion size={32} className="opacity-50" />
                                                    <span className="text-sm font-medium text-gray-400">
                                                        Chưa có Part nào.
                                                    </span>
                                                    <button
                                                        onClick={() => openAddPartModal(paper)}
                                                        className="mt-1 text-xs font-bold text-orange-500 hover:text-orange-600"
                                                    >
                                                        + Thêm Part đầu tiên
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        pvs.flatMap((pv, idx) => {
                                            // SPEAKING: render virtual rows per speaking part
                                            if (pv.paper.paperType === "SPEAKING") {
                                                if (pv.loadingDetail) {
                                                    return (
                                                        <tr key={pv.part.id} className="align-middle">
                                                            <td colSpan={6} className="px-6 py-4">
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-300">
                                                                    <Loader2 size={11} className="animate-spin" />
                                                                    Đang tải Speaking Parts...
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                                if (pv.speakingRows.length === 0) {
                                                    return (
                                                        <tr key={pv.part.id} className="align-middle">
                                                            <td colSpan={6} className="px-6 py-4 text-center">
                                                                <span className="text-xs text-gray-300 italic">Chưa có Speaking Part nào.</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                                return pv.speakingRows.map((sr, srIdx) => (
                                                    <tr
                                                        key={`${pv.part.id}-sp-${srIdx}`}
                                                        className="group hover:bg-emerald-50/40 transition-all align-middle"
                                                    >
                                                        {/* # STT */}
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="text-xs font-bold text-gray-400">{srIdx + 1}</span>
                                                        </td>
                                                        {/* Part number */}
                                                        <td className="px-4 py-4 text-center">
                                                            <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50">
                                                                <span className="text-sm font-extrabold text-emerald-600">
                                                                    {sr.partNumber}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        {/* Order = partNumber */}
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="text-sm font-medium text-gray-500">{sr.partNumber}</span>
                                                        </td>
                                                        {/* Số câu = phaseCount */}
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="text-sm font-extrabold text-gray-800">{sr.phaseCount}</span>
                                                        </td>
                                                        {/* Instruction = partTitle */}
                                                        <td className="px-4 py-4 max-w-xs">
                                                            <div className="flex items-start gap-2">
                                                                <AlignLeft size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                                                                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                                                    {sr.partTitle}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        {/* Thao tác */}
                                                        <td className="px-4 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    title="Sửa Speaking Part"
                                                                    onClick={() => handleSpeakingPartEditClick(sr.questionId, sr.partIndex)}
                                                                    className="p-2 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                                                >
                                                                    <Pencil size={14} />
                                                                </button>
                                                                <button
                                                                    title="Xem Speaking Part"
                                                                    onClick={() => handleSpeakingPartClick(sr.questionId, sr.partIndex)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-500 hover:bg-blue-50 transition-all"
                                                                >
                                                                    <Eye size={13} />
                                                                    Xem
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ));
                                            }

                                            // Non-speaking: regular row
                                            return [(
                                                <tr
                                                    key={pv.part.id}
                                                    className="group hover:bg-orange-50/30 transition-all align-middle"
                                                >
                                                    {/* # STT */}
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-xs font-bold text-gray-400">
                                                            {idx + 1}
                                                        </span>
                                                    </td>

                                                    {/* Part number */}
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50">
                                                            <span className="text-sm font-extrabold text-orange-500">
                                                                {pv.part.partNumber}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Order Index */}
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-medium text-gray-500">
                                                            {pv.part.orderIndex}
                                                        </span>
                                                    </td>

                                                    {/* Số câu */}
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-extrabold text-gray-800">
                                                            {pv.maxQuestionEnd > 0 ? pv.maxQuestionEnd : "—"}
                                                        </span>
                                                    </td>

                                                    {/* Instruction */}
                                                    <td className="px-4 py-4 max-w-xs">
                                                        {pv.loadingDetail ? (
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-300">
                                                                <Loader2 size={11} className="animate-spin" />
                                                                Đang tải...
                                                            </div>
                                                        ) : pv.instruction ? (
                                                            <div className="flex items-start gap-2">
                                                                <AlignLeft size={13} className="text-gray-400 shrink-0 mt-0.5" />
                                                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                                                    <RichText text={pv.instruction} />
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-300 italic">Chưa có instruction</span>
                                                        )}
                                                    </td>

                                                    {/* Thao tác */}
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                title="Sửa Part"
                                                                onClick={() => openEditPartModal(pv)}
                                                                className="p-2 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                title="Xem câu hỏi"
                                                                onClick={() => handlePartClick(pv.part.id)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-500 hover:bg-blue-50 transition-all"
                                                            >
                                                                <Eye size={13} />
                                                                Xem
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )];
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        {pvs.length > 0 && (
                            <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100">
                                <p className="text-xs font-medium text-gray-400">
                                    Tổng{" "}
                                    <span className="font-bold text-gray-800">{paperStats[paper.paperType]?.parts ?? pvs.length}</span>{" "}
                                    part ·{" "}
                                    <span className="font-bold text-gray-800">{paperStats[paper.paperType]?.questions ?? 0}</span>{" "}
                                    {paper.paperType === "SPEAKING" ? "phase" : "câu hỏi"}
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
