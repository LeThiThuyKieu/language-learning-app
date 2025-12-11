# 📚 Giải thích MongoDB Collections và Mối quan hệ với MySQL

## 🔗 Kiến trúc: MySQL + MongoDB

### **MySQL** (Relational Database):

- Lưu **metadata** và **quan hệ** giữa các entity
- Lưu **tiến độ học tập** của người dùng
- Dữ liệu có cấu trúc rõ ràng, cần ACID transactions

### **MongoDB** (Document Database):

- Lưu **nội dung học tập** (rich content, không cấu trúc cố định)
- Lưu **bài học, câu hỏi, bài tập** với format linh hoạt
- Dễ mở rộng, lưu được JSON phức tạp

### **Mối liên kết:**

- MongoDB dùng **ID từ MySQL** để reference (ví dụ: `skillNodeId`, `levelId`)
- MySQL lưu metadata → MongoDB lưu nội dung chi tiết

---

## 🎯 Cấu trúc Level và CEFR Mapping

### **Level Mapping với CEFR:**

- **Level 1 (Beginner)** → A1, A2
- **Level 2 (Intermediate)** → B1, B2
- **Level 3 (Advanced)** → C1, C2

### **Mapping BEGINNER/INTERMEDIATE/ADVANCED với CEFR:**

| Placement Group (Giao diện) | CEFR Levels (Chuẩn) | Level ID |
| --------------------------- | ------------------- | -------- |
| BEGINNER                    | A1, A2              | 1        |
| INTERMEDIATE                | B1, B2              | 2        |
| ADVANCED                    | C1, C2              | 3        |

**Lý do mapping:**

- **Giao diện**: Dùng BEGINNER/INTERMEDIATE/ADVANCED (user-friendly)
- **Data source**: Phải có CEFR level (A1, A2, B1, B2, C1, C2) để đảm bảo theo chuẩn quốc tế
- **ETL Process**: Khi import data từ nguồn (ví dụ: kangle), chọn dataset có cột CEFR và map:
  - BEGINNER → Import câu hỏi có CEFR = A1, A2
  - INTERMEDIATE → Import câu hỏi có CEFR = B1, B2
  - ADVANCED → Import câu hỏi có CEFR = C1, C2

### **Cấu trúc Skill Tree và Skill Node:**

- **Skill Tree = Topic (Chủ đề)**: Mỗi skill tree là một chủ đề học tập

  - Level 1: 5 skill trees (topics) - ID: 1-5
  - Level 2: 10 skill trees (topics) - ID: 6-15
  - Level 3: 10+ skill trees (topics) - ID: 16+ (mở rộng)

- **Skill Node = Loại bài tập**: Mỗi skill tree có 5 nodes cố định:

  1. **VOCAB** - Từ vựng
  2. **LISTENING** - Nghe
  3. **SPEAKING** - Nói
  4. **MATCHING** - Nối
  5. **REVIEW** - Ôn tập

- **Câu hỏi trong mỗi Node**: Mỗi node random **10 câu hỏi** từ pool của level đó
  - Ví dụ: Node VOCAB của Skill Tree "Daily Activities" (Level 1) → Random 10 câu hỏi A1/A2 loại VOCAB

---

## 📋 Chi tiết từng Collection

### 1. **`vocabularies`** - Từ vựng

**Mục đích:** Lưu từ vựng với thông tin chi tiết (phát âm, ví dụ, hình ảnh, audio)

**Liên kết MySQL:**

- `levelId` → `levels.id`
- `skillTreeId` → `skill_tree.id`
- `skillNodeId` → `skill_node.id`

**Ví dụ Document:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "word": "hello",
  "pronunciation": "/həˈloʊ/",
  "meaning": "Xin chào",
  "exampleSentence": "Hello, how are you?",
  "exampleTranslation": "Xin chào, bạn khỏe không?",
  "partOfSpeech": "interjection",
  "synonyms": ["hi", "greetings"],
  "antonyms": ["goodbye"],
  "audioUrl": "https://cdn.example.com/audio/hello.mp3",
  "imageUrl": "https://cdn.example.com/images/hello.jpg",
  "levelId": 1,
  "skillTreeId": 5,
  "skillNodeId": 12,
  "tags": ["basic", "greeting", "beginner"]
}
```

---

### 2. **`lessons`** - Bài học

**Mục đích:** Lưu nội dung bài học (có thể là markdown, HTML, hoặc JSON)

**Liên kết MySQL:**

- `levelId` → `levels.id`
- `skillTreeId` → `skill_tree.id`
- `skillNodeId` → `skill_node.id`

**Ví dụ Document:**

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "Present Simple Tense",
  "description": "Học cách sử dụng thì hiện tại đơn",
  "content": "# Present Simple\n\n## Cấu trúc\n- I/You/We/They + V\n- He/She/It + V(s/es)\n\n## Ví dụ\n- I **go** to school every day.\n- She **goes** to work by bus.",
  "levelId": 2,
  "skillTreeId": 8,
  "skillNodeId": 25,
  "tags": ["grammar", "present-tense"],
  "estimatedDuration": 15,
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-20T14:20:00"
}
```

