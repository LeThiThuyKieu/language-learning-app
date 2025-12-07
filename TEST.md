# Hướng dẫn Test Ứng dụng

## 🚀 Chạy ứng dụng

### 1. Chạy Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```

Backend sẽ chạy tại: `http://localhost:8080`

**Test endpoint:**

```bash
curl http://localhost:8080/api/public/health
```

### 2. Chạy Frontend (React + Vite)

```bash
cd frontend
npm install  # Chỉ cần chạy lần đầu
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## ✅ Kiểm tra

1. Mở trình duyệt và truy cập: `http://localhost:3000`
2. Trang chủ sẽ hiển thị:
   - ✅ Frontend Status: Running (luôn hiển thị)
   - ✅ Backend API Status: Online (nếu backend đang chạy)
   - ❌ Backend API Status: Offline (nếu backend chưa chạy)

## 🧪 Test API trực tiếp

### Health Check

```bash
curl http://localhost:8080/api/public/health
```

Kết quả mong đợi:

```json
{
  "success": true,
  "message": "API is running",
  "data": {
    "status": "UP",
    "timestamp": "2024-01-01T12:00:00",
    "service": "Language Learning App API",
    "version": "1.0.0"
  }
}
```

## 📝 Lưu ý

- Đảm bảo MySQL đang chạy (nếu cần)
- Đảm bảo MongoDB đang chạy hoặc có kết nối MongoDB Atlas
- Kiểm tra cấu hình trong `application.properties`
