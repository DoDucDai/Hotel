# 🏨 Hotel Booking Platform (Monorepo)

Chào mừng bạn đến với dự án **Hotel Booking Platform** — Một nền tảng đặt phòng khách sạn trực tuyến toàn diện được xây dựng với kiến trúc hiện đại, sạch sẽ và dễ bảo trì.

Dự án hiện tại được cấu trúc dưới dạng **Monorepo** phân tầng rõ ràng, tích hợp cả Backend (Spring Boot) và Frontend (React/Vite).

---

## 🏗️ Cấu Trúc Dự Án (Monorepo Structure)

Dự án được phân chia thành các workspace độc lập và phân nhóm tài liệu khoa học tại thư mục gốc:

```text
HotelBooking/                    ← Root thư mục làm việc chính
├── .github/workflows/           ← Cấu hình CI/CD (GitHub Actions)
├── .vscode/                     ← Cấu hình chung cho editor VS Code
├── docs/                        ← Nơi lưu trữ toàn bộ tài liệu dự án
│   ├── api/                     ← Tài liệu API endpoints
│   ├── architecture/            ← Sơ đồ thiết kế kiến trúc hệ thống
│   ├── database/                ← Thiết kế cơ sở dữ liệu MongoDB
│   ├── qa/                      ← Log lỗi và báo cáo kiểm thử QA
│   ├── CODEMAP.md               ← Bản đồ tính năng chi tiết
│   └── SRS.md                   ← Đặc tả yêu cầu phần mềm
├── backend/                     ← WORKSPACE BACKEND (Spring Boot 3 + Java 17)
│   ├── src/                     ← Mã nguồn Java backend
│   ├── pom.xml                  ← Quản lý dependency Maven
│   └── uploads/                 ← Thư mục lưu hình ảnh tải lên (Runtime)
├── frontend/                    ← WORKSPACE FRONTEND (React 18 + Vite)
│   ├── src/                     ← Mã nguồn React/JSX
│   └── package.json             ← Quản lý dependency React
├── design-system/               ← Các bản mẫu thiết kế giao diện
└── package.json                 ← Quản lý và chạy đồng thời BE + FE
```

---

## ⚡ Khởi Chạy Nhanh (Quick Start)

Nhờ cấu trúc Monorepo thống nhất, bạn không cần phải mở nhiều tab terminal để chạy riêng biệt. 

### 1. Cài đặt các thư viện cần thiết tại Root
Tại thư mục gốc dự án (`d:\DACN\HotelBooking`), chạy lệnh:
```bash
npm install
```

### 2. Cài đặt dependency cho Frontend
```bash
npm install --prefix frontend
```

### 3. Khởi động đồng thời cả Backend & Frontend
Chạy lệnh duy nhất sau ở thư mục gốc:
```bash
npm run dev
```
*Hệ thống sẽ sử dụng `concurrently` để chạy song song:*
- **Backend (Spring Boot)** sẽ chạy trên port `http://localhost:8080`
- **Frontend (React + Vite)** sẽ chạy trên port `http://localhost:5173`

---

## 🖥️ Workspace Backend (Spring Boot)

Chi tiết cấu hình và công nghệ được sử dụng ở backend.

- **Tech Stack:** Java 17, Spring Boot 3, Spring Security, Spring Data MongoDB.
- **Cơ sở dữ liệu:** MongoDB (mặc định trỏ về `mongodb://localhost:27017/hotelbooking`).
- **Xác thực:** JWT Access Token + Refresh Token.

### Chạy riêng lẻ Backend
Nếu bạn chỉ muốn phát triển backend, chạy lệnh này tại thư mục gốc:
```bash
npm run dev:be
```
hoặc vào thư mục `backend/` và chạy:
```bash
./mvnw spring-boot:run
```

---

## 🎨 Workspace Frontend (React)

- **Tech Stack:** React 18, Vite, React Router, Axios.
- **Cấu trúc src:**
  - `pages/`: Các màn hình chức năng (`Home`, `Hotels`, `Booking`, `AdminDashboard`...).
  - `components/`: UI components có thể tái sử dụng.
  - `services/`: Lớp gọi API tập trung.

### Chạy riêng lẻ Frontend
Nếu bạn chỉ muốn phát triển giao diện, chạy lệnh này tại thư mục gốc:
```bash
npm run dev:fe
```
hoặc vào thư mục `frontend/` và chạy:
```bash
npm run dev
```

---

## 🔒 Cấu Hình Môi Trường (.env)

Cả hai dự án backend và frontend đều sử dụng các file `.env` để bảo mật thông tin cấu hình local.
- **Backend (.env):** Nằm trong thư mục `backend/` (dùng cấu hình `MONGODB_URI`, `JWT_SECRET`, cấu hình SMTP Email).
- **Frontend (.env):** Nằm trong thư mục `frontend/` (dùng cấu hình `VITE_API_BASE_URL`).

*Lưu ý: Các file `.env` đã được cấu hình trong `.gitignore` để tránh rò rỉ mã nguồn bí mật lên Git.*

---

## 📖 Tài Liệu Chi Tiết

Mọi tài liệu liên quan đến dự án đã được chuyển lên thư mục `docs/` ở root để dễ dàng tiếp cận:
- [Đặc tả yêu cầu phần mềm (SRS)](file:///d:/DACN/HotelBooking/docs/SRS.md)
- [Bản đồ cấu trúc mã nguồn (CODEMAP)](file:///d:/DACN/HotelBooking/docs/CODEMAP.md)
- [Tài liệu API](file:///d:/DACN/HotelBooking/docs/api/API-Documentation.md)
- [Thiết kế DB](file:///d:/DACN/HotelBooking/docs/database/Database-Design.md)
