import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, MessageSquare, Search, Star, TreePine, Users } from "lucide-react";
import AdminStatCard from "@/components/admin/common/AdminStatCard";
import { feedbackService, type AdminFeedbackItem } from "@/services/admin/feedbackService";

const ratingOptions = [
  { label: "Tất cả", value: "all", rating: 0 },
  { label: "Rất dễ", value: "1", rating: 1 },
  { label: "Dễ", value: "2", rating: 2 },
  { label: "Trung bình", value: "3", rating: 3 },
  { label: "Khó", value: "4", rating: 4 },
  { label: "Rất khó", value: "5", rating: 5 },
];
const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "highest", label: "Điểm cao nhất" },
  { value: "lowest", label: "Điểm thấp nhất" },
];

function getRatingLabel(rating: number) {
  switch (rating) {
    case 1:
      return "Rất dễ";
    case 2:
      return "Dễ";
    case 3:
      return "Trung bình";
    case 4:
      return "Khó";
    case 5:
      return "Rất khó";
    default:
      return "—";
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatCreatedAt(value: string) {
  const date = new Date(value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function buildFeedbackStats(items: AdminFeedbackItem[]) {
  const totalFeedback = items.length;
  const uniqueUsers = new Set(items.map((item) => item.email)).size;
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
  const [feedbacks, setFeedbacks] = useState<AdminFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [treeFilter, setTreeFilter] = useState("Tất cả tree");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [draftSearchText, setDraftSearchText] = useState("");
  const [draftTreeFilter, setDraftTreeFilter] = useState("Tất cả tree");
  const [draftRatingFilter, setDraftRatingFilter] = useState("all");
  const [draftSortBy, setDraftSortBy] = useState("newest");
  const [page, setPage] = useState(0);
  const [isTreeFilterOpen, setIsTreeFilterOpen] = useState(false);
  const [isRatingFilterOpen, setIsRatingFilterOpen] = useState(false);
  const [isSortFilterOpen, setIsSortFilterOpen] = useState(false);
  const treeFilterRef = useRef<HTMLDivElement | null>(null);
  const ratingFilterRef = useRef<HTMLDivElement | null>(null);
  const sortFilterRef = useRef<HTMLDivElement | null>(null);

  const selectedTreeOption = draftTreeFilter;
  const selectedRatingOption =
    ratingOptions.find((option) => option.value === draftRatingFilter) ?? ratingOptions[0];
  const selectedSortOption = sortOptions.find((option) => option.value === draftSortBy) ?? sortOptions[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (treeFilterRef.current && !treeFilterRef.current.contains(event.target as Node)) {
        setIsTreeFilterOpen(false);
      }
      if (ratingFilterRef.current && !ratingFilterRef.current.contains(event.target as Node)) {
        setIsRatingFilterOpen(false);
      }
      if (sortFilterRef.current && !sortFilterRef.current.contains(event.target as Node)) {
        setIsSortFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadFeedbacks() {
      setLoading(true);
      setLoadError(null);

      try {
        const data = await feedbackService.getFeedbacks();

        if (!isActive) {
          return;
        }

        setFeedbacks(data.items ?? []);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error("Lỗi tải feedback:", error);
        setFeedbacks([]);
        setLoadError("Không thể tải dữ liệu đánh giá từ máy chủ.");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadFeedbacks();

    return () => {
      isActive = false;
    };
  }, []);

  const treeOptions = useMemo(
    () => ["Tất cả tree", ...Array.from(new Set(feedbacks.map((item) => item.tree)))],
    [feedbacks],
  );

  const stats = useMemo(() => buildFeedbackStats(feedbacks), [feedbacks]);

  const filteredFeedback = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    const filtered = feedbacks.filter((item) => {
      const matchesSearch =
        search.length === 0 ||
        item.name.toLowerCase().includes(search) ||
        item.email.toLowerCase().includes(search) ||
        item.tree.toLowerCase().includes(search) ||
        (item.comment?.toLowerCase().includes(search) ?? false);

      const matchesTree = treeFilter === "Tất cả tree" || item.tree === treeFilter;
      const matchesRating = ratingFilter === "all" || item.rating === Number(ratingFilter);

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
  }, [feedbacks, ratingFilter, searchText, sortBy, treeFilter]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredFeedback.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pagedFeedback = filteredFeedback.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index);

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

      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {loadError}
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-7 lg:gap-x-6 lg:gap-y-4 lg:items-start">
          <label className="flex flex-col gap-2 lg:col-span-3">
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

          <div className="flex flex-col gap-2 lg:min-w-[calc(100%+10px)]" ref={treeFilterRef}>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Lọc theo tree</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTreeFilterOpen((current) => !current)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition hover:border-orange-300 hover:bg-white hover:text-orange-600"
              >
                <span>{selectedTreeOption}</span>
                <span className="text-xs text-gray-400">{isTreeFilterOpen ? "▲" : "▼"}</span>
              </button>

              {isTreeFilterOpen && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {treeOptions.map((tree) => {
                    const isActive = draftTreeFilter === tree;

                    return (
                      <button
                        key={tree}
                        type="button"
                        onClick={() => {
                          setDraftTreeFilter(tree);
                          setIsTreeFilterOpen(false);
                        }}
                        className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition ${
                          isActive
                            ? "bg-orange-50 text-orange-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                        }`}
                      >
                        <span className="font-semibold">{tree}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:min-w-[calc(100%+10px)]" ref={ratingFilterRef}>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Lọc theo đánh giá</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRatingFilterOpen((current) => !current)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition hover:border-orange-300 hover:bg-white hover:text-orange-600"
              >
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{selectedRatingOption.label}</span>
                </span>
                <span className="text-xs text-gray-400">{isRatingFilterOpen ? "▲" : "▼"}</span>
              </button>

              {isRatingFilterOpen && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {ratingOptions.map((rating) => {
                    const isActive = draftRatingFilter === rating.value;

                    return (
                      <button
                        key={rating.value}
                        type="button"
                        onClick={() => {
                          setDraftRatingFilter(rating.value);
                          setIsRatingFilterOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                          isActive
                            ? "bg-orange-50 text-orange-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                        }`}
                      >
                        <span className="font-semibold">{rating.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:min-w-[calc(100%+10px)]" ref={sortFilterRef}>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Sắp xếp</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortFilterOpen((current) => !current)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition hover:border-orange-300 hover:bg-white hover:text-orange-600"
              >
                <span>{selectedSortOption.label}</span>
                <span className="text-xs text-gray-400">{isSortFilterOpen ? "▲" : "▼"}</span>
              </button>

              {isSortFilterOpen && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {sortOptions.map((option) => {
                    const isActive = draftSortBy === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setDraftSortBy(option.value);
                          setIsSortFilterOpen(false);
                        }}
                        className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition ${
                          isActive
                            ? "bg-orange-50 text-orange-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                        }`}
                      >
                        <span className="font-semibold">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Áp dụng</label>
            <button
              type="button"
              onClick={() => {
                setSearchText(draftSearchText);
                setTreeFilter(draftTreeFilter);
                setRatingFilter(draftRatingFilter);
                setSortBy(draftSortBy);
                setPage(0);
              }}
              className="inline-flex w-fit items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-orange-600 px-[10px] py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
            >
              <Filter size={16} />
              Áp dụng
            </button>
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
                <th className="px-5 py-4 text-left">Accuracy</th>
                <th className="px-5 py-4 text-left">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="px-5 py-10 text-center text-sm text-gray-500" colSpan={5}>
                    Đang tải dữ liệu đánh giá...
                  </td>
                </tr>
              ) : pagedFeedback.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-sm text-gray-500" colSpan={5}>
                    Không tìm thấy đánh giá phù hợp.
                  </td>
                </tr>
              ) : (
                pagedFeedback.map((item) => (
                  <tr key={item.id} className="transition hover:bg-orange-50/40">
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.email}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-700">{item.tree}</td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                        {getRatingLabel(item.rating)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {item.accuracy}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{formatCreatedAt(item.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-gray-600">
            Trang {safePage + 1}/{totalPages} - Tổng {filteredFeedback.length} đánh giá
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
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`rounded-md px-3 py-2 text-sm font-bold shadow-sm transition ${
                  pageNumber === safePage
                    ? "bg-orange-500 text-white"
                    : "border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                {pageNumber + 1}
              </button>
            ))}
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