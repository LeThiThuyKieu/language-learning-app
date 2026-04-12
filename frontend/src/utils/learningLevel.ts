export type LevelKey = "beginner" | "intermediate" | "advanced";

export function mapLevelIdToKey(levelId: number): LevelKey {
    if (levelId === 1) return "beginner";
    if (levelId === 2) return "intermediate";
    return "advanced";
}

/** Đã chọn & lưu trình độ trên profile (API trả currentLevelId) */
export function hasChosenLearningLevel(currentLevelId: number | null | undefined): boolean {
    return typeof currentLevelId === "number" && currentLevelId >= 1 && currentLevelId <= 3;
}

export function isLevelKeyFromState(v: unknown): v is LevelKey {
    return v === "beginner" || v === "intermediate" || v === "advanced";
}
