// ============================================================
// EXAM MODULE — MongoDB Seed Data
// Database: language_learning_data
// Collection: exam_questions
//
// Chạy bằng: mongosh language_learning_data exam_mongo_seed.js
//
// Quy ước _id: dùng string slug (khớp với mongo_doc_id trong MySQL)
//
// AUDIO: Listening paper có 1 file audio DUY NHẤT chạy xuyên suốt
//        toàn bộ paper (không pause/rewind). audio_url lưu ở bảng
//        exam_paper (MySQL), KHÔNG lưu ở từng question document.
//
// question_type map:
//   MULTIPLE_CHOICE  → options[]{id, text, image_url}
//   FILL_IN_FORM     → form_title, form_context, blanks[]{number, label, prefix, suffix}
//   MATCHING         → instruction_detail, left_items[]{id,label}, right_items[]{id,label}
//   FILL_IN_TEXT     → sentence (chuỗi có "___" đánh dấu chỗ trống)
//   SHORT_WRITE      → prompt_text, bullet_points[], min_words
//   SPEAKING_TASK    → prompt, prep_time_sec, speak_time_sec, image_url
// ============================================================

db = db.getSiblingDB("language_learning_data");

// Xóa seed cũ nếu có (idempotent)
db.exam_questions.deleteMany({
  _id: { $in: [
    "a2t1_l_p1_q1","a2t1_l_p1_q2","a2t1_l_p1_q3","a2t1_l_p1_q4","a2t1_l_p1_q5",
    "a2t1_l_p2_form",
    "a2t1_l_p3_q11","a2t1_l_p3_q12","a2t1_l_p3_q13","a2t1_l_p3_q14","a2t1_l_p3_q15",
    "a2t1_l_p4_q16","a2t1_l_p4_q17","a2t1_l_p4_q18","a2t1_l_p4_q19","a2t1_l_p4_q20",
    "a2t1_l_p5_match",
    "a2t1_rw_p1_q1","a2t1_rw_p1_q2","a2t1_rw_p1_q3","a2t1_rw_p1_q4","a2t1_rw_p1_q5",
    "a2t1_rw_p2_q6","a2t1_rw_p2_q7",
    "a2t1_rw_p3_q8","a2t1_rw_p3_q9","a2t1_rw_p3_q10",
    "a2t1_rw_p4_q11","a2t1_rw_p4_q12",
    "a2t1_rw_p5_q13","a2t1_rw_p5_q14","a2t1_rw_p5_q15","a2t1_rw_p5_q16","a2t1_rw_p5_q17",
    "a2t1_rw_p6_write","a2t1_rw_p7_write",
    "a2t1_sp_p1_task1","a2t1_sp_p1_task2","a2t1_sp_p2_task1","a2t1_sp_p3_task1"
  ]}
});

// ============================================================
// LISTENING — Part 1: MULTIPLE_CHOICE (câu 1-5, có ảnh hoặc text)
// Toàn bộ Listening dùng chung 1 audio file ở exam_paper, không lưu ở đây
// instruction lưu ở câu đầu tiên của mỗi nhóm, các câu sau để null
// ============================================================
db.exam_questions.insertMany([
  {
    _id: "a2t1_l_p1_q1",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: "For each question, choose the correct answer.",
    question_number: 1,
    text: "Where will Claire meet Alex?",
    options: [
      { id: "A", text: "Art Gallery", image_url: null },
      { id: "B", text: "Hair Salon",  image_url: null },
      { id: "C", text: "Cafe",        image_url: null }
    ]
  },
  {
    _id: "a2t1_l_p1_q2",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: null,
    question_number: 2,
    text: "What does the man buy at the market?",
    options: [
      { id: "A", text: "Vegetables", image_url: null },
      { id: "B", text: "Fruit",      image_url: null },
      { id: "C", text: "Fish",       image_url: null }
    ]
  },
  {
    _id: "a2t1_l_p1_q3",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: null,
    question_number: 3,
    text: "How will they travel to the airport?",
    options: [
      { id: "A", text: "By Taxi",  image_url: null },
      { id: "B", text: "By Train", image_url: null },
      { id: "C", text: "By Bus",   image_url: null }
    ]
  },
  {
    _id: "a2t1_l_p1_q4",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: null,
    question_number: 4,
    text: "Which sport does Sarah prefer?",
    options: [
      { id: "A", text: "Swimming", image_url: null },
      { id: "B", text: "Tennis",   image_url: null },
      { id: "C", text: "Cycling",  image_url: null }
    ]
  },
  {
    _id: "a2t1_l_p1_q5",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: null,
    question_number: 5,
    text: "What time does the film start?",
    options: [
      { id: "A", text: "6:30" },
      { id: "B", text: "7:00" },
      { id: "C", text: "7:45" }
    ]
  }
]);

