import type { AdminQuestion } from "@/services/revisionService";

export function skipsTaskDetail(questionType: string): boolean {
    const type = questionType.toUpperCase();
    return type === "MATCHING" || type === "WRITING";
}

export function sortQuestions(questions: AdminQuestion[]): AdminQuestion[] {
    return (questions ?? []).slice().sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

export function getQuestionDetailPath(
    topicId: number | string,
    taskId: number | string,
    questions: AdminQuestion[],
): string {
    const base = `/admin/revision-management/topics/${topicId}/tasks/${taskId}`;
    const sorted = sortQuestions(questions);
    if (sorted.length === 0) return `${base}/questions/new`;
    return `${base}/questions/${sorted[0].mongoId}`;
}
