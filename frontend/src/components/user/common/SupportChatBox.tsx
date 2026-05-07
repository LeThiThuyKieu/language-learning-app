import { useEffect, useRef, useState } from "react";
import { Send, X, ChevronLeft, Loader2, GraduationCap, User, BookOpen, Wrench, MessageCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { supportService } from "@/services/supportService";
import { toast } from "react-hot-toast";
import type { SupportThread } from "@/components/admin/support_management/supportTypes";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = "category" | "chat";

interface Category {
    id: number;
    displayName: string;
    colorBg: string;
    colorText: string;
}

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
    "Bắt đầu học": GraduationCap,
    "Tài khoản":   User,
    "Bài học":     BookOpen,
    "Kỹ thuật":    Wrench,
    "Khác":        MessageCircle,
};

// ─── LocalStorage keys ────────────────────────────────────────────────────────
const LS_TICKET_ID  = "support_chat_ticket_id";
const LS_CATEGORY   = "support_chat_category";
const LS_AUTO_REPLY = "support_chat_auto_reply";

// ─── Props ────────────────────────────────────────────────────────────────────
interface SupportChatBoxProps {
    onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function SupportChatBox({ onClose }: SupportChatBoxProps) {
    const { isAuthenticated } = useAuthStore();

    // Khôi phục từ localStorage
    const savedCategory = (() => {
        try { return JSON.parse(localStorage.getItem(LS_CATEGORY) ?? "null") as Category | null; }
        catch { return null; }
    })();
    const savedTicketId = localStorage.getItem(LS_TICKET_ID);
    const savedAutoReply = localStorage.getItem(LS_AUTO_REPLY);

    const [step, setStep] = useState<Step>(savedTicketId ? "chat" : "category");
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(savedCategory);
    const [ticket, setTicket] = useState<SupportThread | null>(null);
    const [draft, setDraft] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isRestoringTicket, setIsRestoringTicket] = useState(!!savedTicketId);
    const [autoReply, setAutoReply] = useState<string | null>(savedAutoReply);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load categories
    useEffect(() => {
        supportService.getCategories()
            .then(setCategories)
            .catch(() => setCategories([
                { id: 1, displayName: "Bắt đầu học", colorBg: "bg-orange-100", colorText: "text-orange-700" },
                { id: 2, displayName: "Tài khoản",   colorBg: "bg-blue-100",   colorText: "text-blue-700" },
                { id: 3, displayName: "Bài học",     colorBg: "bg-emerald-100", colorText: "text-emerald-700" },
                { id: 4, displayName: "Kỹ thuật",    colorBg: "bg-violet-100", colorText: "text-violet-700" },
                { id: 5, displayName: "Khác",        colorBg: "bg-gray-100",   colorText: "text-gray-700" },
            ]))
            .finally(() => setIsLoadingCategories(false));
    }, []);

