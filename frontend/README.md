# Hotel Booking Frontend

React + Vite frontend for the Hotel Booking system.

## Stack
- React 18
- React Router
- Axios
- CSS modules by page/component

## Folder Overview
- `src/pages`: feature screens (`Home`, `Hotels`, `HotelDetail`, `Booking`, `Account`, `HostRooms`, `AdminDashboard`)
- `src/components`: reusable UI blocks
- `src/services`: API layer (preferred import path)
- `src/api`: legacy compatibility wrappers (do not add new code here)
- `src/utils`: helper utilities

## Run
```powershell
npm install
npm run dev
```

## Build & Lint
```powershell
npm run build
npm run lint
```

## Test
```powershell
npm run test
```

## API Base URL
Configured by env var `VITE_API_BASE_URL` (with fallback in `src/utils/apiConfig.js`).

Default backend URL:
- `http://localhost:8080`

Local setup:
- Copy `.env.example` -> `.env`
- Set `VITE_API_BASE_URL=http://localhost:8080`
- `.env` is git-ignored

## Conventions
- Put new API calls in `src/services/*`.
- Keep pages thin; extract reusable logic/components when file size grows.
- Avoid adding new direct calls in page files if a service already exists.
