# Hotel Booking Project

Hotel booking platform with Spring Boot (backend) + React/Vite (frontend).

## 1. Tech Stack
- Backend: Java 17, Spring Boot 3, Spring Security, Spring Data MongoDB
- Frontend: React 18, Vite, React Router, Axios
- Database: MongoDB
- Auth: JWT access token + refresh token
- Extra modules: host inventory calendar, coupon, dispute, audit log, notification center

## 2. Project Structure
- `src/main/java/com/example/hotelbooking`
  - `controller`: REST endpoints
  - `service`: business logic
  - `repository`: MongoDB access
  - `model`: domain models
  - `dto`: request/response DTOs
  - `config`, `security`, `exception`
- `hotelbooking-frontend/src`
  - `pages`: screens
  - `components`: reusable UI
  - `services`: API calls
  - `routes`, `utils`
- `docs/`: design, SRS, DB and API docs

## How to find code in 30s
From project root (`hotelbooking`), use:

```powershell
.\scripts\find-code.ps1 "booking"
.\scripts\find-code.ps1 "wishlist"
.\scripts\find-code.ps1 "/auth/refresh"
```

Fast lookup flow:
- Step 1: check route in `hotelbooking-frontend/src/App.jsx`
- Step 2: open page in `hotelbooking-frontend/src/pages/*`
- Step 3: open API call in `hotelbooking-frontend/src/services/*`
- Step 4: jump to backend `controller/*Controller.java` then `service/*Service.java`
- Step 5: for auth/permission issues, check `config/SecurityConfig.java`

Feature map:
- `docs/CODEMAP.md`

## 3. Main Features
- Authentication: register/login/refresh/verify email/forgot-reset password
- Public catalog: hotels, rooms, recommendations, search filters
- Booking flow: create/reschedule/cancel, payment status, booking status
- Host panel:
  - manage hotels/rooms
  - room inventory by date + inventory blocks
  - host dashboard (bookings + revenue snapshot)
- Admin panel:
  - global dashboard, users, bookings, hotels approval
  - coupons, disputes, audit logs
- Notification pipeline:
  - in-app notifications API (`/notifications/*`)
  - optional email notifications for key events

## 4. Prerequisites
- Java 17+
- Maven (or use `mvnw`)
- Node.js 18+
- MongoDB running locally (default: `mongodb://localhost:27017/hotelbooking`)

## 5. Run Backend
```powershell
./mvnw spring-boot:run
```

Backend base URL: `http://localhost:8080`

Swagger: `http://localhost:8080/swagger-ui/index.html`

## 6. Run Frontend
```powershell
cd hotelbooking-frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

## 7. Configuration
Main config files:
- `src/main/resources/application.properties`
- `src/main/resources/application-local.properties` (local override)

Recommended environment variables:
- `JWT_SECRET` (required, >= 48 bytes)
- `ALLOWED_ORIGINS` (comma-separated)
- `APP_BACKEND_URL` (default `http://localhost:8080`)
- `PAYMENT_SANDBOX_SECRET` (used to sign sandbox checkout/webhook)
- `MAIL_USERNAME`, `MAIL_PASSWORD`, `APP_MAIL_FROM`
- `APP_FRONTEND_URL`
- `APP_BOOTSTRAP_ADMIN_ENABLED`, `APP_BOOTSTRAP_ADMIN_EMAIL`, `APP_BOOTSTRAP_ADMIN_PASSWORD` (optional first-admin bootstrap for local/dev)
- `APP_DEMO_SEED_ENABLED`, `APP_DEMO_SEED_PASSWORD` (optional demo data seed for local UI flow)

Optional project `.env` workflow:
- Copy `.env.example` -> `.env` and fill local values.
- `.env` is git-ignored, only `.env.example` is committed.

Demo seed for local testing:
- Set `APP_DEMO_SEED_ENABLED=true` and `APP_DEMO_SEED_PASSWORD=Demo123!` in `.env`
- Restart backend once to seed idempotent demo data:
  - admin: `demo.admin@hotelbooking.local`
  - host: `demo.host@hotelbooking.local`
  - user: `demo.user@hotelbooking.local`

## 8. Testing
Backend:
```powershell
./mvnw test
```

Frontend:
```powershell
cd hotelbooking-frontend
npm run build
npm run lint
npm run test
```

## 9. API Highlights
- Auth: `/auth/*`
- Hotels: `/hotels/*`
- Rooms: `/rooms/*`
- Bookings: `/bookings/*`
- Payments: `/payments/checkout/{bookingId}`, `/payments/webhook/sandbox`
- Host: `/host/*`
- Admin: `/admin/*`
- Notifications: `/notifications/*`

## 10. Observability
- Request tracing: every response includes `X-Request-Id`
- Health/info: `/actuator/health`, `/actuator/info`
- Basic metrics endpoint: `/actuator/metrics`

## 11. Notes
- Upload images are served from `/uploads/**`.
- `application-local.properties` is git-ignored for local secrets.
- If you see malformed Vietnamese text in terminal, ensure UTF-8 encoding in shell/editor.