// ============================================================
// LISTENING — Part 2: FILL_IN_FORM (câu 6-10, cả form = 1 doc)
// Dạng: nghe và điền vào form/note
// ============================================================
db.exam_questions.insertOne({
  _id: "a2t1_l_p2_form",
  question_type: "FILL_IN_FORM",
  section: "LISTENING",
  instruction: "For each question, write the correct answer in the gap. Write one or two words or a number or a date or a time.",
  question_number_start: 6,
  question_number_end: 10,
  // Tiêu đề / context của form hiển thị trên UI
  form_title: "Jobs for students with Sunshine Holidays",
  form_context: "Work in: Children's summer camps",
  // Mỗi blank = 1 ô điền, có prefix/suffix để render đúng layout
  blanks: [
    { number: 6,  label: "Dates of jobs", prefix: "15th June \u2013 20th", suffix: ""          },
    { number: 7,  label: "Staff must be", prefix: "",                       suffix: "years old"  },
    { number: 8,  label: "Staff must be able to", prefix: "",               suffix: ""           },
    { number: 9,  label: "Staff will earn",        prefix: "\u00a3",        suffix: "per week"   },
    { number: 10, label: "Send a letter and",      prefix: "",              suffix: ""           }
  ]
});

// ============================================================
// LISTENING — Part 3: MULTIPLE_CHOICE (câu 11-15)
// Audio: 1 đoạn hội thoại dài, 5 câu hỏi
// ============================================================
db.exam_questions.insertMany([
  {
    _id: "a2t1_l_p3_q11",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: "For each question, choose the correct answer.",
    question_number: 11,
    text: "What is the main topic of the conversation?",
    options: [
      { id: "A", text: "Planning a holiday"    },
      { id: "B", text: "Booking a restaurant"  },
      { id: "C", text: "Finding a job"         }
    ]
  },
  {
    _id: "a2t1_l_p3_q12",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: null,
    question_number: 12,
    text: "What problem does the woman mention?",
    options: [
      { id: "A", text: "She lost her bag."         },
      { id: "B", text: "She missed the bus."       },
      { id: "C", text: "She forgot the address."   }
    ]
  },
  {
    _id: "a2t1_l_p3_q13",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: null,
    question_number: 13,
    text: "How does the man suggest solving the problem?",
    options: [
      { id: "A", text: "By calling a friend"  },
      { id: "B", text: "By searching online"  },
      { id: "C", text: "By asking a local"    }
    ]
  },
  {
    _id: "a2t1_l_p3_q14",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: null,
    question_number: 14,
    text: "What will they do next?",
    options: [
      { id: "A", text: "Go to the station" },
      { id: "B", text: "Find a hotel"      },
      { id: "C", text: "Have lunch first"  }
    ]
  },
  {
    _id: "a2t1_l_p3_q15",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: null,
    question_number: 15,
    text: "What does the woman finally decide?",
    options: [
      { id: "A", text: "To stay another day"  },
      { id: "B", text: "To leave immediately" },
      { id: "C", text: "To call her family"   }
    ]
  }
]);

