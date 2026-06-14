import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import GuestPrompt from "@/components/user/GuestPrompt";
import LearnSidebar from "@/components/user/learn/common/LearnSidebar.tsx";
import LearnRightPanel from "@/components/user/learn/common/LearnRightPanel.tsx";
import { phoneticService, type PhoneticItem, type PhoneticsData } from "@/services/phoneticService.ts";

// Card phát âm
function PhoneticCard({
  item,
  isPlaying,
  onPlay,
}: {
  item: PhoneticItem;
  isPlaying: boolean;
  onPlay: (item: PhoneticItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPlay(item)}
      className={`
        flex flex-col items-center justify-center gap-1.5 rounded-xl border
        px-2 py-3 text-center transition-all select-none w-full
        ${isPlaying
          ? "border-primary-300 bg-primary-50 shadow-sm ring-1 ring-primary-200"
          : "border-gray-200 bg-white hover:border-primary-200 hover:bg-orange-50 hover:shadow-sm"
        }
      `}
    >
      {/* Ký hiệu IPA */}
      <span
        className="text-2xl font-medium leading-none text-gray-600"
        style={{ fontFamily: "'Noto Sans', 'Segoe UI', Inter, sans-serif" }}
      >
        {item.symbol}
      </span>

      {/* Từ ví dụ */}
      <span className="text-sm text-gray-400 font-medium leading-none">
        {item.exampleWord}
      </span>

      {/* Thanh indicator */}
      <div className="mt-1 w-8 h-1 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isPlaying ? "w-full bg-primary-400" : "w-0"
          }`}
        />
      </div>
    </button>
  );
}

// Section (Nguyên âm / Phụ âm)
function PhoneticSection({
  title,
  items,
  playingId,
  onPlay,
}: {
  title: string;
  items: PhoneticItem[];
  playingId: number | null;
  onPlay: (item: PhoneticItem) => void;
}) {
  return (
    <div className="mt-5">
      {/* Divider + tiêu đề */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm font-bold text-gray-600 whitespace-nowrap uppercase tracking-wide">
          {title}
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Lưới 4 cột — nhỏ gọn hơn */}
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <PhoneticCard
            key={item.id}
            item={item}
            isPlaying={playingId === item.id}
            onPlay={onPlay}
          />
        ))}
      </div>
    </div>
  );
}

// Page
export default function PhoneticPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();

  const [data, setData] = useState<PhoneticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    phoneticService
      .getPhonetics()
      .then(setData)
      .catch(() => setError("Không tải được dữ liệu. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, []);

  function handlePlay(item: PhoneticItem) {
    // Dừng âm thanh hiện tại
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();

    // Bấm lại cùng card → dừng
    if (playingId === item.id) {
      setPlayingId(null);
      return;
    }

    setPlayingId(item.id);

    /**
     * Phát audio từ URL, trả về Promise resolve khi kết thúc/lỗi.
     * Nếu url null → dùng Web Speech API.
     */
    function playAudio(url: string | null, fallbackText: string): Promise<void> {
      return new Promise((resolve) => {
        if (url) {
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => resolve();
          audio.onerror = () => {
            // fallback
            if ("speechSynthesis" in window) {
              window.speechSynthesis.cancel();
              const utter = new SpeechSynthesisUtterance(fallbackText);
              utter.lang = "en-US";
              utter.rate = 0.8;
              utter.onend = () => resolve();
              window.speechSynthesis.speak(utter);
            } else {
              resolve();
            }
          };
          audio.play().catch(() => audio.onerror?.(new Event("error")));
        } else {
          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(fallbackText);
            utter.lang = "en-US";
            utter.rate = 0.8;
            utter.onend = () => resolve();
            window.speechSynthesis.speak(utter);
          } else {
            setTimeout(resolve, 600);
          }
        }
      });
    }

    // Phát liên tiếp: âm IPA → từ ví dụ
    (async () => {
      await playAudio(item.audioUrl, item.symbol);
      // Khoảng nghỉ nhỏ giữa 2 audio
      await new Promise((r) => setTimeout(r, 250));
      await playAudio(item.wordAudioUrl, item.exampleWord);
      setPlayingId(null);
    })();
  }

  if (!isAuthenticated) return <GuestPrompt />;

  return (
    <div className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white -mt-8">
      <div className="w-full px-4 pb-8 pt-5 md:px-8 md:pt-6">
        <div className="grid grid-cols-12 gap-6">

          {/* Sidebar trái */}
          <LearnSidebar
            isAllLevelsCompleted={false}
            showGeneralRevision={false}
            onToggleGeneralRevision={() => navigate("/general-revision")}
            activeItem="phonetic"
            onNavigate={(path) => navigate(path)}
            onLogout={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          />

          {/* Nội dung giữa */}
          <main className="col-span-12 md:col-span-9 lg:col-span-9">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 px-4 lg:px-6">

                {/* Header */}
                <div className="text-center pt-6 mb-8">
                  <h1 className="text-3xl font-black text-primary-600">
                    Cùng học phát âm tiếng Anh!
                  </h1>
                  <p className="mt-2 text-base text-gray-500">
                    Tập nghe và học phát âm các âm trong tiếng Anh
                  </p>
                </div>

                {/* Loading skeleton */}
                {loading && (
                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                    ))}
                  </div>
                )}

                {/* Lỗi */}
                {error && (
                  <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                    {error}
                  </div>
                )}

                {/* Nội dung chính */}
                {!loading && !error && data && (
                  <>
                    <PhoneticSection
                      title="Nguyên âm"
                      items={data.vowels}
                      playingId={playingId}
                      onPlay={handlePlay}
                    />
                    <PhoneticSection
                      title="Phụ âm"
                      items={data.consonants}
                      playingId={playingId}
                      onPlay={handlePlay}
                    />
                  </>
                )}
              </div>

              {/* Panel bên phải */}
              <LearnRightPanel onViewProfile={() => navigate("/profile")} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
