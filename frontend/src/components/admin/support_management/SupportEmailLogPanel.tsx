import { CheckCircle, Loader2, Mail, XCircle } from "lucide-react";
import type { SupportEmailLog } from "./supportTypes";

type SupportEmailLogPanelProps = {
    logs: SupportEmailLog[];
    isLoading?: boolean;
    ticketId: number;
    /** true khi hiển thị bên trong modal (ẩn tiêu đề section) */
    embedded?: boolean;
};

function formatSentAt(sentAt: string): string {
    const normalized = sentAt.endsWith("Z") ? sentAt : sentAt + "Z";
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return sentAt;
    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function SupportEmailLogPanel({
    logs,
    isLoading = false,
    ticketId,
    embedded = false,
}: SupportEmailLogPanelProps) {
    return (
        <div className={embedded ? "" : "border-t border-gray-100 pt-5"}>
            {!embedded && (
                <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-[11px] font-bold px-3 py-1 rounded-full">
                        <Mail className="w-3 h-3" />
                        LỊCH SỬ GỬI EMAIL
                    </span>
                    <span className="text-xs text-gray-400">Ticket #{ticketId}</span>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
            ) : logs.length === 0 ? (
                <p className="text-sm text-gray-400 bg-gray-50 rounded-2xl px-4 py-3">
                    Chưa có email phản hồi nào được gửi cho ticket này.
                </p>
            ) : (
                <div className="space-y-2">
                    {logs.map((log) => {
                        const isSuccess = log.status === "SUCCESS";
                        return (
                            <div
                                key={log.id}
                                className={[
                                    "rounded-2xl border px-4 py-3 text-sm",
                                    isSuccess
                                        ? "border-emerald-100 bg-emerald-50/50"
                                        : "border-rose-100 bg-rose-50/50",
                                ].join(" ")}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                    <span
                                        className={[
                                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                            isSuccess
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-rose-100 text-rose-700",
                                        ].join(" ")}
                                    >
                                        {isSuccess ? (
                                            <CheckCircle className="h-3.5 w-3.5" />
                                        ) : (
                                            <XCircle className="h-3.5 w-3.5" />
                                        )}
                                        {isSuccess ? "Thành công" : "Thất bại"}
                                    </span>
                                    <span className="text-xs text-gray-500">{formatSentAt(log.sentAt)}</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-0.5">Người nhận</p>
                                <p className="font-medium text-gray-800 mb-2">{log.toEmail}</p>
                                <p className="text-xs text-gray-500 mb-0.5">Tiêu đề</p>
                                <p className="text-gray-700 leading-snug">{log.subject}</p>
                                {!isSuccess && log.errorMessage && (
                                    <>
                                        <p className="text-xs text-gray-500 mt-2 mb-0.5">Lỗi</p>
                                        <p className="text-rose-700 text-xs leading-relaxed break-words">
                                            {log.errorMessage}
                                        </p>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
