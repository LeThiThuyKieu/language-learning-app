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
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 text-slate-900 relative">

            {/* POPUP */}
            {showAdminPopup && mockPayload && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-[28px] bg-white shadow-2xl overflow-hidden border border-slate-200">

                        <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-cyan-300"/>
                                <span className="text-xs font-mono">Admin Simulation</span>
                            </div>

                            <button
                                onClick={()=>setShowAdminPopup(false)}
                                className="p-2 rounded-xl hover:bg-white/10"
                            >
                                <X className="h-5 w-5"/>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-sm space-y-1">
                                <p><b>To:</b> {mockPayload.to}</p>
                                <p><b>From:</b> {mockPayload.senderName}</p>
                                <p><b>Subject:</b> {mockPayload.subject}</p>
                            </div>

                            <div className="p-5 bg-slate-50 rounded-2xl">
                                <p className="text-xs font-bold mb-2 text-slate-400 uppercase">Message</p>
                                <p className="italic">{mockPayload.content}</p>
                            </div>

                            <button
                                onClick={()=>setShowAdminPopup(false)}
                                className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold"
                            >
                                Đóng
                            </button>
                        </div>

                    </div>
                </div>
            )}


            {/* HERO */}
            <header className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-500 to-primary-600 text-white">

                <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/20 blur-3xl rounded-full"/>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-300/20 blur-3xl rounded-full"/>

                <div className="relative py-20 text-center max-w-5xl mx-auto px-6">

                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-xl px-5 py-2 text-sm font-bold mb-6">
                        <HelpCircle className="w-5 h-5"/>
                        Trung tâm trợ giúp
                    </div>

                    <h1 className="text-5xl font-black mb-4 tracking-tight">
                        Chúng tôi có thể giúp gì cho bạn?
                    </h1>

                    <p className="text-orange-100 max-w-2xl mx-auto text-lg">
                        Tìm câu trả lời nhanh hoặc gửi yêu cầu hỗ trợ tới admin.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-10 max-w-2xl mx-auto">

                        <div className="bg-white/15 rounded-3xl p-5 backdrop-blur-xl">
                            <p className="text-3xl font-black">24/7</p>
                            <span className="text-sm text-orange-100">Hỗ trợ</span>
                        </div>

                        <div className="bg-white/15 rounded-3xl p-5 backdrop-blur-xl">
                            <p className="text-3xl font-black">100+</p>
                            <span className="text-sm text-orange-100">FAQ</span>
                        </div>

                        <div className="bg-white/15 rounded-3xl p-5 backdrop-blur-xl">
                            <p className="text-3xl font-black">&lt;1h</p>
                            <span className="text-sm text-orange-100">Phản hồi</span>
                        </div>

                    </div>

                </div>

            </header>


            <main className="mx-auto max-w-7xl px-4 -mt-10 relative z-10 pb-12 lg:px-8 grid gap-8 lg:grid-cols-2">


                {/* FAQ */}
                <div className="space-y-4">

                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6">
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"/>

                            <input
                                value={searchTerm}
                                onChange={(e)=>setSearchTerm(e.target.value)}
                                placeholder="Tìm câu hỏi..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-orange-100 outline-none"
                            />
                        </div>

                        <h2 className="text-2xl font-black mb-5">
                            Câu hỏi phổ biến
                        </h2>

                        <div className="space-y-4">
                            {filteredFaqs.map((item,index)=>(
                                <div
                                    key={index}
                                    className="rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition"
                                >
                                    <button
                                        onClick={()=>setOpenIndex(index)}
                                        className="w-full px-5 py-5 font-bold flex justify-between items-center bg-gradient-to-r from-slate-50 to-orange-50"
                                    >
                                        {item.question}

                                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <ChevronDown
                                                className={`h-5 w-5 transition ${openIndex===index ? 'rotate-180 text-orange-600':''}`}
                                            />
                                        </div>

                                    </button>

                                    {openIndex===index && (
                                        <div className="p-5 text-slate-600 leading-relaxed space-y-2">
                                            {item.answer.map((a,i)=>(
                                                <p key={i}>• {a}</p>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            ))}
                        </div>

                    </div>
                </div>


                {/* FORM */}
                <div className="space-y-6">

                    <div className="bg-gradient-to-br from-white to-orange-50 p-8 rounded-[32px] border border-orange-100 shadow-2xl lg:sticky lg:top-24">

                        <h2 className="text-2xl font-black mb-6 flex gap-2 items-center">
                            <MessageSquare className="w-6 h-6 text-orange-600"/>
                            Gửi hỗ trợ
                        </h2>

                        <form onSubmit={submitQuestion} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    value={form.name}
                                    onChange={(e)=>setForm({...form,name:e.target.value})}
                                    placeholder="Tên"
                                    className="p-4 rounded-2xl bg-white border-2 border-transparent focus:border-orange-500 shadow-sm outline-none"
                                />

                                <input
                                    value={form.email}
                                    onChange={(e)=>setForm({...form,email:e.target.value})}
                                    placeholder="Email"
                                    className="p-4 rounded-2xl bg-white border-2 border-transparent focus:border-orange-500 shadow-sm outline-none"
                                />
                            </div>

                            <select
                                value={form.topic}
                                onChange={(e)=>setForm({...form,topic:e.target.value as SupportTopic})}
                                className="w-full p-4 rounded-2xl bg-white border-2 border-transparent focus:border-orange-500 outline-none"
                            >
                                {SUPPORT_TOPICS.map(t=>(
                                    <option key={t}>{t}</option>
                                ))}
                            </select>

                            <textarea
                                rows={5}
                                value={form.question}
                                onChange={(e)=>setForm({...form,question:e.target.value})}
                                placeholder="Nhập nội dung hỗ trợ..."
                                className="w-full p-4 rounded-2xl bg-white border-2 border-transparent focus:border-orange-500 outline-none"
                            />

                            {formError && (
                                <p className="text-red-500 text-sm font-bold">{formError}</p>
                            )}

                            <button
                                disabled={isSubmitting}
                                type="submit"
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-900 to-orange-500 text-white font-bold shadow-lg hover:scale-[1.02] transition"
                            >
                                {isSubmitting ? 'Đang gửi...' : (
                                    <>
                                        <Send className="inline mr-2"/>
                                        Gửi yêu cầu
                                    </>
                                )}
                            </button>

                        </form>

                    </div>


                    {/* HISTORY */}
                    {questions.length>0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                                Vừa gửi gần đây
                            </h3>

                            {questions.map(q=>(
                                <div
                                    key={q.id}
                                    className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center"
                                >
                                    <div>
                                        <p className="text-xs font-bold text-orange-600 uppercase mb-1">
                                            {q.topic}
                                        </p>

                                        <p className="text-sm font-medium text-slate-700">
                                            {q.question}
                                        </p>
                                    </div>

                                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-md">
                                        ✓ SENT
                                        </span>

                                </div>
                            ))}

                        </div>
                    )}

                </div>

            </main>

        </div>
    )
}