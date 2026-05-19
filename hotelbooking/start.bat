@echo off
echo ========================================================
echo Starting Hotel Booking Backend and Frontend...
echo ========================================================

echo Starting Spring Boot Backend...
start "Backend" cmd /k ".\mvnw spring-boot:run"

echo Starting Vite Frontend...
start "Frontend" cmd /k "cd hotelbooking-frontend && npm run dev"

echo Both services are starting in separate windows.
echo - Backend will be available at http://localhost:8080 (usually)
echo - Frontend will be available at http://localhost:5173 (usually)
echo.
echo Press any key to close this launcher...
pause >nul
