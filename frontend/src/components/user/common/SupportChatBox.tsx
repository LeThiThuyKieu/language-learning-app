import { useEffect, useRef, useState } from "react";
import {
    Send, X, ChevronLeft, Loader2,
    GraduationCap, User, BookOpen, Wrench, MessageCircle,
    MessageSquarePlus, Clock, CheckCircle, XCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { supportService } from "@/services/supportService";
import { useSupportSocket } from "@/hooks/useSupportSocket";
import { toast } from "react-hot-toast";
import type { SupportThread } from "@/components/admin/support_management/supportTypes";

/** Các bước trong luồng chat hỗ trợ */
type Step =
    | "category"  // Bước 1: chọn chủ đề
    | "suggest"   // Bước 2: gợi ý ticket cũ còn mở
    | "chat";     // Bước 3: chat

interface Category {
    id: number;
    displayName: string;
    colorBg: string;
    colorText: string;
}

/** Map tên category → icon tương ứng */
const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
    "Bắt đầu học": GraduationCap,
    "Tài khoản":   User,
    "Bài học":     BookOpen,
    "Kỹ thuật":    Wrench,
    "Khác":        MessageCircle,
};

/** Style badge cho từng trạng thái ticket */
const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    OPEN:        { label: "Open",        className: "bg-rose-100 text-rose-700",       icon: Clock },
    IN_PROGRESS: { label: "In Progress", className: "bg-amber-100 text-amber-700",     icon: Clock },
    RESOLVED:    { label: "Resolved",    className: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    CLOSED:      { label: "Closed",      className: "bg-gray-100 text-gray-500",       icon: XCircle },
};

/** Keys lưu trạng thái chat vào localStorage để khôi phục khi reload */
const LS_TICKET_ID  = "support_chat_ticket_id";
const LS_CATEGORY   = "support_chat_category";
const LS_AUTO_REPLY = "support_chat_auto_reply";

interface SupportChatBoxProps {
    onClose: () => void;
}

