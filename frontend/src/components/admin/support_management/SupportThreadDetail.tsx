import { Send, Loader2, User, ChevronLeft } from "lucide-react";
import { type SupportThread, STATUS_STYLE, STATUS_LABEL } from "./supportTypes.ts";

type SupportThreadDetailProps = {
    thread: SupportThread | null;
    replyDraft: string;
    onReplyDraftChange: (value: string) => void;
    onSendReply: () => void;
    isSendingReply?: boolean;
    onBack?: () => void; // mobile: quay về list
};

function AvatarPlaceholder({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
    const initials = name.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();
    const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-10 h-10 text-sm" : "w-9 h-9 text-sm";
    const colors = ["bg-orange-400", "bg-blue-400", "bg-violet-400", "bg-emerald-400", "bg-rose-400"];
    return (
        <div className={`${sz} ${colors[name.charCodeAt(0) % colors.length]} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
            {initials}
        </div>
    );
}

export default function SupportThreadDetail({
    thread,
    replyDraft,
    onReplyDraftChange,
    onSendReply,
    isSendingReply = false,
    onBack,
}: SupportThreadDetailProps) {
    if (!thread) return null;

    const isLoadingMessages = !thread.messages;

    return (
        <section className="rounded-3xl border border-gray-100 bg-white shadow-sm flex flex-col overflow-hidden h-full">

            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 shrink-0"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}
                <AvatarPlaceholder name={thread.name} size="lg" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-gray-900 truncate">{thread.category}</h2>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[thread.status]}`}>
                            {STATUS_LABEL[thread.status]}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {thread.name}
                        <span className="mx-1.5">·</span>
                        {thread.email}
                        <span className="mx-1.5">·</span>
                        {thread.createdAt}
                    </p>
                </div>
            </div>

            {/* Messages — giống ChatSupportPage */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {isLoadingMessages ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                ) : thread.messages!.map((msg, idx) => {
                    const isAdmin = msg.senderType === "ADMIN";
                    const showDivider = idx > 0 && thread.messages![idx - 1].senderType !== msg.senderType && isAdmin;
                    return (
                        <div key={idx}>
                            {showDivider && (
                                <div className="flex items-center gap-3 my-3">
                                    <div className="flex-1 h-px bg-gray-100" />
                                    <span className="text-[11px] text-gray-400">Phản hồi từ admin</span>
                                    <div className="flex-1 h-px bg-gray-100" />
                                </div>
                            )}
                            <div className={`flex items-end gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                                {isAdmin ? (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0">
                                        <User className="w-3.5 h-3.5 text-white" />
                                    </div>
                                ) : (
                                    <AvatarPlaceholder name={thread.name} size="sm" />
                                )}
                                <div className={`max-w-[70%] flex flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}>
                                    <span className="text-[11px] text-gray-400">
                                        {isAdmin ? `Admin · ${msg.createdAt}` : `${thread.name} · ${msg.createdAt}`}
                                    </span>
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm border border-gray-100 ${
                                        isAdmin ? "bg-orange-50 rounded-br-sm" : "bg-white rounded-bl-sm"
                                    }`}>
                                        {msg.message}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input — giống ChatSupportPage */}
            {!isLoadingMessages && (
                <div className="px-4 pt-3 pb-4 border-t border-gray-100 shrink-0">
                    <div className="flex items-end gap-3">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-orange-300 focus-within:bg-white transition">
                            <textarea
                                value={replyDraft}
                                onChange={(e) => onReplyDraftChange(e.target.value)}
                                placeholder={thread.messages!.some((m) => m.senderType === "ADMIN")
                                    ? "Nhập nội dung phản hồi tiếp theo..."
                                    : "Nhập nội dung phản hồi cho user..."}
                                rows={1}
                                className="w-full bg-transparent text-sm text-gray-700 outline-none resize-none overflow-hidden placeholder:text-gray-400 leading-relaxed"
                                style={{ maxHeight: 120 }}
                                onInput={(e) => {
                                    const el = e.currentTarget;
                                    el.style.height = "auto";
                                    el.style.height = Math.min(el.scrollHeight, 120) + "px";
                                }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={onSendReply}
                            disabled={isSendingReply || !replyDraft.trim()}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#D84315] hover:bg-[#BF360C] text-white text-sm font-bold shadow-md shadow-orange-200 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                            {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Gửi
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
