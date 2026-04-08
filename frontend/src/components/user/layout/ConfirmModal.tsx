import { createPortal } from "react-dom";

// ConfirmModal.tsx
interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: string;
}

export default function ConfirmModal({
                                         isOpen,
                                         onClose,
                                         onConfirm,
                                         message,
                                     }: ConfirmModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10020] bg-black/45 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 sm:p-10 w-full max-w-lg shadow-2xl">
                <p className="text-gray-700 text-lg mb-8">{message}</p>

                <div className="flex justify-between gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-orange-200 hover:bg-orange-300 transition-colors font-semibold"
                    >
                        Hủy
                    </button>

                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors font-semibold"
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}