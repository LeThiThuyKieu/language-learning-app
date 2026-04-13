import { useEffect, useState, useRef } from "react";
import { Send, X } from "lucide-react";

export type SupportChatMessage = {
    id: string;
    role: "user" | "assistant";
    text: string;
};

/**
 * =========================
 * QUICK QUESTIONS (gợi ý)
 * =========================
 */
const SUGGESTIONS = [
    "Tôi cần hỗ trợ tài khoản",
    "Cách sử dụng ứng dụng?",
    "Tôi bị lỗi đăng nhập",
    "Liên hệ admin như thế nào?",
];

/**
 * =========================
 * FAKE AUTO RESPONSE
 * =========================
 */
function getAutoReply(userText: string): string {
    const text = userText.toLowerCase();

    if (text.includes("tài khoản")) {
        return "Bạn có thể vào phần hồ sơ để quản lý tài khoản nhé.";
    }
    if (text.includes("đăng nhập")) {
        return "Bạn thử kiểm tra lại email và mật khẩu. Nếu vẫn lỗi, hãy dùng 'Quên mật khẩu'.";
    }
    if (text.includes("liên hệ")) {
        return "Bạn có thể gửi email cho admin qua trang 'Trung tâm trợ giúp'.";
    }
    if (text.includes("cách sử dụng")) {
        return "Bạn có thể bắt đầu từ trang chính và làm theo hướng dẫn từng bước.";
    }

    return "Mình đã nhận câu hỏi của bạn 👍 sẽ phản hồi sớm nhất!";
}

export function SupportChatBox({ onClose }: { onClose: () => void }) {
    /**
     * =========================
     * STATE
     * =========================
     */
    const [messages, setMessages] = useState<SupportChatMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Trạng thái mở/đóng suggestions (giống Messenger)
    const [showSuggestions, setShowSuggestions] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    /**
     * =========================
     * AUTO SCROLL
     * =========================
     */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    /**
     * =========================
     * SEND MESSAGE
     * =========================
     */
    const handleSend = (text?: string) => {
        const content = text ?? draft.trim();
        if (!content) return;

        const userMessage: SupportChatMessage = {
            id: Date.now() + "",
            role: "user",
            text: content,
        };

        setMessages((prev) => [...prev, userMessage]);
        setDraft("");
        setIsLoading(true);
        setShowSuggestions(false); // gửi xong thì đóng gợi ý

        // Fake AI reply
        setTimeout(() => {
            const reply: SupportChatMessage = {
                id: Date.now() + "_bot",
                role: "assistant",
                text: getAutoReply(content),
            };

            setMessages((prev) => [...prev, reply]);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="mb-3 flex h-[480px] w-[min(calc(100vw-3rem),380px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/90">

            {/* ================= HEADER ================= */}
            <div className="flex items-center justify-between border-b bg-primary-600 px-4 py-3 text-white">
                <div>
                    <p className="text-sm font-bold">Hỗ trợ trực tuyến</p>
                    <p className="text-xs flex items-center gap-1 text-white/85">
                        <span className="h-2 w-2 rounded-full bg-green-400" />
                        Phản hồi trong vài phút
                    </p>
                </div>

                <button onClick={onClose}>
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* ================= MESSAGE LIST ================= */}
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 px-3 py-3">
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex ${
                            m.role === "user" ? "justify-end" : "justify-start"
                        }`}
                    >
                        <div
                            className={`max-w-[85%] px-3 py-2 text-sm ${
                                m.role === "user"
                                    ? "bg-primary-600 text-white rounded-2xl rounded-br-sm"
                                    : "bg-white border rounded-2xl rounded-bl-sm shadow-sm"
                            }`}
                        >
                            {m.text}
                        </div>
                    </div>
                ))}

                {/* LOADING */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="rounded-2xl bg-white px-3 py-2 text-sm shadow">
                            Đang trả lời...
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* ================= SUGGESTIONS (Messenger style) ================= */}
            {/* ================= SUGGESTIONS (Messenger style) ================= */}
            {messages.length === 0 && (
                <div className="bg-slate-50 px-3 py-2">

                    {/* ===== NÚT SVG MỞ GỢI Ý (nằm bên phải, cùng hàng với nút gửi) ===== */}
                    {!showSuggestions && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowSuggestions(true)}
                                className="
                                    p-2
                                    rounded-full
                                    bg-transparent
                                    border border-slate-300
                                    transition-all duration-200
                                    hover:bg-white
                                    active:scale-95
                                    focus:outline-none
                                    focus:ring-2
                                    focus:ring-primary-500/40
                                "
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 122.88 112.5"
                                    className="h-5 w-5 text-blue-500"
                                >
                                    <path
                                        fill="currentColor"
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M12.56,87.39c6.93,0,12.56,5.62,12.56,12.56c0,6.93-5.62,12.56-12.56,12.56C5.62,112.5,0,106.88,0,99.95
                                            C0,93.01,5.62,87.39,12.56,87.39L12.56,87.39z
                                            M35.07,88.24h86.38c0.79,0,1.43,0.64,1.43,1.43v19.93c0,0.79-0.64,1.43-1.43,1.43
                                            H35.07c-0.79,0-1.43-0.64-1.43-1.43V89.67C33.64,88.88,34.29,88.24,35.07,88.24L35.07,88.24z
                                            M35.07,44.7h86.38c0.79,0,1.43,0.64,1.43,1.43v19.93c0,0.79-0.64,1.43-1.43,1.43
                                            H35.07c-0.79,0-1.43-0.64-1.43-1.43V46.13C33.64,45.34,34.29,44.7,35.07,44.7L35.07,44.7z
                                            M35.07,1.16h86.38c0.79,0,1.43,0.64,1.43,1.43v19.93c0,0.79-0.64,1.43-1.43,1.43
                                            H35.07c-0.79,0-1.43-0.64-1.43-1.43V2.59C33.64,1.8,34.29,1.16,35.07,1.16L35.07,1.16z
                                            M12.56,43.69c6.93,0,12.56,5.62,12.56,12.56c0,6.93-5.62,12.56-12.56,12.56
                                            C5.62,68.81,0,63.19,0,56.25C0,49.32,5.62,43.69,12.56,43.69L12.56,43.69z
                                            M12.56,0c6.93,0,12.56,5.62,12.56,12.56c0,6.93-5.62,12.56-12.56,12.56
                                            C5.62,25.11,0,19.49,0,12.56C0,5.62,5.62,0,12.56,0L12.56,0z"
                                    />
                                </svg>
                            </button>
                        </div>                    )}

                    {/* ===== DANH SÁCH GỢI Ý ===== */}
                    {showSuggestions && (
                        <div className="mt-2 flex flex-wrap gap-2 justify-end animate-in fade-in duration-200">
                            {SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(s)}
                                    className="rounded-full bg-white px-3 py-1 text-xs shadow-sm hover:bg-slate-100 transition"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {/* ================= INPUT ================= */}
            <div className="border-t bg-white p-3">
                <div className="flex gap-2">
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Nhập tin nhắn hoặc câu hỏi..."
                        className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm"
                    />

                    <button
                        onClick={() => handleSend()}
                        disabled={!draft.trim()}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}