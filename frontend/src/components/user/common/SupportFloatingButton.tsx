import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { SupportChatBox } from "./SupportChatBox"; // import chatbox

/**
 * =========================
 * HOVER MESSAGES
 * =========================
 */
const HOVER_MESSAGES = [
    "Có thắc mắc gì? Hỏi mình nhé",
    "Mình luôn sẵn sàng giúp bạn!",
    "Có gì chưa rõ không?",
    "Nhấn vào để được hỗ trợ nha",
] as const;

const DISPLAY_MS = 1500;
const GAP_MS = 500;

/**
 * =========================
 * ICON CHAT
 * =========================
 */
function SupportChatIcon({ className }: { className?: string }) {
    return (
        <svg className={className}
             viewBox="0 0 122.88 107.09"
             xmlns="http://www.w3.org/2000/svg" aria-hidden >
            <path fill="currentColor"
                  d="M63.08,0h.07C79.93.55,95,6.51,105.75,15.74c11,9.39,17.52,22.16,17.11,36.09v0a42.67,42.67,0,0,1-7.58,22.87A55,55,0,0,1,95.78,92a73.3,73.3,0,0,1-28.52,8.68,62.16,62.16,0,0,1-27-3.63L6.72,107.09,16.28,83a49.07,49.07,0,0,1-10.91-13A40.16,40.16,0,0,1,.24,45.55a44.84,44.84,0,0,1,9.7-23A55.62,55.62,0,0,1,26.19,8.83,67,67,0,0,1,43.75,2,74.32,74.32,0,0,1,63.07,0Zm24.18,42a7.78,7.78,0,1,1-7.77,7.78,7.78,7.78,0,0,1,7.77-7.78Zm-51.39,0a7.78,7.78,0,1,1-7.78,7.78,7.79,7.79,0,0,1,7.78-7.78Zm25.69,0a7.78,7.78,0,1,1-7.77,7.78,7.78,7.78,0,0,1,7.77-7.78Zm1.4-36h-.07A68.43,68.43,0,0,0,45.14,7.85a60.9,60.9,0,0,0-16,6.22A49.65,49.65,0,0,0,14.66,26.32,38.87,38.87,0,0,0,6.24,46.19,34.21,34.21,0,0,0,10.61,67,44.17,44.17,0,0,0,21.76,79.67l1.76,1.39L16.91,97.71l23.56-7.09,1,.38a56,56,0,0,0,25.32,3.6,67,67,0,0,0,26.16-8A49,49,0,0,0,110.3,71.36a36.86,36.86,0,0,0,6.54-19.67v0c.35-12-5.41-23.1-15-31.33C92.05,11.94,78.32,6.52,63,6.06Z" />
        </svg> ); }

