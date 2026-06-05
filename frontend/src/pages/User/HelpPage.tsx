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
import { supportService } from "@/services/supportService.ts";
import apiClient from "@/config/api";

// --- TYPES ---
type FAQItem = { id: number; question: string; answer: string[]; displayOrder: number; };
type SupportTopic = "Bắt đầu học" | "Tài khoản" | "Bài học" | "Kỹ thuật" | "Khác";
type SupportQuestion = { id: string; name: string; email: string; topic: SupportTopic; question: string; createdAt: string; status: string; };

// Định nghĩa interface cho Payload để tránh lỗi "Unexpected any"
interface SubmittedSupportPayload {
    from: string;
    senderName: string;
    topic: string;
    content: string;
}

type ApiResponse<T> = { success: boolean; message: string; data: T };

const SUPPORT_TOPICS: SupportTopic[] = ["Bắt đầu học", "Tài khoản", "Bài học", "Kỹ thuật", "Khác"];
const emptyForm = { name: "", email: "", topic: "Bắt đầu học" as SupportTopic, question: "" };

export default function HelpPage() {
    const { user, isAuthenticated } = useAuthStore();
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [questions, setQuestions] = useState<SupportQuestion[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [faqLoading, setFaqLoading] = useState(true);

    const [showAdminPopup, setShowAdminPopup] = useState(false);
    const [submittedPayload, setSubmittedPayload] = useState<SubmittedSupportPayload | null>(null);

    // Load FAQ từ API
    useEffect(() => {
        apiClient.get<ApiResponse<FAQItem[]>>("/public/faqs")
            .then(res => setFaqs(res.data.data ?? []))
            .catch(() => toast.error("Không thể tải câu hỏi thường gặp"))
            .finally(() => setFaqLoading(false));
    }, []);

    useEffect(() => {
        if (isAuthenticated && user?.email) {
            setForm((prev) => ({
                ...prev,
                name: prev.name || user.email.split("@")[0] || "",
                email: prev.email || user.email || ""
            }));
        }
    }, [isAuthenticated, user]);

    const filteredFaqs = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return faqs;
        return faqs.filter(f => f.question.toLowerCase().includes(query));
    }, [searchTerm, faqs]);

    const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const { name, email, topic, question } = form;

        // Validate từng field riêng với thông báo cụ thể
        if (!name.trim()) {
            setFormError("Vui lòng nhập tên của bạn.");
            return;
        }
        if (!email.trim()) {
            setFormError("Vui lòng nhập địa chỉ email.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setFormError("Địa chỉ email không đúng định dạng (ví dụ: ten@gmail.com).");
            return;
        }
        if (!question.trim()) {
            setFormError("Vui lòng nhập nội dung câu hỏi.");
            return;
        }
        if (question.trim().length < 10) {
            setFormError("Nội dung quá ngắn, vui lòng mô tả chi tiết hơn (ít nhất 10 ký tự).");
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        try {
            if (isAuthenticated) {
                await supportService.createUserTicket(topic, question);
            } else {
                await supportService.createGuestTicket(name, email, topic, question);
            }

            setSubmittedPayload({
                from: email,
                senderName: name,
                topic,
                content: question,
            });
            setShowAdminPopup(true);

            const newEntry: SupportQuestion = {
                id: Date.now().toString(),
                name,
                email,
                topic,
                question,
                createdAt: new Date().toLocaleTimeString("vi-VN"),
                status: "Đang chờ Admin duyệt",
            };
            setQuestions([newEntry, ...questions].slice(0, 5));

            setForm(emptyForm);
            toast.success("Đã gửi yêu cầu thành công!");
        } catch (error) {
            console.error("Gửi hỗ trợ thất bại", error);
            // Lấy message lỗi cụ thể từ server nếu có
            const axiosError = error as { response?: { data?: { message?: string } } };
            const serverMsg = axiosError?.response?.data?.message;
            if (serverMsg) {
                setFormError(serverMsg);
            } else if (error instanceof Error) {
                setFormError(`Gửi thất bại: ${error.message}`);
            } else {
                setFormError("Không thể gửi yêu cầu lúc này, vui lòng thử lại sau.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 text-slate-900 relative">

            {/* POPUP */}
            {showAdminPopup && submittedPayload && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-[28px] bg-white shadow-2xl overflow-hidden border border-slate-200">

                        {/* HEADER */}
                        <div className="bg-gradient-to-r from-primary-900 to-orange-500 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4"/>
                                <span className="text-sm font-bold">Gửi thành công</span>
                            </div>

                            <button
                                onClick={()=>setShowAdminPopup(false)}
                                className="p-2 rounded-xl hover:bg-white/10"
                            >
                                <X className="h-5 w-5"/>
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="p-6 space-y-4">

                            {/* THÔNG BÁO */}
                            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-sm">
                                <p className="font-bold text-orange-600">
                                    ✅ Yêu cầu của bạn đã được gửi!
                                </p>
                                <p className="text-slate-600 text-xs mt-1">
                                    Admin sẽ phản hồi qua email trong thời gian sớm nhất.
                                </p>
                            </div>

                            {/* INFO */}
                            <div className="p-4 bg-slate-50 rounded-2xl text-sm space-y-2">
                                <p><b>Email:</b> {submittedPayload.from}</p>
                                <p><b>Danh mục:</b> {submittedPayload.topic}</p>
                            </div>

                            {/* MESSAGE */}
                            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-xs font-bold mb-2 text-slate-400 uppercase">
                                    Nội dung
                                </p>
                                <p className="italic text-slate-700">
                                    {submittedPayload.content}
                                </p>
                            </div>

                            {/* BUTTON */}
                            <button
                                onClick={()=>setShowAdminPopup(false)}
                                className="w-full py-3 rounded-2xl bg-primary-800 text-white font-bold"
                            >
                                OK
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

                    <div className="grid grid-cols-2 gap-4 mt-10 max-w-sm mx-auto">

                        <div className="bg-white/15 rounded-3xl p-5 backdrop-blur-xl">
                            <p className="text-3xl font-black">24/7</p>
                            <span className="text-sm text-orange-100">Hỗ trợ</span>
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
                            {faqLoading ? (
                                <div className="text-center py-10 text-slate-400">Đang tải...</div>
                            ) : filteredFaqs.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">Không tìm thấy câu hỏi phù hợp.</div>
                            ) : (
                                filteredFaqs.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition"
                                    >
                                        <button
                                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                            className="w-full px-5 py-5 font-bold flex justify-between items-center bg-gradient-to-r from-slate-50 to-orange-50"
                                        >
                                            {item.question}

                                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                <ChevronDown
                                                    className={`h-5 w-5 transition ${openIndex === index ? 'rotate-180 text-orange-600' : ''}`}
                                                />
                                            </div>
                                        </button>

                                        {openIndex === index && (
                                            <div className="p-5 text-slate-600 leading-relaxed space-y-2">
                                                {item.answer.map((a, i) => (
                                                    <p key={i}>• {a}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
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
                    

                </div>

            </main>

        </div>
    )
}