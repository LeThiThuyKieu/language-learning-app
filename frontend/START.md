# 🚀 Hướng dẫn chạy Frontend

## ⚠️ QUAN TRỌNG: KHÔNG mở file HTML trực tiếp!

File `index.html` không thể chạy trực tiếp trong trình duyệt vì:

- Sử dụng TypeScript/JSX cần được compile
- Sử dụng module imports cần Vite server
- Cần build process để xử lý dependencies

## ✅ Cách chạy ĐÚNG:

### Bước 1: Mở Terminal/PowerShell

Mở terminal trong thư mục `frontend`

### Bước 2: Cài đặt dependencies (chỉ lần đầu)

```bash
npm install
```

### Bước 3: Chạy dev server

```bash
npm run dev
```

### Bước 4: Mở trình duyệt

Sau khi chạy lệnh trên, bạn sẽ thấy:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**Mở trình duyệt và truy cập: `http://localhost:3000`**

## 🔧 Nếu gặp lỗi:

### Lỗi: "npm is not recognized"

- Cài đặt Node.js từ: https://nodejs.org/
- Chọn phiên bản LTS (18.x hoặc 20.x)

### Lỗi: "Cannot find module"

```bash
cd frontend
rm -rf node_modules  # hoặc xóa thư mục node_modules
npm install
```

### Lỗi: Port 3000 đã được sử dụng

```bash
# Sửa trong vite.config.ts hoặc dùng port khác
npm run dev -- --port 3001
```

## 📝 Lưu ý:

- **LUÔN** chạy `npm run dev` thay vì mở file HTML trực tiếp
- Dev server sẽ tự động reload khi bạn thay đổi code
- Để dừng server: Nhấn `Ctrl + C` trong terminal
