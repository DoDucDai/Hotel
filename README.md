# 🏨 Hotel Booking System

A full-stack web application for hotel booking management, built with **Spring Boot**, **ReactJS**, and **MongoDB**.

---

## 📋 Overview

This platform supports three roles — **User**, **Admin**, and **Host** — with full booking lifecycle management, secure authentication, and payment integration.

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based login/register with access & refresh token
- Email verification, forgot password, and OTP-based password reset
- Role-Based Access Control (USER / ADMIN / HOST)
- BCrypt password hashing

### 🛏️ Booking Management
- Room availability search with date overlap validation
- Create, reschedule, and cancel bookings
- Coupon/discount pricing and refund policy handling
- Payment & booking status transitions
- Concurrent overbooking prevention via MongoDB room-level lock (retry + TTL)

### 💳 Payment
- Sandbox payment integration with HMAC-SHA256 signature validation
- Idempotent webhook handling to prevent duplicate processing

### 🛠️ Admin & Host Dashboard
- Hotel and room catalog management
- Booking oversight and user management
- Notification and audit log for critical actions

### 🧪 Testing & CI
- 35 JUnit/Mockito unit tests
- GitHub Actions CI for automated build/test checks

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3, Spring Security |
| Frontend | ReactJS |
| Database | MongoDB |
| Auth | JWT, BCrypt, Spring Mail |
| Testing | JUnit 5, Mockito |
| CI/CD | GitHub Actions |
| Docs | Swagger / OpenAPI |

---

## 📁 Project Structure

```
src/
├── controller/     # REST API endpoints (~91 endpoints, 16 controllers)
├── service/        # Business logic (25 services)
├── repository/     # Data access layer (14 repositories)
├── model/          # MongoDB document models
├── dto/            # Data Transfer Objects
└── config/         # Security, JWT, Mail config
```

---

## ⚙️ Getting Started

### Prerequisites
- Java 17+
- MongoDB
- Maven

### Run locally

```bash
# Clone the repo
git clone https://github.com/DoDucDai/Hotel.git
cd Hotel

# Configure environment variables in application.properties
# (MongoDB URI, JWT secret, Mail config, Payment secret)

# Build and run
./mvnw spring-boot:run
```

### API Documentation

Once running, visit:
```
http://localhost:8080/swagger-ui.html
```

---

## 🧪 Run Tests

```bash
./mvnw test
```

---

## 👤 Author

**Đỗ Đức Đại**  
📧 doducdai17042004@gmail.com  
🔗 [github.com/DoDucDai](https://github.com/DoDucDai)