export function SupportChatBox({ onClose }: SupportChatBoxProps) {
    const { isAuthenticated } = useAuthStore();

    // Đọc dữ liệu đã lưu từ localStorage khi component mount
    const savedCategory = (() => {
        try { return JSON.parse(localStorage.getItem(LS_CATEGORY) ?? "null") as Category | null; }
        catch { return null; }
    })();
    const savedTicketId  = localStorage.getItem(LS_TICKET_ID);
    const savedAutoReply = localStorage.getItem(LS_AUTO_REPLY);

    // Nếu đã có ticketId trong localStorage → bỏ qua bước chọn category, vào thẳng chat
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
    const [autoReply, setAutoReply]               = useState<string | null>(savedAutoReply);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef   = useRef<HTMLTextAreaElement>(null);

    /** WebSocket: nhận tin nhắn realtime từ admin */
    useSupportSocket({
        ticketId: step === "chat" && isAuthenticated ? (ticket?.id ?? null) : null,
        onUpdate: (updated) => setTicket(updated), // cập nhật ticket khi có tin mới
    });

    /** Tải danh sách category từ API khi component mount, fallback về danh sách cứng nếu lỗi */
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

    /** Khôi phục ticket từ API nếu có ticketId trong localStorage (sau khi reload trang) */
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
                // Ticket không còn tồn tại hoặc hết quyền → xóa storage, về bước chọn category
                clearChatStorage();
                setStep("category");
                setSelectedCategory(null);
                setAutoReply(null);
            })
            .finally(() => setIsRestoringTicket(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** Tự động scroll xuống tin nhắn mới nhất mỗi khi danh sách messages thay đổi */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket?.messages]);

    /** Xóa toàn bộ dữ liệu chat đã lưu trong localStorage */
    const clearChatStorage = () => {
        localStorage.removeItem(LS_TICKET_ID);
        localStorage.removeItem(LS_CATEGORY);
        localStorage.removeItem(LS_AUTO_REPLY);
    };

    /** Lưu ticketId, category và auto-reply vào localStorage để khôi phục sau reload */
    const saveChatStorage = (ticketId: number, cat: Category, reply: string) => {
        localStorage.setItem(LS_TICKET_ID, String(ticketId));
        localStorage.setItem(LS_CATEGORY, JSON.stringify(cat));
        localStorage.setItem(LS_AUTO_REPLY, reply);
    };

    /** Quay về bước chọn category, reset toàn bộ state và xóa localStorage */
    const goBackToCategory = () => {
        clearChatStorage();
        setStep("category");
        setTicket(null);
        setSelectedCategory(null);
        setAutoReply(null);
        setSuggestedTickets([]);
    };

    /**
     * Xử lý khi user chọn một category:
     * - Nếu đã có ticket cũ cùng category → vào thẳng chat
     * - Nếu có ticket đang mở cùng category → hiện bước suggest
     * - Nếu không có → vào thẳng bước chat để tạo mới
     */
    const handleSelectCategory = async (cat: Category) => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để sử dụng chat hỗ trợ");
            return;
        }

        // Đang có ticket cũ cùng category trong localStorage → không cần check lại
        if (savedTicketId && savedCategory?.id === cat.id) {
            setSelectedCategory(cat);
            setStep("chat");
            return;
        }

        // Chọn category khác → xóa storage cũ
        clearChatStorage();
        setTicket(null);
        setAutoReply(null);
        setSelectedCategory(cat);
        localStorage.setItem(LS_CATEGORY, JSON.stringify(cat));

        setIsLoadingSuggest(true);
        try {
            const active = await supportService.getActiveTicketsByCategory(cat.id);
            if (active.length > 0) {
                setSuggestedTickets(active); // có ticket cũ → hiện bước suggest
                setStep("suggest");
            } else {
                setStep("chat"); // không có → tạo mới
            }
        } catch {
            setStep("chat"); // lỗi API → vẫn cho vào chat
        } finally {
            setIsLoadingSuggest(false);
        }
    };

    /** Tiếp tục một ticket cũ đã chọn từ bước suggest */
    const handleContinueTicket = async (t: SupportThread) => {
        setIsLoadingSuggest(true);
        try {
            const detail = await supportService.getMyTicketDetail(t.id);
            setTicket(detail);
            const reply = "Cảm ơn bạn đã liên hệ hỗ trợ 💬 Yêu cầu của bạn đã được gửi thành công. Admin sẽ phản hồi trong thời gian sớm nhất. Vui lòng chờ trong giây lát nhé!";
            setAutoReply(reply);
            saveChatStorage(t.id, selectedCategory!, reply);
            setStep("chat");
        } catch {
            toast.error("Không thể tải ticket, vui lòng thử lại");
        } finally {
            setIsLoadingSuggest(false);
        }
    };

    /** Bỏ qua suggest, tạo ticket mới */
    const handleNewTicket = () => {
        setSuggestedTickets([]);
        setStep("chat");
    };

    /**
     * Gửi tin nhắn:
     * - Nếu chưa có ticket → tạo ticket mới với tin nhắn đầu tiên
     * - Nếu đã có ticket → gửi follow-up message
     */
    const handleSend = async () => {
        if (!draft.trim() || isSending) return;
        const text = draft.trim();
        setDraft("");
        setIsSending(true);
        try {
            if (!ticket) {
                // Tin nhắn đầu tiên → tạo ticket mới
                const result = await supportService.createUserTicket(
                    selectedCategory!.displayName,
                    text,
                    "CHAT",
                );
                const detail = await supportService.getMyTicketDetail(result.id);
                setTicket(detail);
                const reply = "Cảm ơn bạn đã liên hệ hỗ trợ 💬 Yêu cầu của bạn đã được gửi thành công. Admin sẽ phản hồi trong thời gian sớm nhất. Vui lòng chờ trong giây lát nhé!";
                setAutoReply(reply);
                saveChatStorage(result.id, selectedCategory!, reply);
            } else {
                if (ticket.status === "CLOSED") {
                    // Ticket đã đóng → không cho gửi
                    toast.error("Ticket này đã đóng. Vui lòng tạo ticket mới.");
                    setDraft(text);
                    return;
                }
                const updated = await supportService.sendUserMessage(ticket.id, text);
                setTicket(updated);
            }
        } catch {
            toast.error("Không thể gửi tin nhắn, vui lòng thử lại");
            setDraft(text); // khôi phục draft nếu gửi thất bại
        } finally {
            setIsSending(false);
        }
    };

    /** Enter gửi tin nhắn, Shift+Enter xuống dòng */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); }
    };

    /** Tự động resize textarea theo nội dung, tối đa 100px */
    const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraft(e.target.value);
        const el = textareaRef.current;
        if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 100) + "px"; }
    };

    const isClosed = ticket?.status === "CLOSED"; // ẩn input nếu ticket đã đóng

    return (
        <div className="mb-3 flex h-[480px] w-[min(calc(100vw-3rem),380px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/90">

            {/* Header — hiển thị tên bước hiện tại và nút đóng */}
            <div className="flex items-center justify-between border-b bg-primary-600 px-4 py-3 text-white shrink-0">
                <div className="flex items-center gap-2">
                    {/* Nút quay lại — chỉ hiện ở bước suggest và chat */}
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
                            <span className="h-2 w-2 rounded-full bg-green-400" /> {/* dot online */}
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
                    <p className="text-sm text-slate-500 mb-4 text-center">
                        Bạn cần hỗ trợ về vấn đề gì?
                    </p>
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
                    {/* Nhắc đăng nhập nếu chưa auth */}
                    {!isAuthenticated && (
                        <p className="text-xs text-slate-400 text-center mt-4">
                            Vui lòng{" "}
                            <a href="/login" className="text-primary-600 font-semibold hover:underline">đăng nhập</a>{" "}
                            để sử dụng chat hỗ trợ
                        </p>
                    )}
                </div>
            )}

            {/* ── Bước 2: Gợi ý ticket cũ còn mở ── */}
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

                            {/* Danh sách ticket cũ có thể tiếp tục */}
                            {suggestedTickets.map((t) => {
                                const badge    = STATUS_BADGE[t.status] ?? STATUS_BADGE["OPEN"];
                                const BadgeIcon = badge.icon;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => void handleContinueTicket(t)}
                                        className="w-full text-left p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.className}`}>
                                                <BadgeIcon className="w-3 h-3" />
                                                {badge.label}
                                            </span>
                                            <span className="text-[10px] text-slate-400">{t.createdAt}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 line-clamp-2">{t.message}</p>
                                        <p className="text-[11px] text-primary-600 font-semibold mt-1.5">
                                            Tiếp tục cuộc hội thoại →
                                        </p>
                                    </button>
                                );
                            })}

                            {/* Nút tạo ticket mới thay vì tiếp tục ticket cũ */}
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
                    {/* Vùng hiển thị tin nhắn */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3 space-y-3">
                        {isRestoringTicket ? (
                            // Đang khôi phục ticket từ localStorage → hiện spinner
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <>
                                {/* Tin nhắn chào mừng tĩnh (không lưu DB) */}
                                <div className="flex justify-start">
                                    <div className="max-w-[85%] px-3 py-2 text-sm bg-white border rounded-2xl rounded-bl-sm shadow-sm text-slate-700">
                                        Xin chào! Bạn đang ở mục hỗ trợ <strong>{selectedCategory?.displayName}</strong>. Hãy nhắn câu hỏi hoặc vấn đề bạn gặp phải để admin hỗ trợ bạn nhé!
                                    </div>
                                </div>

                                {/* Banner thông báo ticket đã đóng */}
                                {isClosed && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-xs text-gray-500">
                                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                                        Ticket này đã đóng. Bấm ← để tạo yêu cầu mới.
                                    </div>
                                )}

                                {/* Render từng tin nhắn trong hội thoại */}
                                {ticket?.messages?.map((msg, idx) => {
                                    const isUser = msg.senderType === "USER";
                                    return (
                                        <div key={idx}>
                                            {/* Bubble tin nhắn — user bên phải, admin bên trái */}
                                            <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
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
                                            {/* Auto-reply của hệ thống hiển thị ngay sau tin nhắn đầu tiên */}
                                            {idx === 0 && autoReply && (
                                                <div className="flex justify-start mt-3">
                                                    <div className="max-w-[85%] px-3 py-2 text-sm bg-white border rounded-2xl rounded-bl-sm shadow-sm text-slate-700">
                                                        {autoReply}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Indicator đang gửi tin nhắn */}
                                {isSending && (
                                    <div className="flex justify-end">
                                        <div className="px-3 py-2 text-sm bg-primary-600/60 text-white rounded-2xl rounded-br-sm">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={messagesEndRef} /> {/* anchor để scroll xuống cuối */}
                    </div>

                    {/* Input gửi tin nhắn — ẩn nếu ticket đã CLOSED */}
                    {!isClosed && (
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
                    )}
                </>
            )}
        </div>
    );
}
