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

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-10 w-11/12 max-w-lg shadow-2xl">
                <p className="text-gray-700 text-lg mb-10">{message}</p>

                <div className="flex justify-between">
                    <button
                        onClick={onClose}
                        className="flex-1 mr-2 py-3 rounded-xl bg-orange-200 hover:bg-orange-300 transition-colors"
                    >
                        Hủy
                    </button>

                    <button
                        onClick={onConfirm}
                        className="flex-1 ml-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
}