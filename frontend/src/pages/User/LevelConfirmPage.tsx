import { useLocation, useNavigate } from "react-router-dom";

type LevelKey = "beginner" | "intermediate" | "advanced";

export default function LevelConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const level = (location.state?.level ?? "beginner") as LevelKey;

  const levelNumberMap: Record<LevelKey, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };

  const levelTextMap: Record<LevelKey, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };

  const message = `Vì bạn đã chọn mức ${levelTextMap[level]}, bạn sẽ bắt đầu ở Level ${levelNumberMap[level]}`;

  const handleContinue = () => {
    navigate("/learn", { state: { level } });
  };

  return (
    <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-between p-6 md:p-10">
      {/* Trung tâm: Lời chào + Lion */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 max-w-2xl w-full">
        {/* Bubble lời thoại */}
        <div className="relative bg-white text-gray-800 px-8 py-4 rounded-3xl text-lg md:text-xl font-extrabold shadow-2xl text-center">
          {message}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-white"></div>
        </div>

        {/* Ảnh Lion */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary-500/20 blur-[100px] rounded-full scale-150"></div>
          <img
            src="/logo/lion.png"
            alt="Lion Mascot"
            className="w-56 h-56 md:w-80 md:h-80 object-contain relative z-10 transform transition-transform group-hover:scale-105 duration-500"
          />
          <div className="w-3/4 h-6 bg-black/30 rounded-[100%] blur-xl mx-auto mt-4"></div>
        </div>
      </div>

      {/* Nút Tiếp tục */}
      <div className="fixed bottom-8 right-4 md:bottom-10 md:right-6">
        <button
          onClick={handleContinue}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-lg rounded-lg shadow-md transition-all duration-200"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

