# Exam Module — Schema Reference

## Tổng quan

Bài thi gồm 3 paper làm tuần tự: **Listening → Reading & Writing → Speaking**  
Không chấm điểm, không Pass/Fail — user làm xong cả 3 thì xem lại bài với đáp án.

**Số bài test theo cấp:**
| Cấp | Số test | Ghi chú |
|-----|---------|---------|
| A2  | 1 | Cambridge Key (KET) |
| B1  | 1 | Cambridge Preliminary (PET) |
| B2  | 2 | Cambridge First (FCE) |
| C1  | 2 | Cambridge Advanced (CAE) |
| C2  | 1 | Cambridge Proficiency (CPE) |

**Thời lượng theo cấp:**
| Cấp | Listening | R&W | Speaking |
|-----|-----------|-----|---------|
| A2  | 30 phút | 60 phút | 10 phút |
| B1  | 36 phút | 90 phút | 12 phút |
| B2  | 40 phút | 90 phút | 15 phút |
| C1  | 40 phút | 90 phút | 15 phút |
| C2  | 40 phút | 90 phút | 16 phút |

---

## MySQL Tables

### `exam_test`
| Column | Type | Ghi chú |
|--------|------|---------|
| id | INT PK | |
| cefr_level | ENUM A2/B1/B2/C1/C2 | |
| test_number | TINYINT | Thứ tự trong cấp (1, 2…) |
| title | VARCHAR | "A2 Test 1" |
| is_active | TINYINT(1) | Ẩn/hiện bài thi |

### `exam_paper`
| Column | Type | Ghi chú |
|--------|------|---------|
| id | INT PK | |
| exam_test_id | FK → exam_test | |
| paper_type | ENUM LISTENING / READING_WRITING / SPEAKING | |
| duration_minutes | SMALLINT | |
| audio_url | VARCHAR | **Listening only** — 1 file duy nhất chạy xuyên suốt, không pause/rewind. R&W và Speaking để NULL. |
| order_index | TINYINT | Thứ tự làm bài |

### `exam_part`
| Column | Type | Ghi chú |
|--------|------|---------|
| id | INT PK | |
| paper_id | FK → exam_paper | |
| part_number | TINYINT | 1, 2, 3… |
| order_index | TINYINT | |

> `instruction` **không lưu ở đây** — lưu trong MongoDB tại field `instruction` của **câu đầu tiên** trong mỗi nhóm (các câu còn lại để `null`). Lý do: mỗi nhóm câu hỏi có instruction riêng và linh hoạt hơn khi quản lý cùng nội dung.

### `exam_question` ← mapping SQL ↔ MongoDB
| Column | Type | Ghi chú |
|--------|------|---------|
| id | BIGINT PK | |
| part_id | FK → exam_part | |
| mongo_doc_id | VARCHAR(50) | `_id` trong MongoDB |
| question_type | ENUM | Xem bảng dưới |
| question_number_start | SMALLINT | Số câu đầu (hiển thị UI) |
| question_number_end | SMALLINT | = start nếu 1 câu đơn |
| correct_answer | TEXT | Dùng khi show lại bài |
| order_index | SMALLINT | Thứ tự trong part |

**Định dạng `correct_answer` theo loại:**
| question_type | correct_answer |
|--------------|---------------|
| MULTIPLE_CHOICE | `"B"` |
| FILL_IN_TEXT | `"playing"` |
| FILL_IN_FORM | JSON: `{"6":"July","7":"18","8":"swim","9":"350","10":"CV"}` |
| MATCHING | JSON: `{"21":"E","22":"A","23":"G","24":"B","25":"F"}` |
| SHORT_WRITE | `NULL` (LLM đánh giá sau) |
| SPEAKING_TASK | `NULL` |

### `user_exam_attempt`
| Column | Type | Ghi chú |
|--------|------|---------|
| id | BIGINT PK | |
| user_id | FK → users | |
| exam_test_id | FK → exam_test | |
| started_at | DATETIME | |
| submitted_at | DATETIME | NULL nếu chưa nộp hết |
| status | ENUM | LISTENING_IN_PROGRESS → COMPLETED |

**Status flow:**
```
LISTENING_IN_PROGRESS
  → LISTENING_DONE
  → READING_WRITING_IN_PROGRESS
  → READING_WRITING_DONE
  → SPEAKING_IN_PROGRESS
  → COMPLETED  ← có thể xem lại bài
```

### `user_exam_answer`
| Column | Type | Ghi chú |
|--------|------|---------|
| id | BIGINT PK | |
| attempt_id | FK → user_exam_attempt | |
| exam_question_id | FK → exam_question | |
| user_answer | TEXT | Định dạng giống correct_answer |
| is_correct | TINYINT(1) | NULL cho FILL_IN_FORM, MATCHING, SHORT_WRITE, SPEAKING |

