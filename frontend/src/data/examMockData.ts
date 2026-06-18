// MOCKUP DATA — sẽ thay bằng API sau

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

export interface ExamTest {
  id: string;
  level: CefrLevel;
  title: string;
  description: string;
  papers: ExamPaper[];
}

export interface ExamPaper {
  type: "LISTENING" | "READING_WRITING" | "SPEAKING";
  label: string;
  durationMinutes: number;
  durationLabel: string;
}

export interface ListeningPart {
  partNumber: number;
  title: string;
  instruction: string;      // "For each question, choose the correct answer"
  questions: ListeningQuestion[];
}

export interface ListeningQuestion {
  id: number;
  text: string;              // "Where will Claire meet Alex?"
  options: ListeningOption[];
}

export interface ListeningOption {
  id: string;               // "A", "B", "C"
  imageUrl: string | null;  // URL ảnh (null → text only)
  text: string | null;      // text option nếu không có ảnh
}

// Cấp độ A2 → C2
export const EXAM_LEVELS: ExamLevel[] = [
  {
    id: "A2",
    label: "A2",
    description: "Key English Test — Trình độ sơ cấp",
    color: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    badgeColor: "bg-green-100",
    testCount: 2,
  },
  {
    id: "B1",
    label: "B1",
    description: "Preliminary English Test — Trung cấp",
    color: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    badgeColor: "bg-blue-100",
    testCount: 2,
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
    testCount: 2,
  },
];

// Danh sách bài thi theo cấp độ
const A2_PAPERS: ExamPaper[] = [
  { type: "LISTENING",       label: "Listening",            durationMinutes: 30,  durationLabel: "30 phút" },
  { type: "READING_WRITING", label: "Reading and Writing",  durationMinutes: 60,  durationLabel: "1 giờ" },
  { type: "SPEAKING",        label: "Speaking",             durationMinutes: 10,  durationLabel: "8–10 phút" },
];

const B1_PAPERS: ExamPaper[] = [
  { type: "LISTENING",       label: "Listening",            durationMinutes: 36,  durationLabel: "36 phút" },
  { type: "READING_WRITING", label: "Reading and Writing",  durationMinutes: 90,  durationLabel: "1 giờ 30 phút" },
  { type: "SPEAKING",        label: "Speaking",             durationMinutes: 12,  durationLabel: "10–12 phút" },
];

const B2_PAPERS: ExamPaper[] = [
  { type: "LISTENING",       label: "Listening",            durationMinutes: 40,  durationLabel: "40 phút" },
  { type: "READING_WRITING", label: "Reading and Writing",  durationMinutes: 90,  durationLabel: "1 giờ 30 phút" },
  { type: "SPEAKING",        label: "Speaking",             durationMinutes: 15,  durationLabel: "12–14 phút" },
];

export const EXAM_TESTS: ExamTest[] = [
  // A2
  { id: "a2-test-1", level: "A2", title: "Test 1", description: "Bài thi thực hành A2 số 1", papers: A2_PAPERS },
  { id: "a2-test-2", level: "A2", title: "Test 2", description: "Bài thi thực hành A2 số 2", papers: A2_PAPERS },
  // B1
  { id: "b1-test-1", level: "B1", title: "Test 1", description: "Bài thi thực hành B1 số 1", papers: B1_PAPERS },
  { id: "b1-test-2", level: "B1", title: "Test 2", description: "Bài thi thực hành B1 số 2", papers: B1_PAPERS },
  // B2
  { id: "b2-test-1", level: "B2", title: "Test 1", description: "Bài thi thực hành B2 số 1", papers: B2_PAPERS },
  { id: "b2-test-2", level: "B2", title: "Test 2", description: "Bài thi thực hành B2 số 2", papers: B2_PAPERS },
  // C1
  { id: "c1-test-1", level: "C1", title: "Test 1", description: "Bài thi thực hành C1 số 1", papers: B2_PAPERS },
  { id: "c1-test-2", level: "C1", title: "Test 2", description: "Bài thi thực hành C1 số 2", papers: B2_PAPERS },
  // C2
  { id: "c2-test-1", level: "C2", title: "Test 1", description: "Bài thi thực hành C2 số 1", papers: B2_PAPERS },
  { id: "c2-test-2", level: "C2", title: "Test 2", description: "Bài thi thực hành C2 số 2", papers: B2_PAPERS },
];

