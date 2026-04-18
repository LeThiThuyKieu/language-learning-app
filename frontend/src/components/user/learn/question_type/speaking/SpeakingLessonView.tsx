import {useEffect, useMemo, useRef, useState} from "react";
import type React from "react";
import type {SkillTreeNodeQuestionsData} from "@/types";
import LessonCompleteView from "@/components/user/learn/LessonCompleteView.tsx";
import LessonTopBar from "@/components/user/learn/LessonTopBar.tsx";
import LessonExitModal from "@/components/user/learn/LessonExitModal.tsx";
import LessonAudioPlayer from "@/components/user/learn/LessonAudioPlayer.tsx";
import {Mic, MicOff, Star, ThumbsUp, TrendingUp, AlertCircle, RefreshCw, CheckCircle2, XCircle} from "lucide-react";

// Helpers

// Tách chuỗi questionText thành mảng các dòng (bỏ dòng trống)
function splitLines(text?: string): string[] {
    const raw = String(text ?? "").replace(/\\n/g, "\n");
    return raw.split("\n").map((s) => s.trim()).filter(Boolean);
}

// Bỏ số thứ tự đầu dòng: "1. server" → "server", dùng khi so sánh với transcript
function stripLeadingNumber(line: string): string {
    return line.replace(/^\d+[. ]\s*/, "").trim();
}

// Tính % giống nhau giữa transcript và câu mẫu theo word-level Jaccard
// Trả về 0–100; dùng để đánh giá kết quả nói
function calcSimilarity(a: string, b: string): number {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    const wordsA = normalize(a).split(/\s+/).filter(Boolean);
    const wordsB = normalize(b).split(/\s+/).filter(Boolean);
    if (!wordsA.length && !wordsB.length) return 100;
    if (!wordsA.length || !wordsB.length) return 0;
    const used = new Array(wordsB.length).fill(false);
    let matched = 0;
    for (const w of wordsA) {
        const idx = wordsB.findIndex((wb, i) => !used[i] && wb === w);
        if (idx !== -1) { matched++; used[idx] = true; }
    }
    const union = wordsA.length + wordsB.length - matched;
    return Math.round((matched / union) * 100);
}

// Trả về icon + text nhận xét + màu tương ứng với % điểm
// Ngưỡng: ≥90 xuất sắc, ≥70 tốt (pass), ≥50 khá, ≥30 cần cải thiện, <30 thử lại
function getScoreLabel(pct: number): { icon: React.ReactNode; text: string; color: string } {
    if (pct >= 90) return { icon: <Star className="w-5 h-5" fill="currentColor"/>, text: "Xuất sắc! Phát âm rất chuẩn.", color: "emerald" };
    if (pct >= 70) return { icon: <ThumbsUp className="w-5 h-5"/>, text: "Tốt lắm! Tiếp tục luyện tập nhé.", color: "emerald" };
    if (pct >= 50) return { icon: <TrendingUp className="w-5 h-5"/>, text: "Khá ổn, cần luyện thêm một chút.", color: "amber" };
    if (pct >= 30) return { icon: <AlertCircle className="w-5 h-5"/>, text: "Cần cải thiện, hãy nghe mẫu và thử lại.", color: "orange" };
    return { icon: <RefreshCw className="w-5 h-5"/>, text: "Hãy nghe mẫu kỹ hơn và thử lại nhé!", color: "red" };
}

// Web Speech API types
// TypeScript không có sẵn type cho Web Speech API nên khai báo thủ công
interface STTResultEvent extends Event {
    results: Record<number, Record<number, { transcript: string }>>;
}
interface STTErrorEvent extends Event {
    error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((e: STTResultEvent) => void) | null;
    onerror: ((e: STTErrorEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}
declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    }
}

