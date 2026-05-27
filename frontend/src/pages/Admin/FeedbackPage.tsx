import { useMemo, useState } from "react";
import { Filter, MessageSquare, Search, Star, TreePine, Users } from "lucide-react";
import AdminStatCard from "@/components/admin/common/AdminStatCard";

type FeedbackItem = {
  id: number;
  tree: string;
  user: string;
  name: string;
  rating: number;
  accuracy: number;
  createdAt: string;
  comment: string;
};

const mockFeedback: FeedbackItem[] = [
  { id: 101, tree: "Basic Vocabulary", user: "alice@example.com", name: "Alice", rating: 3, accuracy: 84, createdAt: "2026-05-20 10:12", comment: "Nội dung dễ theo dõi, nhưng cần thêm ví dụ." },
  { id: 102, tree: "Verb Tenses", user: "bob@example.com", name: "Bob", rating: 5, accuracy: 98, createdAt: "2026-05-21 14:03", comment: "Tree rất rõ ràng và dễ học." },
  { id: 103, tree: "Listening 1", user: "carol@example.com", name: "Carol", rating: 2, accuracy: 71, createdAt: "2026-05-22 08:45", comment: "Phần nghe hơi nhanh với người mới." },
  { id: 104, tree: "Travel Basics", user: "david@example.com", name: "David", rating: 4, accuracy: 90, createdAt: "2026-05-22 19:20", comment: "Bộ tree du lịch khá thực tế." },
  { id: 105, tree: "Food & Drinks", user: "emma@example.com", name: "Emma", rating: 5, accuracy: 96, createdAt: "2026-05-23 11:05", comment: "Rất thích phần từ vựng chủ đề." },
  { id: 106, tree: "Daily Routine", user: "frank@example.com", name: "Frank", rating: 4, accuracy: 88, createdAt: "2026-05-23 16:48", comment: "Bài tập vừa sức, mạch học tốt." },
  { id: 107, tree: "Grammar Path", user: "grace@example.com", name: "Grace", rating: 5, accuracy: 99, createdAt: "2026-05-24 09:32", comment: "Cấu trúc tree giúp học theo lộ trình." },
  { id: 108, tree: "Speaking Basics", user: "henry@example.com", name: "Henry", rating: 3, accuracy: 80, createdAt: "2026-05-24 18:10", comment: "Nên bổ sung thêm phản hồi phát âm." },
  { id: 109, tree: "Travel Basics", user: "ivy@example.com", name: "Ivy", rating: 4, accuracy: 92, createdAt: "2026-05-25 10:00", comment: "Phần luyện tập phù hợp mục tiêu giao tiếp." },
  { id: 110, tree: "Listening 1", user: "jack@example.com", name: "Jack", rating: 2, accuracy: 68, createdAt: "2026-05-25 13:25", comment: "Cần thêm hướng dẫn trước khi nghe." },
  { id: 111, tree: "Food & Drinks", user: "kate@example.com", name: "Kate", rating: 5, accuracy: 97, createdAt: "2026-05-26 09:45", comment: "Tree đẹp, nội dung dễ nhớ." },
  { id: 112, tree: "Daily Routine", user: "leo@example.com", name: "Leo", rating: 4, accuracy: 89, createdAt: "2026-05-26 15:15", comment: "Lộ trình học hợp lý và không bị rối." },
];

const treeOptions = ["Tất cả tree", ...Array.from(new Set(mockFeedback.map((item) => item.tree)))];
const ratingOptions = ["Tất cả", "5 sao", "4 sao", "3 sao", "2 sao", "1 sao"];
const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "highest", label: "Điểm cao nhất" },
  { value: "lowest", label: "Điểm thấp nhất" },
];

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star key={index} size={14} className={index < rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
  ));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function buildFeedbackStats(items: FeedbackItem[]) {
  const totalFeedback = items.length;
  const uniqueUsers = new Set(items.map((item) => item.user)).size;
  const uniqueTrees = new Set(items.map((item) => item.tree)).size;

  return [
    {
      label: "Tổng đánh giá",
      value: totalFeedback.toLocaleString(),
      icon: <MessageSquare size={24} />,
      iconBg: "bg-orange-50",
      iconText: "text-orange-500",
      borderColor: "border-l-orange-500",
      change: "Tất cả phản hồi đã ghi nhận",
      trend: "up" as const,
    },
    {
      label: "Người dùng",
      value: uniqueUsers.toLocaleString(),
      icon: <Users size={24} />,
      iconBg: "bg-blue-50",
      iconText: "text-blue-500",
      borderColor: "border-l-blue-500",
      change: "Người dùng đã gửi đánh giá",
      pulsing: true,
    },
    {
      label: "Tree đã đánh giá",
      value: uniqueTrees.toLocaleString(),
      icon: <TreePine size={24} />,
      iconBg: "bg-green-50",
      iconText: "text-green-600",
      borderColor: "border-l-green-500",
      change: "Số tree có feedback",
      trend: "up" as const,
    },
  ];
}

