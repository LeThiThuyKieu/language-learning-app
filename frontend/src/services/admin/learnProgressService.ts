import apiClient from "@/config/api";

export interface NodeProgressItem {
    nodeId: number;
    title: string;
    nodeType: string;
    orderIndex: number;
    status: "not_started" | "in_progress" | "completed";
    earnedXp: number;
    maxXp: number;
    attemptCount: number;
}

export interface TreeProgressItem {
    treeId: number;
    orderIndex: number;
    status: "locked" | "in_progress" | "done";
    accuracy: number;
    nodes: NodeProgressItem[];
}

export interface UserLearnSummary {
    userId: number;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    currentLevelId: number | null;
    currentLevelName: string | null;
    completedTrees: number;
    totalTrees: number;
    currentProgressLabel: string | null;
}

export interface UserLearnDetail extends UserLearnSummary {
    completedNodes: number;
    totalNodes: number;
    trees: TreeProgressItem[];
}

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    number: number;
    size: number;
}

export const learnProgressService = {
    getSummaryList: async (page = 0, size = 10, search?: string) => {
        const params: Record<string, string | number> = { page, size };
        if (search) params.search = search;
        const res = await apiClient.get<{ data: PageResponse<UserLearnSummary> }>(
            "/admin/learn-progress", { params }
        );
        return res.data.data;
    },

    getDetail: async (userId: number): Promise<UserLearnDetail> => {
        const res = await apiClient.get<{ data: UserLearnDetail }>(
            `/admin/learn-progress/${userId}`
        );
        return res.data.data;
    },
};
