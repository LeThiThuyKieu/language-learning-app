import type {SkillTreeQuestionsData} from "@/types";

export default function TreeNodesDataPreview({data}: { data: SkillTreeQuestionsData | null }) {
    if (!data?.nodes?.length) return null;

    return (
        <section className="mt-8 rounded-2xl border border-gray-200 bg-gray-50/90 p-4 md:p-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-800 mb-1">
                Dữ liệu bài theo node
            </h2>
            <p className="text-xs text-gray-500 mb-4">
                Tree {data.treeId} · Level {data.levelId} — tạm hiển thị thô, sau có thể chỉnh layout câu hỏi.
            </p>
            <div className="flex flex-col gap-4">
                {data.nodes.map((node) => (
                    <article
                        key={`${node.nodeId}-${node.nodeType}`}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                        <header className="flex flex-wrap items-baseline gap-2 mb-2">
              <span className="text-xs font-bold uppercase text-primary-600 tabular-nums">
                {node.nodeType}
              </span>
                            <span className="text-sm font-semibold text-gray-900">{node.title}</span>
                            <span className="text-xs text-gray-500">({node.questions.length} câu)</span>
                        </header>
                        <ul className="text-sm text-gray-800 space-y-2 max-h-56 overflow-y-auto pr-1">
                            {node.questions.map((q, i) => (
                                <li
                                    key={q.id ?? `${node.nodeId}-q-${i}`}
                                    className="border-t border-gray-100 pt-2 first:border-t-0 first:pt-0"
                                >
                                    <span className="font-semibold text-gray-500">#{i + 1}</span>{" "}
                                    {q.questionText ? (
                                        <span className="whitespace-pre-wrap">{q.questionText}</span>
                                    ) : (
                                        <em className="text-gray-400">(chưa có questionText)</em>
                                    )}
                                    {q.options && q.options.length > 0 ? (
                                        <div className="mt-1 text-xs text-gray-600">
                                            <span className="font-semibold">Lựa chọn: </span>
                                            {q.options.join(" · ")}
                                        </div>
                                    ) : null}
                                    {q.correctAnswer ? (
                                        <div className="mt-1 text-xs text-gray-600">
                                            <span className="font-semibold">Đáp án: </span>
                                            {q.correctAnswer}
                                        </div>
                                    ) : null}
                                    {q.audioUrl ? (
                                        <div className="mt-1 text-xs text-blue-700 break-all">{q.audioUrl}</div>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>
        </section>
    );
}

