import { useState } from "react";
import { Send, Loader2, MessageSquare, ChevronLeft, Mail, History } from "lucide-react";
import SupportEmailLogModal from "./SupportEmailLogModal";
import { type SupportEmailLog, type SupportThread, STATUS_STYLE, STATUS_LABEL } from "./supportTypes.ts";

const AUTO_REPLY_TEXT = "Cảm ơn bạn đã liên hệ hỗ trợ 💬 Yêu cầu của bạn đã được gửi thành công. Admin sẽ phản hồi trong thời gian sớm nhất. Vui lòng chờ trong giây lát nhé!";

type SupportThreadDetailProps = {
    thread: SupportThread | null;
    replyDraft: string;
    onReplyDraftChange: (value: string) => void;
    onSendReply: () => void;
    isSendingReply?: boolean;
    onBack?: () => void;
    emailLogs?: SupportEmailLog[];
    isLoadingEmailLogs?: boolean;
    onOpenEmailLogs?: () => void;
};

export default function SupportThreadDetail({
    thread,
    replyDraft,
    onReplyDraftChange,
    onSendReply,
    isSendingReply = false,
    onBack,
    emailLogs,
    isLoadingEmailLogs = false,
    onOpenEmailLogs,
}: SupportThreadDetailProps) {
    const [showEmailLogModal, setShowEmailLogModal] = useState(false);

    if (!thread) return null;

    const isLoadingMessages = !thread.messages;
    const showEmailHistory = emailLogs !== undefined;

    const realMessages = (thread.messages ?? []).filter((m) => m.message !== AUTO_REPLY_TEXT);
    const userMessages = realMessages.filter((m) => m.senderType === "USER");
    const adminReplies = realMessages.filter((m) => m.senderType === "ADMIN");
    const firstUserMsg = userMessages[0];
    const firstUserTime = firstUserMsg?.createdAt ?? thread.createdAt;

    const handleOpenEmailLogs = () => {
        onOpenEmailLogs?.();
        setShowEmailLogModal(true);
    };

    return (
        <section className="rounded-3xl border border-gray-100 bg-white shadow-sm flex flex-col overflow-hidden h-full min-h-0">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 shrink-0"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}
                <h2 className="text-base font-bold text-gray-900 flex-1 min-w-0">Chi tiết hỗ trợ</h2>
                {showEmailHistory && (
                    <button
                        type="button"
                        onClick={handleOpenEmailLogs}
                        className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                        <History className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Lịch sử gửi email</span>
                        <span className="sm:hidden">Lịch sử</span>
                        {!isLoadingEmailLogs && (emailLogs?.length ?? 0) > 0 && (
                            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                                {emailLogs!.length}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {/* Toàn bộ nội dung scroll — reply nằm trong luồng, không cố định */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-2xl px-4 py-3">
                        <p className="text-[11px] text-gray-400 font-medium mb-1">Email</p>
                        <p className="text-sm text-gray-800 font-medium">{thread.email}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl px-4 py-3">
                        <p className="text-[11px] text-gray-400 font-medium mb-1">Tên</p>
                        <p className="text-sm text-gray-800 font-medium">{thread.name}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl px-4 py-3">
                        <p className="text-[11px] text-gray-400 font-medium mb-1">Category</p>
                        <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700">
                            {thread.category}
                        </span>
                    </div>
                    <div className="bg-gray-50 rounded-2xl px-4 py-3">
                        <p className="text-[11px] text-gray-400 font-medium mb-1">Status</p>
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[thread.status]}`}>
                            {STATUS_LABEL[thread.status]}
                        </span>
                    </div>
                    <div className="bg-gray-50 rounded-2xl px-4 py-3 sm:col-span-2">
                        <p className="text-[11px] text-gray-400 font-medium mb-1">Thời gian</p>
                        <p className="text-sm text-gray-700">{firstUserTime}</p>
                    </div>
                </div>

                {isLoadingMessages ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <>
                        {/* Nội dung user */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                                    <MessageSquare className="w-3 h-3" />
                                    NỘI DUNG
                                </span>
                            </div>
                            <div className="bg-gray-50 rounded-2xl px-5 py-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {firstUserMsg?.message ?? thread.message}
                            </div>
                        </div>

                        {/* Reply — ngay dưới nội dung, trên các lần đã phản hồi */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 text-[11px] font-bold px-3 py-1 rounded-full">
                                    <Mail className="w-3 h-3" />
                                    REPLY
                                </span>
                            </div>
                            <textarea
                                value={replyDraft}
                                onChange={(e) => onReplyDraftChange(e.target.value)}
                                placeholder={adminReplies.length > 0
                                    ? "Nhập nội dung phản hồi tiếp theo..."
                                    : "Nhập nội dung phản hồi cho user..."}
                                rows={4}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 outline-none resize-none focus:border-orange-300 focus:bg-white transition placeholder:text-gray-400 leading-relaxed"
                                style={{ maxHeight: 200 }}
                                onInput={(e) => {
                                    const el = e.currentTarget;
                                    el.style.height = "auto";
                                    el.style.height = Math.min(el.scrollHeight, 200) + "px";
                                }}
                            />
                            <button
                                type="button"
                                onClick={onSendReply}
                                disabled={isSendingReply || !replyDraft.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#D84315] hover:bg-[#BF360C] text-white text-sm font-bold shadow-md shadow-orange-200 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Gửi phản hồi
                            </button>
                        </div>

                        {/* Các lần admin đã phản hồi */}
                        {adminReplies.map((reply, idx) => (
                            <div key={idx}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 text-[11px] font-bold px-3 py-1 rounded-full">
                                        <MessageSquare className="w-3 h-3" />
                                        NỘI DUNG ĐÃ PHẢN HỒI
                                    </span>
                                    <span className="text-xs text-gray-400">{reply.createdAt}</span>
                                </div>
                                <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                    {reply.message}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {showEmailHistory && (
                <SupportEmailLogModal
                    open={showEmailLogModal}
                    onClose={() => setShowEmailLogModal(false)}
                    logs={emailLogs ?? []}
                    isLoading={isLoadingEmailLogs}
                    ticketId={thread.id}
                />
            )}
        </section>
    );
}
