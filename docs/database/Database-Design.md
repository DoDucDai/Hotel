# Database Design

## 1. Tong quan
- Database: MongoDB.
- Database name: `hotelbooking`.
- Kieu luu tru: document-based theo collection.

## 2. Danh sach collection
- `users`
- `hotels`
- `rooms`
- `booking`
- `refresh_tokens`

## 3. Chi tiet schema

### 3.1 Collection `users`
Muc dich: Luu thong tin tai khoan, role, profile.

| Field | Type | Bat buoc | Mo ta |
|---|---|---|---|
| `_id` | String (ObjectId stringify) | Yes | ID user |
| `name` | String | No | Ho ten |
| `email` | String | Yes | Email dang nhap, unique |
| `password` | String | Yes | Password da hash BCrypt |
| `role` | String enum (`USER`, `ADMIN`) | Yes | Quyen he thong |
| `gender` | String | No | Gioi tinh |
| `dateOfBirth` | String | No | Ngay sinh |
| `citizenId` | String | No | CCCD/CMND |

Index hien co:
- Unique index tren `email` (`@Indexed(unique = true)`).

### 3.2 Collection `hotels`
Muc dich: Luu thong tin khach san.

| Field | Type | Bat buoc | Mo ta |
|---|---|---|---|
| `_id` | String | Yes | ID hotel |
| `ownerId` | String | No | User so huu hotel |
| `name` | String | Yes (logic) | Ten khach san |
| `address` | String | Yes (logic) | Dia chi |
| `city` | String | Yes (logic) | Thanh pho |
| `imageUrl` | String | No | Link anh dai dien |

Ghi chu:
- `ownerId` dung cho host module de phan quyen.

### 3.3 Collection `rooms`
Muc dich: Luu thong tin phong.

| Field | Type | Bat buoc | Mo ta |
|---|---|---|---|
| `_id` | String | Yes | ID room |
| `ownerId` | String | No | User so huu room |
| `hotelId` | String | Yes (logic) | ID hotel cha |
| `name` | String | Yes | Ten phong |
| `capacity` | Number (int) | Yes | So khach toi da (>=1) |
| `price` | Number (double) | Yes | Gia phong (>=0) |

Ghi chu:
- Co validation annotation `@NotBlank`, `@Min`.
- `hotelId` la tham chieu logic toi `hotels._id`.

### 3.4 Collection `booking`
Muc dich: Luu don dat phong.

| Field | Type | Bat buoc | Mo ta |
|---|---|---|---|
| `_id` | String | Yes | ID booking |
| `userId` | String | Yes | ID user dat phong |
| `roomId` | String | Yes | ID room dat |
| `checkInDate` | Date (LocalDate) | Yes | Ngay nhan phong |
| `checkOutDate` | Date (LocalDate) | Yes | Ngay tra phong |
| `totalPrice` | Number (double) | Yes | Tong tien booking |

Ghi chu:
- Service co check overlap lich dat theo `roomId`.
- Collection dat ten `booking` (so it), khong phai `bookings`.

### 3.5 Collection `refresh_tokens`
Muc dich: Luu refresh token de cap lai access token.

| Field | Type | Bat buoc | Mo ta |
|---|---|---|---|
| `_id` | String | Yes | ID token record |
| `userId` | String | Yes | User so huu token |
| `token` | String | Yes | Gia tri refresh token UUID |
| `expiryDate` | DateTime (Instant) | Yes | Han su dung token |

## 4. Quan he du lieu (logical)
- `users (1) -> (N) hotels` qua `hotels.ownerId`.
- `users (1) -> (N) rooms` qua `rooms.ownerId`.
- `hotels (1) -> (N) rooms` qua `rooms.hotelId`.
- `users (1) -> (N) booking` qua `booking.userId`.
- `rooms (1) -> (N) booking` qua `booking.roomId`.
- `users (1) -> (N) refresh_tokens` qua `refresh_tokens.userId`.

Luu y:
- MongoDB dang khong enforced foreign key; tham chieu duoc dam bao boi service/controller logic.

## 5. Truy van chinh dang su dung
- User:
- `findByEmail(email)`
- Hotel:
- `findByOwnerId(ownerId)`
- `findByCityContainingIgnoreCase(city, pageable)`
- `findByNameContainingIgnoreCase(name)`
- Room:
- `findByHotelId(hotelId)`
- `findByOwnerId(ownerId)`
- `findByCapacityGreaterThanEqual(guests)`
- Booking:
- `findByRoomId(roomId)`
- `findByUserId(userId)`
- `findByCheckInDateLessThanEqualAndCheckOutDateGreaterThanEqual(checkOut, checkIn)` de loc overlap.
- Refresh token:
- `findByToken(token)`

## 6. Index de xuat (khuyen nghi)
De toi uu khi du lieu lon:
- `hotels`: index `city`, index `ownerId`.
- `rooms`: index `hotelId`, index `ownerId`, compound index `(capacity, hotelId)`.
- `booking`: index `userId`, index `roomId`, compound index `(roomId, checkInDate, checkOutDate)`.
- `refresh_tokens`: unique index `token`, index `userId`, index `expiryDate` (phuc vu dọn rac).

## 7. Du lieu nhay cam va bao mat
- `users.password` luon luu hash, khong luu plain text.
- `citizenId` la PII, can han che log va che do truy cap.
- JWT secret hien dang hard-code trong code, khuyen nghi dua vao environment variables.

## 8. Chuan hoa du lieu khuyen nghi
- `dateOfBirth` hien la String; nen chuyen sang `LocalDate` de query/validate tot hon.
- `booking` nen doi ten collection thanh `bookings` neu can convention ro rang.
- Bo sung truong `createdAt`, `updatedAt` cho users/hotels/rooms/booking.

## 9. Sao luu va khoi phuc
- Backup dinh ky MongoDB (mongodump) theo ngay.
- Test restore (mongorestore) tren moi truong staging.
- Dat retention policy theo muc tieu RPO/RTO cua du an.
