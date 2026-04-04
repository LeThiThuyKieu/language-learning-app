import heroImg from "/hero-illustration/hero-image.jpg";

export default function HeroSection()
{
    return (
        <div
            className="min-h-[70vh] flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto px-4 py-16 gap-8">
            {/* Text */}
            <div
                className="flex-1 flex flex-col items-center md:items-start justify-center text-center md:text-left space-y-6">
                {/* Tăng leading của h1 lên để các dòng không dính nhau */}
                <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.15] md:leading-[1.2]">
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
                        className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-lg rounded-lg shadow-md transition-all duration-200">
                        Bắt đầu học
                    </button>
                    <button
                        className="px-8 py-3 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold text-lg rounded-lg transition-all duration-200">
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