import { create } from "zustand";

type ProfileSummary = {
    fullName: string | null;
    avatarUrl: string | null;
    email: string | null;
};

interface ProfileState extends ProfileSummary {
    syncFromProfile: (profile: ProfileSummary) => void;
    patch: (partial: Partial<ProfileSummary>) => void;
    clear: () => void;
}

const EMPTY: ProfileSummary = {
    fullName: null,
    avatarUrl: null,
    email: null,
};

export const useProfileStore = create<ProfileState>((set) => ({
    ...EMPTY,
    syncFromProfile: (profile) =>
        set({
            fullName: profile.fullName ?? null,
            avatarUrl: profile.avatarUrl ?? null,
            email: profile.email ?? null,
        }),
    patch: (partial) => set((state) => ({ ...state, ...partial })),
    clear: () => set(EMPTY),
}));
