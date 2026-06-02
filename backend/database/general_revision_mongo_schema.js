/**
 * MongoDB schema cho phần ÔN TẬP TỔNG HỢP (General Revision)
 * Collection: general_revision_questions
 *             general_revision_topic_meta
 * Tách hoàn toàn khỏi collection "questions" của phần Học.
 *
 * question_type: VOCAB | LISTENING | SPEAKING | MATCHING
 */

// ──────────────────────────────────────────────────────────
// 1. Tạo collection + indexes
// ──────────────────────────────────────────────────────────
db.createCollection("general_revision_questions");

db.general_revision_questions.createIndex({ topic_id: 1 });
db.general_revision_questions.createIndex({ task_id: 1 });
db.general_revision_questions.createIndex({ question_type: 1 });
db.general_revision_questions.createIndex({ topic_id: 1, task_id: 1 });

// ──────────────────────────────────────────────────────────
// 2. Sample documents — 1 câu cho mỗi dạng bài của topic 1
// ──────────────────────────────────────────────────────────

db.general_revision_questions.insertMany([
  // 2a. VOCAB — điền vào chỗ trống / multiple-choice
  {
    topic_id: 1,          // Daily Life
    task_id: 1,           // MySQL general_revision_task.id tương ứng
    question_type: "VOCAB",
    question_text: "She goes to the ________ every morning to buy fresh vegetables.",
    distractors: ["library", "museum", "market", "hospital"],
    correct_answer: "market",
    explanation: "'Market' là nơi bán thực phẩm tươi sống.",
    difficulty: "easy",
    metadata: { audio_url: "", image_url: "" }
  },

  // 2b. LISTENING — nghe audio, chọn đáp án
  {
    topic_id: 1,
    task_id: 2,
    question_type: "LISTENING",
    question_text: "What time does the man wake up?",
    distractors: ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM"],
    correct_answer: "7:00 AM",
    explanation: "Trong đoạn hội thoại, người đàn ông nói anh thức dậy lúc 7 giờ sáng.",
    difficulty: "easy",
    metadata: {
      audio_url: "/audio/general_revision/daily_life/listening_01.mp3",
      transcript: "A: What time do you usually wake up? B: I wake up at seven in the morning.",
      image_url: ""
    }
  },

  // 2c. SPEAKING — đọc to câu / từ
  {
    topic_id: 1,
    task_id: 3,
    question_type: "SPEAKING",
    question_text: "Read the following sentence aloud:",
    prompt_text: "I brush my teeth and wash my face every morning before breakfast.",
    expected_keywords: ["brush", "teeth", "wash", "face", "morning", "breakfast"],
    difficulty: "easy",
    metadata: {
      audio_url: "/audio/general_revision/daily_life/speaking_01.mp3",
      image_url: ""
    }
  },

  // 2d. MATCHING — ghép cặp từ ↔ nghĩa
  {
    topic_id: 1,
    task_id: 4,
    question_type: "MATCHING",
    question_text: "Ghép từ tiếng Anh với nghĩa tiếng Việt:",
    pairs: [
      { left: "alarm clock",  right: "đồng hồ báo thức" },
      { left: "toothbrush",   right: "bàn chải đánh răng" },
      { left: "breakfast",    right: "bữa sáng" },
      { left: "commute",      right: "đi làm / đi học hằng ngày" }
    ],
    difficulty: "easy",
    metadata: { audio_url: "", image_url: "" }
  }
]);

// ──────────────────────────────────────────────────────────
// 3. general_revision_topic_meta — metadata phụ trợ cho UI
// ──────────────────────────────────────────────────────────
db.createCollection("general_revision_topic_meta");
db.general_revision_topic_meta.createIndex({ topic_id: 1 }, { unique: true });

db.general_revision_topic_meta.insertOne({
  topic_id: 1,
  topic_title: "Daily Life",
  key_vocabulary: [
    { word: "alarm clock",  meaning: "đồng hồ báo thức",     example: "My alarm clock rings at 6 AM." },
    { word: "commute",      meaning: "di chuyển đi làm/học", example: "The commute takes 30 minutes." },
    { word: "grocery",      meaning: "hàng tạp hóa",          example: "I buy groceries on weekends." },
    { word: "routine",      meaning: "thói quen hằng ngày",   example: "Exercising is part of my daily routine." }
  ],
  speaking_prompts: [
    "Describe your morning routine.",
    "What do you usually do after work?",
    "How long is your daily commute?"
  ]
});