// Mockup Listening — A2 Test 1
export const A2_TEST1_LISTENING: ListeningPart[] = [
  {
    partNumber: 1,
    title: "Part 1",
    instruction: "For each question, choose the correct answer.",
    questions: [
      {
        id: 1,
        text: "Where will Claire meet Alex?",
        options: [
          { id: "A", imageUrl: "https://placehold.co/220x150/e8f4e8/2d6a2d?text=Art+Gallery", text: null },
          { id: "B", imageUrl: "https://placehold.co/220x150/fce4ec/b71c1c?text=Hair+Salon", text: null },
          { id: "C", imageUrl: "https://placehold.co/220x150/e3f2fd/0d47a1?text=Cafe", text: null },
        ],
      },
      {
        id: 2,
        text: "What does the man buy at the market?",
        options: [
          { id: "A", imageUrl: "https://placehold.co/220x150/fff9c4/f57f17?text=Vegetables", text: null },
          { id: "B", imageUrl: "https://placehold.co/220x150/f3e5f5/6a1b9a?text=Fruit", text: null },
          { id: "C", imageUrl: "https://placehold.co/220x150/e0f7fa/006064?text=Fish", text: null },
        ],
      },
      {
        id: 3,
        text: "How will they travel to the airport?",
        options: [
          { id: "A", imageUrl: "https://placehold.co/220x150/e8eaf6/283593?text=By+Taxi", text: null },
          { id: "B", imageUrl: "https://placehold.co/220x150/e8f5e9/1b5e20?text=By+Train", text: null },
          { id: "C", imageUrl: "https://placehold.co/220x150/fff3e0/e65100?text=By+Bus", text: null },
        ],
      },
      {
        id: 4,
        text: "Which sport does Sarah prefer?",
        options: [
          { id: "A", imageUrl: "https://placehold.co/220x150/fce4ec/880e4f?text=Swimming", text: null },
          { id: "B", imageUrl: "https://placehold.co/220x150/e8f4e8/1a237e?text=Tennis", text: null },
          { id: "C", imageUrl: "https://placehold.co/220x150/e3f2fd/b71c1c?text=Cycling", text: null },
        ],
      },
      {
        id: 5,
        text: "What time does the film start?",
        options: [
          { id: "A", imageUrl: null, text: "6:30" },
          { id: "B", imageUrl: null, text: "7:00" },
          { id: "C", imageUrl: null, text: "7:45" },
        ],
      },
    ],
  },
  {
    partNumber: 2,
    title: "Part 2",
    instruction: "For each question, write the correct answer in the gap.",
    questions: [
      { id: 6,  text: "The event starts at ___.",      options: [{ id: "A", imageUrl: null, text: "Answer" }] },
      { id: 7,  text: "Tickets cost ___ pounds.",      options: [{ id: "A", imageUrl: null, text: "Answer" }] },
      { id: 8,  text: "The venue is in ___ Street.",   options: [{ id: "A", imageUrl: null, text: "Answer" }] },
      { id: 9,  text: "Bring a ___ with you.",         options: [{ id: "A", imageUrl: null, text: "Answer" }] },
      { id: 10, text: "Contact ___ for more details.", options: [{ id: "A", imageUrl: null, text: "Answer" }] },
    ],
  },
  {
    partNumber: 3,
    title: "Part 3",
    instruction: "For each question, choose the correct answer.",
    questions: [
      {
        id: 11,
        text: "What is the main topic of the conversation?",
        options: [
          { id: "A", imageUrl: null, text: "Planning a holiday" },
          { id: "B", imageUrl: null, text: "Booking a restaurant" },
          { id: "C", imageUrl: null, text: "Finding a job" },
        ],
      },
      {
        id: 12,
        text: "What problem does the woman mention?",
        options: [
          { id: "A", imageUrl: null, text: "She lost her bag." },
          { id: "B", imageUrl: null, text: "She missed the bus." },
          { id: "C", imageUrl: null, text: "She forgot the address." },
        ],
      },
      {
        id: 13,
        text: "How does the man suggest solving the problem?",
        options: [
          { id: "A", imageUrl: null, text: "By calling a friend" },
          { id: "B", imageUrl: null, text: "By searching online" },
          { id: "C", imageUrl: null, text: "By asking a local" },
        ],
      },
      {
        id: 14,
        text: "What will they do next?",
        options: [
          { id: "A", imageUrl: null, text: "Go to the station" },
          { id: "B", imageUrl: null, text: "Find a hotel" },
          { id: "C", imageUrl: null, text: "Have lunch first" },
        ],
      },
      {
        id: 15,
        text: "What does the woman finally decide?",
        options: [
          { id: "A", imageUrl: null, text: "To stay another day" },
          { id: "B", imageUrl: null, text: "To leave immediately" },
          { id: "C", imageUrl: null, text: "To call her family" },
        ],
      },
    ],
  },
  {
    partNumber: 4,
    title: "Part 4",
    instruction: "For each question, choose the correct answer.",
    questions: [
      {
        id: 16,
        text: "What is the speaker's main message?",
        options: [
          { id: "A", imageUrl: null, text: "Save money on groceries" },
          { id: "B", imageUrl: null, text: "Eat more vegetables" },
          { id: "C", imageUrl: null, text: "Cook at home more often" },
        ],
      },
      {
        id: 17,
        text: "According to the speaker, what is the easiest change to make?",
        options: [
          { id: "A", imageUrl: null, text: "Drinking more water" },
          { id: "B", imageUrl: null, text: "Walking instead of driving" },
          { id: "C", imageUrl: null, text: "Going to bed earlier" },
        ],
      },
      {
        id: 18,
        text: "What does the speaker say about exercise?",
        options: [
          { id: "A", imageUrl: null, text: "It should be done every day." },
          { id: "B", imageUrl: null, text: "Even a short walk helps." },
          { id: "C", imageUrl: null, text: "It requires a gym membership." },
        ],
      },
      {
        id: 19,
        text: "What advice does the speaker give for motivation?",
        options: [
          { id: "A", imageUrl: null, text: "Set small, achievable goals." },
          { id: "B", imageUrl: null, text: "Find a personal trainer." },
          { id: "C", imageUrl: null, text: "Join a sports team." },
        ],
      },
      {
        id: 20,
        text: "What is the speaker's overall conclusion?",
        options: [
          { id: "A", imageUrl: null, text: "Health changes take years." },
          { id: "B", imageUrl: null, text: "Small steps lead to big results." },
          { id: "C", imageUrl: null, text: "Diet is more important than exercise." },
        ],
      },
    ],
  },
  {
    partNumber: 5,
    title: "Part 5",
    instruction: "For each question, choose the correct answer.",
    questions: [
      {
        id: 21,
        text: "Where does the conversation take place?",
        options: [
          { id: "A", imageUrl: null, text: "At a school" },
          { id: "B", imageUrl: null, text: "At a library" },
          { id: "C", imageUrl: null, text: "At a bookshop" },
        ],
      },
      {
        id: 22,
        text: "What does the boy need help with?",
        options: [
          { id: "A", imageUrl: null, text: "Finding a book" },
          { id: "B", imageUrl: null, text: "Renewing his card" },
          { id: "C", imageUrl: null, text: "Returning a magazine" },
        ],
      },
      {
        id: 23,
        text: "What does the librarian suggest?",
        options: [
          { id: "A", imageUrl: null, text: "Checking the catalogue online" },
          { id: "B", imageUrl: null, text: "Looking in a different section" },
          { id: "C", imageUrl: null, text: "Asking another member of staff" },
        ],
      },
      {
        id: 24,
        text: "What time does the library close today?",
        options: [
          { id: "A", imageUrl: null, text: "5:00 pm" },
          { id: "B", imageUrl: null, text: "6:00 pm" },
          { id: "C", imageUrl: null, text: "7:00 pm" },
        ],
      },
      {
        id: 25,
        text: "What will the boy do before he leaves?",
        options: [
          { id: "A", imageUrl: null, text: "Borrow two books" },
          { id: "B", imageUrl: null, text: "Fill in a form" },
          { id: "C", imageUrl: null, text: "Pay a fine" },
        ],
      },
    ],
  },
];

