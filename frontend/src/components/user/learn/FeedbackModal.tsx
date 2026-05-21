import { useState } from "react";
import { CheckCircle2, ArrowRight, X, MessageSquare } from "lucide-react";
import { learningService } from "@/services/learningService";
import {
    FaGrinBeam,
    FaSmile,
    FaMeh,
    FaFrown,
    FaSadCry,
} from "react-icons/fa";
import type { IconType } from "react-icons";

interface FeedbackModalProps {
    treeId: number;
    onDone: () => void;
}

interface RatingOption {
    value: number;
    Icon: IconType;
    iconColor: string;
    label: string;
}

const RATINGS: RatingOption[] = [
    { value: 1, Icon: FaGrinBeam,  iconColor: "text-emerald-400", label: "Rất dễ" },
    { value: 2, Icon: FaSmile,     iconColor: "text-lime-400",    label: "Dễ" },
    { value: 3, Icon: FaMeh,       iconColor: "text-amber-400",   label: "Bình thường" },
    { value: 4, Icon: FaFrown,     iconColor: "text-orange-400",  label: "Khó" },
    { value: 5, Icon: FaSadCry,    iconColor: "text-red-400",     label: "Rất khó" },
];

export default function FeedbackModal({ treeId, onDone }: FeedbackModalProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (selected === null || loading) return;
        setLoading(true);
        try {
            await learningService.submitFeedback(treeId, selected);
        } catch {
            // ignore — vẫn cho tiếp tục
        } finally {
            setLoading(false);
            setSubmitted(true);
        }
    }

    return (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

                {!submitted ? (
                    /* ── Form ── */
                    <div className="relative px-7 pt-6 pb-7">
                        {/* Skip — X nhỏ góc trên phải */}
                        <button
                            type="button"
                            onClick={onDone}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                            aria-label="Bỏ qua"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>

                        {/* Icon — cam bo tròn lớn */}
                        <div className="flex justify-center mb-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-primary-600 flex items-center justify-center shadow-lg">
                                <MessageSquare className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        {/* Title màu cam */}
                        <p className="text-base font-extrabold text-primary-600 text-center mb-2">
                            Bạn cảm thấy bài học này thế nào?
                        </p>
                        {/* Subtitle */}
                        <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                            Phản hồi của bạn giúp chúng tôi cải thiện trải nghiệm học tập
                            và hoàn thiện các nội dung tiếp theo.
                        </p>

                        {/* Rating options */}
                        <div className="flex justify-between gap-2 mb-6">
                            {RATINGS.map((r) => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setSelected(r.value)}
                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all active:scale-95 ${
                                        selected === r.value
                                            ? "border-primary-500 bg-primary-50 scale-105 shadow-md"
                                            : "border-gray-200 bg-white hover:border-primary-200 hover:bg-primary-50/40"
                                    }`}
                                >
                                    <r.Icon className={`w-7 h-7 text-[28px] ${r.iconColor} ${selected === r.value ? "scale-110" : ""} transition-transform`} />
                                    <span className={`text-[10px] font-bold leading-tight text-center ${
                                        selected === r.value ? "text-primary-700" : "text-gray-500"
                                    }`}>
                                        {r.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Submit button */}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={selected === null || loading}
                            className={`w-full rounded-2xl py-3.5 font-extrabold text-sm uppercase tracking-widest transition-all ${
                                selected !== null && !loading
                                    ? "bg-gradient-to-r from-amber-400 via-primary-500 to-primary-600 text-white shadow-lg hover:opacity-90 active:scale-95"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {loading ? "Đang gửi..." : "Gửi phản hồi"}
                        </button>
                    </div>
                ) : (
                    /* ── Thank you screen ── */
                    <div className="px-7 pt-8 pb-7 flex flex-col items-center text-center">
                        {/* Success icon */}
                        <div className="relative mb-5">
                            <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center">
                                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-primary-600" />
                                </div>
                            </div>
                            {/* Decorative dots */}
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-300 opacity-80" />
                            <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full bg-primary-300 opacity-70" />
                            <span className="absolute top-2 -left-3 w-2 h-2 rounded-full bg-primary-200 opacity-60" />
                        </div>

                        <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                            Cảm ơn bạn đã gửi phản hồi!
                        </h2>
                        <p className="text-sm text-gray-500 mb-7 leading-relaxed">
                            Ý kiến của bạn giúp chúng tôi cải thiện bài học tốt hơn mỗi ngày.
                        </p>

                        <button
                            type="button"
                            onClick={onDone}
                            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-primary-500 to-primary-600 text-white font-extrabold py-3.5 text-sm uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            Tiếp tục bài học <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
