import apiClient from "@/config/api";
import { useProfileStore } from "@/store/profileStore";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface ProfileBadge {
    id: number;
    badgeName: string;
    description: string;
    requiredKn: number;
    iconUrl: string | null;
    earned: boolean;
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
    totalKn: number;
    completedNodes: number;
    totalNodes: number;
    completionRate: number;
    totalAttempts: number;
    accuracyByType: Record<string, number>;
    completedTrees: number;
    totalTrees: number;
    currentProgressLabel: string | null;
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
        const data = response.data.data;
        useProfileStore.getState().syncFromProfile(data);
        return data;
    },

    updateMyProfile: async (
        payload: UpdateProfilePayload
    ): Promise<UserProfileDetail> => {
        const response = await apiClient.put<ApiResponse<UserProfileDetail>>(
            "/users/profile",
            payload
        );
        const data = response.data.data;
        useProfileStore.getState().syncFromProfile(data);
        return data;
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