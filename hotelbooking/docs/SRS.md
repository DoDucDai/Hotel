# Software Requirements Specification (SRS)

## 1. Muc dich tai lieu
Tai lieu nay mo ta yeu cau he thong dat phong khach san cua project `hotelbooking`, lam co so cho phat trien, kiem thu va van hanh.

## 2. Pham vi he thong
He thong cung cap:
- Tim kiem khach san, xem chi tiet, xem phong.
- Dat phong theo khoang ngay.
- Quan ly tai khoan nguoi dung (ho so, email).
- Quan ly noi dung dang phong (hotel/room) cho nguoi dung co quyen host.
- Quan tri he thong (dashboard thong ke, quan ly user).

## 3. Dinh nghia vai tro
- Guest: nguoi chua dang nhap.
- User: nguoi da dang nhap vai tro `USER`.
- Host capability: nguoi dung `USER` co the tao/sua/xoa hotel va room cua chinh minh qua module `/host`.
- Admin: nguoi dung vai tro `ADMIN`, co quyen quan tri cao nhat.

## 4. Mo ta tong quan
### 4.1 Product perspective
- Frontend: React + Vite (`hotelbooking-frontend`).
- Backend: Spring Boot REST API.
- Database: MongoDB.
- Auth: JWT access token + refresh token.

### 4.2 Luong chinh
- Guest vao Home, Hotels, Hotel Detail.
- Khi dat phong, nguoi dung phai dang nhap.
- User dat phong xong co the xem lich su dat phong.
- User co the cap nhat profile va email.
- User co the quan ly hotel/room cua minh trong khu host.
- Admin theo doi dashboard va quan ly tai nguyen he thong.

## 5. Functional Requirements
### FR-01 Dang ky
- He thong cho phep tao tai khoan voi ten, email, password.
- Mat khau duoc ma hoa BCrypt truoc khi luu.
- Role mac dinh cua dang ky thuong la `USER`.

### FR-02 Dang nhap
- He thong xac thuc bang email/password.
- Tra ve `accessToken`, `refreshToken`, `role`.

### FR-03 Lam moi phien dang nhap
- He thong ho tro lam moi access token bang refresh token hop le.

### FR-04 Quan ly khach san cong khai
- Guest/User/Admin deu co the:
- Xem danh sach hotel co phan trang.
- Xem chi tiet hotel.
- Tim hotel theo thanh pho.

### FR-05 Quan ly khach san theo admin
- Admin co the tao/sua/xoa hotel.
- Admin co the upload anh hotel.

### FR-06 Quan ly phong
- Tat ca role co the xem danh sach phong va phong theo hotel.
- User/Guest co the tim phong theo ngay va so khach.
- Chi Admin duoc truy cap API `/rooms` cho thao tac tao/sua/xoa truc tiep.

### FR-07 Dat phong
- User/Admin co the tao booking.
- He thong kiem tra:
- `checkOutDate` phai sau `checkInDate`.
- Khong duoc trung lich voi booking da ton tai cua cung room.
- Tong tien = `room.price * so_ngay`.

### FR-08 Huy booking
- User/Admin co the xoa booking theo id (theo implementation hien tai chua rang buoc owner khi xoa).

### FR-09 Lich su dat phong cua toi
- User/Admin co the lay danh sach booking cua chinh minh qua `/bookings/my`.

### FR-10 Quan ly tai khoan
- User/Admin co the xem tai khoan hien tai (`/users/me`).
- User/Admin co the cap nhat profile (name, gender, dateOfBirth, citizenId).
- User/Admin co the doi email; sau doi email he thong cap access token moi.

### FR-11 Host module
- User/Admin co the quan ly hotel cua minh:
- Xem danh sach hotel cua minh.
- Tao/sua/xoa hotel.
- User/Admin co the quan ly room cua minh:
- Xem danh sach room cua minh.
- Tao/sua/xoa room.
- He thong kiem tra quyen so huu hotel/room truoc thao tac.

### FR-12 Admin dashboard
- Admin co the xem dashboard thong ke:
- Tong users, hotels, rooms, bookings, tong doanh thu.

### FR-13 Tu dang xuat khi khong hoat dong
- Frontend co co che timeout 10 phut khong thao tac.
- Het han se xoa token localStorage va dieu huong ve trang login kem toast thong bao.

## 6. Non-Functional Requirements
### NFR-01 Bao mat
- JWT duoc gui qua header `Authorization: Bearer <token>`.
- Phan quyen theo role tren Spring Security va method security.
- Mat khau duoc hash bang BCrypt.

### NFR-02 Hieu nang
- API danh sach co ho tro phan trang (`/hotels`, `/rooms`).
- Tim kiem phong theo dieu kien ngay va suc chua.

### NFR-03 Kha nang mo rong
- Kien truc tach frontend/backend.
- Co the scale backend/doc lap voi frontend.

### NFR-04 Kha dung va UX
- Co toast thong bao thong nhat tren frontend.
- Luong dieu huong co guard (ProtectedRoute) cho cac trang can dang nhap.

### NFR-05 Kha nang bao tri
- Backend to chuc theo layer: controller, service, repository, model, dto.
- Co OpenAPI/Swagger de theo doi hop dong API.

## 7. Ranh buoc ky thuat
- Java + Spring Boot.
- MongoDB local: `mongodb://localhost:27017/hotelbooking`.
- Frontend React Vite, axios call backend `http://localhost:8080`.

## 8. Gia dinh
- Moi user co the dong vai tro host thong qua module `/host` (khong co role HOST rieng).
- Upload anh hotel luu trong thu muc `uploads/` tai root project.
- Error nghiep vu tra ve dang JSON: `{ "error": "..." }`.

## 9. Tieu chi chap nhan
- User co the dang ky/dang nhap/refresh token thanh cong.
- User co the tim phong, dat phong va xem lich su booking cua minh.
- User co the cap nhat profile va doi email.
- Host co the quan ly hotel/room cua minh.
- Admin xem duoc dashboard va quan ly user.
