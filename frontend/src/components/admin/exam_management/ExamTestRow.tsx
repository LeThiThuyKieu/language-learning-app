import { Eye, Pencil, ToggleLeft, ToggleRight, Headphones, BookOpen, Mic } from "lucide-react";
import type { AdminExamTestDto } from "@/services/admin/examManagementService";

interface Props {
    test: AdminExamTestDto;
    onToggle: (test: AdminExamTestDto) => void;
    onEdit: () => void;
    onDetail: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
    A2: "bg-green-100 text-green-700",
    B1: "bg-blue-100 text-blue-700",
    B2: "bg-indigo-100 text-indigo-700",
    C1: "bg-purple-100 text-purple-700",
    C2: "bg-rose-100 text-rose-700",
};

const PAPER_ICONS = {
    LISTENING: Headphones,
    READING_WRITING: BookOpen,
    SPEAKING: Mic,
};

const PAPER_LABELS: Record<string, string> = {
    LISTENING: "L",
    READING_WRITING: "R&W",
    SPEAKING: "S",
};

export default function ExamTestRow({ test, onToggle, onEdit, onDetail }: Props) {
    const levelColor = LEVEL_COLORS[test.cefrLevel] ?? "bg-slate-100 text-slate-600";

    return (
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-slate-50/60 transition-colors">
            {/* Title */}
            <div className="flex flex-col items-center text-center">
                <p className="font-medium text-slate-800 text-sm">{test.title}</p>
                {test.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{test.description}</p>
                )}
            </div>

            {/* Level */}
            <div className="flex justify-center">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${levelColor}`}>
                    {test.cefrLevel}
                </span>
            </div>

            {/* Papers */}
            <div className="flex justify-center gap-1.5 ">
                {test.papers.map(p => {
                    const Icon = PAPER_ICONS[p.paperType] ?? BookOpen;
                    return (
                        <div
                            key={p.paperType}
                            title={`${p.paperType} — ${p.durationMinutes} phút`}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600"
                        >
                            <Icon size={11} />
                            <span>{PAPER_LABELS[p.paperType]}</span>
                        </div>
                    );
                })}
            </div>

            {/* Questions count */}
            <div className="flex justify-center text-sm text-slate-600 font-medium">{test.totalQuestions}</div>

            {/* Status */}
            <div className="flex justify-center">
                {test.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        Active
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                        Ẩn
                    </span>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-1">
                <button
                    onClick={onDetail}
                    title="Xem chi tiết"
                    className="p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                >
                    <Eye size={15} />
                </button>
                <button
                    onClick={onEdit}
                    title="Chỉnh sửa"
                    className="p-2 rounded-xl text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                >
                    <Pencil size={15} />
                </button>
                <button
                    onClick={() => onToggle(test)}
                    title={test.isActive ? "Ẩn bài thi" : "Hiện bài thi"}
                    className={`p-2 rounded-xl transition-colors ${
                        test.isActive
                            ? "text-green-500 hover:text-slate-500 hover:bg-slate-100"
                            : "text-slate-400 hover:text-green-500 hover:bg-green-50"
                    }`}
                >
                    {test.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
            </div>
        </div>
    );
}
