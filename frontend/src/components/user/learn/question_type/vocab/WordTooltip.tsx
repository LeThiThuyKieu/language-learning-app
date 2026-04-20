import { useState, useRef, useEffect } from "react";
import { Volume2 } from "lucide-react";

interface WordTooltipProps {
    word: string;
    children: React.ReactNode;
    disabled?: boolean;
}

// Cache
const meaningCache: Record<string, string> = {};
const phoneticCache: Record<string, string> = {};

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

// Dịch sang tiếng Việt + lấy phiên âm IPA song song (2 request chạy cùng lúc)
async function getMeaningAndPhonetic(word: string): Promise<{ meaning: string; phonetic: string }> {
    const key = word.toLowerCase().trim();
    if (key in meaningCache && key in phoneticCache) {
        return { meaning: meaningCache[key], phonetic: phoneticCache[key] };
    }

    const [meaningResult, phoneticResult] = await Promise.allSettled([
        // Google Translate — dịch tiếng Việt
        (async () => {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(key)}`;
            const res = await fetchWithTimeout(url, 3000);
            if (res.ok) {
                const data = await res.json();
                const translated: string = data?.[0]?.[0]?.[0] ?? "";
                return translated && translated.toLowerCase() !== key ? translated : "";
            }
            return "";
        })(),
        // Free Dictionary API — lấy IPA phonetic
        (async () => {
            const res = await fetchWithTimeout(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`,
                4000
            );
            if (res.ok) {
                const data = await res.json();
                return (
                    data?.[0]?.phonetic ||
                    data?.[0]?.phonetics?.find((x: { text?: string }) => x.text)?.text ||
                    ""
                );
            }
            return "";
        })(),
    ]);

    const m = meaningResult.status === "fulfilled" ? meaningResult.value : "";
    const p = phoneticResult.status === "fulfilled" ? phoneticResult.value : "";
    meaningCache[key] = m;
    phoneticCache[key] = p;
    return { meaning: m, phonetic: p };
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
    const [meaning, setMeaning] = useState<string | null>(null);
    const [phonetic, setPhonetic] = useState<string>("");
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!visible || !word) return;
        speakWord(word);

        const key = word.toLowerCase().trim();

        // Dùng 1 request lấy cả nghĩa + phiên âm
        if (key in meaningCache && key in phoneticCache) {
            setMeaning(meaningCache[key]);
            setPhonetic(phoneticCache[key]);
        } else {
            setMeaning(null);
            setPhonetic("");
            getMeaningAndPhonetic(word).then(({ meaning, phonetic }) => {
                setMeaning(meaning);
                setPhonetic(phonetic);
            });
        }
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
                            {meaning === null ? "..." : meaning || "—"}
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

                    {/* Phiên âm */}
                    {phonetic && (
                        <span className="text-xs text-gray-400 font-medium">{phonetic}</span>
                    )}
                </div>
            )}
        </span>
    );
}