export default function SupportFloatingButton() {
    const navigate = useNavigate();
    const location = useLocation();

    /**
     * =========================
     * STATE
     * =========================
     */
    const [menuOpen, setMenuOpen] = useState(false); // menu nhỏ
    const [chatOpen, setChatOpen] = useState(false); // chatbox

    const [hoverLineIndex, setHoverLineIndex] = useState<number | null>(null);

    const hoverTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const hoverCycleDoneRef = useRef(false);
    const rootRef = useRef<HTMLDivElement>(null);

    /**
     * =========================
     * HOVER LOGIC
     * =========================
     */
    const clearHoverTimers = useCallback(() => {
        hoverTimersRef.current.forEach(clearTimeout);
        hoverTimersRef.current = [];
    }, []);

    const stopHoverSequence = useCallback(() => {
        clearHoverTimers();
        setHoverLineIndex(null);
    }, [clearHoverTimers]);

    const startHoverSequence = useCallback(() => {
        if (menuOpen || hoverCycleDoneRef.current) return;

        clearHoverTimers();

        const runStep = (index: number) => {
            if (index >= HOVER_MESSAGES.length) {
                hoverCycleDoneRef.current = true;
                setHoverLineIndex(null);
                return;
            }

            setHoverLineIndex(index);

            const hideTimer = setTimeout(() => {
                setHoverLineIndex(null);

                if (index === HOVER_MESSAGES.length - 1) {
                    hoverCycleDoneRef.current = true;
                    return;
                }

                const gapTimer = setTimeout(() => runStep(index + 1), GAP_MS);
                hoverTimersRef.current.push(gapTimer);
            }, DISPLAY_MS);

            hoverTimersRef.current.push(hideTimer);
        };

        runStep(0);
    }, [clearHoverTimers, menuOpen]);

    const onPointerEnter = () => {
        if (!menuOpen) startHoverSequence();
    };

    const onPointerLeave = () => {
        stopHoverSequence();
        hoverCycleDoneRef.current = false;
    };

    /**
     * =========================
     * EFFECTS
     * =========================
     */

    // Khi mở menu thì dừng hover
    useEffect(() => {
        if (menuOpen) {
            stopHoverSequence();
            hoverCycleDoneRef.current = false;
        }
    }, [menuOpen, stopHoverSequence]);

    // Click ngoài → đóng menu
    useEffect(() => {
        if (!menuOpen) return;

        const onDoc = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [menuOpen]);

    // Cleanup timer
    useEffect(() => () => clearHoverTimers(), [clearHoverTimers]);

    /**
     * =========================
     * ACTIONS
     * =========================
     */

    const toggleMenu = () => setMenuOpen((o) => !o);

    // Đi tới FAQ
    const goFaq = () => {
        setMenuOpen(false);

        if (location.pathname === "/help") {
            document.getElementById("help-faq")?.scrollIntoView({ behavior: "smooth" });
        } else {
            navigate("/help");
        }
    };

    // MỞ CHATBOX
    const openChat = () => {
        setMenuOpen(false);
        setChatOpen(true);
    };

    /**
     * =========================
     * RENDER
     * =========================
     */
    const showTooltip =
        hoverLineIndex !== null &&
        hoverLineIndex >= 0 &&
        hoverLineIndex < HOVER_MESSAGES.length &&
        !menuOpen;

    return (
        <div
            ref={rootRef}
            className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2"
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
        >
            {/* ================= TOOLTIP ================= */}
            {showTooltip && (
                <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-lg">
                    {HOVER_MESSAGES[hoverLineIndex]}
                </div>
            )}

            {/* ================= CHATBOX ================= */}
            {chatOpen && (
                <SupportChatBox onClose={() => setChatOpen(false)} />
            )}

            {/* ================= MENU ================= */}
            {menuOpen && !chatOpen && (
                <div className="mb-1 flex min-w-[13rem] flex-col rounded-2xl bg-white py-1 shadow-xl">
                    <button
                        onClick={goFaq}
                        className="
                            mx-2 my-1
                            rounded-xl
                            px-4 py-3
                            text-left text-sm font-medium text-slate-700
                            transition-all duration-200

                            hover:bg-primary-100
                            hover:text-primary-800
                            hover:shadow-md
                            hover:translate-x-1
                          "
                    >
                        Câu hỏi thường gặp
                    </button>

                    <button
                        onClick={openChat}
                        className="
                            mx-2 my-1
                            rounded-xl
                            px-4 py-3
                            text-left text-sm font-medium text-slate-700
                            transition-all duration-200

                            hover:bg-orange-200
                            hover:text-orange-800
                            hover:shadow-md
                            hover:translate-x-1
                          "
                    >
                        Chat hỗ trợ
                    </button>
                </div>
            )}

            {/* ================= BUTTON ================= */}
            <button
                onClick={toggleMenu}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg hover:scale-105"
            >
                {menuOpen ? (
                    <X className="h-7 w-7" />
                ) : (
                    <SupportChatIcon className="h-9 w-9" />
                )}
            </button>
        </div>
    );
}