---

### 3. **`questions`** - Câu hỏi

**Mục đích:** Lưu câu hỏi cho các bài test, quiz, placement test. Mỗi node sẽ random 10 câu hỏi từ pool của level đó.

**Liên kết MySQL:**

- `levelId` → `levels.id`
- `skillTreeId` → `skill_tree.id` (Topic)
- `skillNodeId` → `skill_node.id` (Loại bài: VOCAB, LISTENING, SPEAKING, MATCHING, REVIEW)

**Lưu ý quan trọng:**

- **`cefrLevel`**: Lưu CEFR level chuẩn (A1, A2, B1, B2, C1, C2) - **BẮT BUỘC** để đảm bảo câu hỏi theo chuẩn CEFR
- **`placementGroup`**: Lưu level hiển thị cho giao diện (BEGINNER, INTERMEDIATE, ADVANCED)
- **`points`**: Điểm số cho câu hỏi khi trả lời đúng. **Mặc định: 10 points** cho tất cả câu hỏi (có thể điều chỉnh nếu cần)
- **`tags`**: Nhãn/từ khóa để phân loại và tìm kiếm câu hỏi (ví dụ: ["vocabulary", "greeting", "beginner"]). Dùng để filter và search
- **Mapping khi lấy data:**
  - BEGINNER → Lấy câu hỏi có `cefrLevel: "A1"` hoặc `"A2"`
  - INTERMEDIATE → Lấy câu hỏi có `cefrLevel: "B1"` hoặc `"B2"`
  - ADVANCED → Lấy câu hỏi có `cefrLevel: "C1"` hoặc `"C2"`
- **ETL Process**: Khi import data từ nguồn (ví dụ: kangle), chọn dataset có cột CEFR và map:
  - Level 1 (BEGINNER) → Import câu hỏi có CEFR = A1, A2
  - Level 2 (INTERMEDIATE) → Import câu hỏi có CEFR = B1, B2
  - Level 3 (ADVANCED) → Import câu hỏi có CEFR = C1, C2