// ============================================================
// LISTENING — Part 4: MULTIPLE_CHOICE (câu 16-20)
// Audio: 1 monologue (bài nói 1 người)
// ============================================================
db.exam_questions.insertMany([
  {
    _id: "a2t1_l_p4_q16",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: "For each question, choose the correct answer.",
    question_number: 16,
    text: "What is the speaker's main message?",
    options: [
      { id: "A", text: "Save money on groceries"   },
      { id: "B", text: "Eat more vegetables"        },
      { id: "C", text: "Cook at home more often"   }
    ]
  },
  {
    _id: "a2t1_l_p4_q17",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: null,
    question_number: 17,
    text: "According to the speaker, what is the easiest change to make?",
    options: [
      { id: "A", text: "Drinking more water"         },
      { id: "B", text: "Walking instead of driving"  },
      { id: "C", text: "Going to bed earlier"        }
    ]
  },
  {
    _id: "a2t1_l_p4_q18",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: null,
    question_number: 18,
    text: "What does the speaker say about exercise?",
    options: [
      { id: "A", text: "It should be done every day."   },
      { id: "B", text: "Even a short walk helps."       },
      { id: "C", text: "It requires a gym membership."  }
    ]
  },
  {
    _id: "a2t1_l_p4_q19",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: null,
    question_number: 19,
    text: "What advice does the speaker give for motivation?",
    options: [
      { id: "A", text: "Set small, achievable goals." },
      { id: "B", text: "Find a personal trainer."     },
      { id: "C", text: "Join a sports team."          }
    ]
  },
  {
    _id: "a2t1_l_p4_q20",
    question_type: "MULTIPLE_CHOICE",
    section: "LISTENING",
    instruction: null,
    question_number: 20,
    text: "What is the speaker's overall conclusion?",
    options: [
      { id: "A", text: "Health changes take years."             },
      { id: "B", text: "Small steps lead to big results."       },
      { id: "C", text: "Diet is more important than exercise."  }
    ]
  }
]);

// ============================================================
// LISTENING — Part 5: MATCHING (câu 21-25, 1 doc nhóm)
// "5 người → chọn 1 món ăn từ 7 lựa chọn"
// ============================================================
db.exam_questions.insertOne({
  _id: "a2t1_l_p5_match",
  question_type: "MATCHING",
  section: "LISTENING",
  instruction: "For each question, choose the correct answer from the list.",
  question_number_start: 21,
  question_number_end: 25,
  instruction_detail: "You will hear Simon talking to Maria about a party. What will each person bring to the party? For each question, choose the correct answer.",
  // Left = người (mỗi người = 1 câu số)
  left_items: [
    { question_number: 21, label: "Barbara" },
    { question_number: 22, label: "Simon"   },
    { question_number: 23, label: "Anita"   },
    { question_number: 24, label: "Peter"   },
    { question_number: 25, label: "Michael" }
  ],
  // Right = các lựa chọn (nhiều hơn left để tăng độ khó)
  right_items: [
    { id: "A", label: "bread"     },
    { id: "B", label: "cheese"    },
    { id: "C", label: "chicken"   },
    { id: "D", label: "fish"      },
    { id: "E", label: "fruit"     },
    { id: "F", label: "ice cream" },
    { id: "G", label: "salad"     }
  ]
});

