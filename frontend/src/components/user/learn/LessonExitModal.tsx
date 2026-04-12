type Props = {
    open: boolean;
    onContinue: () => void;
    onExit: () => void;
    // Mặc định: Tiếp tục học . Placement test dùng "Tiếp tục Test".
    continueButtonText?: string;
};

export default function LessonExitModal({
    open,
    onContinue,
    onExit,
    continueButtonText = "Tiếp tục học",
}: Props) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                aria-label="Đóng"
                onClick={onContinue}
            />
            <div
                className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center"
                role="dialog"
                aria-modal="true"
                aria-labelledby="lesson-exit-title"
            >
                <img
                    src="/logo/lion.png"
                    alt=""
                    className="mx-auto h-24 w-24 object-contain mb-4"
                />
                <p
                    id="lesson-exit-title"
                    className="text-gray-800 font-bold text-lg leading-snug mb-6"
                >
                    Đợi chút, đừng đi mà! Bạn sẽ mất hết tiến trình của bài học này nếu thoát bây giờ.
                </p>
                <button
                    type="button"
                    onClick={onContinue}
                    className="w-full rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold py-3.5 uppercase tracking-wide text-sm mb-2 transition shadow-md"
                >
                    {continueButtonText}
                </button>
                <button
                    type="button"
                    onClick={onExit}
                    className="w-full text-red-500 font-bold uppercase tracking-wide text-sm py-2.5 hover:underline"
                >
                    Thoát
                </button>
            </div>
        </div>
    );
}