export default function FeedbackPage() {
  const [searchText, setSearchText] = useState("");
  const [treeFilter, setTreeFilter] = useState("Tất cả tree");
  const [ratingFilter, setRatingFilter] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("newest");
  const [draftSearchText, setDraftSearchText] = useState("");
  const [draftTreeFilter, setDraftTreeFilter] = useState("Tất cả tree");
  const [draftRatingFilter, setDraftRatingFilter] = useState("Tất cả");
  const [draftSortBy, setDraftSortBy] = useState("newest");
  const [page, setPage] = useState(0);

  const stats = useMemo(() => buildFeedbackStats(mockFeedback), []);

  const filteredFeedback = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    const filtered = mockFeedback.filter((item) => {
      const matchesSearch =
        search.length === 0 ||
        item.name.toLowerCase().includes(search) ||
        item.user.toLowerCase().includes(search) ||
        item.tree.toLowerCase().includes(search) ||
        item.comment.toLowerCase().includes(search);

      const matchesTree = treeFilter === "Tất cả tree" || item.tree === treeFilter;
      const matchesRating = ratingFilter === "Tất cả" || item.rating === Number(ratingFilter[0]);

      return matchesSearch && matchesTree && matchesRating;
    });

    filtered.sort((left, right) => {
      const leftTime = new Date(left.createdAt.replace(" ", "T")).getTime();
      const rightTime = new Date(right.createdAt.replace(" ", "T")).getTime();

      if (sortBy === "oldest") return leftTime - rightTime;
      if (sortBy === "highest") return right.rating - left.rating || rightTime - leftTime;
      if (sortBy === "lowest") return left.rating - right.rating || rightTime - leftTime;
      return rightTime - leftTime;
    });

    return filtered;
  }, [ratingFilter, searchText, sortBy, treeFilter]);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredFeedback.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pagedFeedback = filteredFeedback.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Quản lý đánh giá</h1>
          <p className="mt-1 text-sm text-gray-500">Theo dõi đánh giá của người dùng theo từng tree học.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-3">
        {stats.map((stat) => (
          <AdminStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <label className="space-y-2 lg:col-span-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tìm người dùng</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={draftSearchText}
                onChange={(event) => setDraftSearchText(event.target.value)}
                placeholder="Họ tên / email / tree"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Lọc theo tree</span>
            <select
              value={draftTreeFilter}
              onChange={(event) => setDraftTreeFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
            >
              {treeOptions.map((tree) => (
                <option key={tree} value={tree}>{tree}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Lọc theo đánh giá</span>
            <select
              value={draftRatingFilter}
              onChange={(event) => setDraftRatingFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
            >
              {ratingOptions.map((rating) => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </label>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Sắp xếp</label>
            <div className="flex gap-3">
              <select
                value={draftSortBy}
                onChange={(event) => setDraftSortBy(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setSearchText(draftSearchText);
                  setTreeFilter(draftTreeFilter);
                  setRatingFilter(draftRatingFilter);
                  setSortBy(draftSortBy);
                  setPage(0);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
              >
                <Filter size={16} />
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-4 text-left">Người dùng</th>
                <th className="px-5 py-4 text-left">Tree</th>
                <th className="px-5 py-4 text-left">Đánh giá</th>
                <th className="px-5 py-4 text-left">Ngày</th>
                <th className="px-5 py-4 text-left">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedFeedback.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-sm text-gray-500" colSpan={5}>
                    Không tìm thấy đánh giá phù hợp.
                  </td>
                </tr>
              ) : (
                pagedFeedback.map((item) => (
                  <tr key={item.id} className="transition hover:bg-orange-50/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100 text-sm font-extrabold text-orange-700">
                          {getInitials(item.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.user}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-700">{item.tree}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">{renderStars(item.rating)}</div>
                      <div className="mt-1 text-xs font-medium text-gray-500">{item.rating}/5</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{item.createdAt}</td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {item.accuracy}%
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-gray-600">
            Trang {safePage + 1} / {totalPages} - Tổng {filteredFeedback.length} đánh giá
          </p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={safePage === 0}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              &lt;
            </button>
            <button
              type="button"
              className="rounded-md bg-orange-500 px-3 py-2 text-sm font-bold text-white shadow-sm"
            >
              {safePage + 1}
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
              disabled={safePage >= totalPages - 1}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
