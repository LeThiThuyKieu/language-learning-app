import { useState, useRef, useEffect } from "react";
import { Volume2 } from "lucide-react";

interface WordTooltipProps {
    word: string;
    children: React.ReactNode;
    disabled?: boolean;
}

// Cache dịch để không gọi API lại
const translateCache: Record<string, string> = {};

// Gọi API dịch nghĩa của từ
async function translateWord(word: string): Promise<string> {
    const key = word.toLowerCase();
    if (translateCache[key]) return translateCache[key];
    try {
        const res = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`
        );
        const data = await res.json();
        const translation: string = data?.responseData?.translatedText ?? "";
        // MyMemory trả về chữ hoa nếu không dịch được, lọc ra
        const result = translation && translation.toUpperCase() !== word.toUpperCase()
            ? translation
            : "";
        translateCache[key] = result;
        return result;
    } catch {
        return "";
    }
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
    const [meaning, setMeaning] = useState<string>("");
    const [loadingMeaning, setLoadingMeaning] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Phát âm + lấy nghĩa khi tooltip hiện
    useEffect(() => {
        if (!visible || !word) return;
        speakWord(word);

        // Lấy nghĩa tiếng Việt
        const cached = translateCache[word.toLowerCase()];
        if (cached !== undefined) {
            setMeaning(cached);
            return;
        }
        setLoadingMeaning(true);
        translateWord(word).then((result) => {
            setMeaning(result);
            setLoadingMeaning(false);
        });
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
        setTimeout(() => setSpeaking(false), 1000);
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
                               rounded-xl bg-gray-900 text-white shadow-xl px-3 py-2
                               flex items-center gap-2 min-w-[80px] max-w-[220px] w-max"
                >
                    {/* Mũi tên */}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />

                    {/* Nghĩa tiếng Việt */}
                    <span className="text-sm font-semibold text-white leading-snug">
                        {loadingMeaning ? "..." : meaning || "—"}
                    </span>

                    {/* Nút phát âm */}
                    <button
                        type="button"
                        onClick={handleSpeakClick}
                        className={[
                            "flex-shrink-0 rounded-full p-1 transition",
                            speaking
                                ? "bg-orange-500 text-white"
                                : "bg-white/20 hover:bg-white/30 text-white",
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