// ============================================================
// READING & WRITING — Part 1: MULTIPLE_CHOICE (câu 1-5)
// Dạng: đọc thông báo/biển hiệu (notice) → chọn đúng nghĩa
// ============================================================
db.exam_questions.insertMany([
  {
    _id: "a2t1_rw_p1_q1",
    question_type: "MULTIPLE_CHOICE",
    section: "READING_WRITING",
    instruction: "For each question, choose the correct answer.",
    question_number: 1,
    passage: {
      text: "For Sale\nWomen's bicycle (small)\n11 years old - needs new tyres\nPhone Debbie - 0794587454",
      style: "notice"
    },
    text: "What does the notice say about the bicycle?",
    options: [
      { id: "A", text: "The bicycle that's for sale was built for a child." },
      { id: "B", text: "Some parts of the bicycle must be changed."          },
      { id: "C", text: "Debbie is selling the bike because she's too big for it now." }
    ]
  },
  {
    _id: "a2t1_rw_p1_q2",
    question_type: "MULTIPLE_CHOICE",
    section: "READING_WRITING",
    instruction: null,
    question_number: 2,
    passage: {
      text: "COMMUNITY CENTRE\nClosed on Monday mornings for staff training.\nAll other classes continue as normal.",
      style: "notice"
    },
    text: "What is the notice about?",
    options: [
      { id: "A", text: "The centre is open every day."                  },
      { id: "B", text: "Classes are cancelled on Monday mornings."      },
      { id: "C", text: "Staff training takes place every week."         }
    ]
  },
  {
    _id: "a2t1_rw_p1_q3",
    question_type: "MULTIPLE_CHOICE",
    section: "READING_WRITING",
    instruction: null,
    question_number: 3,
    passage: {
      text: "To: All students\nPlease return library books by Friday.\nFines will be charged after this date.",
      style: "notice"
    },
    text: "What must students do?",
    options: [
      { id: "A", text: "Pay money to use the library."                   },
      { id: "B", text: "Bring books back before the weekend."            },
      { id: "C", text: "Ask permission before borrowing books."          }
    ]
  },
  {
    _id: "a2t1_rw_p1_q4",
    question_type: "MULTIPLE_CHOICE",
    section: "READING_WRITING",
    instruction: null,
    question_number: 4,
    passage: {
      text: "POOL NOTICE\nNo diving in the shallow end.\nChildren under 12 must be with an adult.",
      style: "notice"
    },
    text: "What does this notice say?",
    options: [
      { id: "A", text: "Young children cannot swim alone."         },
      { id: "B", text: "Swimming is not allowed here."             },
      { id: "C", text: "Diving is allowed in the deep end only."  }
    ]
  },
  {
    _id: "a2t1_rw_p1_q5",
    question_type: "MULTIPLE_CHOICE",
    section: "READING_WRITING",
    instruction: null,
    question_number: 5,
    passage: {
      text: "Fresh bread \u2014 baked today!\nBuy 2 loaves and get 1 FREE\nOffer ends Saturday",
      style: "notice"
    },
    text: "What is the special offer?",
    options: [
      { id: "A", text: "You get a discount if you buy one loaf."      },
      { id: "B", text: "You pay for two loaves and receive three."     },
      { id: "C", text: "The bread is free on Saturday."                }
    ]
  }
]);

// ============================================================
// R&W — Part 2: MULTIPLE_CHOICE (câu 6-7)
// Dạng: đọc mô tả người → chọn lớp học phù hợp
// ============================================================
db.exam_questions.insertMany([
  {
    _id: "a2t1_rw_p2_q6",
    question_type: "MULTIPLE_CHOICE",
    section: "READING_WRITING",
    instruction: "For each question, choose the correct answer.",
    question_number: 6,
    passage: null,
    text: "Jake wants to learn to cook. He enjoys outdoor activities and has free time in the evenings. Which class is best for Jake?",
    options: [
      { id: "A", text: "Monday afternoon baking class"           },
      { id: "B", text: "Tuesday evening Italian cooking class"   },
      { id: "C", text: "Saturday morning yoga class"             }
    ]
  },
  {
    _id: "a2t1_rw_p2_q7",
    question_type: "MULTIPLE_CHOICE",
    section: "READING_WRITING",
    instruction: null,
    question_number: 7,
    passage: null,
    text: "Maria needs a class for her 8-year-old daughter who loves drawing. The class must be on a weekend.",
    options: [
      { id: "A", text: "Children's art class \u2013 Saturday 10am"    },
      { id: "B", text: "Adult drawing class \u2013 Tuesday 7pm"       },
      { id: "C", text: "Photography for beginners \u2013 Sunday 2pm"  }
    ]
  }
]);

