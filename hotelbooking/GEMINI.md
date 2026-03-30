# Gemini Project Instructions for HotelBooking

This file provides context and instructions for the Gemini CLI agent working on this project.

## Project Overview

This is a hotel booking application.
- The backend is a Java/Maven application located in the `hotelbooking` directory.
- The frontend is a React application located in the `hotelbooking/hotelbooking-frontend` directory.

## Backend (Java/Maven)

### How to build:
From the `hotelbooking` directory, run:
```bash
./mvnw clean install
```

### How to run:
From the `hotelbooking` directory, run:
```bash
./mvnw spring-boot:run
```
The backend will be available at `http://localhost:8080`.

## Frontend (React)

### How to install dependencies:
From the `hotelbooking/hotelbooking-frontend` directory, run:
```bash
npm install
```

### How to run the development server:
From the `hotelbooking/hotelbooking-frontend` directory, run:
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173` and will connect to the backend at `http://localhost:8080`.

## General Instructions

- Please follow existing code conventions.
- Add tests for new features.
- Keep the API documentation (`docs/API-Documentation.md`) updated.
