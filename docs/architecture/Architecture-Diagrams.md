# Architecture Diagrams (Mermaid)

## 1. ERD
```mermaid
erDiagram
    USERS {
        string id PK
        string name
        string email UNIQUE
        string password_hash
        string role
        string gender
        string dateOfBirth
        string citizenId
    }

    HOTELS {
        string id PK
        string ownerId FK
        string name
        string address
        string city
        string imageUrl
    }

    ROOMS {
        string id PK
        string ownerId FK
        string hotelId FK
        string name
        int capacity
        double price
    }

    BOOKING {
        string id PK
        string userId FK
        string roomId FK
        date checkInDate
        date checkOutDate
        double totalPrice
    }

    REFRESH_TOKENS {
        string id PK
        string userId FK
        string token
        datetime expiryDate
    }

    USERS ||--o{ HOTELS : owns
    USERS ||--o{ ROOMS : owns
    HOTELS ||--o{ ROOMS : contains
    USERS ||--o{ BOOKING : creates
    ROOMS ||--o{ BOOKING : booked_in
    USERS ||--o{ REFRESH_TOKENS : has
```

## 2. Sequence Diagram - Login + Token Issue
```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend (React)
    participant AC as AuthController
    participant UR as UserRepository
    participant JWT as JwtUtil
    participant RTS as RefreshTokenService

    U->>FE: Submit email/password
    FE->>AC: POST /auth/login
    AC->>UR: findByEmail(email)
    UR-->>AC: User
    AC->>AC: Verify password (BCrypt)

    alt Invalid credentials
        AC-->>FE: 400 { error }
        FE-->>U: Show error toast
    else Valid credentials
        AC->>JWT: generateToken(email, role)
        AC->>RTS: createRefreshToken(userId)
        RTS-->>AC: refreshToken
        AC-->>FE: 200 { accessToken, refreshToken, role }
        FE-->>U: Login success + navigate
    end
```

## 3. Sequence Diagram - Search Room + Create Booking
```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend
    participant RC as RoomController
    participant RS as RoomService
    participant RR as RoomRepository
    participant BR as BookingRepository
    participant BC as BookingController
    participant BS as BookingService
    participant UR as UserRepository

    U->>FE: Search rooms (checkIn/checkOut/guests)
    FE->>RC: GET /rooms/search
    RC->>RS: searchRooms(checkIn, checkOut, guests)
    RS->>RR: findByCapacityGreaterThanEqual(guests)
    RR-->>RS: Candidate rooms
    RS->>BR: findByCheckInDateLessThanEqualAndCheckOutDateGreaterThanEqual(...)
    BR-->>RS: Existing bookings
    RS-->>RC: Available rooms
    RC-->>FE: 200 rooms[]

    U->>FE: Click "Dat phong"
    FE->>BC: POST /bookings (Bearer token, roomId, dates)
    BC->>UR: findByEmail(authentication.name)
    UR-->>BC: Current user
    BC->>BS: createBooking(booking with userId)

    BS->>BR: findByRoomId(roomId)
    BR-->>BS: Room bookings

    alt Date overlap
        BS-->>BC: throw RuntimeException
        BC-->>FE: 400 { error: "Room already booked..." }
        FE-->>U: Show error toast
    else Valid date
        BS->>RR: findById(roomId)
        RR-->>BS: Room(price)
        BS->>BS: totalPrice = price * numberOfDays
        BS->>BR: save(booking)
        BR-->>BS: Saved booking
        BS-->>BC: Booking
        BC-->>FE: 200 booking
        FE-->>U: Booking success
    end
```

## 4. Ghi chu su dung
- Ban co the dan truc tiep cac block Mermaid nay vao:
- GitHub Markdown (neu repo co ho tro Mermaid)
- Mermaid Live Editor
- Cong cu docs noi bo co plugin Mermaid