// ============================================================
// R&W — Part 3: MULTIPLE_CHOICE (câu 8-10)
// Dạng: đọc đoạn văn ngắn → trả lời câu hỏi
// Passage dùng chung cho cả 3 câu (chỉ lưu ở câu đầu)
// ============================================================
db.exam_questions.insertMany([
  {
    _id: "a2t1_rw_p3_q8",
    question_type: "MULTIPLE_CHOICE",
    section: "READING_WRITING",
    instruction: "For each question, choose the correct answer.",
    question_number: 8,
    // passage chỉ lưu ở câu đầu của nhóm, các câu sau passage = null
    passage: {
      text: "Anna loves sport and goes running three times a week. Last month she started swimming lessons because she wants to compete in triathlons next year. She finds swimming the most difficult part but is improving quickly.",
      style: "normal"
    },
    text: "Why did Anna start swimming lessons?",
    options: [
      { id: "A", text: "Because her doctor told her to."                        },
      { id: "B", text: "Because she wants to take part in a race."              },
      { id: "C", text: "Because she enjoys swimming more than running."         }
    ]
  },
  {
    _id: "a2t1_rw_p3_q9",
    question_type: "MULTIPLE_CHOICE",
    section: "READING_WRITING",
    instruction: null,
    question_number: 9,
    passage: null,
    text: "What does Anna find hardest?",
    options: [
      { id: "A", text: "Running"  },
      { id: "B", text: "Cycling"  },
      { id: "C", text: "Swimming" }
    ]
  },
  {
    _id: "a2t1_rw_p3_q10",
    question_type: "MULTIPLE_CHOICE",
    section: "READING_WRITING",
    instruction: null,
    question_number: 10,
    passage: null,
    text: "How often does Anna go running?",
    options: [
      { id: "A", text: "Once a week"        },
      { id: "B", text: "Twice a week"       },
      { id: "C", text: "Three times a week" }
    ]
  }
]);

// ============================================================
// R&W — Part 4: MULTIPLE_CHOICE (câu 11-12)
// Dạng: đọc đoạn văn dài hơn → trả lời
// ============================================================
db.exam_questions.insertMany([
  {
    _id: "a2t1_rw_p4_q11",
    question_type: "MULTIPLE_CHOICE",
    section: "READING_WRITING",
    instruction: "For each question, choose the correct answer.",
    question_number: 11,
    passage: {
      text: "My name is Tom. I grew up in a small town but moved to the city for university. I found it hard at first because everything was so busy and loud. Now I love it \u2014 there are so many things to do, from concerts to museums. The only thing I miss is the quiet countryside.",
      style: "normal"
    },
    text: "What does Tom like most about living in the city?",
    options: [
      { id: "A", text: "It is quiet and peaceful."          },
      { id: "B", text: "There are lots of activities."      },
      { id: "C", text: "It reminds him of the countryside." }
    ]
  },
  {
    _id: "a2t1_rw_p4_q12",
    question_type: "MULTIPLE_CHOICE",
    section: "READING_WRITING",
    instruction: null,
    question_number: 12,
    passage: null,
    text: "How did Tom feel when he first moved to the city?",
    options: [
      { id: "A", text: "Excited and happy"              },
      { id: "B", text: "Bored and lonely"               },
      { id: "C", text: "Uncomfortable and overwhelmed"  }
    ]
  }
]);

// ============================================================
// R&W — Part 5: FILL_IN_TEXT (câu 13-17)
// Dạng: điền 1 từ vào chỗ trống trong câu
// "___" đánh dấu vị trí blank trong sentence
// ============================================================
db.exam_questions.insertMany([
  {
    _id: "a2t1_rw_p5_q13",
    question_type: "FILL_IN_TEXT",
    section: "READING_WRITING",
    instruction: "For each question, write the correct word. Use ONE word only.",
    question_number: 13,
    sentence: "I enjoy ___ football with my friends at the weekend."
  },
  {
    _id: "a2t1_rw_p5_q14",
    question_type: "FILL_IN_TEXT",
    section: "READING_WRITING",
    instruction: null,
    question_number: 14,
    sentence: "She has lived in London ___ five years."
  },
  {
    _id: "a2t1_rw_p5_q15",
    question_type: "FILL_IN_TEXT",
    section: "READING_WRITING",
    instruction: null,
    question_number: 15,
    sentence: "Can you help me ___ this box? It's very heavy."
  },
  {
    _id: "a2t1_rw_p5_q16",
    question_type: "FILL_IN_TEXT",
    section: "READING_WRITING",
    instruction: null,
    question_number: 16,
    sentence: "He didn't study, ___ he failed the exam."
  },
  {
    _id: "a2t1_rw_p5_q17",
    question_type: "FILL_IN_TEXT",
    section: "READING_WRITING",
    instruction: null,
    question_number: 17,
    sentence: "What time ___ you usually wake up?"
  }
]);

