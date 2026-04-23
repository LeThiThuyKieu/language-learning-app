import { useState, useRef, useEffect } from "react";
import { Volume2 } from "lucide-react";

interface WordTooltipProps {
    word: string;
    children: React.ReactNode;
    disabled?: boolean;
}

// Types
interface VocabDetail {
    word: string;
    meaning: string;
    phonetic: string;
}

// In-memory cache (session)
// Backend đã có Redis + MongoDB cache, đây chỉ là cache phía client để tránh gọi lại backend trong cùng 1 phiên làm bài.
const clientCache: Record<string, VocabDetail> = {};
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

/**
 * Gọi backend GET /api/vocabulary/details?words=word1,word2,...
 * Backend xử lý: Redis → MongoDB → External API (3-layer cache)
 */
async function fetchFromBackend(word: string): Promise<VocabDetail> {
    const key = word.toLowerCase().trim();
    if (clientCache[key]) return clientCache[key];

    try {
        const res = await fetch(`${API_BASE}/vocabulary/details?words=${encodeURIComponent(key)}`, {
            signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
            const data: Record<string, VocabDetail> = await res.json();
            const detail = data[key] ?? { word: key, meaning: "", phonetic: "" };
            clientCache[key] = detail;
            return detail;
        }
    } catch { /* ignore — fallback to empty */ }

    const fallback: VocabDetail = { word: key, meaning: "", phonetic: "" };
    clientCache[key] = fallback;
    return fallback;
}

function speakWord(word: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = "en-US";
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
}

// Component
export default function WordTooltip({ word, children, disabled }: WordTooltipProps) {
    const [visible, setVisible] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [detail, setDetail] = useState<VocabDetail | null>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!visible || !word) return;
        speakWord(word);

        const key = word.toLowerCase().trim();
        if (clientCache[key]) {
            setDetail(clientCache[key]);
            return;
        }
        setDetail(null); // loading
        fetchFromBackend(word).then(setDetail);
    }, [visible, word]);

    function handleMouseEnter() {
        if (disabled) return;
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setVisible(true);
    }

    function handleMouseLeave() {
        hideTimer.current = setTimeout(() => setVisible(false), 200);
    }

    function handleSpeakClick(e: React.MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        setSpeaking(true);
        speakWord(word);
        setTimeout(() => setSpeaking(false), 900);
    }

    return (
        <span
            className="relative inline"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}

            {visible && (
                <div
                    onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current); }}
                    onMouseLeave={handleMouseLeave}
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
                               rounded-xl bg-white border border-gray-200 shadow-lg
                               px-3 py-2.5 w-max max-w-[220px] flex flex-col gap-1"
                >
                    {/* Mũi tên */}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white drop-shadow-sm"/>

                    {/* Nghĩa + nút phát âm */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800 leading-snug flex-1">
                            {detail === null ? "..." : detail.meaning || "—"}
                        </span>
                        <button
                            type="button"
                            onClick={handleSpeakClick}
                            className={[
                                "flex-shrink-0 rounded-full p-1.5 transition",
                                speaking ? "bg-orange-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-500",
                            ].join(" ")}
                            title="Phát âm"
                        >
                            <Volume2 size={13}/>
                        </button>
                    </div>

                    {/* Phiên âm IPA */}
                    {detail?.phonetic && (
                        <span className="text-xs text-gray-400 font-medium">{detail.phonetic}</span>
                    )}
                </div>
            )}
        </span>
    );
}
