# Code Map (Find Feature Fast)

## 1) Start Point

- FE routes: `hotelbooking-frontend/src/App.jsx`
- BE routes: `src/main/java/com/example/hotelbooking/controller/*Controller.java`
- FE API calls: `hotelbooking-frontend/src/services/*.js`

## 2) Feature -> Where To Read

- Auth (login/register/forgot/reset/verify):
  - FE page: `hotelbooking-frontend/src/pages/Login.jsx`, `Register.jsx`, `Forgot.jsx`, `ResetPassword.jsx`, `VerifyEmail.jsx`
  - FE service: `hotelbooking-frontend/src/services/authService.js`
  - BE: `AuthController.java`, `AuthService.java`, `JwtUtil.java`, `SecurityConfig.java`

- Hotels list:
  - FE page: `hotelbooking-frontend/src/pages/HotelsEnhanced.jsx`
  - FE feature: `hotelbooking-frontend/src/features/hotels/*`
  - BE: `HotelController.java`, `HotelCatalogService.java`, `RoomController.java`

- Hotel detail:
  - FE page: `hotelbooking-frontend/src/pages/HotelDetailEnhanced.jsx`
  - FE feature: `hotelbooking-frontend/src/features/hotelDetail/*`
  - BE: `HotelController.java`, `ReviewController.java`, `RoomController.java`

- Booking:
  - FE page: `hotelbooking-frontend/src/pages/Booking.jsx`
  - FE feature: `hotelbooking-frontend/src/features/booking/bookingPageUtils.js`
  - BE: `BookingController.java`, `BookingService.java`, `CouponController.java`

- Payments:
  - FE trigger: `hotelbooking-frontend/src/pages/Booking.jsx`
  - FE service: `hotelbooking-frontend/src/services/bookingService.js`
  - BE: `PaymentController.java`, `PaymentService.java`

- Account:
  - FE page: `hotelbooking-frontend/src/pages/AccountEnhanced.jsx`
  - FE feature: `hotelbooking-frontend/src/features/account/*`
  - BE: `UserController.java`, `UserService.java`, `WishlistController.java`

- Host:
  - FE page: `hotelbooking-frontend/src/pages/HostRooms.jsx`
  - FE feature: `hotelbooking-frontend/src/features/host/*`
  - BE: `HostDashboardController.java`, `HostHotelController.java`, `HostRoomController.java`, `HostInventoryController.java`

- Admin:
  - FE page: `hotelbooking-frontend/src/pages/AdminDashboard.jsx`
  - FE feature: `hotelbooking-frontend/src/features/admin/*`
  - BE: `AdminController.java`, `AdminService.java`

- Notifications:
  - FE use: `hotelbooking-frontend/src/components/Navbar.jsx`
  - FE service: `hotelbooking-frontend/src/services/notificationService.js`
  - BE: `NotificationController.java`, `NotificationService.java`

## 3) 30-Second Search Commands

- One command search all FE+BE:
  - `.\scripts\find-code.ps1 "keyword"`

- Find UI text:
  - `rg -n "text_can_tim" hotelbooking-frontend/src`

- Find endpoint usage from FE:
  - `rg -n "/auth/refresh|/bookings|/hotels" hotelbooking-frontend/src/services`

- Find function name everywhere:
  - `rg -n "handleBookingStatusUpdate|createAdmin|refreshToken"`

- Find controller/service quickly:
  - `rg --files src/main/java/com/example/hotelbooking | rg "Controller|Service"`

## 4) Rule To Keep Search Fast

- New feature always put in `src/features/<feature-name>/...`
- FE page chỉ giữ orchestration, logic tách sang `features/*`
- Every API call must go through `hotelbooking-frontend/src/services/*.js` (không gọi `axios` trực tiếp trong page)
- Khi tạo file mới, đặt tên theo feature + intent:
  - `use<Feature>State.js`, `<Feature>Utils.js`, `<Feature>Section.jsx`
