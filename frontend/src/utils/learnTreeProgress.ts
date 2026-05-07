import { learningService, type AttemptItem } from "@/services/learningService";

/**
 * Tiến độ cây bài học — lưu DB là nguồn chính, sessionStorage là cache tạm.
 */
export function learnTreeUnlockedStorageKey(treeId: number): string {
    return `learn_tree_${treeId}_unlocked`;
}

export function getLearnTreeUnlockedCount(treeId: number): number {
    try {
        const v = sessionStorage.getItem(learnTreeUnlockedStorageKey(treeId));
        const n = v ? Number(v) : 1;
        return Number.isFinite(n) && n >= 1 ? n : 1;
    } catch {
        return 1;
    }
}

function setLearnTreeUnlockedCount(treeId: number, count: number) {
    try {
        sessionStorage.setItem(learnTreeUnlockedStorageKey(treeId), String(count));
    } catch {
        // ignore
    }
}

/**
 * Load tiến trình từ DB và cập nhật sessionStorage cache.
 * Gọi khi vào LearningPage.
 */
export async function loadProgressFromDB(treeId: number): Promise<number> {
    try {
        const count = await learningService.getUnlockedCount(treeId);
        setLearnTreeUnlockedCount(treeId, count);
        return count;
    } catch {
        // Nếu lỗi mạng, dùng cache sessionStorage
        return getLearnTreeUnlockedCount(treeId);
    }
}

/**
 * Sau khi hoàn thành node: ghi lại attempts + complete node.
 * Trả về unlockedCount mới.
 */
export async function completeNodeAndSave(
    nodeId: number,
    treeId: number,
    levelId?: number,
    correctCount = 0,
    attempts?: AttemptItem[]
): Promise<number> {
    try {
        let result: { unlockedCount: number; knEarned: number };

        if (attempts && attempts.length > 0) {
            result = await learningService.submitAttempts({ nodeId, attempts });
        } else {
            result = await learningService.completeNode(nodeId, correctCount);
        }

        const count = result.unlockedCount;
        setLearnTreeUnlockedCount(treeId, count);
        if (levelId != null) {
            learningService.invalidateLevelQuestionsCache(levelId);
        }
        return count;
    } catch {
        const current = getLearnTreeUnlockedCount(treeId);
        const next = Math.max(current, 1);
        setLearnTreeUnlockedCount(treeId, next);
        return next;
    }
}

export function bumpLearnTreeUnlocked(treeId: number, atLeast: number): number {
    const floor = Number.isFinite(atLeast) && atLeast >= 1 ? atLeast : 1;
    const next = Math.max(getLearnTreeUnlockedCount(treeId), floor);
    setLearnTreeUnlockedCount(treeId, next);
    return next;
}
