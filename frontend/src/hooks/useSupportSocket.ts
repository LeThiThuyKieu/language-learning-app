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
    createdAt: string;
    messages: Array<{
        senderType: "USER" | "ADMIN";
        message: string;
        createdAt: string;
    }>;
}

/** Kiểu list item nhận từ /topic/support/list */
interface WsListItemPayload {
    id: number;
    requesterName: string;
    requesterEmail: string;
    categoryDisplayName: string;
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    source: string;
    createdAt: string;
    latestMessage: string;
}

/** Chuyển ISO date string thành chuỗi thời gian tương đối */
function toRelativeTime(dateIso: string): string {
    const normalized = dateIso.endsWith("Z") ? dateIso : dateIso + "Z";
    const date    = new Date(normalized);
    if (isNaN(date.getTime())) return dateIso;
    const diffMs  = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)  return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    return `${Math.floor(diffHour / 24)} ngày trước`;
}

const AUTO_REPLY_TEXT = "Cảm ơn bạn đã liên hệ hỗ trợ 💬 Yêu cầu của bạn đã được gửi thành công. Admin sẽ phản hồi trong thời gian sớm nhất. Vui lòng chờ trong giây lát nhé!";

/** Map payload WebSocket → SupportThread */
function mapPayloadToThread(payload: WsTicketPayload, keepMessage?: string): SupportThread {
    const realMessages = payload.messages.filter((m) => m.message !== AUTO_REPLY_TEXT);
    const latestMsg    = realMessages.length > 0 ? realMessages[realMessages.length - 1].message : "";
    const firstUserMsg = payload.messages.find((m) => m.senderType === "USER")?.message ?? "";
    return {
        id:        payload.id,
        userId:    payload.userId,
        name:      payload.requesterName || payload.requesterEmail?.split("@")[0] || "Người dùng",
        email:     payload.requesterEmail,
        category:  payload.categoryDisplayName as SupportThread["category"],
        message:   keepMessage ?? latestMsg ?? firstUserMsg,
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

/** URL SockJS — dùng relative path để đi qua Vite proxy, tránh CORS và 302 redirect */
const WS_URL = "/ws";

interface UseSupportSocketOptions {
    ticketId: number | null;
    onUpdate: (thread: SupportThread) => void;
    keepMessage?: string;
}

/**
 * Subscribe vào /topic/support/{ticketId} để nhận tin nhắn realtime của ticket đang xem.
 */
export function useSupportSocket({ ticketId, onUpdate, keepMessage }: UseSupportSocketOptions) {
    const clientRef   = useRef<Client | null>(null);
    const onUpdateRef = useRef(onUpdate);
    const keepMsgRef  = useRef(keepMessage);

    onUpdateRef.current = onUpdate;
    keepMsgRef.current  = keepMessage;

    useEffect(() => {
        if (ticketId === null) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log(`[SupportSocket] connected → /topic/support/${ticketId}`);
                client.subscribe(`/topic/support/${ticketId}`, (frame) => {
                    console.log(`[SupportSocket] ticket ${ticketId}:`, frame.body);
                    try {
                        const payload = JSON.parse(frame.body) as WsTicketPayload;
                        onUpdateRef.current(mapPayloadToThread(payload, keepMsgRef.current));
                    } catch (err) {
                        console.error("[SupportSocket] parse error:", err, frame.body);
                    }
                });
            },
            onStompError: (frame) => {
                console.error("[SupportSocket] STOMP error:", frame.headers["message"]);
            },
            onDisconnect: () => {
                console.warn(`[SupportSocket] disconnected ticket ${ticketId}`);
            },
        });

        client.activate();
        clientRef.current = client;
        return () => { client.deactivate(); clientRef.current = null; };
    }, [ticketId]);
}

interface UseSupportListSocketOptions {
    onListUpdate: (item: WsListItemPayload) => void;
}

/**
 * Subscribe vào /topic/support/list để nhận cập nhật danh sách (sort, status, preview).
 * Dùng cho admin page — nhận update của mọi ticket, không chỉ ticket đang xem.
 */
export function useSupportListSocket({ onListUpdate }: UseSupportListSocketOptions) {
    const clientRef     = useRef<Client | null>(null);
    const onUpdateRef   = useRef(onListUpdate);
    onUpdateRef.current = onListUpdate;

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log("[SupportListSocket] connected → /topic/support/list");
                client.subscribe("/topic/support/list", (frame) => {
                    console.log("[SupportListSocket] received:", frame.body);
                    try {
                        const item = JSON.parse(frame.body) as WsListItemPayload;
                        onUpdateRef.current(item);
                    } catch (err) {
                        console.error("[SupportListSocket] parse error:", err, frame.body);
                    }
                });
            },
            onStompError: (frame) => {
                console.error("[SupportListSocket] STOMP error:", frame.headers["message"]);
            },
            onDisconnect: () => {
                console.warn("[SupportListSocket] disconnected");
            },
        });

        client.activate();
        clientRef.current = client;
        return () => { client.deactivate(); clientRef.current = null; };
    }, []);
}

export type { WsListItemPayload };
