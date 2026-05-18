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

export const leaderboardService = {
    getTopLeaderboard: async (limit = 10): Promise<LeaderboardEntry[]> => {
        const response = await apiClient.get<ApiResponse<LeaderboardEntry[]>>(
            `/leaderboard/top?limit=${limit}`
        );

        return response.data.data;
    },
};