import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "react-hot-toast";
import {
    ChevronDown,
    HelpCircle,
    MessageSquare,
    Search,
    Send,
    X,
    Mail,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

// --- TYPES ---
type FAQItem = { category: string; question: string; answer: string[]; };
type SupportTopic = "Bắt đầu học" | "Tài khoản" | "Bài học" | "Kỹ thuật" | "Khác";
type SupportQuestion = { id: string; name: string; email: string; topic: SupportTopic; question: string; createdAt: string; status: string; };

// Định nghĩa interface cho Payload để tránh lỗi "Unexpected any"
interface MockEmailPayload {
    subject: string;
    to: string;
    from: string;
    senderName: string;
    content: string;
    timestamp: string;
    deviceInfo: string;
}

const FAQ_DATA: FAQItem[] = [
    // ===== BẮT ĐẦU HỌC =====
    {
        category: "Bắt đầu học",
        question: "Tôi nên bắt đầu từ đâu nếu mới học lại tiếng Anh?",
        answer: [
            "Hãy bắt đầu bằng bài kiểm tra trình độ và lộ trình cơ bản.",
            "Sau đó học 15-20 phút mỗi ngày."
        ]
    },
    {
        category: "Bắt đầu học",
        question: "Tôi có cần học mỗi ngày không?",
        answer: [
            "Không bắt buộc nhưng nên học mỗi ngày để duy trì thói quen.",
            "Chỉ cần 10-20 phút mỗi ngày là đã hiệu quả."
        ]
    },
    {
        category: "Bắt đầu học",
        question: "Học bao lâu thì có tiến bộ?",
        answer: [
            "Tùy vào sự kiên trì của bạn.",
            "Nếu học đều mỗi ngày, bạn sẽ thấy tiến bộ sau vài tuần."
        ]
    },

    // ===== TÀI KHOẢN =====
    {
        category: "Tài khoản",
        question: "Tôi quên mật khẩu thì phải làm sao?",
        answer: [
            "Bạn hãy chọn 'Quên mật khẩu' ở màn hình đăng nhập.",
            "Sau đó làm theo hướng dẫn để đặt lại mật khẩu."
        ]
    },
    {
        category: "Tài khoản",
        question: "Tôi có thể đổi thông tin cá nhân không?",
        answer: [
            "Có, bạn có thể chỉnh sửa thông tin trong phần hồ sơ cá nhân.",
            "Bao gồm tên, avatar và các thông tin khác."
        ]
    },
    {
        category: "Tài khoản",
        question: "Tôi có thể đăng nhập trên nhiều thiết bị không?",
        answer: [
            "Có, bạn có thể đăng nhập trên cả điện thoại và máy tính.",
            "Dữ liệu học tập sẽ được đồng bộ."
        ]
    },

    // ===== BÀI HỌC =====
    {
        category: "Bài học",
        question: "Tôi học sai nhiều có sao không?",
        answer: [
            "Không sao, sai là một phần của việc học.",
            "Hệ thống sẽ giúp bạn ôn lại các câu sai."
        ]
    },
    {
        category: "Bài học",
        question: "Tôi có thể học lại bài cũ không?",
        answer: [
            "Có, bạn có thể học lại bất kỳ bài nào đã hoàn thành.",
            "Việc ôn lại giúp bạn nhớ lâu hơn."
        ]
    },
    {
        category: "Bài học",
        question: "Làm sao để tăng level nhanh hơn?",
        answer: [
            "Hoàn thành bài học mỗi ngày và giữ streak.",
            "Làm thêm bài luyện tập để nhận thêm XP."
        ]
    },

    // ===== KỸ THUẬT =====
    {
        category: "Kỹ thuật",
        question: "Nếu bài học không tải được thì tôi nên làm gì?",
        answer: [
            "Hãy tải lại trang hoặc kiểm tra kết nối mạng.",
            "Nếu vẫn lỗi, hãy liên hệ hỗ trợ."
        ]
    },
    {
        category: "Kỹ thuật",
        question: "Ứng dụng bị lag hoặc chậm thì sao?",
        answer: [
            "Hãy thử tải lại trang hoặc đóng các tab không cần thiết.",
            "Kiểm tra lại kết nối Internet để đảm bảo ổn định."
        ]
    },
    {
        category: "Kỹ thuật",
        question: "Tôi không nghe được audio?",
        answer: [
            "Hãy kiểm tra âm lượng thiết bị và trình duyệt.",
            "Đảm bảo bạn đã cho phép website sử dụng âm thanh."
        ]
    },

    // ===== KHÁC =====
    {
        category: "Khác",
        question: "Tôi có thể góp ý hoặc báo lỗi không?",
        answer: [
            "Có, bạn có thể gửi góp ý qua form liên hệ.",
            "Chúng tôi luôn sẵn sàng lắng nghe và cải thiện."
        ]
    },
    {
        category: "Khác",
        question: "Ứng dụng có miễn phí không?",
        answer: [
            "Phiên bản cơ bản là miễn phí.",
            "Một số tính năng nâng cao có thể yêu cầu nâng cấp."
        ]
    },
    {
        category: "Khác",
        question: "Tôi có thể học offline không?",
        answer: [
            "Hiện tại cần kết nối Internet để học.",
            "Chúng tôi sẽ cập nhật tính năng offline trong tương lai."
        ]
    }
];

const SUPPORT_TOPICS: SupportTopic[] = ["Bắt đầu học", "Tài khoản", "Bài học", "Kỹ thuật", "Khác"];
const emptyForm = { name: "", email: "", topic: "Bắt đầu học" as SupportTopic, question: "" };

export default function HelpPage() {
    const { user, isAuthenticated } = useAuthStore();
    const [openIndex, setOpenIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState(""); // Đã sử dụng ở input tìm kiếm bên dưới
    const [form, setForm] = useState(emptyForm);
    const [questions, setQuestions] = useState<SupportQuestion[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- FIX LỖI ANY & NAME ---
    const [showAdminPopup, setShowAdminPopup] = useState(false);
    const [mockPayload, setMockPayload] = useState<MockEmailPayload | null>(null);

    useEffect(() => {
        if (isAuthenticated && user?.email) {
            setForm((prev) => ({
                ...prev,
                // auth store chỉ có email, nên dùng phần trước @ làm tên gợi ý.
                name: prev.name || user.email.split("@")[0] || "",
                email: prev.email || user.email || ""
            }));
        }
    }, [isAuthenticated, user]);

    const filteredFaqs = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return FAQ_DATA;
        return FAQ_DATA.filter(f => f.question.toLowerCase().includes(query));
    }, [searchTerm]);

    const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const { name, email, topic, question } = form;

        if (!name.trim() || !email.trim() || !question.trim()) {
            setFormError("Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        await new Promise(resolve => setTimeout(resolve, 800));

        const dataToAdmin: MockEmailPayload = {
            subject: `Hỗ trợ: ${topic}`,
            to: "admin@tienganh.com",
            from: email,
            senderName: name,
            content: question,
            timestamp: new Date().toLocaleString("vi-VN"),
            deviceInfo: navigator.userAgent.slice(0, 50) + "..."
        };

        setMockPayload(dataToAdmin);
        setShowAdminPopup(true);

        const newEntry: SupportQuestion = {
            id: Date.now().toString(),
            name, email, topic, question,
            createdAt: new Date().toLocaleTimeString("vi-VN"),
            status: "Đang chờ Admin duyệt",
        };
        setQuestions([newEntry, ...questions].slice(0, 5));

        setForm(emptyForm);
        setIsSubmitting(false);
        toast.success("Đã gửi yêu cầu thành công!");
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 relative">
            {/* POPUP MÔ PHỎNG ADMIN NHẬN MAIL */}
            {showAdminPopup && mockPayload && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
                        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-blue-400" />
                                <span className="text-xs font-mono">Admin View (Simulation)</span>
                            </div>
                            <button onClick={() => setShowAdminPopup(false)} className="hover:bg-slate-800 p-1 rounded-lg">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[13px] space-y-1">
                                <p><strong>To:</strong> {mockPayload.to}</p>
                                <p><strong>From:</strong> {mockPayload.senderName} ({mockPayload.from})</p>
                                <p><strong>Subject:</strong> {mockPayload.subject}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase">Message:</p>
                                <p className="text-sm italic">"{mockPayload.content}"</p>
                            </div>
                            <button onClick={() => setShowAdminPopup(false)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm">Đóng bản xem thử</button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <header className="bg-white border-b border-slate-200 py-12 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-xs font-bold text-blue-600 mb-4">
                    <HelpCircle className="h-4 w-4" /> TRUNG TÂM TRỢ GIÚP
                </div>
                <h1 className="text-4xl font-black tracking-tight">Hỗ trợ học viên</h1>
            </header>

            <main className="mx-auto max-w-7xl px-4 pt-[10px] pb-12 lg:px-8 grid gap-8 lg:grid-cols-2">
                {/* FAQ */}
                <div id="help-faq" className="space-y-4 scroll-mt-24">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm câu hỏi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    {filteredFaqs.map((item, index) => (
                        <div key={index} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <button onClick={() => setOpenIndex(index)} className="w-full p-4 text-left font-bold flex justify-between items-center hover:bg-slate-50">
                                {item.question}
                                <ChevronDown className={`h-4 w-4 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
                            </button>
                            {openIndex === index && (
                                <div className="px-4 pb-4 text-sm text-slate-500 border-t border-slate-50 pt-3 leading-relaxed">
                                    {item.answer.map((a, i) => <p key={i}>{a}</p>)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* FORM */}
                <div id="help-chat" className="space-y-6 scroll-mt-24">
                   <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:sticky lg:top-24 self-start">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-blue-600" /> Gửi tin nhắn
                        </h2>
                        <form onSubmit={submitQuestion} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Tên" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="p-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-blue-500" />
                                <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="p-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-blue-500" />
                            </div>
                            <select value={form.topic} onChange={(e) => setForm({...form, topic: e.target.value as SupportTopic})} className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-blue-500">
                                {SUPPORT_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <textarea placeholder="Nội dung..." rows={4} value={form.question} onChange={(e) => setForm({...form, question: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-blue-500" />
                            {formError && <p className="text-xs text-red-500 font-bold">{formError}</p>}
                            <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex justify-center items-center gap-2">
                                {isSubmitting ? "Đang gửi..." : <><Send className="h-4 w-4" /> Gửi</>}
                            </button>
                        </form>
                    </div>

                    {/* LỊCH SỬ GỬI */}
                    {questions.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vừa gửi gần đây</h3>
                            {questions.map(q => (
                                <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                                    <div>
                                        <p className="text-xs font-bold text-blue-600 uppercase">{q.topic}</p>
                                        <p className="text-sm font-medium text-slate-700">{q.question}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md tracking-tighter">SENT</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}