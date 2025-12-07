# Language Learning App

Ứng dụng web học ngoại ngữ trực tuyến phù hợp với năng lực người học dựa trên kiến trúc Spring Boot – ReactJS – MySQL

## Công nghệ sử dụng

### Backend

- **Spring Boot 3.2.0** - Framework Java
- **Spring Data JPA** - ORM cho MySQL
- **Spring Data MongoDB** - ODM cho MongoDB
- **Spring Security** - Authentication & Authorization
- **JWT** - JSON Web Token cho authentication
- **MySQL** - Database quan hệ
- **MongoDB** - Database NoSQL cho nội dung học tập

### Frontend

- **React 18** - UI Library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Zustand** - State management
- **React Query** - Data fetching
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

## Cấu trúc dự án

```
LanguageLearningApp/
├── backend/                    # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/languagelearning/
│   │   │   │   ├── config/     # Configuration classes
│   │   │   │   ├── controller/ # REST Controllers
│   │   │   │   ├── dto/        # Data Transfer Objects
│   │   │   │   ├── entity/     # JPA Entities (MySQL)
│   │   │   │   ├── document/   # MongoDB Documents
│   │   │   │   ├── repository/ # Data Access Layer
│   │   │   │   ├── service/    # Business Logic
│   │   │   │   ├── exception/ # Exception Handlers
│   │   │   │   └── LanguageLearningAppApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml
│
└── frontend/                   # React + TypeScript Frontend
    ├── src/
    │   ├── components/         # React Components
    │   │   └── layout/         # Layout components
    │   ├── pages/              # Page components
    │   │   └── auth/           # Authentication pages
    │   ├── services/           # API services
    │   ├── store/              # State management
    │   ├── types/              # TypeScript types
    │   ├── utils/              # Utility functions
    │   ├── config/             # Configuration
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── tailwind.config.js
```

## Yêu cầu hệ thống

- **Java 17+**
- **Node.js 18+**
- **MySQL 8.0+**
- **MongoDB 6.0+**
- **Maven 3.6+**

## Hướng dẫn cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd LanguageLearningApp
```

### 2. Cài đặt Backend

```bash
cd backend

# Cấu hình database trong application.properties
# - MySQL: spring.datasource.url, username, password
# - MongoDB: spring.data.mongodb.uri

# Chạy ứng dụng
mvn spring-boot:run
```

Backend sẽ chạy tại: `http://localhost:8080`

### 3. Cài đặt Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

### 4. Setup Database

#### MySQL

Tạo database và chạy các script SQL trong file `database.sql` (nếu có) hoặc sử dụng JPA auto-ddl.

#### MongoDB

Đảm bảo MongoDB đang chạy và tạo database `language_learning_app`.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Learning

- `GET /api/learning/skill-trees` - Lấy danh sách skill trees
- `GET /api/learning/skill-trees/{id}/nodes` - Lấy nodes của skill tree
- `GET /api/learning/lessons/{id}` - Lấy thông tin lesson
- `GET /api/learning/nodes/{id}/questions` - Lấy câu hỏi của node
- `GET /api/learning/nodes/{id}/vocabularies` - Lấy từ vựng của node

### Progress

- `GET /api/progress/users/{id}/skill-trees` - Lấy tiến độ skill trees
- `GET /api/progress/users/{id}/nodes/{nodeId}` - Lấy tiến độ node
- `PUT /api/progress/users/{id}/nodes/{nodeId}` - Cập nhật tiến độ
- `POST /api/progress/placement-test` - Nộp bài kiểm tra đầu vào

## Database Schema

### MySQL Tables

- `users`, `user_profile`, `role`, `user_role`
- `levels`, `skill_tree`, `skill_node`
- `user_skill_tree_progress`, `user_node_progress`
- `placement_test`, `xp_history`, `badges`, `user_badges`
- `streak_history`, `leaderboard`, `feedback`

### MongoDB Collections

- `lessons`, `questions`, `vocabularies`, `flashcards`
- `listening_exercises`, `speaking_exercises`, `matching_exercises`
- `grammar_notes`, `explanation_notes`, `media_files`
- `placement_test_questions`, `reading_passages`, `conversation_scripts`

## Development

### Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Build Production

### Backend

```bash
cd backend
mvn clean package
java -jar target/language-learning-app-1.0.0.jar
```

### Frontend

```bash
cd frontend
npm run build
# Files sẽ được build vào thư mục dist/
```

## Tác giả

Nhóm khóa luận tốt nghiệp - Kiều - Hương

## License

Dự án khóa luận tốt nghiệp
