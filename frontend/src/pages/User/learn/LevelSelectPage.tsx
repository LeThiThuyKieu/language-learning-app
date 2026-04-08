import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/utils/cn.ts";

type LevelKey = "beginner" | "intermediate" | "advanced" | "test";

const messages: Record<LevelKey, string> = {
  beginner: "Được rồi, mình cùng học từ cơ bản nhé!",
  intermediate: "Ok, tớ sẽ thiết kế nội dung học phù hợp với bạn!",
  advanced: "Tuyệt! Cùng chinh phục những thử thách nâng cao nào!",
  test: "Hãy làm bài Test đầu vào để khám phá trình độ của bạn!",
};

export default function LevelSelectPage() {
  const [selected, setSelected] = useState<LevelKey | null>(null);
  const navigate = useNavigate();

  const currentMessage = useMemo(() => {
    if (!selected) return "Bạn đang ở mức nào? Hãy chọn để Lion đồng hành nhé!";
    return messages[selected];
  }, [selected]);

  const handleContinue = () => {
    if (!selected) return;
    if (selected === "test") {
      navigate("/placement-test");
    } else {
      // Điều hướng tới trang xác nhận level trước khi học
      navigate("/level-confirm", { state: { level: selected } });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-between p-6 md:p-10">
      {/* Khu vực trung tâm: Lời thoại + Lion */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 max-w-3xl w-full">
        {/* Bong bóng lời thoại */}
        <div className="relative bg-white text-gray-800 px-6 md:px-8 py-4 rounded-3xl text-lg md:text-xl font-extrabold shadow-2xl text-center">
          {currentMessage}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-white"></div>
        </div>

        {/* Lion */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary-500/20 blur-[100px] rounded-full scale-150"></div>
          <img
            src="/logo/lion.png"
            alt="Lion Mascot"
            className="w-40 h-40 md:w-60 md:h-60 object-contain relative z-10 transform transition-transform group-hover:scale-105 duration-500"
          />
          <div className="w-3/4 h-6 bg-black/30 rounded-[100%] blur-xl mx-auto mt-4"></div>
        </div>

        {/* Lựa chọn level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <LevelCard
            title="Beginner"
            description="Bắt đầu từ cơ bản"
            active={selected === "beginner"}
            onClick={() => setSelected("beginner")}
            icon={
              <img
                src="/icons/select-level/beginner.svg"
                alt="Basic start"
                className="w-10 h-10 md:w-14 md:h-14"
              />
            }
          />
          <LevelCard
            title="Intermediate"
            description="Đã có nền tảng"
            active={selected === "intermediate"}
            onClick={() => setSelected("intermediate")}
            icon={
                <img
                    src="/icons/select-level/intermediate.svg"
                    alt="Intermediate"
                    className="w-10 h-10 md:w-14 md:h-14"
                />
            }
          />
          <LevelCard
            title="Advanced"
            description="Trình độ cao"
            active={selected === "advanced"}
            onClick={() => setSelected("advanced")}
            icon={
                <img
                    src="/icons/select-level/advanced.svg"
                    alt="Advanced"
                    className="w-10 h-10 md:w-14 md:h-14"
                />
            }
          />
            <LevelCard
                title="Xác định trình độ hiện tại"
                description="Biết ngay level phù hợp"
                active={selected === "test"}
                onClick={() => setSelected("test")}
                icon={
                    <img
                        src="/icons/select-level/test-level.svg"
                        alt="Placement test"
                        className="w-10 h-10 md:w-14 md:h-14"
                    />
                }
            />
        </div>
      </div>

      {/* Nút tiếp tục */}
      <div className="fixed bottom-8 right-4 md:bottom-10 md:right-6">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={cn(
            "px-8 py-3 rounded-lg text-sm font-semibold shadow-md transition-all duration-200",
            selected
              ? "bg-primary-600 hover:bg-primary-700 text-white"
              : "bg-gray-500 cursor-not-allowed text-white"
          )}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

type LevelCardProps = {
  title: string;
  description: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
};

function LevelCard({ title, description, active, onClick, icon }: LevelCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left p-5 rounded-2xl border transition-all bg-white hover:bg-white",
        "shadow-md hover:shadow-xl",
        active ? "border-primary-600 ring-2 ring-primary-300" : "border-transparent"
      )}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className="shrink-0">
            {icon}
          </div>
        )}
        <div>
          <div className="text-lg md:text-xl font-bold text-gray-900">{title}</div>
          <div className="mt-1 text-sm text-gray-600">{description}</div>
        </div>
      </div>
    </button>
  );
}

