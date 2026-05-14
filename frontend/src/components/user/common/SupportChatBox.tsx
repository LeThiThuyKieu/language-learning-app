import { useEffect, useRef, useState } from "react";
import {
    Send, X, ChevronLeft, Loader2,
    GraduationCap, User, BookOpen, Wrench, MessageCircle,
    MessageSquarePlus, XCircle, Bot,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { supportService } from "@/services/supportService";
import { useSupportSocket } from "@/hooks/useSupportSocket";
import { toast } from "react-hot-toast";
import type { SupportThread } from "@/components/admin/support_management/supportTypes";

type Step = "category" | "suggest" | "chat";

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

const LS_TICKET_ID  = "support_chat_ticket_id";
const LS_CATEGORY   = "support_chat_category";

interface SupportChatBoxProps {
    onClose: () => void;
}

export function SupportChatBox({ onClose }: SupportChatBoxProps) {
    const { isAuthenticated } = useAuthStore();

    const savedCategory = (() => {
        try { return JSON.parse(localStorage.getItem(LS_CATEGORY) ?? "null") as Category | null; }
        catch { return null; }
    })();
    const savedTicketId = localStorage.getItem(LS_TICKET_ID);

    const [step, setStep]                         = useState<Step>(savedTicketId ? "chat" : "category");
    const [categories, setCategories]             = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(savedCategory);
    const [ticket, setTicket]                     = useState<SupportThread | null>(null);
    const [suggestedTickets, setSuggestedTickets] = useState<SupportThread[]>([]);
    const [draft, setDraft]                       = useState("");
    const [isSending, setIsSending]               = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
    const [isRestoringTicket, setIsRestoringTicket] = useState(!!savedTicketId);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef    = useRef<HTMLTextAreaElement>(null);

    /** WebSocket: nhận tin nhắn realtime từ admin/bot */
    useSupportSocket({
        ticketId: step === "chat" && isAuthenticated ? (ticket?.id ?? null) : null,
        onUpdate: (updated) => setTicket(updated),
    });

    /** Load categories */
    useEffect(() => {
        supportService.getCategories()
            .then(setCategories)
            .catch(() => setCategories([
                { id: 1, displayName: "Bắt đầu học", colorBg: "bg-orange-100",  colorText: "text-orange-700" },
                { id: 2, displayName: "Tài khoản",   colorBg: "bg-blue-100",    colorText: "text-blue-700" },
                { id: 3, displayName: "Bài học",     colorBg: "bg-emerald-100", colorText: "text-emerald-700" },
                { id: 4, displayName: "Kỹ thuật",    colorBg: "bg-violet-100",  colorText: "text-violet-700" },
                { id: 5, displayName: "Khác",        colorBg: "bg-gray-100",    colorText: "text-gray-700" },
            ]))
            .finally(() => setIsLoadingCategories(false));
    }, []);

    /** Khôi phục ticket từ localStorage sau reload */
    useEffect(() => {
        if (!savedTicketId || !isAuthenticated) {
            setIsRestoringTicket(false);
            return;
        }
        supportService.getMyTicketDetail(Number(savedTicketId))
            .then((detail) => { setTicket(detail); setStep("chat"); })
            .catch(() => {
                clearChatStorage();
                setStep("category");
                setSelectedCategory(null);
            })
            .finally(() => setIsRestoringTicket(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** Auto-scroll khi có tin nhắn mới */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket?.messages]);

    const clearChatStorage = () => {
        localStorage.removeItem(LS_TICKET_ID);
        localStorage.removeItem(LS_CATEGORY);
    };

    const saveChatStorage = (ticketId: number, cat: Category) => {
        localStorage.setItem(LS_TICKET_ID, String(ticketId));
        localStorage.setItem(LS_CATEGORY, JSON.stringify(cat));
    };

    const goBackToCategory = () => {
        clearChatStorage();
        setStep("category");
        setTicket(null);
        setSelectedCategory(null);
        setSuggestedTickets([]);
    };

    const handleSelectCategory = async (cat: Category) => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để sử dụng chat hỗ trợ");
            return;
        }
        if (savedTicketId && savedCategory?.id === cat.id) {
            setSelectedCategory(cat);
            setStep("chat");
            return;
        }
        clearChatStorage();
        setTicket(null);
        setSelectedCategory(cat);
        localStorage.setItem(LS_CATEGORY, JSON.stringify(cat));
        setIsLoadingSuggest(true);
        try {
            const active = await supportService.getActiveTicketsByCategory(cat.id);
            if (active.length > 0) { setSuggestedTickets(active); setStep("suggest"); }
            else setStep("chat");
        } catch { setStep("chat"); }
        finally { setIsLoadingSuggest(false); }
    };

    const handleContinueTicket = async (t: SupportThread) => {
        setIsLoadingSuggest(true);
        try {
            const detail = await supportService.getMyTicketDetail(t.id);
            setTicket(detail);
            saveChatStorage(t.id, selectedCategory!);
            setStep("chat");
        } catch { toast.error("Không thể tải ticket, vui lòng thử lại"); }
        finally { setIsLoadingSuggest(false); }
    };

    const handleNewTicket = () => { setSuggestedTickets([]); setStep("chat"); };

    /**
     * Hybrid flow:
     * 1. Match chatbot keyword
     * 2. Tạo ticket với user message + botResponse (nếu match)
     *    → Backend lưu: USER message + BOT message vào DB
     * 3. Admin thấy đầy đủ conversation trong dashboard
     */
    const handleSend = async () => {
        if (!draft.trim() || isSending) return;
        const text = draft.trim();
        setDraft("");
        setIsSending(true);
        try {
            if (!ticket) {
                // Bước 1: match chatbot
                let botResponse: string | undefined;
                try {
                    const match = await supportService.matchChatbot(text, selectedCategory?.id);
                    if (match.matched && match.botResponse) botResponse = match.botResponse;
                } catch { /* lỗi match → bỏ qua, tạo ticket bình thường */ }

                // Bước 2: tạo ticket, kèm botResponse nếu có
                const result = await supportService.createUserTicket(
                    selectedCategory!.displayName,
                    text,
                    "CHAT",
                    botResponse,
                );
                const detail = await supportService.getMyTicketDetail(result.id);
                setTicket(detail);
                saveChatStorage(result.id, selectedCategory!);
            } else {
                if (ticket.status === "CLOSED") {
                    toast.error("Ticket này đã đóng. Vui lòng tạo ticket mới.");
                    setDraft(text);
                    return;
                }
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

    const isClosed = ticket?.status === "CLOSED";

    return (
        <div className="mb-3 flex h-[480px] w-[min(calc(100vw-3rem),380px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/90">

            {/* Header */}
            <div className="flex items-center justify-between border-b bg-primary-600 px-4 py-3 text-white shrink-0">
                <div className="flex items-center gap-2">
                    {(step === "suggest" || step === "chat") && (
                        <button onClick={goBackToCategory} className="p-1 rounded-lg hover:bg-white/20 transition">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    )}
                    <div>
                        <p className="text-sm font-bold">
                            {step === "category" ? "Chat hỗ trợ"
                                : step === "suggest" ? `${selectedCategory?.displayName} — Ticket cũ`
                                : selectedCategory?.displayName ?? "Hỗ trợ"}
                        </p>
                        <p className="text-xs flex items-center gap-1 text-white/85">
                            <span className="h-2 w-2 rounded-full bg-green-400" />
                            {step === "category" ? "Chọn chủ đề để bắt đầu"
                                : step === "suggest" ? "Tiếp tục hoặc tạo mới"
                                : "Phản hồi trong vài phút"}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition">
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* ── Bước 1: Chọn category ── */}
            {step === "category" && (
                <div className="flex-1 overflow-y-auto p-4">
                    <p className="text-sm text-slate-500 mb-4 text-center">Bạn cần hỗ trợ về vấn đề gì?</p>
                    {isLoadingCategories || isLoadingSuggest ? (
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
                                        onClick={() => void handleSelectCategory(cat)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-transparent
                                            ${cat.colorBg} hover:border-primary-300 hover:shadow-md transition-all active:scale-95`}
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

            {/* ── Bước 2: Gợi ý ticket cũ ── */}
            {step === "suggest" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoadingSuggest ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-slate-600 font-medium">
                                Bạn có ticket đang mở về <strong>{selectedCategory?.displayName}</strong>:
                            </p>
                            {suggestedTickets.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => void handleContinueTicket(t)}
                                    className="w-full text-left p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 transition-all"
                                >
                                    <span className="text-[10px] text-slate-400">{t.createdAt}</span>
                                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">{t.message}</p>
                                    <p className="text-[11px] text-primary-600 font-semibold mt-1.5">Tiếp tục cuộc hội thoại →</p>
                                </button>
                            ))}
                            <button
                                onClick={handleNewTicket}
                                className="w-full flex items-center gap-2 p-3 rounded-2xl border-2 border-dashed border-gray-200 text-slate-500 hover:border-primary-300 hover:text-primary-600 hover:bg-orange-50 transition-all"
                            >
                                <MessageSquarePlus className="w-4 h-4 shrink-0" />
                                <span className="text-xs font-semibold">Tạo yêu cầu hỗ trợ mới</span>
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ── Bước 3: Chat ── */}
            {step === "chat" && (
                <>
                    <div className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3 space-y-3">
                        {isRestoringTicket ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <>
                                {/* Tin nhắn chào mừng */}
                                <div className="flex justify-start">
                                    <div className="flex items-start gap-1.5 max-w-[85%]">
                                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                                            <Bot className="w-3.5 h-3.5 text-primary-600" />
                                        </div>
                                        <div className="px-3 py-2 text-sm bg-white border rounded-2xl rounded-bl-sm shadow-sm text-slate-700">
                                            Xin chào! Bạn đang ở mục hỗ trợ <strong>{selectedCategory?.displayName}</strong>. Hãy nhắn câu hỏi để mình hỗ trợ bạn nhé!
                                        </div>
                                    </div>
                                </div>

                                {/* Banner ticket đã đóng */}
                                {isClosed && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-xs text-gray-500">
                                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                                        Ticket này đã đóng. Bấm ← để tạo yêu cầu mới.
                                    </div>
                                )}

                                {/* Messages từ DB — USER / BOT / ADMIN */}
                                {ticket?.messages?.map((msg, idx) => {
                                    const isUser  = msg.senderType === "USER";
                                    const isBot   = msg.senderType === "BOT";
                                    const isAdmin = msg.senderType === "ADMIN";

                                    if (isUser) return (
                                        <div key={idx} className="flex justify-end">
                                            <div className="max-w-[85%] px-3 py-2 text-sm bg-primary-600 text-white rounded-2xl rounded-br-sm">
                                                {msg.message}
                                                <p className="text-[10px] text-white/70 text-right mt-1">{msg.createdAt}</p>
                                            </div>
                                        </div>
                                    );

                                    if (isBot) return (
                                        <div key={idx} className="flex justify-start">
                                            <div className="flex items-start gap-1.5 max-w-[85%]">
                                                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Bot className="w-3.5 h-3.5 text-primary-600" />
                                                </div>
                                                <div className="px-3 py-2 text-sm bg-white border border-primary-100 rounded-2xl rounded-bl-sm shadow-sm text-slate-700 whitespace-pre-line">
                                                    {msg.message}
                                                    <p className="text-[10px] text-slate-400 mt-1">Trả lời tự động · {msg.createdAt}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );

                                    if (isAdmin) return (
                                        <div key={idx} className="flex justify-start">
                                            <div className="flex items-start gap-1.5 max-w-[85%]">
                                                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                                                    <User className="w-3.5 h-3.5 text-orange-600" />
                                                </div>
                                                <div className="px-3 py-2 text-sm bg-white border rounded-2xl rounded-bl-sm shadow-sm text-slate-700">
                                                    {msg.message}
                                                    <p className="text-[10px] text-slate-400 mt-1">Admin · {msg.createdAt}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );

                                    return null;
                                })}

                                {/* Indicator đang gửi */}
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
                    {!isClosed && (
                        <div className="border-t bg-white p-3 shrink-0">
                            <div className="flex gap-2 items-end">
                                <textarea
                                    ref={textareaRef}
                                    value={draft}
                                    onChange={handleDraftChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={ticket ? "Nhập tin nhắn tiếp theo..." : "Nhập câu hỏi của bạn..."}
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
                    )}
                </>
            )}
        </div>
    );
}
