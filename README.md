# 🏨 Hotel Booking Platform (Monorepo)

Chào mừng bạn đến với dự án **Hotel Booking Platform** — Một nền tảng đặt phòng khách sạn trực tuyến toàn diện được thiết kế và xây dựng theo kiến trúc phân tầng hiện đại, an toàn và dễ bảo trì.

Dự án hiện tại được cấu trúc dưới dạng **Monorepo** phân tầng rõ ràng, tích hợp cả Backend (Spring Boot 3) và Frontend (React 18 / Vite).

---

## 🏗️ Cấu Trúc Dự An (Monorepo Structure)

Dự án được phân chia thành các workspace độc lập và phân nhóm tài liệu khoa học tại thư mục gốc:

```text
HotelBooking/                    ← Root thư mục làm việc chính
├── .github/workflows/           ← Cấu hình CI/CD (GitHub Actions)
├── .vscode/                     ← Cấu hình chung cho editor VS Code
├── docs/                        ← Nơi lưu trữ toàn bộ tài liệu dự án
│   ├── api/                     ← Tài liệu API endpoints chi tiết
│   ├── architecture/            ← Sơ đồ thiết kế kiến trúc hệ thống
│   ├── database/                ← Thiết kế cơ sở dữ liệu MongoDB
│   ├── qa/                      ← Log lỗi và báo cáo kiểm thử QA (QA-Round-2.1)
│   ├── CODEMAP.md               ← Bản đồ tính năng chi tiết
│   └── SRS.md                   ← Đặc tả yêu cầu phần mềm (SRS)
├── backend/                     ← WORKSPACE BACKEND (Spring Boot 3 + Java 17)
│   ├── src/                     ← Mã nguồn Java backend
│   ├── pom.xml                  ← Quản lý dependency Maven
│   └── uploads/                 ← Thư mục lưu hình ảnh tải lên (Runtime)
├── frontend/                    ← WORKSPACE FRONTEND (React 18 + Vite)
│   ├── src/                     ← Mã nguồn React/JSX
│   └── package.json             ← Quản lý dependency React
├── package.json                 ← Quản lý và chạy đồng thời BE + FE bằng concurrently
```

---

## ⚡ Khởi Chạy Nhanh (Quick Start)

Nhờ cấu trúc Monorepo thống nhất, bạn có thể dễ dàng quản lý và khởi động cả hai workspace mà không cần mở nhiều tab terminal riêng biệt.

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

### 🛠️ Công Nghệ Sử Dụng
- **Core Framework:** Spring Boot 3.4+, Java 17
- **Database:** MongoDB (Spring Data MongoDB)
- **Security:** Spring Security & JWT (Access Token & Refresh Token)
- **Email:** Spring Boot Starter Mail (SMTP)
- **Testing:** JUnit 5, Mockito

### 🛡️ Phân Quyền & Ma Trận Bảo Mật (Security Matrix)
Hệ thống sử dụng cơ chế bảo mật phân tầng chặt chẽ dựa trên các vai trò `GUEST`, `USER` (bao gồm cả khả năng của `HOST`), và `ADMIN`.

| Endpoint | HTTP Method | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `/auth/login`, `/auth/register` | `POST` | Public | Đăng nhập và đăng ký tài khoản |
| `/rooms/**`, `/hotels/**` | `GET` | Public | Duyệt xem phòng/khách sạn đã được phê duyệt |
| `/payments/instructions` | `GET` | USER, ADMIN | Xem thông tin STK của Host (Che số/Ẩn đối với người ngoài) |
| `/bookings` | `POST` | USER | Đặt phòng (Yêu cầu tài khoản đã xác nhận email) |
| `/bookings/room/{roomId}` | `GET` | OWNER, ADMIN | Xem danh sách lịch đặt của một phòng cụ thể |
| `/bookings/revenue` | `GET` | ADMIN | Xem tổng doanh thu của toàn bộ hệ thống |
| `/host/**` | `ALL` | USER, ADMIN | Các tính năng dành cho chủ phòng (Quản lý hotel/room của mình) |
| `/admin/**` | `ALL` | ADMIN | Các tính năng dành cho quản trị viên tối cao |

