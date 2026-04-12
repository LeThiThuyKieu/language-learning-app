import type {PlacementLevelBand, PlacementStep} from "@/pages/User/learn/placement/placementTypes.ts";

// Dữ liệu mockup, gọi API sau
// Thứ tự: 15 Vocab → 3 Listening → 11 Speaking → 3 khối Matching (mỗi khối 5 cặp)
export function buildPlacementSteps(): PlacementStep[] {
  const steps: PlacementStep[] = [];

  // VOCAB: 5 + 5 + 5
  const vocabL1: {q: string; o: string[]; c: number}[] = [
    {q: '"Happy" nghĩa là gì?', o: ["Buồn", "Vui", "Mệt", "Đói"], c: 1},
    {q: '"Book" là gì?', o: ["Sách", "Bút", "Bàn", "Cửa"], c: 0},
    {q: 'Chọn từ trái nghĩa với "big":', o: ["large", "huge", "small", "great"], c: 2},
    {q: '"Morning" là thời điểm nào?', o: ["Tối", "Trưa", "Sáng", "Khuya"], c: 2},
    {q: '"Water" là gì?', o: ["Lửa", "Nước", "Gió", "Đất"], c: 1},
  ];
  const vocabL2: {q: string; o: string[]; c: number}[] = [
    {q: '"Nevertheless" gần nghĩa nhất với:', o: ["However", "Therefore", "Moreover", "Instead"], c: 0},
    {q: 'Chọn từ thích hợp: She ___ English for three years.', o: ["studies", "has studied", "study", "studying"], c: 1},
    {q: '"Reliable" nghĩa là:', o: ["Đáng tin cậy", "Nguy hiểm", "Nhàm chán", "Rẻ tiền"], c: 0},
    {q: 'Idiom: "Break the ice" có nghĩa:', o: ["Làm vỡ băng", "Khởi đầu hội thoại", "Kết thúc", "Tranh cãi"], c: 1},
    {q: '"Significant" trong học thuật thường là:', o: ["Nhỏ", "Không quan trọng", "Đáng kể", "Ẩn"], c: 2},
  ];
  const vocabL3: {q: string; o: string[]; c: number}[] = [
    {q: '"Ubiquitous" nghĩa là:', o: ["Hiếm", "Ở khắp nơi", "Vô hình", "Cũ kỹ"], c: 1},
    {q: 'Collocation: ___ attention (chú ý sâu sắc)', o: ["pay", "give", "take", "draw"], c: 0},
    {q: '"Mitigate" gần nghĩa với:', o: ["Làm nặng thêm", "Giảm nhẹ", "Tăng tốc", "Phủ nhận"], c: 1},
    {q: 'Trái nghĩa "explicit":', o: ["clear", "implicit", "direct", "obvious"], c: 1},
    {q: '"Paradigm" trong bài học thuật thường chỉ:', o: ["Lỗi chính tả", "Mô hình/khuôn mẫu", "Đoạn mở", "Phụ lục"], c: 1},
  ];

  [...vocabL1, ...vocabL2, ...vocabL3].forEach((v, i) => {
    const level: PlacementLevelBand = i < 5 ? 1 : i < 10 ? 2 : 3;
    steps.push({
      kind: "vocab",
      id: `vocab-${i + 1}`,
      level,
      prompt: v.q,
      options: v.o,
      correctIndex: v.c,
    });
  });

  // LISTENING: 3 (placeholder audio — LessonAudioPlayer vẫn render)
  const listen = [
    {
      level: 1 as PlacementLevelBand,
      title: "Nghe & điền từ (Cơ bản)",
      audioUrl: "",
      text: "He was born in: ___ (1). She likes ___ (2) music.",
      answers: ["London", "classical"],
    },
    {
      level: 2 as PlacementLevelBand,
      title: "Nghe & điền từ (Trung cấp)",
      audioUrl: "",
      text: "They decided to ___ (1) the meeting until next week. The result was ___ (2).",
      answers: ["postpone", "unexpected"],
    },
    {
      level: 3 as PlacementLevelBand,
      title: "Nghe & điền từ (Nâng cao)",
      audioUrl: "",
      text: "The hypothesis remains ___ (1) until further data ___ (2) it.",
      answers: ["tenuous", "substantiates"],
    },
  ];
  listen.forEach((L, i) => {
    steps.push({
      kind: "listening",
      id: `listening-${i + 1}`,
      level: L.level,
      title: L.title,
      audioUrl: L.audioUrl,
      textWithBlanks: L.text,
      blankAnswers: L.answers,
    });
  });

  // SPEAKING: 11 câu (3 + 4 + 4), hệ thống chấm theo độ khớp từ (placeholder — STT sẽ bổ sung sau)
  const speakL1 = [
    "Hello, my name is Anna.",
    "I like coffee in the morning.",
    "The weather is nice today.",
  ];
  const speakL2 = [
    "Could you please repeat that more slowly?",
    "I would rather stay home than go out tonight.",
    "The report needs to be finished by Friday.",
    "Learning English takes time and patience.",
  ];
  const speakL3 = [
    "Notwithstanding the risks, the team proceeded carefully.",
    "The findings are consistent with prior research in this field.",
    "She articulated her concerns in a constructive manner.",
    "We should mitigate potential errors before the launch.",
  ];
  [...speakL1, ...speakL2, ...speakL3].forEach((line, i) => {
    const level: PlacementLevelBand = i < 3 ? 1 : i < 7 ? 2 : 3;
    steps.push({
      kind: "speaking",
      id: `speaking-${i + 1}`,
      level,
      instruction: "Đọc và gõ lại câu (hệ thống chấm theo độ khớp từ).",
      lines: [line],
    });
  });

  // MATCHING: 3 khối × 5 cặp (cuối cùng)
  const blocks: {level: PlacementLevelBand; pairs: {left: string; right: string}[]}[] = [
    {
      level: 1,
      pairs: [
        {left: "apple", right: "a round fruit"},
        {left: "run", right: "move fast on foot"},
        {left: "blue", right: "color of the sky"},
        {left: "teacher", right: "works at school"},
        {left: "sleep", right: "rest at night"},
      ],
    },
    {
      level: 2,
      pairs: [
        {left: "achieve", right: "reach a goal"},
        {left: "deadline", right: "final date to finish"},
        {left: "negotiate", right: "discuss to agree"},
        {left: "evidence", right: "proof or data"},
        {left: "priority", right: "most important task"},
      ],
    },
    {
      level: 3,
      pairs: [
        {left: "paradox", right: "seems self-contradictory"},
        {left: "ambiguous", right: "unclear in meaning"},
        {left: "coherent", right: "logical and consistent"},
        {left: "substantiate", right: "support with proof"},
        {left: "pragmatic", right: "practical, realistic"},
      ],
    },
  ];

  blocks.forEach((b, bi) => {
    const pairs = b.pairs.map((p, i) => {
      const leftId = `m${bi}-l-${i}`;
      const rightId = `m${bi}-r-${i}`;
      return {leftId, rightId, left: p.left, right: p.right};
    });
    steps.push({
      kind: "matching",
      id: `matching-block-${bi + 1}`,
      level: b.level,
      pairs,
    });
  });

  return steps;
}

// Số lượng theo từng dạng
export const PLACEMENT_SECTION_COUNTS = {
  vocab: 15,
  listening: 3,
  speaking: 11,
  // Tổng số cặp ghép (3 khối × 5 cặp)
  matchingPairs: 15,
} as const;


// Nhãn trình độ (level)
export function levelBandEnglish(level: PlacementLevelBand): string {
  if (level === 1) return "Beginner";
  if (level === 2) return "Intermediate";
  return "Advanced";
}
