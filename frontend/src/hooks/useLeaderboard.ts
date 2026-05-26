import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { leaderboardService, type LeaderboardEntry, type LeaderboardPeriod } from "@/services/leaderboardService";

export function useLeaderboard(limit = 10, period: LeaderboardPeriod = "WEEK") {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        let stompClient: any | null = null;
        let subscription: any | null = null;

        const loadLeaderboard = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await leaderboardService.getTopLeaderboard(period);
                if (!cancelled) {
                    setEntries(data.slice(0, Math.max(1, Math.min(limit, 10))));
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

        // Subscribe to websocket snapshot for realtime updates
        try {
            const socket = new SockJS('/ws');
            stompClient = Stomp.over(socket);
            stompClient.connect({}, () => {
                subscription = stompClient.subscribe(`/topic/leaderboard/${period}`, (message: { body: string }) => {
                    try {
                        const data: LeaderboardEntry[] = JSON.parse(message.body);
                        if (!cancelled) {
                            setEntries(data.slice(0, Math.max(1, Math.min(limit, 10))));
                        }
                    } catch (e) {
                        // ignore parse errors
                    }
                });
            });
        } catch (e) {
            // ignore websocket errors; fallback to polling
        }

        return () => {
            cancelled = true;
            try {
                if (subscription) subscription.unsubscribe();
            } catch (e) {}
            try {
                if (stompClient && stompClient.connected) stompClient.disconnect();
            } catch (e) {}
        };
    }, [limit, period]);

    return { entries, isLoading, error };
}