### 🔒 Chính Sách Xác Thực Email (Email Verification Policy)
Để đảm bảo tính trung thực của các giao dịch trên nền tảng, hệ thống áp dụng cơ chế xác thực email:
- Người dùng chưa xác thực email vẫn có thể **đăng nhập** và **duyệt xem** toàn bộ giao diện website thông thường.
- Tuy nhiên, khi người dùng cố gắng sử dụng các chức năng quan trọng (như **Đặt phòng**, hoặc **Đăng ký làm Host để đăng bán khách sạn/phòng**), hệ thống sẽ chặn giao dịch và ném lỗi yêu cầu xác nhận email trước khi tiếp tục.

### 💳 Cơ Chế Thanh Toán Sandbox (Payment Sandbox Flow)
Hệ thống tích hợp cổng thanh toán trực tuyến mô phỏng (Sandbox Checkout) cực kỳ an toàn:
1. Khi khách hàng nhấn thanh toán cho một booking hợp lệ, Backend sẽ ký số HMAC-SHA256 để tạo mã giao dịch duy nhất kèm chữ ký bảo mật.
2. Khách hàng được dẫn tới trang Sandbox Checkout mô phỏng của hệ thống (tải trên trình duyệt dưới dạng HTML động).
3. Khi khách hàng nhấn "Thanh toán thành công" hoặc "Thanh toán thất bại", Sandbox sẽ chuyển hướng kèm webhook có chữ ký số phản hồi về Backend để cập nhật trạng thái thanh toán (`PAID` hoặc `FAILED`) một cách tự động và ghi lại nhật ký kiểm toán (Audit Logs).

---

## 🎨 Workspace Frontend (React + Vite)

### 🛠️ Công Nghệ Sử Dụng
- **Core Framework:** React 18
- **Build Tool:** Vite (Cực nhanh và nhẹ)
- **Routing:** React Router v6
- **Styling:** Vanilla CSS, Curated harmonious HSL palettes
- **API Client:** Axios (Tự động đính kèm JWT và xử lý refresh token khi hết hạn)

### 📂 Cấu Trúc Mã Nguồn Frontend
- `src/pages/`: Các màn hình chính (`Home`, `Hotels`, `Booking`, `AdminDashboard`...).
- `src/components/`: UI components có thể tái sử dụng (Navbar, Footer, Modals, Cards...).
- `src/services/`: Lớp gọi API tập trung và cấu hình Axios Interceptors.

---

## ⚙️ Cấu Hình Môi Trường (.env)

Cả hai dự án backend và frontend đều sử dụng các file `.env` để bảo mật thông tin cấu hình local.
- **Backend (.env):** Nằm trong thư mục `backend/` (dùng cấu hình `MONGODB_URI`, `JWT_SECRET`, cấu hình SMTP Email).
- **Frontend (.env):** Nằm trong thư mục `frontend/` (dùng cấu hình `VITE_API_BASE_URL`).

---

## 📖 Tài Liệu Chi Tiết

Mọi tài liệu liên quan đến dự án đã được chuyển lên thư mục `docs/` ở root để dễ dàng tiếp cận:
- [Đặc tả yêu cầu phần mềm (SRS)](file:///d:/DACN/HotelBooking/docs/SRS.md)
- [Bản đồ cấu trúc mã nguồn (CODEMAP)](file:///d:/DACN/HotelBooking/docs/CODEMAP.md)
- [Tài liệu API](file:///d:/DACN/HotelBooking/docs/api/API-Documentation.md)
- [Thiết kế DB](file:///d:/DACN/HotelBooking/docs/database/Database-Design.md)
- [Nhật ký lỗi QA Round 2.1](file:///d:/DACN/HotelBooking/docs/qa/QA-Round-2.1-Bug-Log.md)
