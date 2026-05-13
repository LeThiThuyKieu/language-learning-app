import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { SupportThread } from "@/components/admin/support_management/supportTypes";

/** Kiểu dữ liệu nhận từ WebSocket, khớp với SupportTicketDetailDto backend */
interface WsTicketPayload {
    id: number;
    userId: number | null;
    requesterName: string;
    requesterEmail: string;
    categoryId: number;
    categoryName: string;
    categoryDisplayName: string;
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    source: string;
    createdAt: string; // ISO string
    messages: Array<{
        senderType: "USER" | "ADMIN";
        message: string;
        createdAt: string; // ISO string
    }>;
}

/** Chuyển ISO date string thành chuỗi thời gian tương đối */
function toRelativeTime(dateIso: string): string {
    const date    = new Date(dateIso);
    const diffMs  = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)  return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    return `${Math.floor(diffHour / 24)} ngày trước`;
}

/** Map payload WebSocket → SupportThread, giữ nguyên message gốc nếu được truyền vào */
function mapPayloadToThread(payload: WsTicketPayload, keepMessage?: string): SupportThread {
    const firstUserMsg = payload.messages.find((m) => m.senderType === "USER")?.message ?? "";
    return {
        id:        payload.id,
        userId:    payload.userId,
        name:      payload.requesterName || payload.requesterEmail?.split("@")[0] || "Người dùng",
        email:     payload.requesterEmail,
        category:  payload.categoryDisplayName as SupportThread["category"],
        message:   keepMessage ?? firstUserMsg, // giữ message gốc để tránh mất preview
        createdAt: toRelativeTime(payload.createdAt),
        sentAt:    payload.createdAt,
        status:    payload.status,
        messages:  payload.messages.map((m) => ({
            senderType: m.senderType,
            message:    m.message,
            createdAt:  toRelativeTime(m.createdAt),
        })),
    };
}

interface UseSupportSocketOptions {
    /** ID ticket cần subscribe. Truyền null để không subscribe. */
    ticketId: number | null;
    /** Callback nhận SupportThread đã được map khi có tin nhắn mới */
    onUpdate: (thread: SupportThread) => void;
    /** Message gốc cần giữ lại khi merge, tránh mất preview trong danh sách */
    keepMessage?: string;
}

/**
 * Hook kết nối WebSocket STOMP và subscribe vào topic của một ticket cụ thể.
 * Tự động reconnect khi mất kết nối, cleanup khi ticketId thay đổi hoặc unmount.
 * Topic: /topic/support/{ticketId}
 */
export function useSupportSocket({ ticketId, onUpdate, keepMessage }: UseSupportSocketOptions) {
    const clientRef   = useRef<Client | null>(null);
    const onUpdateRef = useRef(onUpdate);
    const keepMsgRef  = useRef(keepMessage);

    // Cập nhật ref mỗi render để callback luôn dùng giá trị mới nhất
    onUpdateRef.current = onUpdate;
    keepMsgRef.current  = keepMessage;

    useEffect(() => {
        if (ticketId === null) return; // không subscribe nếu chưa có ticketId

        const client = new Client({
            // Dùng SockJS làm transport để hỗ trợ fallback (xhr-polling, iframe, ...)
            webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"}/ws`),
            reconnectDelay: 5000, // tự reconnect sau 5s nếu mất kết nối
            onConnect: () => {
                client.subscribe(`/topic/support/${ticketId}`, (frame) => {
                    try {
                        const payload = JSON.parse(frame.body) as WsTicketPayload;
                        const thread  = mapPayloadToThread(payload, keepMsgRef.current);
                        onUpdateRef.current(thread);
                    } catch { /* bỏ qua frame không parse được */ }
                });
            },
            onStompError: (frame) => {
                console.error("[SupportSocket] STOMP error:", frame.headers["message"]);
            },
        });

        client.activate(); // bắt đầu kết nối
        clientRef.current = client;

        // Cleanup: ngắt kết nối khi ticketId thay đổi hoặc component unmount
        return () => {
            client.deactivate();
            clientRef.current = null;
        };
    }, [ticketId]); // re-subscribe khi ticketId thay đổi
}
