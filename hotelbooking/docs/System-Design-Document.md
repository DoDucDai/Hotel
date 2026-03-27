# System Design Document

## 1. Tong quan kien truc
He thong duoc thiet ke theo mo hinh 3 tang:
- Presentation Layer: React (Vite), Router, ProtectedRoute, Toast, SessionTimeoutManager.
- Application Layer: Spring Boot REST API (Controller + Service + Security).
- Data Layer: MongoDB collections (`users`, `hotels`, `rooms`, `booking`, `refresh_tokens`).

## 2. Kien truc logic backend
### 2.1 Controller layer
- `AuthController`: register, login, refresh, create-admin.
- `UserController`: CRUD user (admin), thong tin tai khoan hien tai.
- `HotelController`: danh sach/chi tiet/search hotel, CRUD hotel, upload image.
- `RoomController`: danh sach/chi tiet/search room, CRUD room.
- `BookingController`: tao/xoa booking, booking theo room, booking cua toi, revenue.
- `HostController`: quan ly hotel/room theo owner.
- `AdminController`: dashboard thong ke.

### 2.2 Service layer
- `UserService`: logic tai khoan, normalize email, hash password.
- `BookingService`: validate lich dat, tinh tong tien.
- `RoomService`: tim phong trong theo khoang ngay.
- `RefreshTokenService`: tao va verify refresh token.
- `HotelService`: ho tro pagination/search hotel (duoc duy tri cho service-level logic).

### 2.3 Repository layer
- MongoRepository cho tung aggregate:
- `UserRepository`, `HotelRepository`, `RoomRepository`, `BookingRepository`, `RefreshTokenRepository`.

## 3. Kien truc frontend
### 3.1 Routing
- Public routes: `/`, `/hotels`, `/hotels/:id`, `/login`, `/register`.
- Protected routes: `/booking`, `/account`, `/host`.
- Admin route: `/admin` (yeu cau role `ADMIN`).

### 3.2 State va auth client-side
- Token duoc luu localStorage (`accessToken`, `refreshToken`, `role`).
- `axiosClient` tu dong gan Authorization header.
- Khi 401: xoa token va chuyen huong ve `/login`.
- `SessionTimeoutManager`: tu dang xuat neu 10 phut khong hoat dong.

## 4. Bao mat va phan quyen
### 4.1 Security stack
- Stateless auth voi JWT (`JwtFilter` + `JwtUtil`).
- BCrypt cho password.
- CORS cho localhost frontend.
- Method security (`@PreAuthorize`) ket hop voi URL security.

### 4.2 Matrix phan quyen (rut gon)
- Public:
- `/auth/**`
- `/uploads/**`
- `GET /hotels/**`
- `GET /rooms/**`
- User/Admin:
- `/users/me/**`
- `/host/**`
- `/bookings/**`
- Admin:
- `/admin/**`
- `/users/**`
- Non-GET `/rooms/**`
- Một so endpoint hotel CRUD duoc chan boi `@PreAuthorize("hasRole('ADMIN')")`.

## 5. Luong nghiep vu chinh
### 5.1 Dang nhap
1. Client gui `POST /auth/login`.
2. Server xac thuc password.
3. Server tra access token + refresh token + role.
4. Client luu token va mo khoa protected pages.

### 5.2 Tim phong va dat phong
1. Client goi `GET /rooms/search` (checkIn, checkOut, guests).
2. Server loc room theo suc chua va lich booking overlap.
3. User chon room va goi `POST /bookings`.
4. Server gan `userId` theo token, tinh `totalPrice`, luu booking.

### 5.3 Host quan ly noi dung
1. Host goi `/host/hotels/my` va `/host/rooms/my`.
2. Host tao/sua/xoa hotel/room.
3. Server check ownerId hoac role ADMIN truoc khi cho phep.

### 5.4 Cap nhat email tai khoan
1. User goi `PUT /users/me/email`.
2. Server kiem tra trung email.
3. Server cap nhat email va phat hanh access token moi.

## 6. Thiet ke upload media
- Endpoint: `POST /hotels/{id}/image`.
- Input: multipart file.
- Validate content-type phai la `image/*`.
- Luu file tai `uploads/` trong root project.
- WebConfig map static resource qua `/uploads/**`.

## 7. Error handling
- `GlobalExceptionHandler` bat `RuntimeException` va tra:
```json
{ "error": "message" }
```
- HTTP status cho RuntimeException: `400 Bad Request`.

## 8. Deployment view (local)
- Backend: Spring Boot tai `http://localhost:8080`.
- Frontend: Vite tai `http://localhost:5173`.
- Database: MongoDB local.
- Swagger UI: `/swagger-ui/index.html`.

## 9. Diem can can nhac khi mo rong
- Tach role `HOST` rieng neu can kiem soat quyen chat hon.
- Bo sung soft delete va audit log cho booking/hotel/room.
- Thay `RuntimeException` bang custom exception + ma loi chuan hoa.
- Bo sung rate limit va secret management an toan hon (env/secret vault).

## 10. So do Mermaid
- Xem file so do ERD va sequence tai:
- `docs/Architecture-Diagrams.md`
