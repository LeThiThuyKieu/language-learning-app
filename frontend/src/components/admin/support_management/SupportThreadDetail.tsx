import { MessageSquare, Send, Loader2 } from "lucide-react";
import { type SupportThread, type SupportStatus } from "./supportTypes.ts";

type SupportThreadDetailProps = {
    thread: SupportThread | null;
    replyDraft: string;
    onReplyDraftChange: (value: string) => void;
    onSendReply: () => void;
    isSendingReply?: boolean;
};

const statusStyles: Record<SupportStatus, string> = {
    "Chưa xử lý": "bg-rose-100 text-rose-700",
    "Đang xử lý": "bg-amber-100 text-amber-700",
    "Đã phản hồi": "bg-emerald-100 text-emerald-700",
};

export default function SupportThreadDetail({
    thread,
    replyDraft,
    onReplyDraftChange,
    onSendReply,
    isSendingReply = false,
}: SupportThreadDetailProps) {
    if (!thread) return null;

    const isLoadingMessages = !thread.messages;
    const adminReplies = thread.messages?.filter((m) => m.senderType === "ADMIN") ?? [];
    const userQuestion = thread.messages?.find((m) => m.senderType === "USER")?.message ?? thread.message;

    return (
        <section className="space-y-6">
            {/* Thông tin ticket */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900">Chi tiết hỗ trợ</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Email</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{thread.email}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Tên</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{thread.name}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Category</p>
                            <p className="mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-700">
                                {thread.category}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Status</p>
                            <p className={[
                                "mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                statusStyles[thread.status],
                            ].join(" ")}>{thread.status}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-3 sm:col-span-2">
                            <p className="text-xs text-slate-500">Thời gian</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{thread.createdAt}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nội dung câu hỏi của user */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    NỘI DUNG
                </div>
                <p className="text-base leading-8 text-slate-800">{userQuestion}</p>
            </div>

            {/* Loading messages */}
            {isLoadingMessages && (
                <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm flex items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Đang tải...</span>
                </div>
            )}

            {/* Các lần admin đã phản hồi */}
            {!isLoadingMessages && adminReplies.map((reply, idx) => (
                <div key={idx} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                            <MessageSquare className="h-3.5 w-3.5" />
                            NỘI DUNG ĐÃ PHẢN HỒI
                        </div>
                        <span className="text-xs text-slate-400">{reply.createdAt}</span>
                    </div>
                    <div className="rounded-2xl bg-orange-50 px-5 py-4">
                        <p className="text-sm leading-7 text-slate-800">{reply.message}</p>
                    </div>
                </div>
            ))}

            {/* Form phản hồi mới */}
            {!isLoadingMessages && (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        <Send className="h-3.5 w-3.5" />
                        {adminReplies.length > 0 ? "PHẢN HỒI MỚI" : "REPLY"}
                    </div>

                    <textarea
                        value={replyDraft}
                        onChange={(event) => onReplyDraftChange(event.target.value)}
                        placeholder={
                            adminReplies.length > 0
                                ? "Nhập nội dung phản hồi tiếp theo..."
                                : "Nhập nội dung phản hồi cho user..."
                        }
                        className="mt-4 min-h-40 w-full rounded-3xl border border-gray-100 bg-blue-50 px-5 py-4 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white"
                    />

                    <div className="mt-5 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={onSendReply}
                            disabled={isSendingReply}
                            className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Send className="h-4 w-4" />
                            {isSendingReply ? "Đang gửi..." : "Gửi phản hồi"}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