**Ví dụ Document (Multiple Choice - Level 1):**

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "questionText": "What is 'hello' in Vietnamese?",
  "questionType": "MULTIPLE_CHOICE",
  "options": ["Xin chào", "Tạm biệt", "Cảm ơn", "Xin lỗi"],
  "correctAnswers": ["Xin chào"],
  "explanation": "'Hello' means 'Xin chào' in Vietnamese.",
  "points": 10,
  "cefrLevel": "A1",
  "levelId": 1,
  "skillTreeId": 1,
  "skillNodeId": 1,
  "placementGroup": "BEGINNER",
  "tags": ["vocabulary", "greeting", "beginner", "A1"]
}
```

**Ví dụ Document (Fill Blank - Level 1):**

```json
{
  "_id": "507f1f77bcf86cd799439014",
  "questionText": "I ___ to school every day.",
  "questionType": "FILL_BLANK",
  "options": [],
  "correctAnswers": ["go"],
  "explanation": "Use present simple 'go' for daily routines.",
  "points": 10,
  "cefrLevel": "A2",
  "levelId": 1,
  "skillTreeId": 1,
  "skillNodeId": 1,
  "tags": ["grammar", "present-simple", "A2"]
}
```

---

### 4. **`skill_trees`** - Cây kỹ năng (MongoDB version)

**Mục đích:** Lưu thông tin chi tiết về skill tree (Topic/Chủ đề), bao gồm danh sách nodes

**Lưu ý:**

- **Skill Tree = Topic (Chủ đề)**: Mỗi skill tree là một chủ đề học tập
- Level 1: Skill Tree ID 1-5 (5 topics)
- Level 2: Skill Tree ID 6-15 (10 topics)
- Level 3: Skill Tree ID 16+ (10+ topics, mở rộng)

**Liên kết MySQL:**

- `skillTreeId` → `skill_tree.id` (MySQL)
- `levelId` → `levels.id` (MySQL)
- `nodeIds` → Danh sách `skill_node.id` (MySQL) - 5 nodes: VOCAB, LISTENING, SPEAKING, MATCHING, REVIEW

**Ví dụ Document (Level 1 - Topic "Daily Activities"):**

```json
{
  "_id": "507f1f77bcf86cd799439015",
  "skillTreeId": 1,
  "levelId": 1,
  "title": "Daily Activities",
  "description": "Học từ vựng và ngữ pháp về các hoạt động hàng ngày",
  "orderIndex": 1,
  "nodeIds": [1, 2, 3, 4, 5],
  "tags": ["daily-activities", "beginner", "A1-A2"]
}
```

---

### 5. **`skill_nodes`** - Node kỹ năng (MongoDB version)

**Mục đích:** Lưu thông tin chi tiết về node (Loại bài tập), bao gồm tất cả tài nguyên liên quan

**Lưu ý:**

- **Skill Node = Loại bài tập**: Mỗi skill tree có 5 nodes cố định:

  1. **VOCAB** - Từ vựng
  2. **LISTENING** - Nghe
  3. **SPEAKING** - Nói
  4. **MATCHING** - Nối
  5. **REVIEW** - Ôn tập

- **Vì sao vẫn có các collection `listening_exercises`, `speaking_exercises`, `matching_exercises` dù đã có `nodeType`?**

  - `nodeType` trong `skill_nodes` chỉ là metadata để biết node này là loại nào.
  - Nội dung chi tiết của từng loại bài tập được lưu ở **collection riêng** cho đúng cấu trúc dữ liệu từng loại:
    - `listening_exercises`: audioUrl, transcript, questionIds…
    - `speaking_exercises`: prompt, sampleAnswer, audio mẫu, keywords…
    - `matching_exercises`: leftItems, rightItems, correctPairs…
  - `skill_nodes.exerciseIds` (tùy chọn) trỏ tới các document ở các collection exercise này. Nếu bạn không dùng exercise riêng, có thể bỏ `exerciseIds` và chỉ dùng `questionIds`.
  - Lý do tách riêng: giữ `skill_nodes` nhẹ (metadata), còn nội dung rich/khác nhau theo loại bài thì lưu đúng cấu trúc riêng của từng exercise.

- **Câu hỏi**: Mỗi node random **10 câu hỏi** từ pool của level đó (A1/A2 cho Level 1, B1/B2 cho Level 2, C1/C2 cho Level 3)

**Liên kết MySQL và MongoDB:**

### **ID từ MySQL (Reference IDs):**

- **`skillNodeId`** → `skill_node.id` (MySQL)

  - **Mục đích**: Liên kết với bảng `skill_node` trong MySQL để lấy metadata (title, node_type, order_index)
  - **Ví dụ**: `skillNodeId: 1` → Tương ứng với `skill_node.id = 1` trong MySQL
  - **Dùng để**: Lưu tiến độ học tập của user trong MySQL (`user_node_progress`)

- **`skillTreeId`** → `skill_tree.id` (MySQL) - Topic

  - **Mục đích**: Liên kết với bảng `skill_tree` trong MySQL để biết node này thuộc topic nào
  - **Ví dụ**: `skillTreeId: 1` → Tương ứng với `skill_tree.id = 1` (Topic: "Daily Activities") trong MySQL
  - **Dùng để**: Lưu tiến độ skill tree của user trong MySQL (`user_skill_tree_progress`)

- **`levelId`** → `levels.id` (MySQL)
  - **Mục đích**: Liên kết với bảng `levels` trong MySQL để biết node này thuộc level nào
  - **Ví dụ**: `levelId: 1` → Tương ứng với `levels.id = 1` (Level: Beginner) trong MySQL
  - **Dùng để**: Filter và query theo level

### **ID từ MongoDB (Content IDs):**

- **`questionIds`** → Danh sách `questions._id` (MongoDB) - 10 câu random

  - **Mục đích**: Lưu danh sách 10 câu hỏi được random từ pool câu hỏi của level đó
  - **Ví dụ**: `["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014", ...]`
  - **Cách lấy**: Query `questions` collection với điều kiện `levelId`, `skillTreeId`, `skillNodeId`, `cefrLevel` → Random chọn 10 câu
  - **Lưu ý**: Mỗi lần user học lại node này có thể random lại 10 câu khác

- **`lessonIds`** → Danh sách `lessons._id` (MongoDB)

  - **Mục đích**: Lưu danh sách bài học liên quan đến node này
  - **Ví dụ**: `["507f1f77bcf86cd799439012"]` → Bài học về "Present Simple Tense"
  - **Dùng để**: Hiển thị nội dung bài học cho user

- **`vocabularyIds`** → Danh sách `vocabularies._id` (MongoDB)
  - **Mục đích**: Lưu danh sách từ vựng liên quan đến node này
  - **Ví dụ**: `["507f1f77bcf86cd799439011"]` → Từ vựng "hello"
  - **Dùng để**: Hiển thị từ vựng cho user học

### **Tại sao có cả ID MySQL và MongoDB?**

- **MySQL IDs** (`skillNodeId`, `skillTreeId`, `levelId`): Dùng để liên kết với metadata và lưu tiến độ học tập
- **MongoDB IDs** (`questionIds`, `lessonIds`, `vocabularyIds`): Dùng để lấy nội dung chi tiết (rich content) từ MongoDB

### **Ví dụ luồng dữ liệu:**

1. **User chọn Skill Node 1** (MySQL: `skill_node.id = 1`)
2. **Query MongoDB** với `skillNodeId: 1` → Lấy document `skill_nodes`
3. **Từ `questionIds`** → Query `questions` collection để lấy 10 câu hỏi chi tiết
4. **Từ `lessonIds`** → Query `lessons` collection để lấy bài học chi tiết
5. **Từ `vocabularyIds`** → Query `vocabularies` collection để lấy từ vựng chi tiết
6. **User làm bài** → Lưu kết quả vào MySQL (`user_node_progress` với `node_id = 1`)

**Ví dụ Document (Level 1 - Skill Tree 1 "Daily Activities" - Node 1 VOCAB):**

```json
{
  "_id": "507f1f77bcf86cd799439016",
  "skillNodeId": 1,
  "skillTreeId": 1,
  "levelId": 1,
  "nodeType": "VOCAB",
  "title": "Daily Activities Vocabulary",
  "description": "Học từ vựng về các hoạt động hàng ngày",
  "orderIndex": 1,
  "questionIds": [
    "507f1f77bcf86cd799439013",
    "507f1f77bcf86cd799439014",
    "507f1f77bcf86cd799439015",
    "507f1f77bcf86cd799439016",
    "507f1f77bcf86cd799439017",
    "507f1f77bcf86cd799439018",
    "507f1f77bcf86cd799439019",
    "507f1f77bcf86cd799439020",
    "507f1f77bcf86cd799439021",
    "507f1f77bcf86cd799439022"
  ],
  "lessonIds": ["507f1f77bcf86cd799439012"],
  "vocabularyIds": ["507f1f77bcf86cd799439011"],
  "mediaIds": ["507f1f77bcf86cd799439030"],
  "exerciseIds": ["507f1f77bcf86cd799439017"],
  "tags": ["vocabulary", "daily-activities", "A1-A2"]
}
```

---

### 6. **`placement_tests`** - Bài kiểm tra đầu vào

**Mục đích:** Lưu cấu hình bài placement test (15 câu hỏi để xác định level). Câu hỏi được chọn từ các CEFR levels (A1, A2, B1, B2, C1, C2) nhưng hiển thị trên giao diện là BEGINNER/INTERMEDIATE/ADVANCED.

**Liên kết MySQL:**

- Kết quả placement test được lưu trong `placement_test` (MySQL)

**Lưu ý quan trọng:**

- **`groups`**: Dùng BEGINNER, INTERMEDIATE, ADVANCED (cho giao diện)
- **Mapping khi lấy câu hỏi:**
  - BEGINNER → Lấy câu hỏi có `cefrLevel: "A1"` hoặc `"A2"`
  - INTERMEDIATE → Lấy câu hỏi có `cefrLevel: "B1"` hoặc `"B2"`
  - ADVANCED → Lấy câu hỏi có `cefrLevel: "C1"` hoặc `"C2"`
- **Lý do**: Đảm bảo câu hỏi theo chuẩn CEFR (A1-A2-B1-B2-C1-C2) nhưng hiển thị user-friendly (BEGINNER/INTERMEDIATE/ADVANCED)

**Ví dụ Document:**

```json
{
  "_id": "507f1f77bcf86cd799439018",
  "title": "English Placement Test",
  "description": "Bài kiểm tra để xác định trình độ tiếng Anh của bạn",
  "questionIds": [
    "507f1f77bcf86cd799439013",
    "507f1f77bcf86cd799439014",
    "507f1f77bcf86cd799439019",
    "507f1f77bcf86cd799439020",
    "507f1f77bcf86cd799439021",
    "507f1f77bcf86cd799439022",
    "507f1f77bcf86cd799439023",
    "507f1f77bcf86cd799439024",
    "507f1f77bcf86cd799439025",
    "507f1f77bcf86cd799439026",
    "507f1f77bcf86cd799439027",
    "507f1f77bcf86cd799439028",
    "507f1f77bcf86cd799439029",
    "507f1f77bcf86cd799439030",
    "507f1f77bcf86cd799439031"
  ],
  "groups": ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
}
```

**Ví dụ Query khi lấy câu hỏi:**

```javascript
// Lấy câu hỏi cho BEGINNER group
db.questions.find({
  placementGroup: "BEGINNER",
  cefrLevel: { $in: ["A1", "A2"] },
});

