import apiClient from "@/config/api";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface LeaderboardEntry {
    rankPosition: number;
    userId: number;
    displayName: string;
    avatarUrl: string | null;
    totalKn: number;
    totalXp: number;
    updatedAt: string;
}

export type LeaderboardPeriod = "WEEK" | "MONTH" | "ALL";

export const leaderboardService = {
    getTopLeaderboard: async (period: LeaderboardPeriod = "WEEK"): Promise<LeaderboardEntry[]> => {
        const response = await apiClient.get<ApiResponse<LeaderboardEntry[]>>(
            `/leaderboard/top?period=${period}`
        );

        return response.data.data;
    },
};