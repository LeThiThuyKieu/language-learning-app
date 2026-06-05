import { createPortal } from "react-dom";
import { X } from "lucide-react";
import SupportEmailLogPanel from "./SupportEmailLogPanel";
import type { SupportEmailLog } from "./supportTypes";

type SupportEmailLogModalProps = {
    open: boolean;
    onClose: () => void;
    logs: SupportEmailLog[];
    isLoading?: boolean;
    ticketId: number;
};

export default function SupportEmailLogModal({
    open,
    onClose,
    logs,
    isLoading = false,
    ticketId,
}: SupportEmailLogModalProps) {
    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Lịch sử gửi email</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Ticket #{ticketId}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                        aria-label="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <SupportEmailLogPanel
                        logs={logs}
                        isLoading={isLoading}
                        ticketId={ticketId}
                        embedded
                    />
                </div>
            </div>
        </div>,
        document.body,
    );
}
