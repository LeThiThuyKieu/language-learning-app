import StatCard from "@/components/admin/dashboard/StatCard.tsx";
import ChartCard from "@/components/admin/dashboard/ChartCard.tsx";
import DataTable from "@/components/admin/dashboard/DataTable.tsx";
import { IncomeOutcomeChart, SimpleBarChart } from "@/components/admin/dashboard/Charts.tsx";
import StatusPieChart from "@/components/admin/dashboard/PieChart.tsx";

// Dummy data for charts
const incomeOutcomeData = [
  { time: "00:00", income: 30, outcome: 20 },
  { time: "01:00", income: 40, outcome: 25 },
  { time: "02:00", income: 35, outcome: 30 },
  { time: "03:00", income: 50, outcome: 35 },
  { time: "04:00", income: 80, outcome: 40 },
  { time: "05:00", income: 100, outcome: 45 },
  { time: "06:00", income: 95, outcome: 50 },
];

const statusData = [
  { name: "Not Started", value: 253, fill: "#fe4d01" },
  { name: "In Progress", value: 1732, fill: "#fbbf24" },
  { name: "Completed", value: 50, fill: "#10b981" },
];

const recentOrders = [
  {
    id: "#USR001",
    customer: "Nguyễn Văn A",
    date: "10 Jan 2026",
    amount: "45/100 XP",
    status: "In Progress",
    tracking: "LESSON-01",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "#USR002",
    customer: "Trần Thị B",
    date: "08 Jan 2026",
    amount: "89/100 XP",
    status: "Completed",
    tracking: "LESSON-02",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: "#USR003",
    customer: "Phạm Minh C",
    date: "05 Jan 2026",
    amount: "23/100 XP",
    status: "In Progress",
    tracking: "LESSON-03",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: "#USR004",
    customer: "Lê Hồng D",
    date: "20 Dec 2025",
    amount: "0/100 XP",
    status: "Not Started",
    tracking: "LESSON-04",
    avatar: "https://i.pravatar.cc/150?img=4",
  },
  {
    id: "#USR005",
    customer: "Đỗ Anh E",
    date: "16 Dec 2025",
    amount: "78/100 XP",
    status: "Completed",
    tracking: "LESSON-05",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
];

const chartData = [
  { month: "Jan", value: 45 },
  { month: "Feb", value: 52 },
  { month: "Mar", value: 48 },
  { month: "Apr", value: 61 },
  { month: "May", value: 55 },
  { month: "Jun", value: 67 },
  { month: "Jul", value: 72 },
  { month: "Aug", value: 68 },
  { month: "Sep", value: 75 },
  { month: "Oct", value: 80 },
  { month: "Nov", value: 78 },
  { month: "Dec", value: 85 },
];

export default function DashboardPage() {
  const tableColumns = [
    { key: "id", label: "User ID", width: "w-24" },
    {
      key: "customer",
      label: "Learner",
      width: "w-40",
      render: (customer: string, row: any) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar}
            alt={customer}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-gray-900 font-medium text-sm">{customer}</span>
        </div>
      ),
    },
    { key: "date", label: "Last Activity", width: "w-28" },
    { key: "amount", label: "XP Progress", width: "w-24" },
    {
      key: "status",
      label: "Lesson Status",
      width: "w-32",
      render: (status: string) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
            status === "Completed"
              ? "bg-emerald-100 text-emerald-700"
              : status === "In Progress"
              ? "bg-amber-100 text-amber-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {status}
        </span>
      ),
    },
    { key: "tracking", label: "Lesson ID", width: "w-32" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">
            Welcome back! Here's your learning progress today.
          </p>
        </div>
        <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md">
          Download Report
        </button>
      </div>

      {/* Stats Grid - 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Users"
          value="2,543"
          percentage={12}
          isIncrease={true}
          icon="👥"
          chart={<SimpleBarChart data={chartData} height={60} />}
        />
        <StatCard
          title="Active Learners"
          value="1,842"
          percentage={18}
          isIncrease={true}
          icon="📚"
          chart={<SimpleBarChart data={chartData} height={60} />}
        />
        <StatCard
          title="Total XP Earned"
          value="125,432"
          percentage={25}
          isIncrease={true}
          icon="⭐"
        />
        <StatCard
          title="Lesson Progress"
          value="68.5%"
          percentage={15}
          isIncrease={true}
          icon="📈"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Completion Rate"
          value="72.3%"
          percentage={8}
          isIncrease={true}
          icon="✅"
          chart={<SimpleBarChart data={chartData} height={40} />}
        />
        <StatCard
          title="Avg Study Time"
          value="45 mins"
          percentage={22}
          isIncrease={true}
          icon="⏱️"
          chart={<SimpleBarChart data={chartData} height={40} />}
        />
        <StatCard
          title="Daily Active"
          value="892"
          percentage={15}
          isIncrease={true}
          icon="🔥"
        />
        <StatCard
          title="Certification Rate"
          value="38.2%"
          percentage={9}
          isIncrease={true}
          icon="🎓"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ChartCard title="Daily Learning Activity">
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                <span className="text-xs text-gray-600 font-medium">Time Spent (mins)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span className="text-xs text-gray-600 font-medium">XP Earned</span>
              </div>
            </div>
            <IncomeOutcomeChart data={incomeOutcomeData} height={280} />
          </ChartCard>
        </div>

        <ChartCard title="Lesson Status">
          <StatusPieChart data={statusData} height={280} />
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                <span className="text-xs text-gray-600 font-medium">Not Started</span>
              </div>
              <span className="text-xs font-semibold text-gray-900">253</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span className="text-xs text-gray-600 font-medium">In Progress</span>
              </div>
              <span className="text-xs font-semibold text-gray-900">1732</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                <span className="text-xs text-gray-600 font-medium">Completed</span>
              </div>
              <span className="text-xs font-semibold text-gray-900">50</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Recent Orders Table */}
      <DataTable title="Student Learning Progress" columns={tableColumns} data={recentOrders} />
    </div>
  );
}
