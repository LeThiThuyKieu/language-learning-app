import { createPortal } from "react-dom";
import { BookOpenCheck, Sparkles, X } from "lucide-react";

interface GeneralRevisionUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToRevision: () => void;
}

/**
 * Modal xuất hiện khi user vừa hoàn thành cả 3 level —
 * gợi ý chuyển sang phần Ôn tập tổng hợp.
 */
export default function GeneralRevisionUnlockModal({
  isOpen,
  onClose,
  onGoToRevision,
}: GeneralRevisionUnlockModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top gradient strip */}
        <div className="h-2 w-full bg-gradient-to-r from-orange-400 via-primary-500 to-orange-600" />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-7 py-8 flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <BookOpenCheck className="h-8 w-8 text-orange-600" />
          </div>

          <img
            src="/logo/lion.png"
            alt="Lion mascot"
            className="w-20 h-20 object-contain drop-shadow-lg select-none"
            draggable={false}
          />

          {/* Title */}
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">
              🎉 Xuất sắc! Bạn đã hoàn thành 3 level!
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Bạn có muốn <span className="font-bold text-primary-600">Ôn tập tổng hợp</span> để
              mở rộng kiến thức qua các chủ đề thực tế?
            </p>
          </div>

          {/* Actions: Button trên — Để sau dưới */}
          <div className="flex flex-col items-center gap-2 w-full pt-1">
            <button
              type="button"
              onClick={onGoToRevision}
              className="w-full rounded-2xl bg-gradient-to-r from-primary-500 to-orange-600 hover:opacity-90 active:scale-95 text-white font-extrabold py-3.5 text-sm uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Bắt đầu ôn tập ngay
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
