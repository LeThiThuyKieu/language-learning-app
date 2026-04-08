import heroImg from "/hero-illustration/hero-image.jpg";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { profileService } from "@/services/profileService";
import toast from "react-hot-toast";
import { useState } from "react";

export default function HeroSection() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const mapLevelIdToKey = (levelId: number): "beginner" | "intermediate" | "advanced" => {
        if (levelId === 1) return "beginner";
        if (levelId === 2) return "intermediate";
        return "advanced";
    };

    const handleStartLearning = async () => {
        if (loading) return;

        // Chưa đăng nhập: hiển thị trang tạm GuestPrompt (qua route /learn đã xử lý sẵn)
        if (!isAuthenticated) {
            navigate("/learn");
            return;
        }

        setLoading(true);
        try {
            const profile = await profileService.getMyProfile();
            const levelId = profile.currentLevelId;

            if (levelId) {
                const level = mapLevelIdToKey(levelId);
                navigate("/learn", { state: { level } });
            } else {
                // Chưa có level: chào đón + chọn trình độ
                navigate("/welcome");
            }
        } catch {
            toast.error("Không thể tải thông tin trình độ của bạn.");
            navigate("/welcome");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-[70vh] flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto px-4 py-16 gap-8">
            {/* Text */}
            <div
                className="flex-1 flex flex-col items-center md:items-start justify-center text-center md:text-left space-y-6">
                {/* Tăng leading của h1 lên để các dòng không dính nhau */}
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-[1.15] md:leading-[1.2]">
                    Học ngoại ngữ <br/>
                    <span className="text-primary-600">mở lối tương lai </span>
                </h1>

                {/* Dùng leading-relaxed cho đoạn văn để dễ đọc hơn */}
                <p className="text-xl md:text-2xl text-gray-600 max-w-lg leading-relaxed">
                    Khám phá thư viện mẫu câu phong phú được thiết kế dành riêng cho nhu cầu hàng ngày. Học tập
                    thông minh, hiệu quả và không nhàm chán.
                </p>

                <div className="flex gap-4 mt-2">
                    <button
                        onClick={handleStartLearning}
                        disabled={loading}
                        className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-base rounded-lg shadow-md transition-all duration-200">
                        {isAuthenticated ? (loading ? "Đang kiểm tra..." : "Vào bài học") : "Bắt đầu học"}
                    </button>
                    <button
                        className="px-8 py-3 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold text-base rounded-lg transition-all duration-200">
                        Tìm hiểu thêm
                    </button>
                </div>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center">
                <img
                    src={heroImg}
                    alt="Hero illustration"
                    className="w-full max-w-md rounded-2xl shadow-lg object-contain"
                />
            </div>
        </div>
    )
}