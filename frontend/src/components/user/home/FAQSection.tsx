import React, {useState} from "react";
import {ChevronDown} from "lucide-react";
import {BookOpen, Ear, MessageSquare, Link, Zap, Smartphone, TrendingUp, Star, CheckCircle2} from 'lucide-react';

interface AnswerLine {
    text: string;
    icon?: React.ReactNode; // Dấu ? có thể có icon hoặc không
}

interface FAQItem {
    question: string;
    answer: (string | AnswerLine)[];
}

// Data for section 4 (FAQ Features)
const faqData: FAQItem[] = [
    {
        question: "Website này khác gì so với các app học tiếng Anh khác?",
        answer: [
            "Website giúp bạn học theo cách người bản xứ thực sự sử dụng ngôn ngữ.",
            "Bao gồm:",
            {text: "Audio thực tế (giọng thật)", icon: <Star size={16} className="text-yellow-400"/>},
            {text: "Luyện nghe – nói – từ vựng kết hợp", icon: <Star size={16} className="text-yellow-400"/>},
            {text: "Hệ thống bài tập thích ứng theo trình độ", icon: <Star size={16} className="text-yellow-400"/>},
            {text: "Giúp bạn học tự nhiên, không máy móc.", icon: <Zap size={16} className="text-orange-400"/>}
        ]
    },
    {
        question: "Tôi cần biết gì trước khi bắt đầu học?",
        answer: [
            "Bạn không cần kiến thức trước. Hệ thống sẽ:",
            {text: "Kiểm tra trình độ ban đầu", icon: <CheckCircle2 size={16} className="text-green-400"/>},
            {text: "Tự động đề xuất lộ trình phù hợp", icon: <CheckCircle2 size={16} className="text-green-400"/>}
        ]
    },
    {
        question: "Tôi có thể cải thiện kỹ năng gì trên website?",
        answer: [
            "Bạn có thể luyện:",
            {text: "Vocabulary (từ vựng)", icon: <BookOpen size={16} className="text-blue-400"/>},
            {text: "Listening (nghe)", icon: <Ear size={16} className="text-yellow-400"/>},
            {text: "Speaking (nói)", icon: <MessageSquare size={16} className="text-green-400"/>},
            {text: "Matching (ghép từ)", icon: <Link size={16} className="text-purple-400"/>}
        ]
    },
    {
        question: "Tôi có thể nói tiếng Anh ngay từ tuần đầu không?",
        answer: [
            "Hoàn toàn có thể! Bạn sẽ được:",
            {text: "Luyện nói theo câu mẫu", icon: <MessageSquare size={16} className="text-green-400"/>},
            {text: "Nghe và bắt chước phát âm", icon: <Ear size={16} className="text-yellow-400"/>},
            {text: "Giao tiếp cơ bản chỉ sau vài ngày", icon: <Zap size={16} className="text-orange-400"/>}
        ]
    },
    {
        question: "Website hoạt động như thế nào?",
        answer: [
            "Hệ thống thông minh sử dụng:",
            {text: "AI để đánh giá trình độ", icon: <Zap size={16} className="text-blue-400"/>},
            {text: "Sinh bài tập phù hợp cá nhân", icon: <CheckCircle2 size={16} className="text-green-400"/>},
            {text: "Điều chỉnh độ khó liên tục", icon: <TrendingUp size={16} className="text-purple-400"/>}
        ]
    },
    {
        question: "Tôi học mỗi ngày bao lâu là hiệu quả?",
        answer: [
            "Chỉ cần 15–30 phút mỗi ngày.",
            {text: "Quan trọng là sự đều đặn hàng ngày.", icon: <Zap size={16} className="text-orange-400"/>}
        ]
    },
    {
        question: "Tôi có thể học trên điện thoại không?",
        answer: [
            {text: "Có, học mọi lúc mọi nơi!", icon: <Smartphone size={16} className="text-blue-400"/>},
            "Website tối ưu hoàn hảo cho cả Mobile và Desktop."
        ]
    },
    {
        question: "Làm sao để biết tôi tiến bộ?",
        answer: [
            "Hệ thống theo dõi sát sao:",
            {text: "Thống kê điểm số chi tiết", icon: <TrendingUp size={16} className="text-green-400"/>},
            {text: "Đánh giá level chuẩn xác", icon: <CheckCircle2 size={16} className="text-green-400"/>}
        ]
    },
    {
        question: "Website có miễn phí không?",
        answer: [
            {text: "Có phiên bản miễn phí trọn đời.", icon: <Star size={16} className="text-yellow-400"/>},
            "Bạn có thể tiếp cận đầy đủ các bài học cơ bản."
        ]
    }
];

export default function FAQSection() {
    const [openIndexes, setOpenIndexes] = useState<number[]>([]);

    const toggleItem = (index: number) => {
        setOpenIndexes((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    // Chia dữ liệu lam 2 cột
    const half = Math.ceil(faqData.length / 2);
    const leftColumn = faqData.slice(0, half);
    const rightColumn = faqData.slice(half);

    // Hàm render từng Item
    const renderFaqItem = (item: FAQItem, globalIndex: number) => {
        const isOpen = openIndexes.includes(globalIndex);
        return (
            <div
                key={globalIndex}
                className="bg-gray-800 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl mb-4"
                onClick={() => toggleItem(globalIndex)}
            >
                <div className="flex justify-between items-center text-white font-bold text-lg">
                    <span className="pr-4">{item.question}</span>
                    <ChevronDown
                        className={`shrink-0 transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`}/>
                </div>
                <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        isOpen ? "max-h-96 mt-4 opacity-100" : "max-h-0 opacity-0"
                    }`}
                >
                    <div className="text-gray-200 text-sm leading-relaxed space-y-2">
                        {item.answer.map((line, i) => {
                            const isObject = typeof line !== 'string';
                            const text = isObject ? (line as AnswerLine).text : (line as string);
                            const icon = isObject ? (line as AnswerLine).icon : null;

                            return (
                                <div key={i} className="flex items-start gap-2">
                                    {/* Chỉ hiển thị icon nếu nó tồn tại */}
                                    {icon && <span className="shrink-0 mt-1">{icon}</span>}
                                    <p>{text}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <section className="w-screen relative left-1/2 right-1/2 -mx-[50vw] bg-primary-500 py-16">
            <div className="max-w-6xl mx-auto px-4">

                {/* Title */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white">
                        Lion có phù hợp với bạn không?
                    </h2>
                    <div className="w-24 h-2 bg-white mx-auto mt-3 rounded-full opacity-30"></div>
                </div>

                {/* FAQ Grid */}
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Cột trái */}
                    <div className="flex-1">
                        {leftColumn.map((item, index) => renderFaqItem(item, index))}
                    </div>
                    {/* Cột phải */}
                    <div className="flex-1">
                        {rightColumn.map((item, index) => renderFaqItem(item, index + half))}
                    </div>
                </div>
            </div>
        </section>)
}


