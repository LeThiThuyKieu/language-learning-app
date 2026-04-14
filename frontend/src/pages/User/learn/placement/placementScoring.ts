import type {PlacementBandResult, PlacementSkillKey, PlacementTestResultPayload} from "@/pages/User/learn/placement/placementTypes.ts";
import {PLACEMENT_MAX_TOTAL, SKILL_MAX} from "@/pages/User/learn/placement/placementTypes.ts";

function scoreSpeakingLine(user: string, expected: string): number {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const a = norm(user);
  const b = norm(expected);
  if (!b) return 0;
  if (a === b) return 1;
  const wa = a.split(" ").filter(Boolean);
  const wb = b.split(" ").filter(Boolean);
  if (wb.length === 0) return 0;
  let hit = 0;
  for (const w of wb) {
    if (wa.includes(w)) hit++;
  }
  return Math.min(1, hit / wb.length);
}

/** Trung bình độ khớp từng dòng (0–1), chỉ dùng gợi ý “yếu” trên UI. */
export function scoreSpeakingStep(lines: string[], inputs: string[]): number {
  if (lines.length === 0) return 0;
  let sum = 0;
  lines.forEach((line, i) => {
    sum += scoreSpeakingLine(inputs[i] ?? "", line);
  });
  return sum / lines.length;
}

/** Khớp backend & bảng quy đổi: ≤55 Beginner, ≤125 Intermediate, còn lại Advanced (thang 160). */
export function bandFromTotal(total: number): PlacementBandResult {
  if (total <= 55) return "BEGINNER";
  if (total <= 125) return "INTERMEDIATE";
  return "ADVANCED";
}

export function bandDisplay(b: PlacementBandResult): {labelVi: string; cefr: string} {
  if (b === "BEGINNER") return {labelVi: "BEGINNER (A1 - A2)", cefr: "A1 - A2"};
  if (b === "INTERMEDIATE") return {labelVi: "INTERMEDIATE (B1 - B2)", cefr: "B1 - B2"};
  return {labelVi: "ADVANCED (C1 - C2)", cefr: "C1 - C2"};
}

export function weakestSkill(skills: PlacementTestResultPayload["skills"]): PlacementSkillKey {
  let key: PlacementSkillKey = "vocab";
  let minRatio = Infinity;
  (Object.keys(skills) as PlacementSkillKey[]).forEach((k) => {
    const s = skills[k];
    const r = s.max > 0 ? s.score / s.max : 1;
    if (r < minRatio) {
      minRatio = r;
      key = k;
    }
  });
  return key;
}

export function analysisForWeakest(w: PlacementSkillKey): string {
  const map: Record<PlacementSkillKey, string> = {
    vocab:
      "Từ vựng của bạn đang phát triển! Ôn trọng âm và collocation mỗi ngày để tăng điểm nhanh.",
    matching:
      "Ghép nghĩa cần thêm luyện tập. Hãy học theo cụm và đọc ví dụ song song song ngữ.",
    listening:
      "Nghe hiểu có thể cải thiện bằng nghe có transcript và nghe lặp lại từng đoạn ngắn.",
    speaking:
      "Kỹ năng nói của bạn đang phát triển! Tập trung vào ngữ điệu và phát âm từng câu ngắn.",
  };
  return map[w];
}

/** Khi không có kết quả API (vào trang kết quả trực tiếp). */
export function buildDemoResult(userName: string): PlacementTestResultPayload {
  const skills = {
    vocab: {score: 26.5, max: SKILL_MAX.vocab},
    matching: {score: 24, max: SKILL_MAX.matching},
    listening: {score: 25.5, max: SKILL_MAX.listening},
    speaking: {score: 18.5, max: SKILL_MAX.speaking},
  };
  const total = skills.vocab.score + skills.matching.score + skills.listening.score + skills.speaking.score;
  const band = bandFromTotal(total);
  const {labelVi, cefr} = bandDisplay(band);
  const w = weakestSkill(skills);
  const detectedLevelId = band === "BEGINNER" ? 1 : band === "INTERMEDIATE" ? 2 : 3;
  return {
    userName,
    totalScore: Math.round(total * 10) / 10,
    maxScore: PLACEMENT_MAX_TOTAL,
    band,
    bandLabelVi: labelVi,
    cefrLabel: cefr,
    detectedLevelId,
    skills,
    weakest: w,
    analysisVi: analysisForWeakest(w),
  };
}
