import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ChangePasswordModalProps {
    isOpen: boolean;
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: (payload: {
        currentPassword: string;
        newPassword: string;
        confirmNewPassword: string;
    }) => Promise<{ success: boolean; message: string }>;
}

export default function ChangePasswordModal({
                                                isOpen,
                                                isSubmitting = false,
                                                onClose,
                                                onSubmit,
                                            }: ChangePasswordModalProps) {

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [feedbackType, setFeedbackType] =
        useState<"success" | "error" | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setFeedbackMessage(null);
            setFeedbackType(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setFeedbackMessage(null);
        setFeedbackType(null);

        if (
            !currentPassword.trim() ||
            !newPassword.trim() ||
            !confirmNewPassword.trim()
        ) {
            setFeedbackType("error");
            setFeedbackMessage("Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        if (newPassword.length < 6) {
            setFeedbackType("error");
            setFeedbackMessage(
                "Mật khẩu mới phải có ít nhất 6 ký tự."
            );
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setFeedbackType("error");
            setFeedbackMessage(
                "Mật khẩu xác nhận không khớp."
            );
            return;
        }

        const result = await onSubmit({
            currentPassword,
            newPassword,
            confirmNewPassword,
        });

        setFeedbackType(
            result.success ? "success" : "error"
        );
        setFeedbackMessage(result.message);
    };

    return createPortal(
        <div className="fixed inset-0 z-[10020] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="
                w-full max-w-lg
                rounded-[30px]
                bg-gradient-to-br from-white to-amber-50
                p-6 sm:p-7
                shadow-2xl
                border border-white/60
            ">

                {/* Header */}
                <div className="mb-5 flex items-center gap-4">
                    <div className="
                        flex h-14 w-14 items-center justify-center
                        rounded-2xl
                        bg-amber-100
                        text-xl
                        shadow-sm
                    ">
                        🔒
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">
                            Đổi mật khẩu
                        </h3>

                        <p className="mt-1 text-sm text-slate-600">
                            Cập nhật mật khẩu để bảo vệ tài khoản của bạn.
                        </p>
                    </div>
                </div>

                {/* Feedback */}
                {feedbackMessage && (
                    <div
                        className={`
                        mb-4 rounded-2xl px-4 py-3 text-sm font-medium
                        ${
                            feedbackType === "success"
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-rose-200 bg-rose-50 text-rose-700"
                        }
                    `}
                    >
                        {feedbackMessage}
                    </div>
                )}

                <form
                    className="space-y-4"
                    onSubmit={handleSubmit}
                >

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Mật khẩu hiện tại
                        </label>

                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e)=>
                                setCurrentPassword(
                                    e.target.value
                                )
                            }
                            disabled={isSubmitting}
                            className="
                                w-full rounded-2xl
                                border border-slate-300
                                bg-white
                                px-4 py-3

                                transition-all duration-200

                                focus:border-primary-400
                                focus:ring-4
                                focus:ring-primary-100
                                focus:outline-none
                            "
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Mật khẩu mới
                        </label>

                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e)=>
                                setNewPassword(
                                    e.target.value
                                )
                            }
                            disabled={isSubmitting}
                            className="
                                w-full rounded-2xl
                                border border-slate-300
                                bg-white
                                px-4 py-3

                                transition-all duration-200

                                focus:border-primary-400
                                focus:ring-4
                                focus:ring-primary-100
                                focus:outline-none
                            "
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Xác nhận mật khẩu mới
                        </label>

                        <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e)=>
                                setConfirmNewPassword(
                                    e.target.value
                                )
                            }
                            disabled={isSubmitting}
                            className="
                                w-full rounded-2xl
                                border border-slate-300
                                bg-white
                                px-4 py-3

                                transition-all duration-200

                                focus:border-primary-400
                                focus:ring-4
                                focus:ring-primary-100
                                focus:outline-none
                            "
                        />
                    </div>

                    {/* Buttons */}
                    <div className="pt-2 flex justify-end gap-3">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="
                                rounded-2xl
                                border border-slate-300
                                bg-white
                                px-5 py-3
                                text-sm font-semibold
                                text-slate-700
                                hover:bg-slate-50
                            "
                        >
                            Hủy
                        </button>

                        <button
                            type={
                                feedbackType === "success"
                                    ? "button"
                                    : "submit"
                            }
                            onClick={
                                feedbackType === "success"
                                    ? onClose
                                    : undefined
                            }
                            disabled={isSubmitting}
                            className="
                                rounded-2xl
                                bg-primary-600
                                px-5 py-3
                                text-sm font-semibold
                                text-white

                                shadow-md
                                transition-all duration-200

                                hover:bg-primary-700
                                hover:scale-[1.02]

                                disabled:bg-slate-300
                                disabled:text-white
                                disabled:cursor-not-allowed
                            "
                        >
                            {isSubmitting
                                ? "Đang lưu..."
                                : feedbackType === "success"
                                    ? "Đóng"
                                    : "Cập nhật mật khẩu"}
                        </button>

                    </div>

                </form>
            </div>
        </div>,
        document.body
    );
}