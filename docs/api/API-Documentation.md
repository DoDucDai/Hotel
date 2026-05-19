# API Documentation

## 1. Thong tin chung
- Base URL: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## 2. Xac thuc
Su dung header:
```http
Authorization: Bearer <accessToken>
```

## 3. Quy uoc response loi
He thong bat `RuntimeException` va tra:
```json
{
  "error": "Noi dung loi"
}
```
HTTP status thuong gap:
- `400 Bad Request` (validate/nghiep vu)
- `401 Unauthorized` (thieu/het han token, tuy theo filter/security)
- `403 Forbidden` (khong du quyen)
- `404 Not Found` (mot so endpoint tra custom body)

## 4. Auth APIs (`/auth`)

### 4.1 Dang ky
- Method: `POST`
- Path: `/auth/register`
- Auth: Khong can
- Body:
```json
{
  "name": "Nguyen Van A",
  "email": "a@example.com",
  "password": "123456"
}
```
- Response:
```json
{ "message": "User registered successfully" }
```

### 4.2 Dang nhap
- Method: `POST`
- Path: `/auth/login`
- Auth: Khong can
- Body:
```json
{
  "email": "a@example.com",
  "password": "123456"
}
```
- Response:
```json
{
  "accessToken": "jwt...",
  "refreshToken": "uuid...",
  "role": "USER"
}
```

### 4.3 Refresh access token
- Method: `POST`
- Path: `/auth/refresh`
- Auth: Khong can
- Query: `refreshToken=<token>`
- Response:
```json
{ "accessToken": "jwt..." }
```

### 4.4 Tao admin
- Method: `POST`
- Path: `/auth/create-admin`
- Auth: Khong can (theo security hien tai)
- Body: giong register
- Response:
```json
{ "message": "Admin created successfully" }
```

## 5. User APIs (`/users`)

### 5.1 Lay danh sach user
- Method: `GET`
- Path: `/users`
- Auth: `ADMIN`
- Response: `User[]`

### 5.2 Lay user theo id
- Method: `GET`
- Path: `/users/{id}`
- Auth: `ADMIN`
- Response: `User`

### 5.3 Tao user (admin)
- Method: `POST`
- Path: `/users`
- Auth: `ADMIN`
- Body: `User`
- Response: `User`

### 5.4 Cap nhat user theo id
- Method: `PUT`
- Path: `/users/{id}`
- Auth: `ADMIN`
- Body: `User`
- Response: `User`

### 5.5 Xoa user
- Method: `DELETE`
- Path: `/users/{id}`
- Auth: `ADMIN`
- Response: `204 No Content`

### 5.6 Lay thong tin tai khoan hien tai
- Method: `GET`
- Path: `/users/me`
- Auth: `USER` hoac `ADMIN`
- Response: `UserAccountResponse`
```json
{
  "id": "userId",
  "name": "Nguyen Van A",
  "email": "a@example.com",
  "role": "USER",
  "gender": "Nam",
  "dateOfBirth": "2000-01-01",
  "citizenId": "012345678901"
}
```

### 5.7 Cap nhat profile hien tai
- Method: `PUT`
- Path: `/users/me/profile`
- Auth: `USER` hoac `ADMIN`
- Body:
```json
{
  "name": "Nguyen Van A",
  "gender": "Nam",
  "dateOfBirth": "2000-01-01",
  "citizenId": "012345678901"
}
```
- Response: `UserAccountResponse`

### 5.8 Cap nhat email hien tai
- Method: `PUT`
- Path: `/users/me/email`
- Auth: `USER` hoac `ADMIN`
- Body:
```json
{
  "email": "new@example.com"
}
```
- Response:
```json
{
  "message": "Email updated successfully",
  "accessToken": "jwt_moi...",
  "role": "USER",
  "user": {
    "id": "userId",
    "name": "Nguyen Van A",
    "email": "new@example.com",
    "role": "USER",
    "gender": "Nam",
    "dateOfBirth": "2000-01-01",
    "citizenId": "012345678901"
  }
}
```

## 6. Hotel APIs (`/hotels`)

### 6.1 Lay danh sach hotel (phan trang)
- Method: `GET`
- Path: `/hotels`
- Auth: Public
- Query:
- `page` (default `0`)
- `size` (default `10`)
- Response:
```json
{
  "content": [ { "id": "...", "name": "...", "city": "..." } ],
  "totalPages": 10,
  "totalElements": 95,
  "currentPage": 0
}
```

### 6.2 Lay hotel theo id
- Method: `GET`
- Path: `/hotels/{id}`
- Auth: Public
- Response:
- `200`: `Hotel`
- `404`: `"Hotel not found"`

### 6.3 Tao hotel
- Method: `POST`
- Path: `/hotels`
- Auth: `ADMIN` (method-level preauthorize)
- Body:
```json
{
  "name": "Moma Paris Ninh Binh",
  "address": "123 Tran Hung Dao",
  "city": "Ninh Binh",
  "imageUrl": "/uploads/demo.jpg"
}
```
- Response: `Hotel`

### 6.4 Cap nhat hotel
- Method: `PUT`
- Path: `/hotels/{id}`
- Auth: `ADMIN`
- Body: `Hotel` (name, address, city duoc cap nhat)
- Response: `Hotel` hoac `404`

### 6.5 Xoa hotel
- Method: `DELETE`
- Path: `/hotels/{id}`
- Auth: `ADMIN`
- Response:
```json
{ "message": "Deleted successfully" }
```

