import {
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Mail,
    MessageSquare,
    Paperclip,
    Send,
    UserRound,
} from "lucide-react";
import { type SupportThread, type SupportStatus } from "./supportTypes.ts";

type SupportThreadDetailProps = {
    thread: SupportThread | null;
    replyDraft: string;
    onReplyDraftChange: (value: string) => void;
};

const statusStyles: Record<SupportStatus, string> = {
    "Chưa xử lý": "bg-rose-100 text-rose-700",
    "Đang xử lý": "bg-amber-100 text-amber-700",
    "Đã phản hồi": "bg-emerald-100 text-emerald-700",
};

export default function SupportThreadDetail({ thread, replyDraft, onReplyDraftChange }: SupportThreadDetailProps) {
    if (!thread) {
        return (
            <section className="flex min-h-[540px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
                <Mail className="h-14 w-14 text-orange-300" />
                <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Chưa chọn email nào</h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                    Bấm vào một item bên trái để xem nội dung chi tiết, lịch sử xử lý và khung phản hồi cho admin.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                    <ChevronRight className="h-4 w-4" />
                    Chọn một email support
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                        <img
                            src={thread.avatar}
                            alt={thread.name}
                            className="h-16 w-16 rounded-2xl object-cover shadow-sm ring-4 ring-orange-50"
                        />
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-2xl font-bold text-slate-900">{thread.name}</h2>
                                <span className={[
                                    "rounded-full px-3 py-1 text-xs font-bold",
                                    statusStyles[thread.status],
                                ].join(" ")}>{thread.status}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                <span className="inline-flex items-center gap-1.5">
                                    <Mail className="h-4 w-4" />
                                    {thread.email}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <MessageSquare className="h-4 w-4" />
                                    {thread.category}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock3 className="h-4 w-4" />
                                    {thread.createdAt}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[360px]">
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Device</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{thread.device}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Version</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{thread.appVersion}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Trạng thái</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{thread.status}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Mã</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">#{thread.id}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    <span>NỘI DUNG HỖ TRỢ</span>
                </div>

                <p className="text-lg leading-8 text-slate-800">
                    {thread.message}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5">
                        <Paperclip className="h-4 w-4" />
                        1 ảnh đính kèm
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5">
                        <UserRound className="h-4 w-4" />
                        Người dùng đang chờ phản hồi
                    </span>
                </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-900">
                        <ArrowRight className="h-5 w-5 text-primary-600" />
                        <h3 className="text-lg font-bold">Phản hồi hỗ trợ</h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[
                            "Reset mật khẩu",
                            "Kiểm tra kết nối",
                            "Hướng dẫn đăng nhập",
                        ].map((template) => (
                            <button
                                key={template}
                                type="button"
                                onClick={() => onReplyDraftChange(template)}
                                className="rounded-full border border-gray-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                            >
                                {template}
                            </button>
                        ))}
                    </div>
                </div>

                <textarea
                    value={replyDraft}
                    onChange={(event) => onReplyDraftChange(event.target.value)}
                    placeholder="Nhập nội dung phản hồi cho user..."
                    className="mt-4 min-h-40 w-full rounded-3xl border border-gray-100 bg-blue-50 px-5 py-4 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white"
                />

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <label className="inline-flex items-center gap-2 text-slate-700">
                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-200 text-primary-600 focus:ring-primary-500" />
                        Gửi email cho user
                    </label>
                    <label className="inline-flex items-center gap-2 text-slate-700">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-200 text-primary-600 focus:ring-primary-500" />
                        Đánh dấu đã xử lý
                    </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-primary-700">
                        <Send className="h-4 w-4" />
                        Gửi phản hồi
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Đánh dấu đã xử lý
                    </button>
                </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Lịch sử hoạt động</p>
                <div className="mt-4 space-y-4">
                    {thread.timeline.map((entry) => (
                        <div key={entry} className="flex gap-3">
                            <div className="mt-2 h-2.5 w-2.5 rounded-full bg-primary-500" />
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{entry}</p>
                                <p className="text-xs text-slate-400">Hôm nay, 10:45 AM</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