// Lấy câu hỏi cho INTERMEDIATE group
db.questions.find({
  placementGroup: "INTERMEDIATE",
  cefrLevel: { $in: ["B1", "B2"] },
});

// Lấy câu hỏi cho ADVANCED group
db.questions.find({
  placementGroup: "ADVANCED",
  cefrLevel: { $in: ["C1", "C2"] },
});
```

---

### 7. **`listening_exercises`** - Bài tập nghe

**Mục đích:** Lưu bài tập nghe với audio, transcript, và câu hỏi

**Liên kết MySQL:**

- `levelId` → `levels.id`
- `skillTreeId` → `skill_tree.id`
- `skillNodeId` → `skill_node.id`
- `questionIds` → Danh sách `questions._id` (MongoDB)

**Ví dụ Document:**

```json
{
  "_id": "507f1f77bcf86cd799439017",
  "title": "At the Restaurant",
  "audioUrl": "https://cdn.example.com/audio/restaurant.mp3",
  "transcript": "Waiter: Good evening. Do you have a reservation? Customer: Yes, for two at 7 PM. Waiter: Right this way, please.",
  "questionIds": ["507f1f77bcf86cd799439032", "507f1f77bcf86cd799439033"],
  "skillNodeId": 15,
  "skillTreeId": 6,
  "levelId": 2,
  "duration": 120,
  "cefrLevel": "B1",
  "tags": ["listening", "restaurant", "conversation"]
}
```

---

### 8. **`speaking_exercises`** - Bài tập nói

**Mục đích:** Lưu bài tập nói với prompt, câu trả lời mẫu, audio mẫu

**Liên kết MySQL:**

- `levelId` → `levels.id`
- `skillTreeId` → `skill_tree.id`
- `skillNodeId` → `skill_node.id`

**Ví dụ Document:**

```json
{
  "_id": "507f1f77bcf86cd799439034",
  "title": "Introduce Yourself",
  "prompt": "Tell me about yourself. Include your name, age, and where you're from.",
  "sampleAnswer": "Hello, my name is John. I'm 25 years old. I'm from New York, USA.",
  "audioUrl": "https://cdn.example.com/audio/introduce-yourself-sample.mp3",
  "keywords": ["name", "age", "from", "introduce"],
  "skillNodeId": 16,
  "skillTreeId": 7,
  "levelId": 1,
  "duration": 60,
  "cefrLevel": "A1",
  "tags": ["speaking", "introduction", "beginner"]
}
```

---

### 9. **`matching_exercises`** - Bài tập nối

**Mục đích:** Lưu bài tập nối từ/cụm từ với nghĩa

**Liên kết MySQL:**

- `levelId` → `levels.id`
- `skillTreeId` → `skill_tree.id`
- `skillNodeId` → `skill_node.id`

**Ví dụ Document:**

```json
{
  "_id": "507f1f77bcf86cd799439035",
  "title": "Match Words with Meanings",
  "leftItems": ["apple", "book", "car", "dog"],
  "rightItems": ["quả táo", "quyển sách", "xe hơi", "con chó"],
  "correctPairs": {
    "apple": "quả táo",
    "book": "quyển sách",
    "car": "xe hơi",
    "dog": "con chó"
  },
  "explanation": "Match English words with their Vietnamese meanings.",
  "skillNodeId": 17,
  "skillTreeId": 8,
  "levelId": 1,
  "cefrLevel": "A1",
  "tags": ["matching", "vocabulary", "beginner"]
}
```

---

### 10. **`conversation_scripts`** - Kịch bản hội thoại

**Mục đích:** Lưu hội thoại với audio, transcript, translation, và dialogue lines

**Liên kết MySQL:**

- `levelId` → `levels.id`
- `skillTreeId` → `skill_tree.id`
- `skillNodeId` → `skill_node.id`
- `vocabulary` → Danh sách `vocabularies._id` (MongoDB)

**Ví dụ Document:**

```json
{
  "_id": "507f1f77bcf86cd799439036",
  "title": "Ordering Coffee",
  "audioUrl": "https://cdn.example.com/audio/coffee-order.mp3",
  "dialogue": [
    {
      "speaker": "Customer",
      "text": "I'd like a coffee, please.",
      "translation": "Tôi muốn một cà phê.",
      "timestamp": 0
    },
    {
      "speaker": "Barista",
      "text": "What size would you like?",
      "translation": "Bạn muốn size nào?",
      "timestamp": 3
    },
    {
      "speaker": "Customer",
      "text": "Large, please.",
      "translation": "Size lớn.",
      "timestamp": 6
    }
  ],
  "transcript": "Customer: I'd like a coffee, please. Barista: What size would you like? Customer: Large, please.",
  "translation": "Khách hàng: Tôi muốn một cà phê. Nhân viên: Bạn muốn size nào? Khách hàng: Size lớn.",
  "skillNodeId": 18,
  "skillTreeId": 9,
  "levelId": 2,
  "duration": 45,
  "cefrLevel": "B1",
  "vocabulary": ["507f1f77bcf86cd799439011"],
  "tags": ["conversation", "coffee", "restaurant"]
}
```

---

### 11. **`level_tests`** - Bài kiểm tra level

**Mục đích:** Lưu cấu hình bài test cho từng level (20 câu: 5 vocab, 5 listening, 5 speaking, 5 matching)

**Liên kết MySQL:**

- `levelId` → `levels.id` (MySQL)

**Ví dụ Document:**

```json
{
  "_id": "507f1f77bcf86cd799439037",
  "levelId": 2,
  "questionIds": [
    "507f1f77bcf86cd799439038",
    "507f1f77bcf86cd799439039",
    "507f1f77bcf86cd799439040",
    "507f1f77bcf86cd799439041",
    "507f1f77bcf86cd799439042",
    "507f1f77bcf86cd799439043",
    "507f1f77bcf86cd799439044",
    "507f1f77bcf86cd799439045",
    "507f1f77bcf86cd799439046",
    "507f1f77bcf86cd799439047",
    "507f1f77bcf86cd799439048",
    "507f1f77bcf86cd799439049",
    "507f1f77bcf86cd799439050",
    "507f1f77bcf86cd799439051",
    "507f1f77bcf86cd799439052",
    "507f1f77bcf86cd799439053",
    "507f1f77bcf86cd799439054",
    "507f1f77bcf86cd799439055",
    "507f1f77bcf86cd799439056",
    "507f1f77bcf86cd799439057"
  ],
  "questionMixJson": "{\"VOCAB\":5,\"LISTENING\":5,\"SPEAKING\":5,\"MATCHING\":5}",
  "tags": ["level-test", "intermediate"]
}
```

---

### 12. **`review_sets`** - Bộ câu hỏi ôn tập (node 5 sẽ làm bài review)

**Mục đích:** Lưu bộ câu hỏi để review lại các node đã học (node 1, 2, 3, 4)

**Liên kết MySQL:**

- `skillTreeId` → `skill_tree.id` (MySQL)
- `nodeIds` → Danh sách `skill_node.id` (MySQL)
- `questionIds` → Danh sách `questions._id` (MongoDB)

**Ví dụ Document:**

```json
{
  "_id": "507f1f77bcf86cd799439058",
  "skillTreeId": 2,
  "nodeIds": [6, 7, 8, 9],
  "questionIds": [
    "507f1f77bcf86cd799439013",
    "507f1f77bcf86cd799439014",
    "507f1f77bcf86cd799439019",
    "507f1f77bcf86cd799439020",
    "507f1f77bcf86cd799439021",
    "507f1f77bcf86cd799439022",
    "507f1f77bcf86cd799439023",
    "507f1f77bcf86cd799439024",
    "507f1f77bcf86cd799439025",
    "507f1f77bcf86cd799439026"
  ],
  "selectionRule": "random-10-of-40",
  "tags": ["review", "grammar"]
}
```

**Giải thích `selectionRule`:** mô tả cách chọn câu hỏi từ `questionIds` để tạo bộ review. Ví dụ `"random-10-of-40"` nghĩa là pool có 40 câu; mỗi lần lấy ngẫu nhiên 10 câu. Có thể thay rule khác (ví dụ `"fixed-first-10"` hoặc weighted theo tag/difficulty) tùy logic implement.

---

### 13. **`explanation_notes`** - Ghi chú giải thích

**Mục đích:** Lưu giải thích chi tiết cho câu hỏi hoặc bài tập (có thể có video, hình ảnh)

**Liên kết:**

- `questionId` → `questions._id` (MongoDB)
- `exerciseId` → ID của exercise (listening/speaking/matching)

**Ví dụ Document:**

```json
{
  "_id": "507f1f77bcf86cd799439059",
  "questionId": "507f1f77bcf86cd799439013",
  "exerciseId": null,
  "explanationText": "The past tense of 'go' is 'went'. This is an irregular verb, so it doesn't follow the normal -ed pattern. 'Gone' is the past participle, used with 'have' or 'has'.",
  "videoUrl": "https://cdn.example.com/videos/past-tense-explanation.mp4",
  "imageUrl": "https://cdn.example.com/images/irregular-verbs-chart.jpg",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-20T14:20:00"
}
```

---

### 14. **`media_files`** - File media

**Mục đích:** Lưu thông tin về file media (hình ảnh, audio, video) đã upload

**Liên kết MySQL:**

- `uploadedBy` → `users.id` (MySQL)

**Ví dụ Document:**

```json
{
  "_id": "507f1f77bcf86cd799439060",
  "fileName": "hello-pronunciation.mp3",
  "fileUrl": "https://cdn.example.com/media/hello-pronunciation.mp3",
  "fileType": "audio",
  "fileSize": 245760,
  "mimeType": "audio/mpeg",
  "duration": 2,
  "tags": ["pronunciation", "greeting"],
  "uploadedAt": "2024-01-15T10:30:00",
  "uploadedBy": 1
}
```

---

## 🔄 Luồng dữ liệu điển hình:

### **Scenario: User học một skill node**

1. **MySQL:** Lấy metadata từ `skill_node` (id=1, type=VOCAB, skill_tree_id=1, level_id=1)
2. **MongoDB:** Lấy nội dung chi tiết từ `skill_nodes` collection:
   - `questionIds` → Lấy 10 câu hỏi random từ pool A1/A2 (Level 1) loại VOCAB
   - `lessonIds` → Lấy bài học từ `lessons`
   - `vocabularyIds` → Lấy từ vựng từ `vocabularies`
3. **User làm bài** → Lưu kết quả vào MySQL (`user_node_progress`)
4. **Cập nhật XP** → Lưu vào MySQL (`xp_history`)

### **Ví dụ cụ thể: Level 1 - Skill Tree 1 "Daily Activities" - Node 1 VOCAB**

1. **MySQL:** Skill Tree 1 (Topic: "Daily Activities"), Skill Node 1 (Type: VOCAB)
2. **MongoDB:**
   - Query `questions` với: `levelId: 1, skillTreeId: 1, skillNodeId: 1, cefrLevel: ["A1", "A2"]`
   - Random chọn 10 câu hỏi từ pool đó
   - Load từ vựng, bài học liên quan
3. **User làm 10 câu hỏi** → Lưu kết quả vào MySQL
4. **Cập nhật XP** → Lưu vào MySQL

### **Tại sao tách MySQL và MongoDB?**

- **MySQL:** Tốt cho structured data, transactions, relationships
- **MongoDB:** Tốt cho rich content, flexible schema, dễ scale

---

## 🔄 ETL Process (Extract, Transform, Load)

### **Quy trình import data từ nguồn (ví dụ: kangle):**

1. **Extract (Trích xuất):**

   - Chọn dataset có cột **CEFR** (A1, A2, B1, B2, C1, C2)
   - Lấy các câu hỏi, từ vựng, bài học từ nguồn

2. **Transform (Chuyển đổi):**

   - Map CEFR → Placement Group:
     - CEFR A1, A2 → `placementGroup: "BEGINNER"`, `levelId: 1`
     - CEFR B1, B2 → `placementGroup: "INTERMEDIATE"`, `levelId: 2`
     - CEFR C1, C2 → `placementGroup: "ADVANCED"`, `levelId: 3`
   - Giữ nguyên `cefrLevel` (A1, A2, B1, B2, C1, C2) để đảm bảo theo chuẩn
   - Phân loại theo topic → `skillTreeId`
   - Phân loại theo loại bài → `skillNodeId` (VOCAB, LISTENING, SPEAKING, MATCHING, REVIEW)

3. **Load (Tải vào database):**
   - Lưu vào MongoDB với đầy đủ thông tin:
     - `cefrLevel`: Chuẩn CEFR (A1, A2, B1, B2, C1, C2)
     - `placementGroup`: Cho giao diện (BEGINNER, INTERMEDIATE, ADVANCED)
     - `levelId`: Level ID (1, 2, 3)
     - `skillTreeId`: Topic ID
     - `skillNodeId`: Node ID

### **Ví dụ ETL:**

**Input từ nguồn (kangle):**

```csv
question_id,question_text,cefr_level,topic,question_type
Q001,"What is 'hello'?","A1","Greetings","VOCAB"
Q002,"I ___ to school.","A2","Daily Activities","GRAMMAR"
```

**Output sau Transform:**

```json
{
  "questionText": "What is 'hello'?",
  "cefrLevel": "A1",
  "placementGroup": "BEGINNER",
  "levelId": 1,
  "skillTreeId": 1,
  "skillNodeId": 1,
  "questionType": "VOCAB"
}
```

---

## 📝 Tóm tắt mối quan hệ:

| MongoDB Collection     | Liên kết MySQL                                | Mục đích                |
| ---------------------- | --------------------------------------------- | ----------------------- |
| `vocabularies`         | `levels`, `skill_tree`, `skill_node`          | Từ vựng chi tiết        |
| `lessons`              | `levels`, `skill_tree`, `skill_node`          | Nội dung bài học        |
| `questions`            | `levels`, `skill_tree`, `skill_node`          | Câu hỏi (10 câu/node)   |
| `skill_trees`          | `skill_tree.id`, `levels.id`                  | Topic/Chủ đề            |
| `skill_nodes`          | `skill_node.id`, `skill_tree.id`, `levels.id` | Loại bài tập            |
| `placement_tests`      | -                                             | Cấu hình placement test |
| `listening_exercises`  | `levels`, `skill_tree`, `skill_node`          | Bài tập nghe            |
| `speaking_exercises`   | `levels`, `skill_tree`, `skill_node`          | Bài tập nói             |
| `matching_exercises`   | `levels`, `skill_tree`, `skill_node`          | Bài tập nối             |
| `conversation_scripts` | `levels`, `skill_tree`, `skill_node`          | Hội thoại               |
| `level_tests`          | `levels.id`                                   | Bài test level          |
| `review_sets`          | `skill_tree.id`, `skill_node.id`              | Bộ câu hỏi review       |
| `explanation_notes`    | -                                             | Giải thích              |
| `media_files`          | `users.id`                                    | File media              |
     |

---

## 🗺️ Mapping Level và Skill Tree

### **Level → CEFR → Skill Tree ID:**

| Level            | Placement Group | CEFR Levels | Skill Tree ID Range | Số lượng Topics      |
| ---------------- | --------------- | ----------- | ------------------- | -------------------- |
| 1 (Beginner)     | BEGINNER        | A1, A2      | 1-5                 | 5 topics             |
| 2 (Intermediate) | INTERMEDIATE    | B1, B2      | 6-15                | 10 topics            |
| 3 (Advanced)     | ADVANCED        | C1, C2      | 16+                 | 10+ topics (mở rộng) |

**Lưu ý:**

- **Placement Group**: Dùng cho giao diện (BEGINNER/INTERMEDIATE/ADVANCED)
- **CEFR Levels**: Dùng cho data source và validation (A1/A2/B1/B2/C1/C2)
- Khi query data: BEGINNER → filter `cefrLevel: ["A1", "A2"]`

### **Skill Tree → Skill Node:**

- Mỗi Skill Tree có **5 nodes cố định**:

  1. **VOCAB** - Từ vựng
  2. **LISTENING** - Nghe
  3. **SPEAKING** - Nói
  4. **MATCHING** - Nối
  5. **REVIEW** - Ôn tập

- Mỗi node random **10 câu hỏi** từ pool của level đó:
  - Level 1: Câu hỏi A1, A2
  - Level 2: Câu hỏi B1, B2
  - Level 3: Câu hỏi C1, C2

### **Ví dụ cụ thể:**

**Level 1 - Skill Tree 1 "Daily Activities":**

- Node 1 (VOCAB): Random 10 câu hỏi A1/A2 loại VOCAB về "Daily Activities"
- Node 2 (LISTENING): Random 10 câu hỏi A1/A2 loại LISTENING về "Daily Activities"
- Node 3 (SPEAKING): Random 10 câu hỏi A1/A2 loại SPEAKING về "Daily Activities"
- Node 4 (MATCHING): Random 10 câu hỏi A1/A2 loại MATCHING về "Daily Activities"
- Node 5 (REVIEW): Random 10 câu hỏi A1/A2 (tổng hợp) về "Daily Activities"
