import type {PlacementBandResult, PlacementSkillKey, PlacementTestResultPayload} from "@/pages/User/learn/placement/placementTypes.ts";
import {PLACEMENT_MAX_TOTAL, SKILL_MAX} from "@/pages/User/learn/placement/placementTypes.ts";

const VOCAB_COUNT = 15;
const MATCHING_PAIRS = 15;
const LISTENING_COUNT = 3;
const SPEAKING_COUNT = 11;

const PTS_PER_VOCAB = SKILL_MAX.vocab / VOCAB_COUNT;
const PTS_PER_PAIR = SKILL_MAX.matching / MATCHING_PAIRS;
const PTS_PER_LISTENING = SKILL_MAX.listening / LISTENING_COUNT;
const PTS_PER_SPEAKING = SKILL_MAX.speaking / SPEAKING_COUNT;

export function scoreVocab(correct: boolean): number {
  return correct ? PTS_PER_VOCAB : 0;
}

export function scoreMatchingPairs(correctPairs: number): number {
  return correctPairs * PTS_PER_PAIR;
}

export function scoreListeningBlanks(allCorrect: boolean): number {
  return allCorrect ? PTS_PER_LISTENING : 0;
}

// Điểm speaking cho một dòng: so khớp từ (đơn giản)
export function scoreSpeakingLine(user: string, expected: string): number {
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

export function scoreSpeakingStep(lines: string[], inputs: string[]): number {
  if (lines.length === 0) return 0;
  let sum = 0;
  lines.forEach((line, i) => {
    sum += scoreSpeakingLine(inputs[i] ?? "", line);
  });
  return (sum / lines.length) * PTS_PER_SPEAKING;
}

export function emptySkillScores(): Record<PlacementSkillKey, {score: number; max: number}> {
  return {
    vocab: {score: 0, max: SKILL_MAX.vocab},
    matching: {score: 0, max: SKILL_MAX.matching},
    listening: {score: 0, max: SKILL_MAX.listening},
    speaking: {score: 0, max: SKILL_MAX.speaking},
  };
}

export function bandFromTotal(total: number): PlacementBandResult {
  const p = total / PLACEMENT_MAX_TOTAL;
  if (p < 0.45) return "BEGINNER";
  if (p < 0.72) return "INTERMEDIATE";
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

/** Demo: nếu cần cố định gần ví dụ 94.5/160 — chỉ dùng khi không có state */
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
  return {
    userName,
    totalScore: Math.round(total * 10) / 10,
    maxScore: PLACEMENT_MAX_TOTAL,
    band,
    bandLabelVi: labelVi,
    cefrLabel: cefr,
    skills,
    weakest: w,
    analysisVi: analysisForWeakest(w),
  };
}

export function buildResultFromSession(
  userName: string,
  scores: Record<PlacementSkillKey, {score: number; max: number}>
): PlacementTestResultPayload {
  const total =
    scores.vocab.score + scores.matching.score + scores.listening.score + scores.speaking.score;
  const band = bandFromTotal(total);
  const {labelVi, cefr} = bandDisplay(band);
  const w = weakestSkill(scores);
  return {
    userName,
    totalScore: Math.round(total * 10) / 10,
    maxScore: PLACEMENT_MAX_TOTAL,
    band,
    bandLabelVi: labelVi,
    cefrLabel: cefr,
    skills: scores,
    weakest: w,
    analysisVi: analysisForWeakest(w),
  };
}

export function isListeningBlankCorrect(input: string, expected: string): boolean {
  return input.trim().toLowerCase() === expected.trim().toLowerCase();
}
