import { useEffect, useRef, useState } from "react";
import { Send, X, ChevronLeft, Loader2, GraduationCap, User, BookOpen, Wrench, MessageCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { supportService } from "@/services/supportService";
import { toast } from "react-hot-toast";
import type { SupportThread } from "@/components/admin/support_management/supportTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step =
    | "category"   // Bước 1: chọn chủ đề
    | "chat";      // Bước 2: chat

interface Category {
    id: number;
    displayName: string;
    colorBg: string;
    colorText: string;
}

// Map category → lucide icon component (không hardcode icon trực tiếp vào JSX)
const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
    "Bắt đầu học": GraduationCap,
    "Tài khoản":   User,
    "Bài học":     BookOpen,
    "Kỹ thuật":    Wrench,
    "Khác":        MessageCircle,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SupportChatBoxProps {
    onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SupportChatBox({ onClose }: SupportChatBoxProps) {
    const { isAuthenticated } = useAuthStore();

    const [step, setStep] = useState<Step>("category");
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [ticket, setTicket] = useState<SupportThread | null>(null);
    const [draft, setDraft] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    // Polling để nhận tin nhắn mới từ admin
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load categories khi mount
    useEffect(() => {
        supportService.getCategories()
            .then(setCategories)
            .catch(() => {
                // Fallback nếu API lỗi
                setCategories([
                    { id: 1, displayName: "Bắt đầu học", colorBg: "bg-orange-100", colorText: "text-orange-700" },
                    { id: 2, displayName: "Tài khoản",   colorBg: "bg-blue-100",   colorText: "text-blue-700" },
                    { id: 3, displayName: "Bài học",     colorBg: "bg-emerald-100", colorText: "text-emerald-700" },
                    { id: 4, displayName: "Kỹ thuật",    colorBg: "bg-violet-100", colorText: "text-violet-700" },
                    { id: 5, displayName: "Khác",        colorBg: "bg-gray-100",   colorText: "text-gray-700" },
                ]);
            })
            .finally(() => setIsLoadingCategories(false));
    }, []);

    // Auto scroll khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket?.messages]);

    // Poll tin nhắn mới từ admin mỗi 10s khi đang ở bước chat
    useEffect(() => {
        if (step !== "chat" || !ticket || !isAuthenticated) return;

        pollRef.current = setInterval(async () => {
            try {
                const updated = await supportService.getMyTicketDetail(ticket.id);
                setTicket(updated);
            } catch {
                // Bỏ qua lỗi poll
            }
        }, 10_000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [step, ticket?.id, isAuthenticated]);

    // Cleanup poll khi unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleSelectCategory = async (cat: Category) => {
        if (!isAuthenticated) {
            // TODO: Khi mở rộng cho guest — hiện form nhập tên/email ở đây
            toast.error("Vui lòng đăng nhập để sử dụng chat hỗ trợ");
            return;
        }
        setSelectedCategory(cat);
        setIsCreating(true);
        try {
            // Tạo ticket với tin nhắn mở đầu tự động
            const result = await supportService.createUserTicket(
                cat.displayName,
                `Xin chào, tôi cần hỗ trợ về: ${cat.displayName}`
            );
            // Load full detail để có messages
            const detail = await supportService.getMyTicketDetail(result.id);
            setTicket(detail);
            setStep("chat");
        } catch {
            toast.error("Không thể tạo cuộc hội thoại, vui lòng thử lại");
            setSelectedCategory(null);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSend = async () => {
        if (!draft.trim() || !ticket || isSending) return;
        const text = draft.trim();
        setDraft("");
        setIsSending(true);

        // Optimistic update
        setTicket((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                messages: [
                    ...(prev.messages ?? []),
                    { senderType: "USER" as const, message: text, createdAt: "Vừa xong" },
                ],
            };
        });

        try {
            const updated = await supportService.sendUserMessage(ticket.id, text);
            setTicket(updated);
        } catch {
            toast.error("Không thể gửi tin nhắn, vui lòng thử lại");
            // Rollback optimistic update
            setTicket((prev) => {
                if (!prev?.messages) return prev;
                return { ...prev, messages: prev.messages.slice(0, -1) };
            });
            setDraft(text);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraft(e.target.value);
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 100) + "px";
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="mb-3 flex h-[480px] w-[min(calc(100vw-3rem),380px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/90">

            {/* Header */}
            <div className="flex items-center justify-between border-b bg-primary-600 px-4 py-3 text-white shrink-0">
                <div className="flex items-center gap-2">
                    {step === "chat" && (
                        <button
                            onClick={() => { setStep("category"); setTicket(null); setSelectedCategory(null); }}
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

            {/* ── Bước 1: Chọn category ── */}
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
                                        disabled={isCreating}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-transparent
                                            ${cat.colorBg} hover:border-primary-300 hover:shadow-md
                                            transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
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

                    {isCreating && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang kết nối...
                        </div>
                    )}

                    {/* Ghi chú cho guest — dễ mở rộng sau */}
                    {!isAuthenticated && (
                        <p className="text-xs text-slate-400 text-center mt-4">
                            Vui lòng{" "}
                            <a href="/login" className="text-primary-600 font-semibold hover:underline">
                                đăng nhập
                            </a>{" "}
                            để sử dụng chat hỗ trợ
                        </p>
                    )}
                </div>
            )}

            {/* ── Bước 2: Chat ── */}
            {step === "chat" && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3 space-y-3">
                        {/* Tin nhắn chào mừng */}
                        <div className="flex justify-start">
                            <div className="max-w-[85%] px-3 py-2 text-sm bg-white border rounded-2xl rounded-bl-sm shadow-sm text-slate-700">
                                Xin chào! Bạn đang ở mục hỗ trợ <strong>{selectedCategory?.displayName}</strong>. Hãy nhắn câu hỏi hoặc vấn đề bạn gặp phải để admin hỗ trợ bạn nhé!
                            </div>
                        </div>

                        {ticket?.messages?.map((msg, idx) => {
                            const isUser = msg.senderType === "USER";
                            // Bỏ qua tin nhắn mở đầu tự động (index 0)
                            if (idx === 0) return null;
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

                        {isSending && (
                            <div className="flex justify-end">
                                <div className="px-3 py-2 text-sm bg-primary-600/60 text-white rounded-2xl rounded-br-sm">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                </div>
                            </div>
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
                                className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-400 transition"
                                style={{ maxHeight: 100 }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!draft.trim() || isSending}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 text-right">
                            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[9px] font-mono">Enter</kbd> để gửi
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
