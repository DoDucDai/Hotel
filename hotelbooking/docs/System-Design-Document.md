# System Design Document

## 1. Tong quan kien truc
He thong duoc thiet ke theo mo hinh 3 tang:
- Presentation Layer: React (Vite), Router, ProtectedRoute, Toast, SessionTimeoutManager.
- Application Layer: Spring Boot REST API (Controller + Service + Security).
- Data Layer: MongoDB collections (`users`, `hotels`, `rooms`, `booking`, `refresh_tokens`).

## 2. Kien truc logic backend
### 2.1 Controller layer
- `AuthController`: register, login, refresh token, verify email, reset password.
- `UserController`: profile user hien tai va quan tri user (admin).
- `HotelController`: danh sach/chi tiet/search hotel, CRUD hotel (admin), upload image.
- `RoomController`: danh sach/chi tiet/search room, CRUD room.
- `BookingController`: tao/huy/doi lich booking, cap nhat status thanh toan va luu tru.
- `HostHotelController`: quan ly hotel theo owner.
- `HostRoomController`: quan ly room theo owner.
- `HostInventoryController`: block/unblock ton kho room theo ngay.
- `HostDashboardController`: thong ke dashboard cho host.
- `AdminController`: dashboard, duyet hotel, quan ly dispute, audit logs.

### 2.2 Service layer
- `HotelCatalogService`: xu ly hotel public + hotel CRUD/admin.
- `BookingService`: nghiep vu booking (pricing, coupon, refund, status transitions).
- `HostHotelService`: nghiep vu hotel cua host.
- `HostRoomService`: nghiep vu room cua host.
- `HostInventoryService`: nghiep vu inventory block cua host.
- `HostDashboardService`: tong hop dashboard host.
- `HostAccessService`: helper quyen truy cap va owner check.
- `HostManagementService`: facade compatibility de tranh vo wiring cu.

### 2.3 Repository layer
MongoRepository theo aggregate:
- `UserRepository`, `HotelRepository`, `RoomRepository`, `BookingRepository`, `RefreshTokenRepository`.

## 3. Kien truc frontend
### 3.1 Routing
- Public routes: `/`, `/hotels`, `/hotels/:id`, `/login`, `/register`.
- Protected routes: `/booking`, `/account`, `/host`, `/notifications`.
- Admin route: `/admin` (yeu cau role `ADMIN`).

### 3.2 State va auth client-side
- Token luu localStorage (`accessToken`, `refreshToken`, `role`).
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
- Public: `/auth/**`, `/uploads/**`, `GET /hotels/**`, `GET /rooms/**`, `GET /reviews/**`.
- User/Admin: `/users/me/**`, `/host/**`, `/bookings/**`, `/wishlist/**`, `/notifications/**`.
- Admin: `/admin/**`, `/users/**`, non-GET `/rooms/**`, mutating `/coupons/**`.

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

### 5.4 Admin duyet hotel
1. Admin xem danh sach hotel trong dashboard `/admin`.
2. Admin cap nhat `approvalStatus` + `approvalNote` qua `PUT /admin/hotels/{id}/approval`.
3. He thong tao notification cho host khi trang thai duyet thay doi.

Ghi chu scope:
- Admin panel UI hien tai tap trung workflow duyet hotel.
- CRUD hotel/upload image van ton tai o API `/hotels/*` cho nhu cau van hanh ky thuat.

### 5.5 Cap nhat email tai khoan
1. User goi `PUT /users/me/email`.
2. Server kiem tra trung email.
3. Server cap nhat email va phat hanh access token moi.

## 6. Thiet ke upload media
- Endpoint: `POST /hotels/{id}/image`.
- Input: multipart file.
- Validate content-type phai la `image/*`.
- Luu file tai `uploads/` trong root project.
- `WebConfig` map static resource qua `/uploads/**`.

## 7. Error handling
- Dung custom exception theo domain (`BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`).
- `GlobalExceptionHandler` tra JSON thong nhat:
```json
{ "error": "message", "message": "message", "status": 400, "timestamp": "..." }
```
- HTTP status duoc map theo loai exception (400/401/403/404/500).

## 8. Deployment view (local)
- Backend: Spring Boot tai `http://localhost:8080`.
- Frontend: Vite tai `http://localhost:5173`.
- Database: MongoDB local.
- Swagger UI: `/swagger-ui/index.html`.

## 9. Diem can can nhac khi mo rong
- Tach role `HOST` rieng neu can kiem soat quyen chat hon.
- Bo sung soft delete va audit log day du cho booking/hotel/room.
- Bo sung business-flow integration test cho host + booking + admin.
- Bo sung rate limit va secret management an toan hon (env/secret vault).

## 10. So do Mermaid
- Xem file so do ERD va sequence tai `docs/Architecture-Diagrams.md`.
