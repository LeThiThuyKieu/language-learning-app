import apiClient from "@/config/api";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface ProfileBadge {
    id: number;
    badgeName: string;
    description: string;
    requiredXp: number;
    iconUrl: string | null;
    earnedAt: string | null;
}

export interface UserProfileDetail {
    userId: number;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    targetGoal: string | null;
    currentLevelId: number | null;
    currentLevelName: string | null;
    currentLevelCefr: string | null;
    totalXp: number;
    streakCount: number;
    rankPosition: number | null;
    completedNodes: number;
    totalNodes: number;
    completionRate: number;
    totalAttempts: number;
    weeklyActivityXp: number[];
    todayXp: number;
    createdAt: string;
    lastLogin: string | null;
    badges: ProfileBadge[];
    hasPassword: boolean;
    authProvider: "LOCAL" | "GOOGLE" | "FACEBOOK";
}

export interface UpdateProfilePayload {
    fullName?: string;
    avatarUrl?: string;
    targetGoal?: string;
    currentLevelId?: number;
}

export const profileService = {
    getMyProfile: async (): Promise<UserProfileDetail> => {
        const response = await apiClient.get<ApiResponse<UserProfileDetail>>(
            "/users/profile"
        );
        return response.data.data;
    },

    updateMyProfile: async (
        payload: UpdateProfilePayload
    ): Promise<UserProfileDetail> => {
        const response = await apiClient.put<ApiResponse<UserProfileDetail>>(
            "/users/profile",
            payload
        );
        return response.data.data;
    },

    uploadAvatar: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiClient.post<ApiResponse<string>>(
            "/users/profile/avatar",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return response.data.data;
    },
};