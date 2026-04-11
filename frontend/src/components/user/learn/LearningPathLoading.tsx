export default function LearningPathLoading() {
    return (
        <div
            className="flex min-h-[min(70vh,520px)] w-full flex-col items-center justify-center rounded-2xl px-6 py-14 text-center shadow-inner">
            <div className="relative mb-8 flex flex-col items-center">
                <div
                    className="flex h-36 w-36 items-end justify-center rounded-full bg-gradient-to-b from-amber-50 to-white shadow-md ring-4 ring-white">
                    <img
                        src="/logo/lion.png"
                        alt="Lion"
                        className="mb-1 h-32 w-32 object-contain drop-shadow-md motion-safe:animate-bounce"
                    />
                </div>
                <div
                    className="pointer-events-none absolute -bottom-1 left-1/2 h-3 w-24 -translate-x-1/2 rounded-[100%] bg-black/10 blur-[2px]"
                    aria-hidden
                />
            </div>
            <p className="text-base font-extrabold text-gray-600">
                Đang tải lộ trình bài học
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-600">
                Lion có các bài học phù hợp với người mới học, người học tầm trung và cả người học nâng cao!
            </p>
        </div>
    );
}
