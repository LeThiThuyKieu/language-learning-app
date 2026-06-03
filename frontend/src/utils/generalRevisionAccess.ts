/**
 * Utility để persist trạng thái "đã mở khoá Ôn tập tổng hợp" vào localStorage.
 *
 * Key theo userId để tránh nhầm lẫn giữa các account trên cùng máy.
 * Một khi đã unlock = true, không bao giờ bị reset (trừ khi xoá localStorage thủ công).
 */

const STORAGE_KEY_PREFIX = "generalRevision_unlocked_user_";

export function getGeneralRevisionUnlocked(userId?: number | string): boolean {
    if (!userId) return false;
    try {
        return localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`) === "true";
    } catch {
        return false;
    }
}

export function setGeneralRevisionUnlocked(userId?: number | string): void {
    if (!userId) return;
    try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, "true");
    } catch {
        // ignore
    }
}