//  ScoreDisplay
// Hiển thị kết quả sau khi kiểm tra: vòng tròn %, nhận xét, so sánh bạn nói / câu mẫu
function ScoreDisplay({ pct, transcript, expected }: { pct: number; transcript: string; expected: string }) {
    const { icon, text, color } = getScoreLabel(pct);
    const pass = pct >= 70;

    const ringColor: Record<string, string> = {
        emerald: "stroke-emerald-500",
        amber: "stroke-amber-400",
        orange: "stroke-orange-500",
        red: "stroke-red-500",
    };
    const textColor: Record<string, string> = {
        emerald: "text-emerald-600",
        amber: "text-amber-500",
        orange: "text-orange-500",
        red: "text-red-500",
    };
    const bgColor: Record<string, string> = {
        emerald: "bg-emerald-50 border-emerald-200",
        amber: "bg-amber-50 border-amber-200",
        orange: "bg-orange-50 border-orange-200",
        red: "bg-red-50 border-red-200",
    };

    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;

    return (
        <div className={`rounded-2xl border-2 ${bgColor[color] ?? "bg-emerald-50 border-emerald-200"} p-5 flex flex-col gap-4`}>
            <div className="flex items-center gap-5">
                {/* Vòng tròn % độ khớp */}
                <div className="relative shrink-0 w-[88px] h-[88px]">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                        <circle cx="44" cy="44" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                        <circle
                            cx="44" cy="44" r={radius}
                            fill="none"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            className={`${ringColor[color] ?? "stroke-emerald-500"} transition-all duration-700`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-xl font-extrabold leading-none ${textColor[color] ?? "text-emerald-600"}`}>{pct}%</span>
                        <span className="text-[10px] text-gray-500 font-semibold mt-0.5">độ khớp</span>
                    </div>
                </div>

                {/* Nhận xét kết quả */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={textColor[color] ?? "text-emerald-600"}>{icon}</span>
                        <span className={`text-base font-extrabold ${textColor[color] ?? "text-emerald-600"}`}>
                            {pass ? "Đạt!" : "Chưa đạt"}
                        </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-snug">{text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                        {pass ? "Ngưỡng đạt: 70%" : "Cần ≥ 70% để qua bài"}
                    </p>
                </div>
            </div>

            {/* So sánh transcript preview và câu mẫu */}
            {transcript && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white/70 border border-gray-200 px-3 py-2">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Bạn nói</p>
                        <p className="text-gray-800 font-medium leading-snug">{transcript}</p>
                    </div>
                    <div className="rounded-xl bg-white/70 border border-gray-200 px-3 py-2">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Câu mẫu</p>
                        <p className="text-gray-800 font-medium leading-snug">{expected}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Main Component
export default function SpeakingLessonView({
    node,
    onLeaveLesson,
    onComplete,
}: {
    node: SkillTreeNodeQuestionsData;
    onLeaveLesson: () => void;
    onComplete: () => void;
}) {
    const q = node.questions?.[0];
    const audioUrl = q?.audioUrl ?? "";

    // Tách questionText (1 bài speaking) thành danh sách câu cần luyện (các cau nhỏ trong bài speaking)
    const lines = useMemo(
        () => splitLines(q?.correctAnswer || q?.questionText),
        [q?.correctAnswer, q?.questionText]
    );

    // lineIndex: câu đang luyện hiện tại
    const [lineIndex, setLineIndex] = useState(0);
    const targetClean = stripLeadingNumber(lines[lineIndex] ?? "");
    const total = lines.length || 1;

    const [recording, setRecording] = useState(false);       // đang ghi âm
    const [transcript, setTranscript] = useState("");         // kết quả STT
    const [score, setScore] = useState<number | null>(null);  // % độ khớp
    const [checked, setChecked] = useState(false);            // đã bấm Kiểm tra
    const [isFinished, setIsFinished] = useState(false);      // hoàn thành tất cả câu
    const [exitOpen, setExitOpen] = useState(false);          // modal thoát
    const [sttError, setSttError] = useState("");             // lỗi ghi âm
    const [skippedIndices, setSkippedIndices] = useState<Set<number>>(new Set()); // câu bị bỏ qua

    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

    // Reset toàn bộ state khi đổi câu hỏi (mongoQuestionId thay đổi)
    useEffect(() => {
        setLineIndex(0);
        setRecording(false);
        setTranscript("");
        setScore(null);
        setChecked(false);
        setIsFinished(false);
        setSttError("");
        setSkippedIndices(new Set());
    }, [q?.mongoQuestionId]);

    // Dọn dẹp SpeechRecognition khi component unmount
    useEffect(() => {
        return () => { recognitionRef.current?.abort(); };
    }, []);

    // Bắt đầu ghi âm bằng Web Speech API (chỉ hỗ trợ Chrome)
    function startRecording() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            setSttError("Trình duyệt không hỗ trợ ghi âm. Hãy dùng Chrome.");
            return;
        }
        setSttError("");
        setTranscript("");
        setScore(null);

        const rec = new SR();
        rec.lang = "en-US";
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        // Nhận kết quả nhận dạng giọng nói
        rec.onresult = (e: STTResultEvent) => {
            const text = String(e.results?.[0]?.[0]?.transcript ?? "");
            setTranscript(text);
        };

        // Xử lý lỗi ghi âm (not-allowed = chưa cấp quyền mic)
        rec.onerror = (e: STTErrorEvent) => {
            setSttError(e.error === "not-allowed"
                ? "Vui lòng cho phép truy cập microphone."
                : "Lỗi ghi âm: " + e.error);
            setRecording(false);
        };

        rec.onend = () => setRecording(false);

        recognitionRef.current = rec;
        rec.start();
        setRecording(true);
    }

    // Dừng ghi âm thủ công (user bấm lại nút mic)
    function stopRecording() {
        recognitionRef.current?.stop();
        setRecording(false);
    }

    // Kiểm tra kết quả: tính % similarity giữa transcript và câu mẫu
    function handleCheck() {
        if (!transcript) { setSttError("Hãy ghi âm trước khi kiểm tra."); return; }
        setScore(calcSimilarity(transcript, targetClean));
        setChecked(true);
    }

    // Tiếp tục: nếu pass (≥70%) thì qua câu tiếp, nếu fail thì cho thử lại
    function handleContinue() {
        if (score !== null && score >= 70) {
            if (lineIndex < lines.length - 1) {
                setLineIndex(lineIndex + 1);
                setChecked(false);
                setTranscript("");
                setScore(null);
                setSttError("");
            } else {
                setIsFinished(true);
            }
        } else {
            // Fail: reset để thử lại câu hiện tại
            setChecked(false);
            setTranscript("");
            setScore(null);
            setSttError("");
        }
    }

    // Bỏ qua câu hiện tại (tính là sai/chưa hoàn thành), chuyển sang câu tiếp
    function handleSkip() {
        setSkippedIndices((prev) => new Set(prev).add(lineIndex));
        if (lineIndex < lines.length - 1) {
            setLineIndex(lineIndex + 1);
            setChecked(false);
            setTranscript("");
            setScore(null);
            setSttError("");
        } else {
            setIsFinished(true);
        }
    }

    // Hoàn thành tất cả câu → hiện màn hình kết thúc bài
    if (isFinished) {
        return <LessonCompleteView knGained={10} onContinue={onComplete}/>;
    }

    const pass = score !== null && score >= 70;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <LessonTopBar
                onClosePress={() => setExitOpen(true)}
                progressPercent={((lineIndex + 1) / total) * 100}
                rightLabel={`${lineIndex + 1}/${total}`}
            />

            <main className="flex-1 w-full">
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-28">
                    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">

                        <div className="max-w-2xl">
                            <p className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200 mb-3">
                                Luyện nói
                            </p>
                            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-snug">
                                Nghe mẫu và luyện đọc theo câu
                            </h1>
                        </div>

                        {/* Audio player — tự động pause khi đang ghi âm (forcePause) */}
                        <LessonAudioPlayer src={audioUrl} trackKey={q?.mongoQuestionId} forcePause={recording}/>

                        <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-b from-gray-50/80 to-white p-5 md:p-6 shadow-inner">
                            <p className="mb-4 text-sm font-semibold text-gray-500">
                                Nhấn mic để ghi âm, sau đó bấm <strong>Kiểm tra</strong>.
                            </p>

                            <div className="space-y-3">
                                {(lines.length ? lines : ["(Chưa có danh sách câu)"]).map((line, idx) => {
                                    const isCurrent = idx === lineIndex;   // câu đang luyện
                                    const isDone = idx < lineIndex;        // câu đã qua
                                    const isSkipped = skippedIndices.has(idx); // câu bị bỏ qua
                                    return (
                                        <div key={`${idx}-${line.slice(0, 24)}`} className="flex flex-col gap-2">
                                            {/* Hàng hiển thị câu + nút mic */}
                                            <div className={[
                                                "flex items-center justify-between gap-4 rounded-2xl border-2 px-4 py-4 transition shadow-sm",
                                                isCurrent && recording && !checked
                                                    ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
                                                    : isCurrent && transcript && !checked
                                                        ? "border-emerald-400 bg-emerald-50"
                                                        : isDone && !isSkipped
                                                            ? "border-emerald-300 bg-emerald-50 opacity-70"
                                                            : isDone && isSkipped
                                                                ? "border-red-200 bg-red-50 opacity-70"
                                                                : isCurrent
                                                                    ? "border-primary-300 bg-white"
                                                                    : "border-gray-200 bg-white opacity-40",
                                            ].join(" ")}>
                                                <span className="text-gray-900 font-semibold leading-snug whitespace-pre-wrap flex-1 min-w-0">
                                                    {/* ✓ xanh = đã pass, ✗ đỏ = đã bỏ qua */}
                                                    {isDone && !isSkipped && <span className="mr-2 text-emerald-500">✓</span>}
                                                    {isDone && isSkipped && <span className="mr-2 text-red-400">✗</span>}
                                                    {line}
                                                </span>

                                                {/* Nút mic chỉ hiện ở câu đang luyện */}
                                                {isCurrent && (
                                                    <button
                                                        type="button"
                                                        disabled={checked}
                                                        onClick={recording ? stopRecording : startRecording}
                                                        className={[
                                                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition shadow-sm",
                                                            checked
                                                                ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                : recording
                                                                    ? "border-red-500 bg-red-500 text-white animate-pulse hover:bg-red-600"
                                                                    : transcript
                                                                        ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
                                                                        : "border-gray-200 bg-white text-primary-600 hover:border-primary-300 hover:bg-primary-50",
                                                        ].join(" ")}
                                                        aria-label={recording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
                                                    >
                                                        {recording
                                                            ? <MicOff className="h-5 w-5" strokeWidth={2.2}/>
                                                            : <Mic className="h-5 w-5" strokeWidth={2.2}/>
                                                        }
                                                    </button>
                                                )}
                                            </div>

                                            {/* Preview transcript ngay dưới câu đang luyện (trước khi kiểm tra) */}
                                            {isCurrent && (transcript || recording) && !checked && (
                                                <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                                                        {recording ? "Đang nghe..." : "Bạn vừa nói"}
                                                    </p>
                                                    <p className="text-gray-800 font-medium text-sm italic">
                                                        {recording
                                                            ? <span className="flex items-center gap-2">
                                                                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping"/>
                                                                Đang ghi âm...
                                                              </span>
                                                            : transcript
                                                        }
                                                    </p>
                                                </div>
                                            )}

                                            {/* Kết quả % ngay dưới câu đang luyện (sau khi kiểm tra) */}
                                            {isCurrent && checked && score !== null && (
                                                <ScoreDisplay
                                                    pct={score}
                                                    transcript={transcript}
                                                    expected={targetClean}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Thông báo lỗi STT */}
                            {sttError && (
                                <p className="mt-3 text-sm text-red-600 font-semibold">{sttError}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer: chưa kiểm tra → nút Kiểm tra; đã kiểm tra → nút Tiếp tục / Thử lại + Bỏ qua */}
                {!checked ? (
                    <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur border-t border-gray-200">
                        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={handleCheck}
                                disabled={!transcript}
                                className={[
                                    "w-[170px] h-12 rounded-2xl px-6 text-sm font-extrabold uppercase tracking-wide shadow-sm transition",
                                    transcript
                                        ? "bg-primary-600 hover:bg-primary-700 text-white"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed",
                                ].join(" ")}
                            >
                                Kiểm tra
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={[
                        "sticky bottom-0 w-full border-t backdrop-blur",
                        pass ? "bg-emerald-50/95 border-emerald-200" : "bg-red-50/95 border-red-200",
                    ].join(" ")}>
                        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
                            <p className={`text-basic font-bold flex items-center gap-2 ${pass ? "text-emerald-700" : "text-red-700"}`}>
                                {pass
                                    ? <><CheckCircle2 className="w-6 h-6 shrink-0" /> Bạn đã vượt qua!</>
                                    : <><XCircle className="w-6 h-6 shrink-0" /> Chưa đạt — hãy thử lại!</>
                                }
                            </p>
                            {pass ? (
                                // Pass: chỉ có nút Tiếp tục
                                <button
                                    type="button"
                                    onClick={handleContinue}
                                    className="min-w-[140px] h-12 rounded-2xl px-6 text-sm font-extrabold uppercase tracking-wide shadow-sm transition text-white bg-emerald-500 hover:bg-emerald-600"
                                >
                                    Tiếp tục
                                </button>
                            ) : (
                                // Fail: Bỏ qua (sang câu tiếp, tính sai) + Thử lại
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleSkip}
                                        className="h-12 rounded-2xl px-5 text-sm font-bold uppercase tracking-wide border-2 border-red-300 text-red-500 hover:bg-red-50 transition"
                                    >
                                        Bỏ qua
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleContinue}
                                        className="min-w-[140px] h-12 rounded-2xl px-6 text-sm font-extrabold uppercase tracking-wide shadow-sm transition text-white bg-primary-600 hover:bg-primary-700"
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <LessonExitModal
                open={exitOpen}
                onContinue={() => setExitOpen(false)}
                onExit={() => { setExitOpen(false); onLeaveLesson(); }}
            />
        </div>
    );
}
