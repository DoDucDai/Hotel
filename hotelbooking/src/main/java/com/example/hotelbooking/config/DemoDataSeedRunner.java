package com.example.hotelbooking.config;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.HotelApprovalStatus;
import com.example.hotelbooking.model.Notification;
import com.example.hotelbooking.model.PaymentMethod;
import com.example.hotelbooking.model.PaymentStatus;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.NotificationRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;

@Component
@ConditionalOnProperty(prefix = "app.demo-seed", name = "enabled", havingValue = "true")
public class DemoDataSeedRunner implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(DemoDataSeedRunner.class);

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo-seed.password:}")
    private String demoPassword;

    @Value("${app.demo-seed.admin-name:Demo Admin}")
    private String demoAdminName;

    @Value("${app.demo-seed.admin-email:demo.admin@hotelbooking.local}")
    private String demoAdminEmail;

    @Value("${app.demo-seed.host-name:Demo Host}")
    private String demoHostName;

    @Value("${app.demo-seed.host-email:demo.host@hotelbooking.local}")
    private String demoHostEmail;

    @Value("${app.demo-seed.user-name:Demo User}")
    private String demoUserName;

    @Value("${app.demo-seed.user-email:demo.user@hotelbooking.local}")
    private String demoUserEmail;

    public DemoDataSeedRunner(
            UserRepository userRepository,
            HotelRepository hotelRepository,
            RoomRepository roomRepository,
            BookingRepository bookingRepository,
            NotificationRepository notificationRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        String normalizedPassword = normalizePassword(demoPassword);
        if (normalizedPassword == null) {
            LOGGER.warn("Skip demo seed: APP_DEMO_SEED_PASSWORD is missing.");
            return;
        }

        User admin = ensureUser(demoAdminName, demoAdminEmail, Role.ADMIN, normalizedPassword, "Demo Admin");
        User host = ensureUser(demoHostName, demoHostEmail, Role.USER, normalizedPassword, "Demo Host");
        User guest = ensureUser(demoUserName, demoUserEmail, Role.USER, normalizedPassword, "Demo User");

        if (host == null || guest == null) {
            LOGGER.warn("Skip demo seed: host/user account cannot be prepared.");
            return;
        }

        Hotel approvedHotel = ensureHotel(
                host.getId(),
                "Sunrise Riverside Hotel",
                "Da Nang",
                "18 Bach Dang, Hai Chau",
                4,
                List.of("Free Wifi", "Rooftop Pool", "Airport Shuttle", "Breakfast"),
                List.of(
                        "https://picsum.photos/seed/hotel-sunrise-1/1280/720",
                        "https://picsum.photos/seed/hotel-sunrise-2/1280/720"),
                HotelApprovalStatus.APPROVED,
                admin == null ? null : admin.getId(),
                "Seed demo approved");

        Hotel pendingHotel = ensureHotel(
                host.getId(),
                "Cloud Nine Boutique",
                "Hoi An",
                "5 Nguyen Thi Minh Khai, Hoi An",
                3,
                List.of("City View", "24h Front Desk"),
                List.of("https://picsum.photos/seed/hotel-cloud-nine-1/1280/720"),
                HotelApprovalStatus.PENDING,
                null,
                "Awaiting admin review");

        Room deluxeRoom = ensureRoom(
                approvedHotel,
                host.getId(),
                "Deluxe River View",
                2,
                1_450_000,
                "DELUXE",
                "1 King Bed",
                6,
                "Phong view song, phu hop cho cap doi.",
                List.of("Wifi", "Ban cong", "Dieu hoa", "Smart TV"),
                List.of("https://picsum.photos/seed/room-deluxe-river/1280/720"));

        Room familyRoom = ensureRoom(
                approvedHotel,
                host.getId(),
                "Family Suite",
                4,
                2_200_000,
                "SUITE",
                "2 Queen Beds",
                4,
                "Can phong rong cho gia dinh 4 nguoi.",
                List.of("Wifi", "Bep mini", "Ban an", "May say toc"),
                List.of("https://picsum.photos/seed/room-family-suite/1280/720"));

        ensureRoom(
                pendingHotel,
                host.getId(),
                "Standard Cozy",
                2,
                920_000,
                "STANDARD",
                "1 Queen Bed",
                5,
                "Phong chuan cho nhu cau nghi ngan ngay.",
                List.of("Wifi", "Nuoc uong"),
                List.of("https://picsum.photos/seed/room-standard-cozy/1280/720"));

        LocalDate today = LocalDate.now();
        Booking completedBooking = ensureBooking(
                guest.getId(),
                deluxeRoom,
                today.minusDays(10),
                today.minusDays(8),
                BookingStatus.CHECKED_OUT,
                PaymentMethod.BANK_TRANSFER,
                PaymentStatus.PAID,
                "Booking demo da hoan tat",
                2,
                null,
                0);

        Booking upcomingBooking = ensureBooking(
                guest.getId(),
                familyRoom == null ? deluxeRoom : familyRoom,
                today.plusDays(5),
                today.plusDays(7),
                BookingStatus.CONFIRMED,
                PaymentMethod.PAY_AT_HOTEL,
                PaymentStatus.PENDING,
                "Booking demo sap toi",
                2,
                "WELCOME10",
                300_000);

        if (admin != null && pendingHotel != null) {
            ensureNotification(
                    admin.getId(),
                    "HOTEL_APPROVAL",
                    "Can duyet khach san moi",
                    "Host vua gui hotel " + pendingHotel.getName() + " cho ban duyet.",
                    "HOTEL",
                    pendingHotel.getId(),
                    false,
                    LocalDateTime.now().minusHours(3));
        }

        if (upcomingBooking != null) {
            ensureNotification(
                    host.getId(),
                    "HOST_BOOKING",
                    "Ban co booking moi",
                    "Phong cua ban vua co booking moi: " + upcomingBooking.getId(),
                    "BOOKING",
                    upcomingBooking.getId(),
                    false,
                    LocalDateTime.now().minusHours(2));
        }

        if (completedBooking != null) {
            ensureNotification(
                    guest.getId(),
                    "BOOKING_PAYMENT",
                    "Thanh toan da xac nhan",
                    "Booking " + completedBooking.getId() + " da duoc xac nhan thanh toan.",
                    "BOOKING",
                    completedBooking.getId(),
                    true,
                    LocalDateTime.now().minusDays(6));
        }

        if (upcomingBooking != null) {
            ensureNotification(
                    guest.getId(),
                    "BOOKING",
                    "Nhac lich nhan phong",
                    "Booking " + upcomingBooking.getId() + " sap den ngay nhan phong.",
                    "BOOKING",
                    upcomingBooking.getId(),
                    false,
                    LocalDateTime.now().minusHours(1));
        }

        LOGGER.info(
                "Demo seed completed. Accounts: admin={}, host={}, user={}",
                normalizeEmail(demoAdminEmail),
                normalizeEmail(demoHostEmail),
                normalizeEmail(demoUserEmail));
    }

    private User ensureUser(String name, String email, Role role, String rawPassword, String fallbackName) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null) {
            LOGGER.warn("Skip demo user seed for role {}: email is missing.", role);
            return null;
        }

        Optional<User> existing = userRepository.findByEmail(normalizedEmail);
        if (existing.isPresent()) {
            if (existing.get().getRole() != role) {
                LOGGER.warn(
                        "Demo seed account {} already exists with role {}, expected {}.",
                        normalizedEmail,
                        existing.get().getRole(),
                        role);
            }
            return existing.get();
        }

        User user = new User();
        user.setName(normalizeName(name, fallbackName));
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setEmailVerified(Boolean.TRUE);
        user.setEmailVerifiedAt(Instant.now().toString());
        return userRepository.save(user);
    }

    private Hotel ensureHotel(
            String ownerId,
            String name,
            String city,
            String address,
            int starRating,
            List<String> amenities,
            List<String> imageUrls,
            HotelApprovalStatus approvalStatus,
            String approvedByUserId,
            String approvalNote) {
        if (ownerId == null || ownerId.isBlank()) {
            return null;
        }

        List<Hotel> ownerHotels = hotelRepository.findByOwnerId(ownerId);
        Optional<Hotel> existing = ownerHotels.stream()
                .filter(hotel -> equalsIgnoreCase(hotel.getName(), name))
                .findFirst();
        if (existing.isPresent()) {
            return existing.get();
        }

        Hotel hotel = new Hotel();
        hotel.setOwnerId(ownerId);
        hotel.setName(name);
        hotel.setCity(city);
        hotel.setAddress(address);
        hotel.setStarRating(Math.max(starRating, 1));
        hotel.setAmenities(amenities);
        hotel.setImageUrls(imageUrls);
        hotel.setApprovalStatus(approvalStatus);
        hotel.setApprovalNote(approvalNote);
        hotel.setApprovedByUserId(approvedByUserId);
        hotel.setApprovedAt(approvalStatus == HotelApprovalStatus.APPROVED ? LocalDateTime.now().minusDays(1) : null);
        hotel.setFreeCancellationBeforeDays(3);
        hotel.setLateCancellationRefundRate(50);
        return hotelRepository.save(hotel);
    }

    private Room ensureRoom(
            Hotel hotel,
            String ownerId,
            String name,
            int capacity,
            double price,
            String roomType,
            String bedType,
            int totalUnits,
            String description,
            List<String> amenities,
            List<String> imageUrls) {
        if (hotel == null || hotel.getId() == null || hotel.getId().isBlank()) {
            return null;
        }

        List<Room> hotelRooms = roomRepository.findByHotelId(hotel.getId());
        Optional<Room> existing = hotelRooms.stream()
                .filter(room -> equalsIgnoreCase(room.getName(), name))
                .findFirst();
        if (existing.isPresent()) {
            return existing.get();
        }

        Room room = new Room();
        room.setOwnerId(ownerId);
        room.setHotelId(hotel.getId());
        room.setName(name);
        room.setCapacity(Math.max(capacity, 1));
        room.setPrice(Math.max(price, 0));
        room.setRoomType(roomType);
        room.setBedType(bedType);
        room.setTotalUnits(Math.max(totalUnits, 1));
        room.setDescription(description);
        room.setAmenities(amenities);
        room.setImageUrls(imageUrls);
        return roomRepository.save(room);
    }

    private Booking ensureBooking(
            String userId,
            Room room,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            BookingStatus status,
            PaymentMethod paymentMethod,
            PaymentStatus paymentStatus,
            String note,
            int guestCount,
            String couponCode,
            double discountAmount) {
        if (userId == null || userId.isBlank() || room == null || room.getId() == null || room.getId().isBlank()) {
            return null;
        }

        List<Booking> userBookings = bookingRepository.findByUserId(userId);
        Optional<Booking> existing = userBookings.stream()
                .filter(booking -> Objects.equals(booking.getRoomId(), room.getId()))
                .filter(booking -> Objects.equals(booking.getCheckInDate(), checkInDate))
                .filter(booking -> Objects.equals(booking.getCheckOutDate(), checkOutDate))
                .findFirst();
        if (existing.isPresent()) {
            return existing.get();
        }

        long nights = Math.max(ChronoUnit.DAYS.between(checkInDate, checkOutDate), 1);
        double originalPrice = room.getPrice() * nights;
        double safeDiscount = Math.max(Math.min(discountAmount, originalPrice), 0);
        double finalPrice = Math.max(originalPrice - safeDiscount, 0);

        LocalDateTime createdAt = checkInDate.isAfter(LocalDate.now())
                ? LocalDateTime.now().minusDays(2)
                : LocalDateTime.now().minusDays(12);

        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setRoomId(room.getId());
        booking.setCheckInDate(checkInDate);
        booking.setCheckOutDate(checkOutDate);
        booking.setGuestCount(Math.max(guestCount, 1));
        booking.setNote(trimToNull(note));
        booking.setStatus(status);
        booking.setPaymentMethod(paymentMethod);
        booking.setPaymentStatus(paymentStatus);
        booking.setCouponCode(trimToNull(couponCode));
        booking.setOriginalPrice(originalPrice);
        booking.setDiscountAmount(safeDiscount);
        booking.setFinalPrice(finalPrice);
        booking.setTotalPrice(finalPrice);
        booking.setCreatedAt(createdAt);
        booking.setUpdatedAt(createdAt.plusHours(2));
        booking.setRefundAmount(0);

        if (paymentStatus == PaymentStatus.PAID) {
            booking.setPaidAt(createdAt.plusHours(1));
        }

        if (status == BookingStatus.CHECKED_IN || status == BookingStatus.CHECKED_OUT) {
            booking.setCheckedInAt(checkInDate.atTime(14, 0));
        }

        if (status == BookingStatus.CHECKED_OUT) {
            booking.setCheckedOutAt(checkOutDate.atTime(11, 0));
        }

        return bookingRepository.save(booking);
    }

    private Notification ensureNotification(
            String userId,
            String type,
            String title,
            String message,
            String entityType,
            String entityId,
            boolean read,
            LocalDateTime createdAt) {
        if (userId == null || userId.isBlank()) {
            return null;
        }

        List<Notification> existingNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Optional<Notification> existing = existingNotifications.stream()
                .filter(notification -> equalsIgnoreCase(notification.getType(), type))
                .filter(notification -> Objects.equals(trimToNull(notification.getTitle()), trimToNull(title)))
                .filter(notification -> Objects.equals(trimToNull(notification.getEntityType()), trimToNull(entityType)))
                .filter(notification -> Objects.equals(trimToNull(notification.getEntityId()), trimToNull(entityId)))
                .findFirst();
        if (existing.isPresent()) {
            return existing.get();
        }

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(trimToNull(type));
        notification.setTitle(trimToNull(title));
        notification.setMessage(trimToNull(message));
        notification.setEntityType(trimToNull(entityType));
        notification.setEntityId(trimToNull(entityId));
        notification.setRead(read);
        notification.setCreatedAt(createdAt == null ? LocalDateTime.now() : createdAt);
        notification.setReadAt(read ? notification.getCreatedAt().plusMinutes(30) : null);
        return notificationRepository.save(notification);
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }

        String normalized = email.trim().toLowerCase(Locale.ROOT);
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizePassword(String password) {
        if (password == null) {
            return null;
        }

        String normalized = password.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeName(String name, String fallback) {
        String normalized = trimToNull(name);
        return normalized == null ? fallback : normalized;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private boolean equalsIgnoreCase(String left, String right) {
        String leftValue = trimToNull(left);
        String rightValue = trimToNull(right);
        if (leftValue == null || rightValue == null) {
            return false;
        }

        return leftValue.equalsIgnoreCase(rightValue);
    }
}
