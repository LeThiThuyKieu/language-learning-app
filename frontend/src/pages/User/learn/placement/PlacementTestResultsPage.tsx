import {useEffect, useMemo, useRef, useState} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {buildDemoResult} from "@/pages/User/learn/placement/placementScoring.ts";
import type {PlacementSkillKey, PlacementTestResultPayload} from "@/pages/User/learn/placement/placementTypes.ts";
import {profileService} from "@/services/profileService.ts";
import {cn} from "@/utils/cn.ts";
import toast from "react-hot-toast";
import {mapLevelIdToKey} from "@/utils/learningLevel.ts";

const YELLOW = "#F9CF15";
const NAVY = "#0a192f";
const PURPLE = "#7c3aed";

function skillLabelVi(k: PlacementSkillKey): string {
  const m: Record<PlacementSkillKey, string> = {
    vocab: "Từ vựng",
    matching: "Matching",
    listening: "Nghe",
    speaking: "Nói",
  };
  return m[k];
}

export default function PlacementTestResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = (location.state as {placementResult?: PlacementTestResultPayload} | null)?.placementResult;

  const [profileName, setProfileName] = useState<string | null>(null);
  const startLearningOnce = useRef(false);

  useEffect(() => {
    let c = false;
    profileService
      .getMyProfile()
      .then((p) => {
        if (!c && p.fullName?.trim()) setProfileName(p.fullName.trim().split(/\s+/)[0] ?? null);
      })
      .catch(() => {});
    return () => {
      c = true;
    };
  }, []);

  const result = useMemo(() => {
    if (fromState) return fromState;
    const name = profileName ?? "Bạn";
    return buildDemoResult(name);
  }, [fromState, profileName]);

  const radarData = useMemo(
    () =>
      (["vocab", "matching", "listening", "speaking"] as const).map((k) => ({
        skill: skillLabelVi(k),
        value: result.skills[k].max > 0 ? Math.round((result.skills[k].score / result.skills[k].max) * 100) : 0,
        full: `${Math.round(result.skills[k].score)}/${result.skills[k].max}`,
      })),
    [result.skills]
  );

  const barData = useMemo(
    () =>
      (["vocab", "matching", "listening", "speaking"] as const).map((k) => ({
        name: skillLabelVi(k),
        score: Math.round(result.skills[k].score * 10) / 10,
        max: result.skills[k].max,
        key: k,
      })),
    [result.skills]
  );

  const weakestKey = result.weakest;

  // Mở lộ trình học
  const handleStartLearning = async () => {
    if (startLearningOnce.current) return;
    const id = result.detectedLevelId;
    if (id < 1 || id > 3) {
      toast.error("Không xác định được trình độ từ kết quả placement.");
      return;
    }
    const level = mapLevelIdToKey(id);
    startLearningOnce.current = true;
    try {
      await profileService.updateMyProfile({currentLevelId: id});
    } catch (e) {
      console.error(e);
      toast.error("Không lưu được trình độ lên hồ sơ. Vẫn mở lộ trình theo kết quả test.");
    }
    navigate("/learn", {state: {level}});
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#eef0ff] via-[#f8f7ff] to-[#fff9e6] font-sans text-gray-900">
      <ConfettiBackdrop />

      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-28 pt-10 md:px-8 md:pb-32 md:pt-14">
        <header className="text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-[#F9CF15] bg-white shadow-xl shadow-amber-200/50 md:h-28 md:w-28">
            <img src="/logo/lion.png" alt="" className="h-16 w-16 object-contain md:h-[4.5rem] md:w-[4.5rem]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#0a192f] md:text-4xl">
            Chúc mừng, {result.userName}!
          </h1>
          <p className="mt-3 text-lg font-bold text-violet-700 md:text-xl">{result.bandLabelVi}</p>

          <div className="mx-auto mt-8 flex h-36 w-36 items-center justify-center rounded-full border-4 border-primary-400 bg-white shadow-inner md:h-44 md:w-44">
            <div className="text-center">
              <p className="text-3xl font-black tabular-nums text-[#0a192f] md:text-4xl">
                {result.totalScore}
              </p>
              <p className="text-sm font-semibold text-gray-500">/ {result.maxScore}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-600">Tổng điểm placement</p>
        </header>

        <section className="mt-12 rounded-3xl border border-white/80 bg-white/90 p-5 shadow-xl backdrop-blur-sm md:p-8">
          <h2 className="text-center text-lg font-extrabold text-[#0a192f] md:text-xl">
            Phân tích kỹ năng
          </h2>
          <p className="mt-1 text-center text-sm text-gray-600">So sánh nhanh giữa bốn kỹ năng</p>

          <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="mx-auto w-full max-w-[280px] lg:mx-0 lg:w-[45%]">
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="skill" tick={{fill: NAVY, fontSize: 11, fontWeight: 700}} />
                  <Radar
                    name="Điểm %"
                    dataKey="value"
                    stroke={PURPLE}
                    fill={PURPLE}
                    fillOpacity={0.35}
                  />
                  <Tooltip contentStyle={{borderRadius: 12, border: "1px solid #e5e7eb"}} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="min-h-[260px] w-full flex-1 lg:w-[55%]">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{top: 8, right: 8, left: 0, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{fontSize: 11, fill: "#4b5563"}} />
                  <YAxis domain={[0, 40]} tick={{fontSize: 11}} />
                  <Tooltip contentStyle={{borderRadius: 12}} />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {barData.map((row) => (
                      <Cell
                        key={row.key}
                        fill={row.key === weakestKey ? "#f97316" : YELLOW}
                        fillOpacity={row.key === weakestKey ? 0.95 : 0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p
            className={cn(
              "mt-8 rounded-2xl border-l-4 p-4 text-sm leading-relaxed md:text-base",
              "border-violet-500 bg-violet-50/80 text-violet-950"
            )}
          >
            <span className="font-extrabold">Nhận xét thích nghi: </span>
            {result.analysisVi}
          </p>
        </section>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => void handleStartLearning()}
            className="w-full max-w-md rounded-full bg-[#F9CF15] px-8 py-3.5 text-base font-extrabold text-gray-900 shadow-lg shadow-amber-200/60 transition hover:brightness-95"
          >
            Bắt đầu học ngay
          </button>
          <button
            type="button"
            onClick={() => navigate("/placement-test")}
            className="text-sm font-semibold text-violet-700 underline-offset-4 hover:underline"
          >
            Làm lại bài test năng lực
          </button>
          <Link to="/" className="text-xs text-gray-500 hover:text-gray-700">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

function ConfettiBackdrop() {
  const spots = useMemo(
    () =>
      Array.from({length: 28}).map((_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        delay: `${(i % 8) * 0.15}s`,
        size: 8 + (i % 5) * 3,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {spots.map((s) => (
        <span
          key={s.id}
          className="absolute animate-pulse rounded-sm bg-[#F9CF15]/40"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            transform: "rotate(45deg)",
          }}
        />
      ))}
      <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-violet-300/25 blur-3xl" />
      <div className="absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
    </div>
  );
}
