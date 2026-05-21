import { learningService, type AttemptItem, type BadgeInfo, type CompleteNodeResult } from "@/services/learningService";

/**
 * Tiến độ cây bài học — lưu DB là nguồn chính, sessionStorage là cache tạm.
 */
export function learnTreeUnlockedStorageKey(treeId: number): string {
    return `learn_tree_${treeId}_unlocked`;
}

export function getLearnTreeUnlockedCount(treeId: number): number {
    try {
        const v = sessionStorage.getItem(learnTreeUnlockedStorageKey(treeId));
        const n = v ? Number(v) : 0;
        return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
        return 0;
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
 * Mở khóa node 1 của tree tiếp theo (nextTreeId).
 * Chỉ set nếu chưa có progress — để không ghi đè progress thực từ DB.
 * Gọi ngay sau khi user hoàn thành feedback để UI phản hồi tức thì.
 */
export function unlockNextTree(nextTreeId: number): void {
    try {
        // Chỉ set = 1 nếu hiện tại = 0 (chưa unlock)
        // Không ghi đè nếu đã có progress cao hơn
        if (getLearnTreeUnlockedCount(nextTreeId) === 0) {
            setLearnTreeUnlockedCount(nextTreeId, 1);
        }
    } catch {
        // ignore
    }
}

/**
 * Xóa cache sessionStorage của một tree.
 * Gọi trước khi navigate về LearningPage để đảm bảo
 * loadProgressFromDB là nguồn duy nhất quyết định trạng thái.
 */
export function clearTreeCache(treeId: number): void {
    try {
        sessionStorage.removeItem(learnTreeUnlockedStorageKey(treeId));
    } catch {
        // ignore
    }
}

/**
 * Load tiến trình từ DB và cập nhật sessionStorage cache.
 * - Tree đầu tiên (index 0): luôn có ít nhất 1 node unlock.
 * - Các tree sau: chỉ unlock nếu user đã feedback cho tree trước (kiểm tra từ DB).
 */
export async function loadProgressFromDB(treeId: number, treeIndex = 0, prevTreeId?: number): Promise<number> {
    try {
        const count = await learningService.getUnlockedCount(treeId);

        // Nếu DB trả về > 0 → tree này đã có progress, dùng luôn
        if (count > 0) {
            setLearnTreeUnlockedCount(treeId, count);
            return count;
        }

        // DB = 0: tree chưa bắt đầu
        if (treeIndex === 0) {
            // Tree đầu tiên luôn mở node 1
            setLearnTreeUnlockedCount(treeId, 1);
            return 1;
        }

        // Tree tiếp theo: kiểm tra feedback của tree trước từ DB
        if (prevTreeId !== undefined) {
            const feedbackDone = await learningService.checkFeedback(prevTreeId);
            if (feedbackDone) {
                setLearnTreeUnlockedCount(treeId, 1);
                return 1;
            }
        }

        // Chưa đủ điều kiện → khoá (0)
        setLearnTreeUnlockedCount(treeId, 0);
        return 0;
    } catch {
        // Nếu lỗi mạng, dùng cache sessionStorage
        return getLearnTreeUnlockedCount(treeId);
    }
}

/**
 * Sau khi hoàn thành node: ghi lại attempts + complete node.
 * Trả về unlockedCount mới và danh sách badge mới được trao.
 */
export async function completeNodeAndSave(
    nodeId: number,
    treeId: number,
    levelId?: number,
    correctCount = 0,
    attempts?: AttemptItem[],
    reviewMeta?: { elapsedSeconds: number; timedOut: boolean; outcome: string }
): Promise<{ unlockedCount: number; newBadges: BadgeInfo[] }> {
    try {
        let result: CompleteNodeResult;

        if (attempts && attempts.length > 0) {
            result = await learningService.submitAttempts({
                nodeId,
                attempts,
                ...(reviewMeta ?? {}),
            });
        } else {
            result = await learningService.completeNode(nodeId, correctCount);
        }

        setLearnTreeUnlockedCount(treeId, result.unlockedCount);
        if (levelId != null) {
            learningService.invalidateLevelQuestionsCache(levelId);
        }
        return { unlockedCount: result.unlockedCount, newBadges: result.newBadges ?? [] };
    } catch {
        const current = getLearnTreeUnlockedCount(treeId);
        const next = Math.max(current, 1);
        setLearnTreeUnlockedCount(treeId, next);
        return { unlockedCount: next, newBadges: [] };
    }
}

export function bumpLearnTreeUnlocked(treeId: number, atLeast: number): number {
    const floor = Number.isFinite(atLeast) && atLeast >= 1 ? atLeast : 1;
    const next = Math.max(getLearnTreeUnlockedCount(treeId), floor);
    setLearnTreeUnlockedCount(treeId, next);
    return next;
}
