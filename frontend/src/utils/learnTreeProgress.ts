/**
 * Tiến độ cây bài học tuyến tính (1 node đang mở … 5 sau matching).
 * Lưu sessionStorage — khi học lại node cũ không được ghi đè giá trị nhỏ hơn.
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

/**
 * Sau khi hoàn thành một loại bài, đặt tối thiểu `atLeast` mà không hạ thấp tiến độ hiện có.
 */
export function bumpLearnTreeUnlocked(treeId: number, atLeast: number): number {
    const floor = Number.isFinite(atLeast) && atLeast >= 1 ? atLeast : 1;
    const next = Math.max(getLearnTreeUnlockedCount(treeId), floor);
    try {
        sessionStorage.setItem(learnTreeUnlockedStorageKey(treeId), String(next));
    } catch {
        // ignore
    }
    return next;
}
