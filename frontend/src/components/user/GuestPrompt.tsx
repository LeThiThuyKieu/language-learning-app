import { Link } from "react-router-dom";

export default function GuestPrompt() {
    return (

        <div className="h-full min-h-[600px] w-full flex items-center justify-center ">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-20">

                    {/* Cột Nội Dung */}
                    <div className="text-center lg:text-left order-2 lg:order-1">
                        <h2 className="text-4xl sm:text-4xl lg:text-5xl font-extrabold text-[#1f1a17] leading-[1.2] tracking-tight">
                            Bạn đã có hồ sơ <br className="hidden lg:block" /> học tập chưa?
                        </h2>
                        <p className="mt-6 text-gray-600 text-basic sm:text-xl max-w-md mx-auto lg:mx-0 leading-relaxed">
                            Đăng nhập hoặc tạo tài khoản để lưu lại quá trình học, nhận huy hiệu và thi đua cùng bạn bè mỗi ngày.
                        </p>

                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                to="/login"
                                className="px-8 py-4 rounded-2xl bg-[#ee552b] text-white font-bold text-lg shadow-lg shadow-orange-200 hover:bg-[#d4441e] hover:-translate-y-0.5 transition-all duration-200 text-center"
                            >
                                Đăng nhập ngay
                            </Link>
                            <Link
                                to="/register"
                                className="px-8 py-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 text-center"
                            >
                                Tạo tài khoản
                            </Link>
                        </div>
                    </div>

                    {/* Cột Hình Ảnh */}
                    <div className="flex justify-center order-1 lg:order-2">
                        <div className="relative group">
                            {/* Một chút hiệu ứng decor phía sau ảnh cho bớt trống */}
                            <div className="absolute inset-0 bg-orange-100 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                            <img
                                src="/hero-illustration/hero-image.jpg"
                                alt="Hero"
                                className="relative w-full max-w-sm lg:max-w-md xl:max-w-lg object-contain drop-shadow-2xl animate-float"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}