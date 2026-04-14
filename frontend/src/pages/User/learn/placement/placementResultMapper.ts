import type {PlacementBandResult, PlacementTestResultPayload} from "@/pages/User/learn/placement/placementTypes.ts";
import {PLACEMENT_MAX_TOTAL} from "@/pages/User/learn/placement/placementTypes.ts";
import {analysisForWeakest, weakestSkill} from "@/pages/User/learn/placement/placementScoring.ts";
import type {PlacementResultData} from "@/services/placementTestService.ts";

export function mapPlacementResultToPayload(
  userName: string,
  api: PlacementResultData
): PlacementTestResultPayload {
  const skills = {
    vocab: {score: api.skillScores?.vocab ?? 0, max: 40},
    matching: {score: api.skillScores?.matching ?? 0, max: 40},
    listening: {score: api.skillScores?.listening ?? 0, max: 40},
    speaking: {score: api.skillScores?.speaking ?? 0, max: 40},
  };
  const band = api.band as PlacementBandResult;
  const weakest = weakestSkill(skills);
  const cefr =
    band === "BEGINNER" ? "A1 - A2" : band === "INTERMEDIATE" ? "B1 - B2" : "C1 - C2";
  return {
    userName,
    totalScore: api.totalScore ?? 0,
    maxScore: PLACEMENT_MAX_TOTAL,
    band,
    bandLabelVi: api.bandLabelVi || band,
    cefrLabel: cefr,
    detectedLevelId: api.detectedLevelId ?? 1,
    skills,
    weakest,
    analysisVi: analysisForWeakest(weakest),
  };
}