// Reading & Writing types

export type RWQuestionType =
  | "MULTIPLE_CHOICE"   // chọn A/B/C
  | "MATCHING"          // nối câu
  | "FILL_IN"           // điền vào chỗ trống (text input)
  | "SHORT_WRITE";      // viết ngắn (textarea)

export interface RWPassage {
  /** Văn bản / thông báo / biển hiệu hiển thị phía trên câu hỏi (có thể null nếu không có) */
  text: string | null;
  /** Style hiển thị passage: "notice" = khung viền đen, "normal" = văn bản thường */
  style?: "notice" | "normal";
}

export interface RWOption {
  id: string;   // "A", "B", "C"
  text: string;
}

export interface RWQuestion {
  id: number;
  type: RWQuestionType;
  passage: RWPassage | null;
  text: string;           // câu hỏi hoặc câu dẫn
  options: RWOption[];    // chỉ dùng cho MULTIPLE_CHOICE
  correctAnswer?: string; // dùng client-side để show đáp án (sẽ bỏ khi có API)
}

export interface RWPart {
  partNumber: number;
  title: string;
  instruction: string;
  questions: RWQuestion[];
}

// Mockup Reading & Writing — A2 Test 1
export const A2_TEST1_READING_WRITING: RWPart[] = [
  {
    partNumber: 1,
    title: "Part 1",
    instruction: "For each question, choose the correct answer.",
    questions: [
      {
        id: 1,
        type: "MULTIPLE_CHOICE",
        passage: {
          text: "For Sale\nWomen's bicycle (small)\n11 years old - needs new tyres\nPhone Debbie - 0794587454",
          style: "notice",
        },
        text: "What does the notice say about the bicycle?",
        options: [
          { id: "A", text: "The bicycle that's for sale was built for a child." },
          { id: "B", text: "Some parts of the bicycle must be changed." },
          { id: "C", text: "Debbie is selling the bike because she's too big for it now." },
        ],
      },
      {
        id: 2,
        type: "MULTIPLE_CHOICE",
        passage: {
          text: "COMMUNITY CENTRE\nClosed on Monday mornings for staff training.\nAll other classes continue as normal.",
          style: "notice",
        },
        text: "What is the notice about?",
        options: [
          { id: "A", text: "The centre is open every day." },
          { id: "B", text: "Classes are cancelled on Monday mornings." },
          { id: "C", text: "Staff training takes place every week." },
        ],
      },
      {
        id: 3,
        type: "MULTIPLE_CHOICE",
        passage: {
          text: "To: All students\nPlease return library books by Friday.\nFines will be charged after this date.",
          style: "notice",
        },
        text: "What must students do?",
        options: [
          { id: "A", text: "Pay money to use the library." },
          { id: "B", text: "Bring books back before the weekend." },
          { id: "C", text: "Ask permission before borrowing books." },
        ],
      },
      {
        id: 4,
        type: "MULTIPLE_CHOICE",
        passage: {
          text: "POOL NOTICE\nNo diving in the shallow end.\nChildren under 12 must be with an adult.",
          style: "notice",
        },
        text: "What does this notice say?",
        options: [
          { id: "A", text: "Young children cannot swim alone." },
          { id: "B", text: "Swimming is not allowed here." },
          { id: "C", text: "Diving is allowed in the deep end only." },
        ],
      },
      {
        id: 5,
        type: "MULTIPLE_CHOICE",
        passage: {
          text: "Fresh bread — baked today!\nBuy 2 loaves and get 1 FREE\nOffer ends Saturday",
          style: "notice",
        },
        text: "What is the special offer?",
        options: [
          { id: "A", text: "You get a discount if you buy one loaf." },
          { id: "B", text: "You pay for two loaves and receive three." },
          { id: "C", text: "The bread is free on Saturday." },
        ],
      },
    ],
  },
  {
    partNumber: 2,
    title: "Part 2",
    instruction: "For each question, choose the correct answer.",
    questions: [
      {
        id: 6,
        type: "MULTIPLE_CHOICE",
        passage: null,
        text: "Jake wants to learn to cook. He enjoys outdoor activities and has free time in the evenings. Which class is best for Jake?",
        options: [
          { id: "A", text: "Monday afternoon baking class" },
          { id: "B", text: "Tuesday evening Italian cooking class" },
          { id: "C", text: "Saturday morning yoga class" },
        ],
      },
      {
        id: 7,
        type: "MULTIPLE_CHOICE",
        passage: null,
        text: "Maria needs a class for her 8-year-old daughter who loves drawing. The class must be on a weekend.",
        options: [
          { id: "A", text: "Children's art class – Saturday 10am" },
          { id: "B", text: "Adult drawing class – Tuesday 7pm" },
          { id: "C", text: "Photography for beginners – Sunday 2pm" },
        ],
      },
    ],
  },
  {
    partNumber: 3,
    title: "Part 3",
    instruction: "For each question, choose the correct answer.",
    questions: [
      {
        id: 8,
        type: "MULTIPLE_CHOICE",
        passage: {
          text: "Anna loves sport and goes running three times a week. Last month she started swimming lessons because she wants to compete in triathlons next year. She finds swimming the most difficult part but is improving quickly.",
          style: "normal",
        },
        text: "Why did Anna start swimming lessons?",
        options: [
          { id: "A", text: "Because her doctor told her to." },
          { id: "B", text: "Because she wants to take part in a race." },
          { id: "C", text: "Because she enjoys swimming more than running." },
        ],
      },
      {
        id: 9,
        type: "MULTIPLE_CHOICE",
        passage: null,
        text: "What does Anna find hardest?",
        options: [
          { id: "A", text: "Running" },
          { id: "B", text: "Cycling" },
          { id: "C", text: "Swimming" },
        ],
      },
      {
        id: 10,
        type: "MULTIPLE_CHOICE",
        passage: null,
        text: "How often does Anna go running?",
        options: [
          { id: "A", text: "Once a week" },
          { id: "B", text: "Twice a week" },
          { id: "C", text: "Three times a week" },
        ],
      },
    ],
  },
  {
    partNumber: 4,
    title: "Part 4",
    instruction: "For each question, choose the correct answer.",
    questions: [
      {
        id: 11,
        type: "MULTIPLE_CHOICE",
        passage: {
          text: "My name is Tom. I grew up in a small town but moved to the city for university. I found it hard at first because everything was so busy and loud. Now I love it — there are so many things to do, from concerts to museums. The only thing I miss is the quiet countryside.",
          style: "normal",
        },
        text: "What does Tom like most about living in the city?",
        options: [
          { id: "A", text: "It is quiet and peaceful." },
          { id: "B", text: "There are lots of activities." },
          { id: "C", text: "It reminds him of the countryside." },
        ],
      },
      {
        id: 12,
        type: "MULTIPLE_CHOICE",
        passage: null,
        text: "How did Tom feel when he first moved to the city?",
        options: [
          { id: "A", text: "Excited and happy" },
          { id: "B", text: "Bored and lonely" },
          { id: "C", text: "Uncomfortable and overwhelmed" },
        ],
      },
    ],
  },
  {
    partNumber: 5,
    title: "Part 5",
    instruction: "For each question, write the correct word. Use ONE word only.",
    questions: [
      { id: 13, type: "FILL_IN", passage: null, text: "I enjoy ___ football with my friends at the weekend.", options: [] },
      { id: 14, type: "FILL_IN", passage: null, text: "She has lived in London ___ five years.", options: [] },
      { id: 15, type: "FILL_IN", passage: null, text: "Can you help me ___ this box? It's very heavy.", options: [] },
      { id: 16, type: "FILL_IN", passage: null, text: "He didn't study, ___ he failed the exam.", options: [] },
      { id: 17, type: "FILL_IN", passage: null, text: "What time ___ you usually wake up?", options: [] },
    ],
  },
  {
    partNumber: 6,
    title: "Part 6",
    instruction: "Write an email. Write 25–35 words. You must include information about all three bullet points.",
    questions: [
      {
        id: 18,
        type: "SHORT_WRITE",
        passage: {
          text: "Your English friend Sam has invited you to his birthday party next Saturday. Write an email to Sam:\n• Say you are happy to come\n• Suggest what time you will arrive\n• Ask what you should bring",
          style: "notice",
        },
        text: "Write your email here:",
        options: [],
      },
    ],
  },
];

