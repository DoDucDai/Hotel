# QA Round 2.1 - Role-based Bug Log

Date: 2026-04-09  
Scope: Code-level checklist theo role `guest/user/host/admin` va doi chieu luong nghiep vu.

## Priority Legend
- P1: Critical security/data exposure
- P2: High business/data integrity risk
- P3: Medium consistency/policy gap

## Findings

### R21-P1-01 - Guest co the lay thong tin STK nhan tien cua host
- Priority: P1
- Role impact: Guest, User
- Scenario:
1. Goi `GET /rooms` hoac `GET /rooms/{id}` de lay `roomId`.
2. Goi `GET /payments/instructions?roomId=<roomId>` khong can dang nhap.
- Actual:
- API tra ve `providerName`, `accountName`, `accountNumber` cua tai khoan nhan tien host (neu host da cau hinh).
- Expected:
- Endpoint nay khong nen public thong tin payout chi tiet theo `roomId` cho guest.
- Nen yeu cau auth va/hoac chi tra ve thong tin da mask.
- Evidence:
- `src/main/java/com/example/hotelbooking/config/SecurityConfig.java` (permitAll GET `/payments/instructions`)
- `src/main/java/com/example/hotelbooking/controller/PaymentController.java` (`@GetMapping("/instructions")`, cho phep auth null)
- `src/main/java/com/example/hotelbooking/service/PaymentService.java` (`getPaymentInstructions(roomId, requesterEmail)` + `resolvePayoutUserForRoomId`)

### R21-P1-02 - User thuong xem duoc doanh thu tong va booking theo room bat ky
- Priority: P1
- Role impact: User (bao gom host capability vi cung role USER)
- Scenario A:
1. Dang nhap bang tai khoan USER khong phai admin.
2. Goi `GET /bookings/revenue`.
- Scenario B:
1. Dang nhap USER bat ky.
2. Goi `GET /bookings/room/{roomId}` voi `roomId` khong thuoc minh.
- Actual:
- User thuong xem duoc tong doanh thu he thong.
- User thuong xem duoc danh sach booking theo room id bat ky.
- Expected:
- 2 endpoint tren chi nen cho ADMIN (hoac host owner co bo loc ownership ro rang).
- Evidence:
- `src/main/java/com/example/hotelbooking/config/SecurityConfig.java` (`/bookings/**` cho `USER`,`ADMIN`)
- `src/main/java/com/example/hotelbooking/controller/BookingController.java` (`/room/{roomId}` va `/revenue` khong co `@PreAuthorize`)
- `src/main/java/com/example/hotelbooking/service/BookingService.java` (`getBookingsByRoom`, `getTotalRevenue` khong check role/ownership)

### R21-P2-01 - Host/Admin co the xoa room/hotel du dang co booking active/future
- Priority: P2
- Role impact: Host, Admin, User da dat phong
- Scenario A:
1. Tao booking cho 1 room.
2. Host xoa room do qua host module.
- Scenario B:
1. Hotel co rooms dang co booking.
2. Host xoa hotel.
- Actual:
- He thong xoa room/hotel va inventory blocks ma khong chan theo booking dang ton tai.
- Co nguy co tao booking mo coi (roomId/hotelId khong con ton tai).
- Expected:
- Chan xoa neu con booking active/future (hoac bat buoc flow archive/soft-delete + migration).
- Evidence:
- `src/main/java/com/example/hotelbooking/service/HostRoomService.java` (`deleteRoom`)
- `src/main/java/com/example/hotelbooking/service/HostHotelService.java` (`deleteHotel`)

### R21-P2-02 - Public room API co the lo room cua hotel chua duoc duyet
- Priority: P2
- Role impact: Guest, User
- Scenario:
1. Host tao/cap nhat hotel => status `PENDING`.
2. Goi `GET /rooms`, `GET /rooms/search`, `GET /rooms/hotel/{hotelId}`.
- Actual:
- RoomService lay room truc tiep tu repository, khong loc theo `HotelApprovalStatus`.
- Du lieu room co the xuat hien cong khai du hotel chua approved.
- Expected:
- Public room list/search chi nen hien room thuoc hotel `APPROVED`.
- Evidence:
- `src/main/java/com/example/hotelbooking/config/SecurityConfig.java` (GET `/rooms/**` permitAll)
- `src/main/java/com/example/hotelbooking/service/RoomService.java` (khong check approval status)
- `src/main/java/com/example/hotelbooking/service/HotelCatalogService.java` (`isPublicHotel` co loc `APPROVED` cho hotel catalog)

### R21-P3-01 - Login cho phep tai khoan chua verify email
- Priority: P3
- Role impact: User
- Scenario:
1. Dang ky tai khoan moi.
2. Khong verify email, van login bang email/password.
- Actual:
- Login thanh cong, response chi tra `emailVerified=false` nhung khong chan dang nhap.
- Expected:
- Neu policy yeu cau verify truoc khi su dung, can block login hoac han che capability.
- Evidence:
- `src/main/java/com/example/hotelbooking/service/AuthService.java` (`login` khong check `emailVerified` truoc khi cap token)

## Recommended Fix Order
1. P1: Khoa lai quyen `/payments/instructions`, `/bookings/revenue`, `/bookings/room/{roomId}`.
2. P2: Chan xoa room/hotel khi con booking active/future; bo sung test regression.
3. P2: Loc room public theo hotel da approved.
4. P3: Chot policy email verification va update auth flow + UI message tuong ung.
