import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { leaderboardService, type LeaderboardEntry } from "@/services/leaderboardService";

export function useLeaderboard(limit = 10) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const socket = new SockJS("/ws");
        const stompClient = Stomp.over(socket);

        const loadLeaderboard = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await leaderboardService.getTopLeaderboard(limit);
                if (!cancelled) {
                    setEntries(data);
                }
            } catch {
                if (!cancelled) {
                    setError("Không tải được bảng xếp hạng");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadLeaderboard();

        // WebSocket: nhận snapshot BXH mới nhất từ backend để không cần polling.
        stompClient.debug = () => {};
        stompClient.connect({}, () => {
            stompClient.subscribe("/topic/leaderboard", (message: { body: string }) => {
                try {
                    const data = JSON.parse(message.body) as LeaderboardEntry[];
                    if (!cancelled) {
                        setEntries(data);
                    }
                } catch {
                    if (!cancelled) {
                        setError("Dữ liệu BXH nhận từ WebSocket không hợp lệ");
                    }
                }
            });
        });

        return () => {
            cancelled = true;
            if (stompClient.connected) {
                stompClient.disconnect(() => undefined);
            }
        };
    }, [limit]);

    return { entries, isLoading, error };
}