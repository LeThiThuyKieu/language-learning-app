import ExportImageModalGeneric, { type ExportColumn } from "@/components/admin/common/ExportImageModal";
import type { PlacementTestRecord } from "@/services/admin/placementTestManagementService.ts";

const statusLabel: Record<string, string> = {
    COMPLETED: "Hoàn thành",
    IN_PROGRESS: "Chưa hoàn thành",
};

const levelColor: Record<string, string> = {
    Beginner:     "bg-orange-100 text-orange-600",
    Intermediate: "bg-blue-100 text-blue-600",
    Advanced:     "bg-purple-100 text-purple-600",
};

const COLUMNS: ExportColumn<PlacementTestRecord>[] = [
    {
        header: "#",
        render: (_, i) => <span className="text-xs text-gray-400">{i + 1}</span>,
    },
    {
        header: "Học viên",
        render: (t) => (
            <div>
                <p className="text-sm font-semibold text-gray-800">{t.userName}</p>
                <p className="text-xs text-gray-400">{t.userEmail}</p>
            </div>
        ),
    },
    {
        header: "Trạng thái",
        render: (t) => (
            <span className={`text-xs font-bold ${t.status === "COMPLETED" ? "text-green-600" : "text-blue-600"}`}>
                {statusLabel[t.status]}
            </span>
        ),
    },
    {
        header: "Điểm",
        render: (t) => (
            <span className="text-xs font-bold text-gray-700">
                {t.totalScore !== null ? `${t.totalScore.toFixed(1)}/160` : "—"}
            </span>
        ),
    },
    {
        header: "Level",
        render: (t) => t.detectedLevel ? (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                levelColor[t.detectedLevel] ?? "bg-gray-100 text-gray-500"
            }`}>
                {t.detectedLevel}
            </span>
        ) : <span className="text-gray-300 text-sm">—</span>,
    },
    {
        header: "Ngày tạo",
        render: (t) => <span className="text-xs text-gray-500">{t.createdAt}</span>,
    },
    {
        header: "Hoàn thành",
        render: (t) => <span className="text-xs text-gray-500">{t.completedAt ?? "—"}</span>,
    },
    {
        header: "Thời lượng",
        render: (t) => <span className="text-xs text-gray-500">{t.duration ?? "—"}</span>,
    },
];

interface Props {
    tests: PlacementTestRecord[];
    onClose: () => void;
}

export default function ExportPlacementModal({ tests, onClose }: Props) {
    return (
        <ExportImageModalGeneric
            title="Danh sách Placement Tests"
            subtitle={`Xuất ngày ${new Date().toLocaleDateString("vi-VN")} · Tổng ${tests.length} bài test`}
            rows={tests}
            columns={COLUMNS}
            filename={`placement_tests_${new Date().toISOString().slice(0, 10)}.png`}
            onClose={onClose}
        />
    );
}
