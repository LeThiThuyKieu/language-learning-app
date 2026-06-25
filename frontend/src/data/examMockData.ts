// UI config tĩnh cho trang exam — màu sắc, label, mô tả cấp độ
// Data bài thi thực lấy từ API qua examService

export type CefrLevel = "A2" | "B1" | "B2" | "C1" | "C2";

export interface ExamLevel {
  id: CefrLevel;
  label: string;
  description: string;
  color: string;
  textColor: string;
  borderColor: string;
  badgeColor: string;
  testCount: number;
}

export const EXAM_LEVELS: ExamLevel[] = [
  {
    id: "A2",
    label: "A2",
    description: "Key English Test — Trình độ sơ cấp",
    color: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    badgeColor: "bg-green-100",
    testCount: 1,
  },
  {
    id: "B1",
    label: "B1",
    description: "Preliminary English Test — Trung cấp",
    color: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    badgeColor: "bg-blue-100",
    testCount: 1,
  },
  {
    id: "B2",
    label: "B2",
    description: "First Certificate in English — Trên trung cấp",
    color: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    badgeColor: "bg-purple-100",
    testCount: 2,
  },
  {
    id: "C1",
    label: "C1",
    description: "Advanced English — Nâng cao",
    color: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    badgeColor: "bg-orange-100",
    testCount: 2,
  },
  {
    id: "C2",
    label: "C2",
    description: "Proficiency — Thành thạo hoàn toàn",
    color: "bg-rose-50",
    textColor: "text-rose-700",
    borderColor: "border-rose-200",
    badgeColor: "bg-rose-100",
    testCount: 1,
  },
];
