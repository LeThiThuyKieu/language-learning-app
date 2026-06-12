import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import GuestPrompt from "@/components/user/GuestPrompt";
import LearnSidebar from "@/components/user/learn/common/LearnSidebar.tsx";
import LearnRightPanel from "@/components/user/learn/common/LearnRightPanel.tsx";

// 26 chữ cái tiếng Anh với phiên âm và ví dụ từ
const ALPHABET = [
  { letter: "A", phonetic: "/eɪ/", example: "Apple" },
  { letter: "B", phonetic: "/biː/", example: "Ball" },
  { letter: "C", phonetic: "/siː/", example: "Cat" },
  { letter: "D", phonetic: "/diː/", example: "Dog" },
  { letter: "E", phonetic: "/iː/", example: "Egg" },
  { letter: "F", phonetic: "/ɛf/", example: "Fish" },
  { letter: "G", phonetic: "/dʒiː/", example: "Goat" },
  { letter: "H", phonetic: "/eɪtʃ/", example: "Hat" },
  { letter: "I", phonetic: "/aɪ/", example: "Ice" },
  { letter: "J", phonetic: "/dʒeɪ/", example: "Jar" },
  { letter: "K", phonetic: "/keɪ/", example: "Kite" },
  { letter: "L", phonetic: "/ɛl/", example: "Lion" },
  { letter: "M", phonetic: "/ɛm/", example: "Moon" },
  { letter: "N", phonetic: "/ɛn/", example: "Nut" },
  { letter: "O", phonetic: "/oʊ/", example: "Orange" },
  { letter: "P", phonetic: "/piː/", example: "Pen" },
  { letter: "Q", phonetic: "/kjuː/", example: "Queen" },
  { letter: "R", phonetic: "/ɑːr/", example: "Rain" },
  { letter: "S", phonetic: "/ɛs/", example: "Sun" },
  { letter: "T", phonetic: "/tiː/", example: "Tree" },
  { letter: "U", phonetic: "/juː/", example: "Umbrella" },
  { letter: "V", phonetic: "/viː/", example: "Van" },
  { letter: "W", phonetic: "/ˈdʌbljuː/", example: "Water" },
  { letter: "X", phonetic: "/ɛks/", example: "Box" },
  { letter: "Y", phonetic: "/waɪ/", example: "Yellow" },
  { letter: "Z", phonetic: "/ziː/", example: "Zebra" },
];

// Màu sắc xen kẽ cho từng card
const CARD_COLORS = [
  "bg-orange-50 border-orange-200 text-orange-700",
  "bg-blue-50 border-blue-200 text-blue-700",
  "bg-purple-50 border-purple-200 text-purple-700",
  "bg-teal-50 border-teal-200 text-teal-700",
  "bg-rose-50 border-rose-200 text-rose-700",
];

export default function AlphabetPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) return <GuestPrompt />;

  return (
    <div className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white -mt-8">
      <div className="w-full px-4 pb-8 pt-5 md:px-8 md:pt-6">
        <div className="grid grid-cols-12 gap-6">

          {/* Sidebar bên trái */}
          <LearnSidebar
            isAllLevelsCompleted={false}
            showGeneralRevision={false}
            onToggleGeneralRevision={() => navigate("/general-revision")}
            activeItem="alphabet"
            onNavigate={(path) => navigate(path)}
            onLogout={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          />

          {/* Nội dung giữa */}
          <main className="col-span-12 md:col-span-9 lg:col-span-9">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8">

                {/* Header */}
                <div className="rounded-2xl bg-primary-500 text-white px-6 py-5 mb-6 flex items-center gap-4 shadow-md">
                  <img
                    src="/icons/learn/alphabet.svg"
                    alt=""
                    className="h-12 w-12 shrink-0 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div>
                    <h1 className="text-2xl font-extrabold leading-tight">Bảng chữ cái</h1>
                    <p className="text-white/80 text-sm mt-0.5">
                      26 chữ cái tiếng Anh — phiên âm và ví dụ từ
                    </p>
                  </div>
                </div>

                {/* Lưới chữ cái */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {ALPHABET.map((item, idx) => {
                    const colorClass = CARD_COLORS[idx % CARD_COLORS.length];
                    return (
                      <div
                        key={item.letter}
                        className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-1 shadow-sm hover:shadow-md transition-shadow cursor-default ${colorClass}`}
                      >
                        {/* Chữ cái lớn */}
                        <div className="text-4xl font-black leading-none">
                          {item.letter}
                        </div>
                        {/* Chữ thường */}
                        <div className="text-xl font-bold leading-none opacity-70">
                          {item.letter.toLowerCase()}
                        </div>
                        {/* Phiên âm */}
                        <div className="text-xs font-semibold text-gray-500 mt-1">
                          {item.phonetic}
                        </div>
                        {/* Ví dụ */}
                        <div className="text-xs font-bold text-gray-700 mt-0.5">
                          {item.example}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