---

## MongoDB Collection: `exam_questions`

Database: `language_learning_data`

> **Quy tắc `instruction`:** Lưu trong từng question document. Câu **đầu tiên** của mỗi nhóm (part) có `instruction` = chuỗi text, các câu sau để `null`. Frontend chỉ hiển thị instruction khi giá trị khác null.

### MULTIPLE_CHOICE
```json
{
  "_id": "a2t1_l_p1_q1",
  "question_type": "MULTIPLE_CHOICE",
  "section": "LISTENING",
  "instruction": "For each question, choose the correct answer.",
  "question_number": 1,
  "text": "Where will Claire meet Alex?",
  "options": [
    { "id": "A", "text": "Art Gallery", "image_url": null },
    { "id": "B", "text": "Hair Salon",  "image_url": null },
    { "id": "C", "text": "Cafe",        "image_url": null }
  ]
}
```

### FILL_IN_FORM (Listening — cả form = 1 document)
```json
{
  "_id": "a2t1_l_p2_form",
  "question_type": "FILL_IN_FORM",
  "section": "LISTENING",
  "instruction": "For each question, write the correct answer in the gap. Write one or two words or a number or a date or a time.",
  "question_number_start": 6,
  "question_number_end": 10,
  "form_title": "Jobs for students with Sunshine Holidays",
  "form_context": "Work in: Children's summer camps",
  "blanks": [
    { "number": 6,  "label": "Dates of jobs", "prefix": "15th June – 20th", "suffix": "" },
    { "number": 7,  "label": "Staff must be", "prefix": "",                  "suffix": "years old" },
    { "number": 8,  "label": "Staff must be able to", "prefix": "",          "suffix": "" },
    { "number": 9,  "label": "Staff will earn",        "prefix": "£",        "suffix": "per week" },
    { "number": 10, "label": "Send a letter and",      "prefix": "",         "suffix": "" }
  ]
}
```

### MATCHING (Listening — 1 nhóm ghép đôi)
```json
{
  "_id": "a2t1_l_p5_match",
  "question_type": "MATCHING",
  "section": "LISTENING",
  "instruction": "For each question, choose the correct answer from the list.",
  "question_number_start": 21,
  "question_number_end": 25,
  "instruction_detail": "What will each person bring to the party?",
  "left_items":  [ { "question_number": 21, "label": "Barbara" }, ... ],
  "right_items": [ { "id": "A", "label": "bread" }, { "id": "E", "label": "fruit" }, ... ]
}
```

### FILL_IN_TEXT (R&W — 1 câu điền 1 từ)
```json
{
  "_id": "a2t1_rw_p5_q13",
  "question_type": "FILL_IN_TEXT",
  "section": "READING_WRITING",
  "instruction": "For each question, write the correct word. Use ONE word only.",
  "question_number": 13,
  "sentence": "I enjoy ___ football with my friends at the weekend."
}
```

### SHORT_WRITE
```json
{
  "_id": "a2t1_rw_p6_write",
  "question_type": "SHORT_WRITE",
  "section": "READING_WRITING",
  "instruction": "Write an email. Write 25–35 words. You must include information about all three bullet points.",
  "question_number": 18,
  "write_type": "EMAIL",
  "min_words": 25,
  "max_words": 35,
  "prompt_text": "Your English friend Sam has invited you...",
  "bullet_points": ["Say you are happy to come", "Suggest what time you will arrive", "Ask what you should bring"]
}
```

### SPEAKING_TASK
```json
{
  "_id": "a2t1_sp_p1_task1",
  "question_type": "SPEAKING_TASK",
  "section": "SPEAKING",
  "instruction": "The examiner will ask you some questions about yourself and your everyday life.",
  "question_number": 1,
  "part_title": "Part 1 — Introduction",
  "prompt": "What is your name? Where are you from?",
  "prep_time_sec": 0,
  "speak_time_sec": 60,
  "image_url": null
}
```

---

## Cách chạy seed

```bash
# 1. SQL — chạy trong MySQL Workbench / HeidiSQL / CLI
mysql -u root -p language_learning_app < exam_sql_migration.sql

# 2. MongoDB — chạy bằng mongosh
mongosh language_learning_data exam_mongo_seed.js
```

## Lưu ý khi thêm test mới (A2 Test 2, B1 Test 1…)

1. Thêm row vào `exam_test`
2. Thêm 3 rows vào `exam_paper`  
3. Thêm parts vào `exam_part`
4. Thêm documents vào MongoDB, lấy `_id` slug mới (vd: `a2t2_l_p1_q1`)
5. Insert vào `exam_question` với `mongo_doc_id` tương ứng
