export default function WhyChooseUsSection() {
    return (
        <section className="w-screen relative left-1/2 right-1/2 -mx-[50vw] bg-white py-12">
            <div className="max-w-6xl mx-auto px-4">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-2">
                    Tại sao nên sử dụng{" "}
                    <span className="text-primary-600">Lion</span>?
                </h2>
                <div className="w-24 h-2 bg-primary-600 mx-auto mb-8 rounded-full opacity-30"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Card 1 */}
                    <div
                        className="group bg-blue-50 rounded-2xl p-8 flex flex-col items-center shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 border-2 border-transparent cursor-pointer">
                        <img src="/why-choose-us/1.png" alt="Memory"
                             className="mb-4 w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-300"/>
                        <p className="mt-4 text-xl font-bold text-gray-800 text-center">
                            Các kỹ thuật ghi nhớ được khoa học chứng minh
                        </p>
                        <p className="mt-2 text-base text-gray-600 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Đừng phí thời gian với những mẫu câu chẳng ai nói bao giờ. Hãy học ngôn ngữ thực sự được
                            sử dụng trong đời sống.
                        </p>
                    </div>
                    {/* Card 2 */}
                    <div
                        className="group bg-purple-50 rounded-2xl p-8 flex flex-col items-center shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-purple-300 border-2 border-transparent cursor-pointer">
                        <img src="/why-choose-us/2.png" alt="Fast Learning"
                             className="mb-4 w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-300"/>
                        <p className="mt-4 text-xl font-bold text-gray-800 text-center">
                            Học nhanh hơn gấp hai lần so với trên lớp
                        </p>
                        <p className="mt-2 text-base text-gray-600 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Tìm những chủ đề nội dung khớp với nhu cầu của bạn: từ nói chuyện phiếm trong kỳ nghỉ
                            cho tới cuộc gặp gỡ với gia đình người yêu của bạn.
                        </p>
                    </div>
                    {/* Card 3*/}
                    <div
                        className="group bg-emerald-50 rounded-2xl p-8 flex flex-col items-center shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-400 border-2 border-transparent cursor-pointer">
                        <img src="/why-choose-us/3.png" alt="Immersion"
                             className="mb-4 w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-300"/>
                        <p className="mt-4 text-xl font-bold text-gray-800 text-center">
                            Học bằng cách đắm mình trong ngôn ngữ, như thể bạn đang sống ở đó vậy
                        </p>
                        <p className="mt-2 text-base text-gray-600 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Đừng phí thời gian với những mẫu câu chẳng ai nói bao giờ. Hãy học ngôn ngữ thực sự được
                            sử dụng trong đời sống.
                        </p>
                    </div>
                    {/* Card 4 */}
                    <div
                        className="group bg-rose-50 rounded-2xl p-8 flex flex-col items-center shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-rose-300 border-2 border-transparent cursor-pointer">
                        <img src="/why-choose-us/4.png" alt="Comprehensive"
                             className="mb-4 w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-300"/>
                        <p className="mt-4 text-xl font-bold text-gray-800 text-center">
                            Bao quát mọi thứ từ kiến thức thiết yếu đến mục tiêu dài hạn
                        </p>
                        <p className="mt-2 text-base text-gray-600 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Tìm những chủ đề nội dung khớp với nhu cầu của bạn: từ nói chuyện phiếm trong kỳ nghỉ
                            cho tới cuộc gặp gỡ với gia đình người yêu của bạn.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}