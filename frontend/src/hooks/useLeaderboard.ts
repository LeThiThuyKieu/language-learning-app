import { useEffect, useState } from "react";
import { leaderboardService, type LeaderboardEntry, type LeaderboardPeriod } from "@/services/leaderboardService";

export function useLeaderboard(limit = 10, period: LeaderboardPeriod = "WEEK") {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

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

        return () => {
            cancelled = true;
        };
    }, [limit, period]);

    return { entries, isLoading, error };
}