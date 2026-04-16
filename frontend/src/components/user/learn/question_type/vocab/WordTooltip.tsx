import { useState, useRef, useEffect } from "react";
import { Volume2 } from "lucide-react";

interface WordTooltipProps {
    word: string;
    children: React.ReactNode;
    disabled?: boolean;
}

// Cache để không gọi API lại
const meaningCache: Record<string, string> = {};

/** Fetch với timeout */
async function fetchWithTimeout(url: string, ms = 3000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        const res = await fetch(url, { signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Dịch từ tiếng Anh sang tiếng Việt dùng Google Translate
 */
async function getMeaning(word: string): Promise<string> {
    const key = word.toLowerCase().trim();
    if (key in meaningCache) return meaningCache[key];

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(key)}`;
        const res = await fetchWithTimeout(url, 3000);
        if (res.ok) {
            const data = await res.json();
            // Response: [[[translatedText, originalText, ...]]]
            const translated: string = data?.[0]?.[0]?.[0] ?? "";
            if (translated && translated.toLowerCase() !== key) {
                meaningCache[key] = translated;
                return translated;
            }
        }
    } catch {
        // timeout hoặc lỗi mạng
    }

    meaningCache[key] = "";
    return "";
}

function speakWord(word: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = "en-US";
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
}

export default function WordTooltip({ word, children, disabled }: WordTooltipProps) {
    const [visible, setVisible] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [meaning, setMeaning] = useState<string | null>(null); // null = chưa load
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!visible || !word) return;

        // Phát âm ngay
        speakWord(word);

        // Lấy nghĩa (có cache)
        const key = word.toLowerCase().trim();
        if (key in meaningCache) {
            setMeaning(meaningCache[key]);
            return;
        }
        setMeaning(null); // loading
        getMeaning(word).then(setMeaning);
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
                    ref={tooltipRef}
                    onMouseEnter={() => {
                        if (hideTimer.current) clearTimeout(hideTimer.current);
                    }}
                    onMouseLeave={handleMouseLeave}
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
                               rounded-xl bg-white border border-gray-200 text-gray-700
                               shadow-lg px-3 py-2 flex items-center gap-2 w-max max-w-[240px]"
                >
                    {/* Mũi tên */}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white drop-shadow-sm" />

                    {/* Nghĩa */}
                    <span className="text-sm font-medium text-gray-700 leading-snug">
                        {meaning === null ? "..." : meaning || "—"}
                    </span>

                    {/* Nút phát âm */}
                    <button
                        type="button"
                        onClick={handleSpeakClick}
                        className={[
                            "flex-shrink-0 rounded-full p-1.5 transition",
                            speaking
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-500",
                        ].join(" ")}
                        title="Phát âm"
                    >
                        <Volume2 size={13} />
                    </button>
                </div>
            )}
        </span>
    );
}
