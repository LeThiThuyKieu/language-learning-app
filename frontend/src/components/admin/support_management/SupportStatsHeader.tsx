import { Sparkles } from "lucide-react";

type SupportStatsHeaderProps = {
    total: number;
    unread: number;
    replied: number;
};

export default function SupportStatsHeader({ total, unread, replied }: SupportStatsHeaderProps) {
    return (
        <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-primary-500 to-primary-600 p-6 shadow-lg shadow-orange-200/60 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl text-white">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    Email Support
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">Quản lý email hỗ trợ</h1>
                <p className="mt-2 max-w-xl text-sm text-white/85">
                    Xem nhanh danh sách yêu cầu, mở từng email để phản hồi, và theo dõi trạng thái xử lý ngay trong admin.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-white">
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xs text-white/75">Tổng email</p>
                    <p className="mt-1 text-2xl font-bold">{total}</p>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xs text-white/75">Chưa xử lý</p>
                    <p className="mt-1 text-2xl font-bold">{unread}</p>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xs text-white/75">Đã phản hồi</p>
                    <p className="mt-1 text-2xl font-bold">{replied}</p>
                </div>
            </div>
        </div>
    );
}