### 6.6 Tim hotel theo city
- Method: `GET`
- Path: `/hotels/search`
- Auth: Public
- Query:
- `city` (bat buoc)
- `page` (default `0`)
- `size` (default `10`)
- Response:
```json
{
  "content": [ { "id": "...", "city": "Da Nang" } ],
  "totalPages": 3
}
```

### 6.7 Upload anh hotel
- Method: `POST`
- Path: `/hotels/{id}/image`
- Auth: `ADMIN`
- Content-Type: `multipart/form-data`
- Field file: `file`
- Response: `Hotel` da cap nhat `imageUrl`

## 7. Room APIs (`/rooms`)

### 7.1 Lay danh sach room (phan trang)
- Method: `GET`
- Path: `/rooms`
- Auth: Public
- Query: `page`, `size`
- Response: `Page<RoomDTO>`

### 7.2 Lay room theo id
- Method: `GET`
- Path: `/rooms/{id}`
- Auth: Public
- Response: `Room`

### 7.3 Tao room
- Method: `POST`
- Path: `/rooms`
- Auth: `ADMIN`
- Body:
```json
{
  "hotelId": "hotelId",
  "name": "Deluxe Double",
  "capacity": 2,
  "price": 45.5
}
```
- Response: `Room`

### 7.4 Cap nhat room
- Method: `PUT`
- Path: `/rooms/{id}`
- Auth: `ADMIN`
- Body: `Room`
- Response: `Room`

### 7.5 Xoa room
- Method: `DELETE`
- Path: `/rooms/{id}`
- Auth: `ADMIN`
- Response: empty

### 7.6 Tim room trong theo ngay
- Method: `GET`
- Path: `/rooms/available`
- Auth: Public
- Query:
- `checkIn` (yyyy-MM-dd)
- `checkOut` (yyyy-MM-dd)
- Response: `Room[]`

### 7.7 Tim room theo ngay + so khach
- Method: `GET`
- Path: `/rooms/search`
- Auth: Public
- Query:
- `guests` (default `1`)
- `checkIn` (optional)
- `checkOut` (optional)
- Rule:
- Neu thieu checkIn/checkOut thi chi loc theo suc chua.
- Response: `Room[]`

### 7.8 Lay room theo hotel
- Method: `GET`
- Path: `/rooms/hotel/{hotelId}`
- Auth: Public
- Response: `Room[]`

## 8. Booking APIs (`/bookings`)

### 8.1 Lay tat ca booking
- Method: `GET`
- Path: `/bookings`
- Auth: `USER` hoac `ADMIN` (theo security hien tai)
- Response: `Booking[]`

### 8.2 Tao booking
- Method: `POST`
- Path: `/bookings`
- Auth: `USER` hoac `ADMIN`
- Body:
```json
{
  "roomId": "roomId",
  "checkInDate": "2026-04-01",
  "checkOutDate": "2026-04-03"
}
```
- Server tu dong gan `userId` theo token va tinh `totalPrice`.
- Response:
```json
{
  "id": "bookingId",
  "userId": "userId",
  "roomId": "roomId",
  "checkInDate": "2026-04-01",
  "checkOutDate": "2026-04-03",
  "totalPrice": 91.0
}
```

### 8.3 Xoa booking
- Method: `DELETE`
- Path: `/bookings/{id}`
- Auth: `USER` hoac `ADMIN`
- Response: empty

### 8.4 Lay booking theo room
- Method: `GET`
- Path: `/bookings/room/{roomId}`
- Auth: `USER` hoac `ADMIN`
- Response: `Booking[]`

### 8.5 Tong doanh thu booking
- Method: `GET`
- Path: `/bookings/revenue`
- Auth: `USER` hoac `ADMIN`
- Response: `number`

### 8.6 Lich su booking cua toi
- Method: `GET`
- Path: `/bookings/my`
- Auth: `USER` hoac `ADMIN`
- Response: `Booking[]`

## 9. Host APIs (`/host`)

### 9.1 Hotel host
- `GET /host/hotels/my`: lay hotel cua owner hien tai (admin se thay tat ca).
- `POST /host/hotels`: tao hotel moi va gan `ownerId` theo user dang nhap.
- `PUT /host/hotels/{id}`: cap nhat hotel neu la owner hoac admin.
- `DELETE /host/hotels/{id}`: xoa hotel neu la owner hoac admin; xoa kem room thuoc hotel.

Body tao/cap nhat hotel:
```json
{
  "name": "Hotel ABC",
  "address": "123 Nguyen Hue",
  "city": "Ho Chi Minh",
  "imageUrl": "/uploads/abc.jpg"
}
```

### 9.2 Room host
- `GET /host/rooms/my`: lay room cua owner hien tai (admin se thay tat ca).
- `POST /host/rooms`: tao room moi cho hotel thuoc owner.
- `PUT /host/rooms/{id}`: cap nhat room neu owner/admin.
- `DELETE /host/rooms/{id}`: xoa room neu owner/admin.

Body tao/cap nhat room:
```json
{
  "hotelId": "hotelId",
  "name": "Family Room",
  "capacity": 4,
  "price": 120.0
}
```

## 10. Admin APIs (`/admin`)

### 10.1 Dashboard thong ke
- Method: `GET`
- Path: `/admin/dashboard`
- Auth: `ADMIN`
- Response:
```json
{
  "totalUsers": 123,
  "totalHotels": 40,
  "totalRooms": 220,
  "totalBookings": 512,
  "totalRevenue": 95000.0
}
```

## 11. Static resource APIs
- `GET /uploads/{filename}`
- Auth: Public
- Dung de hien thi anh hotel da upload.