// Speaking types

export interface SpeakingTask {
  id: number;
  partNumber: number;
  partTitle: string;
  instruction: string;       // hướng dẫn chung của part
  prompt: string;            // câu hỏi / chủ đề cụ thể
  prepTimeSec: number;       // thời gian chuẩn bị (giây), 0 nếu không có
  speakTimeSec: number;      // thời gian nói tối đa (giây)
  imageUrl?: string | null;  // ảnh minh họa (Part 2 thường có)
}

// Mockup Speaking — A2 Test 1
export const A2_TEST1_SPEAKING: SpeakingTask[] = [
  {
    id: 1,
    partNumber: 1,
    partTitle: "Part 1 — Introduction",
    instruction: "The examiner will ask you some questions about yourself.",
    prompt: "What is your name? Where are you from? Do you work or study?",
    prepTimeSec: 0,
    speakTimeSec: 60,
  },
  {
    id: 2,
    partNumber: 1,
    partTitle: "Part 1 — Everyday topics",
    instruction: "Answer the examiner's questions about familiar topics.",
    prompt: "Tell me about your hobbies. What do you enjoy doing in your free time?",
    prepTimeSec: 0,
    speakTimeSec: 60,
  },
  {
    id: 3,
    partNumber: 2,
    partTitle: "Part 2 — Topic discussion",
    instruction: "Look at the picture and describe what you see. Then answer the questions.",
    prompt: "What are the people doing in this picture? Where do you think they are? Do you enjoy this activity?",
    prepTimeSec: 30,
    speakTimeSec: 90,
    imageUrl: "https://placehold.co/500x300/e8f4e8/2d6a2d?text=People+at+a+market",
  },
  {
    id: 4,
    partNumber: 3,
    partTitle: "Part 3 — Extended discussion",
    instruction: "Discuss the topic with the examiner.",
    prompt: "Let's talk about shopping. Do you prefer shopping online or in stores? Why?",
    prepTimeSec: 0,
    speakTimeSec: 120,
  },
];
