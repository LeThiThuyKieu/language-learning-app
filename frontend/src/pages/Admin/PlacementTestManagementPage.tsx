import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import AdminStatCard, { type AdminStatCardProps } from "@/components/admin/common/AdminStatCard";
import PlacementTestTable from "@/components/admin/placement_test_management/PlacementTestTable";
import PlacementTestDetailModal from "@/components/admin/placement_test_management/PlacementTestDetailModal";
import {
    placementTestManagementService,
    type PlacementTestStats,
    type PlacementTestRecord,
} from "@/services/admin/placementTestManagementService.ts";

function buildStats(s: PlacementTestStats): AdminStatCardProps[] {
    return [
        {
            label: "Tổng Placement Tests",
            value: s.totalTests.toLocaleString(),
            icon: <ClipboardList size={24} />,
            iconBg: "bg-orange-50",
            iconText: "text-orange-500",
            borderColor: "border-l-orange-500",
            change: "Tổng số bài test",
            trend: "up",
        },
        {
            label: "Đã hoàn thành",
            value: s.completedTests.toLocaleString(),
            icon: <CheckCircle2 size={24} />,
            iconBg: "bg-green-50",
            iconText: "text-green-600",
            borderColor: "border-l-green-500",
            change: "Bài test hoàn thành",
            trend: "up",
        },
        {
            label: "Chưa hoàn thành",
            value: s.inProgressTests.toLocaleString(),
            icon: <Clock size={24} />,
            iconBg: "bg-blue-50",
            iconText: "text-blue-500",
            borderColor: "border-l-blue-500",
            change: "Bỏ dở giữa chừng",
            pulsing: true,
        },
        {
            label: "Điểm trung bình",
            value: s.averageScore.toFixed(1),
            icon: <TrendingUp size={24} />,
            iconBg: "bg-purple-50",
            iconText: "text-purple-500",
            borderColor: "border-l-purple-500",
            change: "Trên thang 160 điểm",
            trend: "up",
        },
    ];
}

export default function PlacementTestManagementPage() {
    const [tests, setTests] = useState<PlacementTestRecord[]>([]);
    const [stats, setStats] = useState<AdminStatCardProps[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedTest, setSelectedTest] = useState<PlacementTestRecord | null>(null);

    async function fetchData(p = 0) {
        setLoading(true);
        try {
            const [testsRes, statsRes] = await Promise.all([
                placementTestManagementService.getTests(p, 10),
                placementTestManagementService.getStats(),
            ]);
            setTests(testsRes.tests);
            setTotal(testsRes.total);
            setStats(buildStats(statsRes));
        } catch (e) {
            console.error("Lỗi tải dữ liệu:", e);
            toast.error("Không thể tải dữ liệu placement tests");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData(0);
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function handleDelete(testId: number) {
        if (!confirm("Bạn có chắc muốn xóa placement test này?")) return;
        try {
            await placementTestManagementService.deleteTest(testId);
            toast.success("Đã xóa placement test thành công!");
            fetchData(page);
        } catch {
            toast.error("Xóa placement test thất bại, vui lòng thử lại.");
        }
    }

    function handlePageChange(p: number) {
        setPage(p);
        fetchData(p);
    }

    function handleRefresh() {
        fetchData(page);
    }

    return (
        <div className="space-y-6">
            {/* Tiêu đề trang */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Quản lý Placement Tests</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Theo dõi và quản lý các bài test năng lực đầu vào của học viên.
                </p>
            </div>

            {/* Thống kê */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((stat) => (
                    <AdminStatCard key={stat.label} {...stat} />
                ))}
            </div>

            {/* Bảng placement tests */}
            <PlacementTestTable
                tests={tests}
                total={total}
                page={page}
                loading={loading}
                onTestSelect={setSelectedTest}
                onPageChange={handlePageChange}
                onRefresh={handleRefresh}
            />

            {/* Modal chi tiết */}
            {selectedTest && (
                <PlacementTestDetailModal
                    test={selectedTest}
                    onClose={() => setSelectedTest(null)}
                />
            )}
        </div>
    );
}