// ============================================================
// R&W — Part 6: SHORT_WRITE — Email (câu 18)
// ============================================================
db.exam_questions.insertOne({
  _id: "a2t1_rw_p6_write",
  question_type: "SHORT_WRITE",
  section: "READING_WRITING",
  instruction: "Write an email. Write 25–35 words. You must include information about all three bullet points.",
  question_number: 18,
  write_type: "EMAIL",
  min_words: 25,
  max_words: 35,
  prompt_text: "Your English friend Sam has invited you to his birthday party next Saturday.\nWrite an email to Sam:",
  bullet_points: [
    "Say you are happy to come",
    "Suggest what time you will arrive",
    "Ask what you should bring"
  ]
});

// ============================================================
// R&W — Part 7: SHORT_WRITE — Story with images (câu 19)
// ============================================================
db.exam_questions.insertOne({
  _id: "a2t1_rw_p7_write",
  question_type: "SHORT_WRITE",
  section: "READING_WRITING",
  instruction: "Look at the three pictures. Write the story shown in the pictures. Write 35 words or more.",
  question_number: 19,
  write_type: "STORY",
  min_words: 35,
  max_words: null,
  prompt_text: "Look at the three pictures. Write the story shown in the pictures.",
  bullet_points: [],
  // URLs ảnh minh hoạ (3 ảnh kể chuyện liên tiếp)
  story_images: [
    { order: 1, image_url: null, alt: "A man waking up and looking shocked"          },
    { order: 2, image_url: null, alt: "A man looking in an empty fridge"             },
    { order: 3, image_url: null, alt: "A man and a woman sitting at a cafe table"    }
  ]
});

// ============================================================
// SPEAKING — Part 1-3 (câu 1-4)
// ============================================================
db.exam_questions.insertMany([
  {
    _id: "a2t1_sp_p1_task1",
    question_type: "SPEAKING_TASK",
    section: "SPEAKING",
    instruction: "The examiner will ask you some questions about yourself and your everyday life.",
    question_number: 1,
    part_title: "Part 1 \u2014 Introduction",
    prompt: "What is your name? Where are you from? Do you work or study?",
    prep_time_sec: 0,
    speak_time_sec: 60,
    image_url: null
  },
  {
    _id: "a2t1_sp_p1_task2",
    question_type: "SPEAKING_TASK",
    section: "SPEAKING",
    instruction: null,
    question_number: 2,
    part_title: "Part 1 \u2014 Everyday topics",
    prompt: "Tell me about your hobbies. What do you enjoy doing in your free time?",
    prep_time_sec: 0,
    speak_time_sec: 60,
    image_url: null
  },
  {
    _id: "a2t1_sp_p2_task1",
    question_type: "SPEAKING_TASK",
    section: "SPEAKING",
    instruction: "Look at the picture and describe what you see. Then answer the questions.",
    question_number: 3,
    part_title: "Part 2 \u2014 Topic discussion",
    prompt: "What are the people doing in this picture? Where do you think they are? Do you enjoy this activity?",
    prep_time_sec: 30,
    speak_time_sec: 90,
    image_url: null
  },
  {
    _id: "a2t1_sp_p3_task1",
    question_type: "SPEAKING_TASK",
    section: "SPEAKING",
    instruction: "Discuss the topic with the examiner.",
    question_number: 4,
    part_title: "Part 3 \u2014 Extended discussion",
    prompt: "Let's talk about shopping. Do you prefer shopping online or in stores? Why?",
    prep_time_sec: 0,
    speak_time_sec: 120,
    image_url: null
  }
]);

// ============================================================
// Index để query nhanh
// ============================================================
db.exam_questions.createIndex({ "question_type": 1 });
db.exam_questions.createIndex({ "section": 1 });

print("=== exam_mongo_seed.js: A2 Test 1 inserted successfully ===");
print("Total documents: " + db.exam_questions.countDocuments());
