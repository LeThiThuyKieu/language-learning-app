// Data for section 3 (Type-Learning Features)
const learningFeatures = [
    {
        title: "Vocabulary",
        desc: "Phát triển vốn từ vựng",
        // Tông xanh Blue đậm
        color: "bg-[#7EC9E0]",
        patternColor: "text-[#69b7cd]/50",
        // Lớp nền đậm hơn nữa
        iconColor: "bg-[#4a8a9a]/90",
        patternType: "concentric",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                 strokeLinejoin="round">
                <rect x="3" y="5" width="14" height="14" rx="2" ry="2"/>
                <path d="M7 1h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2"/>
            </svg>
        )
    },
    {
        title: "Listening",
        desc: "Rèn luyện đôi tai linh hoạt",
        // Tông cam Peach đậm
        color: "bg-[#FFAD7A]",
        patternColor: "text-[#ff985c]/50",
        // Lớp nền đậm hơn nữa
        iconColor: "bg-[#d86d34]/90",
        patternType: "dots",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                 strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                <path
                    d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
        )
    },
    {
        title: "Speaking",
        desc: "Tự tin giao tiếp tự nhiên",
        // Tông xanh Mint/Green đậm
        color: "bg-[#8DE8C5]",
        patternColor: "text-[#7ad8b3]/50",
        // Lớp nền đậm hơn nữa
        iconColor: "bg-[#4a9d7a]/90",
        patternType: "zigzag",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                 strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
            </svg>
        )
    },
    {
        title: "Matching",
        desc: "Nối từ và ghi nhớ nghĩa",
        // Tông vàng đậm
        color: "bg-[#FFDB80]",
        patternColor: "text-[#ffcb5c]/50",
        // Lớp nền đậm hơn nữa
        iconColor: "bg-[#d89f34]/90",
        patternType: "concentric",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                 strokeLinejoin="round">
                <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
            </svg>
        )
    },
    {
        title: "Review",
        desc: "Ôn tập và củng cố kiến thức",
        // Tông hồng/đỏ Coral đậm
        color: "bg-[#F79383]",
        patternColor: "text-[#f37c69]/50",
        // Lớp nền đậm hơn nữa
        iconColor: "bg-[#ca5c4a]/90",
        patternType: "leaves",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                 strokeLinejoin="round">
                <path d="M12 20V10M18 20V4M6 20v-4"/>
            </svg>
        )
    }
];

export default function TypeLearningSection(){
    return(
        <section
            className="w-screen relative left-1/2 right-1/2 -mx-[50vw] py-16 bg-gradient-to-r from-orange-50 via-white to-emerald-50">
            <div className="max-w-6xl mx-auto px-4">

                {/* Tiêu đề */}
                <div className="flex flex-col items-center mb-12">
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center">
                            Học tiếng anh cùng{" "}
                            <span className="text-primary-600">Lion</span>{" "}
                        </h2>
                    </div>
                    <p className="text-basic md:text-xl text-gray-600 text-center max-w-2xl mt-2">
                        Học ngôn ngữ nhanh chóng và dễ dàng hơn cùng Lion – nền tảng tối ưu cho hành trình chinh
                        phục ngoại ngữ của bạn.
                    </p>
                </div>

                {/* Lưới danh sách các type learning */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
                    {learningFeatures.map((feature, index) => (
                        <div
                            key={index}
                            className={`group ${feature.color} rounded-[2rem] p-6 flex flex-col items-center justify-center shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer relative overflow-hidden
                    ${index === 0 || index === 4 ? "min-h-[350px]" : index === 1 || index === 3 ? "min-h-[280px]" : "min-h-[230px]"}`}
                        >
                            {/* Họa tiết góc trên (SVG Pattern) */}
                            <div className={`absolute top-2 right-2 w-20 h-20 ${feature.patternColor} opacity-70`}>
                                {feature.patternType === 'concentric' && (
                                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="100" cy="0" r="30"/>
                                        <circle cx="100" cy="0" r="50"/>
                                        <circle cx="100" cy="0" r="70"/>
                                    </svg>
                                )}
                                {feature.patternType === 'dots' && (
                                    <div className="grid grid-cols-4 gap-2 mt-4 ml-4">
                                        {[...Array(12)].map((_, i) => <div key={i}
                                                                           className="w-1 h-1 rounded-full bg-current"/>)}
                                    </div>
                                )}
                                {feature.patternType === 'zigzag' && (
                                    <svg viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2.5"
                                         strokeLinecap="round">
                                        <path d="M0 10 L20 30 L40 10 L60 30 L80 10"/>
                                        <path d="M0 20 L20 40 L40 20 L60 40 L80 20"/>
                                    </svg>
                                )}
                                {feature.patternType === 'leaves' && (
                                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5"
                                         strokeLinecap="round">
                                        <path d="M30 20 C40 10, 60 10, 70 20 S60 30, 30 20 Z"/>
                                        <path d="M40 30 C50 20, 70 20, 80 30 S70 40, 40 30 Z"/>
                                    </svg>
                                )}
                            </div>

                            {/* Icon tròn có lớp nền mờ */}
                            <div
                                className={`w-16 h-16 ${feature.iconColor} rounded-full flex items-center justify-center mb-6 z-10 backdrop-blur-sm`}>
                                <div className="w-10 h-10 text-white flex items-center justify-center">
                                    {feature.icon}
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="text-center z-10">
                                <h3 className="text-xl font-bold text-gray-800 mb-2 uppercase tracking-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-base text-gray-700 font-medium leading-tight px-2 text-center text-balance">
                                    {feature.desc}
                                </p>
                            </div>

                            {/* Họa tiết góc dưới (Cho Card Review và Vocabulary) */}
                            {(index === 0 || index === 4) && (
                                <div
                                    className={`absolute bottom-2 left-2 w-16 h-16 ${feature.patternColor} rotate-180`}>
                                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="100" cy="0" r="30"/>
                                        <circle cx="100" cy="0" r="50"/>
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}