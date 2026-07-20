import { useState } from "react";
import { X, CheckCircle2, XCircle, Volume2, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import type { AttemptItem } from "@/services/learningService";
import type { SkillTreeEnrichedQuestion } from "@/types";

interface ReviewAnswerSheetProps {
    attempts: AttemptItem[];
    questions: SkillTreeEnrichedQuestion[];
    onClose: () => void;
}

interface MergedRow {
    index: number;          // số thứ tự hiển thị (1-based)
    question: SkillTreeEnrichedQuestion | null;
    attempt: AttemptItem;
    type: string;
}

// helpers

// Section header
function SectionHeader({ label, correct, total, color }: {
    label: string; correct: number; total: number; color: string;
}) {
    return (
        <div className={`flex items-center justify-between px-3 py-1.5 rounded-xl mb-2 ${color}`}>
            <span className="text-xs font-extrabold uppercase tracking-widest">{label}</span>
            <span className="text-xs font-bold opacity-80">{correct}/{total} đúng</span>
        </div>
    );
}

// VOCAB row (câu 1-4): expand để xem đáp án + options
function VocabRow({ row, displayIndex, expanded, onToggle }: {
    row: MergedRow; displayIndex: number; expanded: boolean; onToggle: () => void;
}) {
    const q = row.question;
    const isCorrect = row.attempt.correct;

    return (
        <div className={`rounded-2xl border-2 overflow-hidden transition-all ${
            isCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
        }`}>
            <button
                type="button"
                className="w-full flex items-start gap-3 px-4 py-3 text-left"
                onClick={onToggle}
            >
                <span className="shrink-0 mt-0.5">
                    {isCorrect
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        : <XCircle className="w-5 h-5 text-red-400" />}
                </span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-gray-500">Câu {displayIndex}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                        {q?.questionText ?? "—"}
                    </p>
                </div>
                <span className="shrink-0 text-gray-400 mt-0.5">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/60 pt-3">
                    {/* Câu trả lời user */}
                    <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Câu trả lời của bạn</p>
                        <p className={`text-sm font-semibold px-3 py-2 rounded-xl ${
                            isCorrect
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-700 line-through"
                        }`}>
                            {row.attempt.userAnswer || <span className="italic not-italic text-gray-400 no-underline">Không trả lời</span>}
                        </p>
                    </div>

                    {/* Đáp án đúng — chỉ khi sai */}
                    {!isCorrect && q?.correctAnswer && (
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Đáp án đúng</p>
                            <p className="text-sm font-semibold px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800">
                                {q.correctAnswer}
                            </p>
                        </div>
                    )}

                    {/* Options — luôn hiện */}
                    {q?.options && q.options.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1.5">Các lựa chọn</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {q.options.map((opt, i) => {
                                    const isAnswer  = opt === q.correctAnswer;
                                    const isUserPick = opt === row.attempt.userAnswer;
                                    return (
                                        <div
                                            key={i}
                                            className={`text-xs px-2.5 py-2 rounded-xl font-medium flex items-center gap-1.5 border ${
                                                isAnswer
                                                    ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                                                    : isUserPick && !isAnswer
                                                    ? "bg-red-100 border-red-300 text-red-700"
                                                    : "bg-white border-gray-200 text-gray-600"
                                            }`}
                                        >
                                            {isAnswer && <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600" />}
                                            {isUserPick && !isAnswer && <XCircle className="w-3 h-3 shrink-0 text-red-500" />}
                                            {opt}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// LISTENING block: audio + đoạn văn (xuống dòng đúng) + từng ô điền
function ListeningBlock({ rows }: { rows: MergedRow[] }) {
    const [expanded, setExpanded] = useState(false);
    const audioUrl = rows[0]?.question?.audioUrl;
    const correctCount = rows.filter(r => r.attempt.correct).length;
    const allCorrect = correctCount === rows.length;

    // Fix \n literal → newline thật
    const paragraphText = (rows[0]?.question?.questionText ?? "").replace(/\\n/g, "\n");

    return (
        <div className={`rounded-2xl border-2 overflow-hidden ${
            allCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
        }`}>
            {/* Header — không có "Câu 5" */}
            <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                onClick={() => setExpanded(v => !v)}
            >
                <span className="shrink-0">
                    {allCorrect
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        : <XCircle className="w-5 h-5 text-red-400" />}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700">
                        Nghe &amp; điền từ — {correctCount}/{rows.length} ô đúng
                    </p>
                </div>
                <span className="shrink-0 text-gray-400">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/60 pt-3">
                    {/* Audio player */}
                    {audioUrl && (
                        <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-purple-500 shrink-0" />
                            <audio controls src={audioUrl} className="h-8 w-full" />
                        </div>
                    )}
                    {/* Đoạn văn — whitespace-pre-wrap để xuống dòng đúng */}
                    {paragraphText && (
                        <div className="rounded-xl bg-white/70 border border-gray-200 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Đoạn văn</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {paragraphText}
                            </p>
                        </div>
                    )}
                    {/* Từng ô điền */}
                    <div className="space-y-1.5">
                        {rows.map((row, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 w-10 shrink-0">Từ {i + 1}</span>
                                <span className={`flex-1 text-sm font-semibold px-3 py-1.5 rounded-xl ${
                                    row.attempt.correct
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-red-100 text-red-700"
                                }`}>
                                    {row.attempt.userAnswer || <span className="italic text-gray-400">Trống</span>}
                                </span>
                                {!row.attempt.correct && row.question?.correctAnswer && (
                                    <>
                                        <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                                        <span className="flex-1 text-sm font-semibold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                                            {row.question.correctAnswer.split("|").find(p => p.match(new RegExp(`^${i+1}\\s*:`)))?.replace(/^\d+\s*:\s*/, "") ?? row.question.correctAnswer}
                                        </span>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// SPEAKING block: 1 audio + danh sách câu đã nói
function SpeakingBlock({ rows }: { rows: MergedRow[] }) {
    const [expanded, setExpanded] = useState(false);
    const audioUrl = rows[0]?.question?.audioUrl;
    const correctCount = rows.filter(r => r.attempt.correct).length;
    const allCorrect = correctCount === rows.length;

    const sampleLines = (() => {
        const raw = rows[0]?.question?.correctAnswer ?? rows[0]?.question?.questionText ?? "";
        return raw.replace(/\\n/g, "\n").split("\n").map(s => s.trim()).filter(Boolean);
    })();

    return (
        <div className={`rounded-2xl border-2 overflow-hidden ${
            allCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
        }`}>
            <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                onClick={() => setExpanded(v => !v)}
            >
                <span className="shrink-0">
                    {allCorrect
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        : <XCircle className="w-5 h-5 text-red-400" />}
                </span>
                <div className="flex-1 min-w-0">
                    {/* Không có "Câu 6" */}
                    <p className="text-sm font-semibold text-gray-700">
                        Luyện nói — {correctCount}/{rows.length} câu đạt
                    </p>
                </div>
                <span className="shrink-0 text-gray-400">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/60 pt-3">
                    {audioUrl && (
                        <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-pink-500 shrink-0" />
                            <audio controls src={audioUrl} className="h-8 w-full" />
                        </div>
                    )}
                    <div className="space-y-2">
                        {rows.map((row, i) => {
                            const sample = sampleLines[i] ?? "";
                            return (
                                <div key={i} className={`rounded-xl border-2 px-3 py-2.5 ${
                                    row.attempt.correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                                }`}>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        {row.attempt.correct
                                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Câu {i + 1}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Bạn nói</p>
                                            <p className={`font-medium ${row.attempt.correct ? "text-emerald-800" : "text-red-700"}`}>
                                                {row.attempt.userAnswer || <span className="italic text-gray-400">Bỏ qua</span>}
                                            </p>
                                        </div>
                                        {sample && (
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Câu mẫu</p>
                                                <p className="font-medium text-gray-700">{sample.replace(/^\d+[. ]\s*/, "")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// MATCHING block: danh sách cặp nối (không có "Câu 7")
function MatchingBlock({ rows }: { rows: MergedRow[] }) {
    const [expanded, setExpanded] = useState(false);
    const correctCount = rows.filter(r => r.attempt.correct).length;
    const allCorrect = correctCount === rows.length;

    return (
        <div className={`rounded-2xl border-2 overflow-hidden ${
            allCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
        }`}>
            <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                onClick={() => setExpanded(v => !v)}
            >
                <span className="shrink-0">
                    {allCorrect
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        : <XCircle className="w-5 h-5 text-red-400" />}
                </span>
                <div className="flex-1 min-w-0">
                    {/* Không có "Câu 7" */}
                    <p className="text-sm font-semibold text-gray-700">
                        Nối từ — {correctCount}/{rows.length} cặp đúng
                    </p>
                </div>
                <span className="shrink-0 text-gray-400">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-2 border-t border-white/60 pt-3">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-1">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Từ / Cụm từ</p>
                        <span />
                        <p className="text-[10px] font-bold uppercase text-gray-400">Nghĩa / Cặp đúng</p>
                    </div>
                    {rows.map((row, i) => {
                        const q = row.question;
                        return (
                            <div key={i} className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border px-3 py-2 ${
                                row.attempt.correct
                                    ? "border-emerald-200 bg-emerald-50/60"
                                    : "border-red-200 bg-red-50/60"
                            }`}>
                                <span className="text-sm font-semibold text-gray-800 truncate">
                                    {q?.questionText ?? "—"}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="text-sm font-semibold text-emerald-700 truncate">
                                    {q?.correctAnswer ?? row.attempt.userAnswer ?? "—"}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Main component
export default function ReviewAnswerSheet({ attempts, questions, onClose }: ReviewAnswerSheetProps) {
    const [expandedVocab, setExpandedVocab] = useState<number | null>(null);

    const realAttempts = attempts.filter(a => a.mongoQuestionId !== "timeout-penalty");

    const qMap = new Map<string, SkillTreeEnrichedQuestion>();
    for (const q of questions) {
        if (q.mongoQuestionId) qMap.set(q.mongoQuestionId, q);
    }

    const rows: MergedRow[] = realAttempts.map((a, i) => {
        const q = qMap.get(a.mongoQuestionId) ?? null;
        return { index: i, question: q, attempt: a, type: q?.questionType ?? "VOCAB" };
    });

    const vocabRows     = rows.filter(r => r.type === "VOCAB");
    const listeningRows = rows.filter(r => r.type === "LISTENING");
    const speakingRows  = rows.filter(r => r.type === "SPEAKING");
    const matchingRows  = rows.filter(r => r.type === "MATCHING");

    const totalCorrect = rows.filter(r => r.attempt.correct).length;
    const vocabStart   = 1;

    return (
        <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-base font-extrabold text-gray-900">Xem lại bài làm</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            <span className="text-emerald-600 font-semibold">{totalCorrect} đúng</span>
                            {" · "}
                            <span className="text-red-500 font-semibold">{rows.length - totalCorrect} sai</span>
                            {" · "}tổng {rows.length} câu
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                    >
                        <X className="w-4 h-4 text-gray-600" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5">

                    {/* VOCAB (câu 1-4) */}
                    {vocabRows.length > 0 && (
                        <div>
                            <SectionHeader
                                label="Từ vựng"
                                correct={vocabRows.filter(r => r.attempt.correct).length}
                                total={vocabRows.length}
                                color="bg-blue-50 text-blue-700"
                            />
                            <div className="space-y-2">
                                {vocabRows.map((row, i) => (
                                    <VocabRow
                                        key={i}
                                        row={row}
                                        displayIndex={vocabStart + i}
                                        expanded={expandedVocab === i}
                                        onToggle={() => setExpandedVocab(expandedVocab === i ? null : i)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LISTENING */}
                    {listeningRows.length > 0 && (
                        <div>
                            <SectionHeader
                                label="Nghe"
                                correct={listeningRows.filter(r => r.attempt.correct).length}
                                total={listeningRows.length}
                                color="bg-purple-50 text-purple-700"
                            />
                            <ListeningBlock rows={listeningRows} />
                        </div>
                    )}

                    {/* SPEAKING */}
                    {speakingRows.length > 0 && (
                        <div>
                            <SectionHeader
                                label="Nói"
                                correct={speakingRows.filter(r => r.attempt.correct).length}
                                total={speakingRows.length}
                                color="bg-pink-50 text-pink-700"
                            />
                            <SpeakingBlock rows={speakingRows} />
                        </div>
                    )}

                    {/* MATCHING */}
                    {matchingRows.length > 0 && (
                        <div>
                            <SectionHeader
                                label="Ghép đôi"
                                correct={matchingRows.filter(r => r.attempt.correct).length}
                                total={matchingRows.length}
                                color="bg-amber-50 text-amber-700"
                            />
                            <MatchingBlock rows={matchingRows} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-4 border-t border-gray-100 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 text-sm transition"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