    // Khôi phục ticket từ API nếu có ticketId trong localStorage
    useEffect(() => {
        if (!savedTicketId || !isAuthenticated) {
            setIsRestoringTicket(false);
            return;
        }
        supportService.getMyTicketDetail(Number(savedTicketId))
            .then((detail) => {
                setTicket(detail);
                setStep("chat");
            })
            .catch(() => {
                // Ticket không còn tồn tại hoặc lỗi → xóa cache, về màn chọn category
                clearChatStorage();
                setStep("category");
                setSelectedCategory(null);
                setAutoReply(null);
            })
            .finally(() => setIsRestoringTicket(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket?.messages]);

    // Poll tin nhắn mới từ admin mỗi 10s
    useEffect(() => {
        if (step !== "chat" || !ticket || !isAuthenticated) return;
        pollRef.current = setInterval(async () => {
            try {
                const updated = await supportService.getMyTicketDetail(ticket.id);
                setTicket(updated);
            } catch { /* bỏ qua */ }
        }, 10_000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [step, ticket?.id, isAuthenticated]);

    useEffect(() => {
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const clearChatStorage = () => {
        localStorage.removeItem(LS_TICKET_ID);
        localStorage.removeItem(LS_CATEGORY);
        localStorage.removeItem(LS_AUTO_REPLY);
    };

    const saveChatStorage = (ticketId: number, cat: Category, reply: string) => {
        localStorage.setItem(LS_TICKET_ID, String(ticketId));
        localStorage.setItem(LS_CATEGORY, JSON.stringify(cat));
        localStorage.setItem(LS_AUTO_REPLY, reply);
    };

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleSelectCategory = (cat: Category) => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để sử dụng chat hỗ trợ");
            return;
        }
        // Chọn category mới → xóa ticket cũ
        clearChatStorage();
        setTicket(null);
        setAutoReply(null);
        setSelectedCategory(cat);
        localStorage.setItem(LS_CATEGORY, JSON.stringify(cat));
        setStep("chat");
    };

    const handleSend = async () => {
        if (!draft.trim() || isSending) return;
        const text = draft.trim();
        setDraft("");
        setIsSending(true);
        try {
            if (!ticket) {
                // Tin nhắn đầu tiên → tạo ticket
                const result = await supportService.createUserTicket(
                    selectedCategory!.displayName,
                    text,
                    "CHAT"
                );
                const detail = await supportService.getMyTicketDetail(result.id);
                setTicket(detail);

                const reply = "Cảm ơn bạn đã liên hệ hỗ trợ 💬 Yêu cầu của bạn đã được gửi thành công. Admin sẽ phản hồi trong thời gian sớm nhất. Vui lòng chờ trong giây lát nhé!";
                setAutoReply(reply);
                saveChatStorage(result.id, selectedCategory!, reply);
            } else {
                const updated = await supportService.sendUserMessage(ticket.id, text);
                setTicket(updated);
            }
        } catch {
            toast.error("Không thể gửi tin nhắn, vui lòng thử lại");
            setDraft(text);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); }
    };

    const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraft(e.target.value);
        const el = textareaRef.current;
        if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 100) + "px"; }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="mb-3 flex h-[480px] w-[min(calc(100vw-3rem),380px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/90">

            {/* Header */}
            <div className="flex items-center justify-between border-b bg-primary-600 px-4 py-3 text-white shrink-0">
                <div className="flex items-center gap-2">
                    {step === "chat" && (
                        <button
                            onClick={() => {
                                clearChatStorage();
                                setStep("category");
                                setTicket(null);
                                setSelectedCategory(null);
                                setAutoReply(null);
                            }}
                            className="p-1 rounded-lg hover:bg-white/20 transition"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    )}
                    <div>
                        <p className="text-sm font-bold">
                            {step === "category" ? "Chat hỗ trợ" : selectedCategory?.displayName ?? "Hỗ trợ"}
                        </p>
                        <p className="text-xs flex items-center gap-1 text-white/85">
                            <span className="h-2 w-2 rounded-full bg-green-400" />
                            {step === "category" ? "Chọn chủ đề để bắt đầu" : "Phản hồi trong vài phút"}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition">
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Bước 1: Chọn category */}
            {step === "category" && (
                <div className="flex-1 overflow-y-auto p-4">
                    <p className="text-sm text-slate-500 mb-4 text-center">
                        Bạn cần hỗ trợ về vấn đề gì?
                    </p>
                    {isLoadingCategories ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                            {categories.map((cat) => {
                                const Icon = CATEGORY_ICON_MAP[cat.displayName] ?? MessageCircle;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleSelectCategory(cat)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-transparent
                                            ${cat.colorBg} hover:border-primary-300 hover:shadow-md
                                            transition-all active:scale-95`}
                                    >
                                        <Icon className={`w-6 h-6 ${cat.colorText}`} strokeWidth={1.8} />
                                        <span className={`text-xs font-semibold text-center ${cat.colorText}`}>
                                            {cat.displayName}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {!isAuthenticated && (
                        <p className="text-xs text-slate-400 text-center mt-4">
                            Vui lòng{" "}
                            <a href="/login" className="text-primary-600 font-semibold hover:underline">đăng nhập</a>{" "}
                            để sử dụng chat hỗ trợ
                        </p>
                    )}
                </div>
            )}

            {/* Bước 2: Chat */}
            {step === "chat" && (
                <>
                    <div className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3 space-y-3">
                        {/* Đang khôi phục ticket */}
                        {isRestoringTicket ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <>
                                {/* Tin nhắn chào mừng UI */}
                                <div className="flex justify-start">
                                    <div className="max-w-[85%] px-3 py-2 text-sm bg-white border rounded-2xl rounded-bl-sm shadow-sm text-slate-700">
                                        Xin chào! Bạn đang ở mục hỗ trợ <strong>{selectedCategory?.displayName}</strong>. Hãy nhắn câu hỏi hoặc vấn đề bạn gặp phải để admin hỗ trợ bạn nhé!
                                    </div>
                                </div>

                                {ticket?.messages?.map((msg, idx) => {
                                    const isUser = msg.senderType === "USER";
                                    return (
                                        <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[85%] px-3 py-2 text-sm ${
                                                isUser
                                                    ? "bg-primary-600 text-white rounded-2xl rounded-br-sm"
                                                    : "bg-white border rounded-2xl rounded-bl-sm shadow-sm text-slate-700"
                                            }`}>
                                                {msg.message}
                                                <p className={`text-[10px] mt-1 ${isUser ? "text-white/70 text-right" : "text-slate-400"}`}>
                                                    {msg.createdAt}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Tin nhắn tự động sau khi gửi lần đầu */}
                                {autoReply && (
                                    <div className="flex justify-start">
                                        <div className="max-w-[85%] px-3 py-2 text-sm bg-white border rounded-2xl rounded-bl-sm shadow-sm text-slate-700">
                                            {autoReply}
                                        </div>
                                    </div>
                                )}

                                {isSending && (
                                    <div className="flex justify-end">
                                        <div className="px-3 py-2 text-sm bg-primary-600/60 text-white rounded-2xl rounded-br-sm">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t bg-white p-3 shrink-0">
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={textareaRef}
                                value={draft}
                                onChange={handleDraftChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập tin nhắn..."
                                rows={1}
                                className="flex-1 resize-none overflow-hidden rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-400 transition"
                                style={{ maxHeight: 100 }}
                            />
                            <button
                                onClick={() => void handleSend()}
                                disabled={!draft.trim() || isSending || isRestoringTicket}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
