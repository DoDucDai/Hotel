package com.example.hotelbooking.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.HotelApprovalStatus;
import com.example.hotelbooking.model.Notification;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.NotificationRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings("null")
class DemoDataSeedRunnerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private final Map<String, User> users = new LinkedHashMap<>();
    private final Map<String, Hotel> hotels = new LinkedHashMap<>();
    private final Map<String, Room> rooms = new LinkedHashMap<>();
    private final Map<String, Booking> bookings = new LinkedHashMap<>();
    private final Map<String, Notification> notifications = new LinkedHashMap<>();

    private final AtomicInteger userIdSequence = new AtomicInteger(0);
    private final AtomicInteger hotelIdSequence = new AtomicInteger(0);
    private final AtomicInteger roomIdSequence = new AtomicInteger(0);
    private final AtomicInteger bookingIdSequence = new AtomicInteger(0);
    private final AtomicInteger notificationIdSequence = new AtomicInteger(0);

    private void configureRepositoryMocks() {
        when(passwordEncoder.encode(anyString())).thenAnswer(invocation -> "ENC(" + invocation.getArgument(0) + ")");

        when(userRepository.findByEmail(anyString())).thenAnswer(invocation -> {
            String email = invocation.getArgument(0, String.class);
            return users.values().stream()
                    .filter(user -> user.getEmail() != null && user.getEmail().equalsIgnoreCase(email))
                    .findFirst();
        });
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            if (user.getId() == null || user.getId().isBlank()) {
                user.setId("u-" + userIdSequence.incrementAndGet());
            }
            users.put(user.getId(), user);
            return user;
        });

        when(hotelRepository.findByOwnerId(anyString())).thenAnswer(invocation -> {
            String ownerId = invocation.getArgument(0, String.class);
            return hotels.values().stream()
                    .filter(hotel -> ownerId.equals(hotel.getOwnerId()))
                    .toList();
        });
        when(hotelRepository.save(any(Hotel.class))).thenAnswer(invocation -> {
            Hotel hotel = invocation.getArgument(0);
            if (hotel.getId() == null || hotel.getId().isBlank()) {
                hotel.setId("h-" + hotelIdSequence.incrementAndGet());
            }
            hotels.put(hotel.getId(), hotel);
            return hotel;
        });

        when(roomRepository.findByHotelId(anyString())).thenAnswer(invocation -> {
            String hotelId = invocation.getArgument(0, String.class);
            return rooms.values().stream()
                    .filter(room -> hotelId.equals(room.getHotelId()))
                    .toList();
        });
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> {
            Room room = invocation.getArgument(0);
            if (room.getId() == null || room.getId().isBlank()) {
                room.setId("r-" + roomIdSequence.incrementAndGet());
            }
            rooms.put(room.getId(), room);
            return room;
        });

        when(bookingRepository.findByUserId(anyString())).thenAnswer(invocation -> {
            String userId = invocation.getArgument(0, String.class);
            return bookings.values().stream()
                    .filter(booking -> userId.equals(booking.getUserId()))
                    .toList();
        });
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            if (booking.getId() == null || booking.getId().isBlank()) {
                booking.setId("b-" + bookingIdSequence.incrementAndGet());
            }
            bookings.put(booking.getId(), booking);
            return booking;
        });

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(anyString())).thenAnswer(invocation -> {
            String userId = invocation.getArgument(0, String.class);
            return notifications.values().stream()
                    .filter(notification -> userId.equals(notification.getUserId()))
                    .sorted(Comparator.comparing(
                            Notification::getCreatedAt,
                            Comparator.nullsLast(Comparator.<LocalDateTime>naturalOrder())).reversed())
                    .toList();
        });
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification notification = invocation.getArgument(0);
            if (notification.getId() == null || notification.getId().isBlank()) {
                notification.setId("n-" + notificationIdSequence.incrementAndGet());
            }
            notifications.put(notification.getId(), notification);
            return notification;
        });
    }

    @Test
    void shouldSeedDemoDataWhenDatabaseIsEmpty() throws Exception {
        configureRepositoryMocks();

        DemoDataSeedRunner runner = buildRunner();

        runner.run(new DefaultApplicationArguments(new String[0]));

        assertEquals(3, users.size());
        assertEquals(2, hotels.size());
        assertEquals(3, rooms.size());
        assertEquals(2, bookings.size());
        assertEquals(4, notifications.size());
        assertEquals(1, users.values().stream().filter(user -> user.getRole() == Role.ADMIN).count());
        assertEquals(1, hotels.values().stream()
                .filter(hotel -> hotel.getApprovalStatus() == HotelApprovalStatus.APPROVED)
                .count());
        assertEquals(1, hotels.values().stream()
                .filter(hotel -> hotel.getApprovalStatus() == HotelApprovalStatus.PENDING)
                .count());

        Booking completedBooking = bookings.values().stream()
                .filter(booking -> booking.getCheckOutDate() != null && booking.getCheckOutDate().isBefore(LocalDate.now()))
                .findFirst()
                .orElse(null);
        assertNotNull(completedBooking);
    }

    @Test
    void shouldNotDuplicateDataWhenRunnerExecutesTwice() throws Exception {
        configureRepositoryMocks();

        DemoDataSeedRunner runner = buildRunner();
        DefaultApplicationArguments arguments = new DefaultApplicationArguments(new String[0]);

        runner.run(arguments);
        runner.run(arguments);

        assertEquals(3, users.size());
        assertEquals(2, hotels.size());
        assertEquals(3, rooms.size());
        assertEquals(2, bookings.size());
        assertEquals(4, notifications.size());
    }

    private DemoDataSeedRunner buildRunner() {
        DemoDataSeedRunner runner = new DemoDataSeedRunner(
                userRepository,
                hotelRepository,
                roomRepository,
                bookingRepository,
                notificationRepository,
                passwordEncoder);

        ReflectionTestUtils.setField(runner, "demoPassword", "Demo123!");
        ReflectionTestUtils.setField(runner, "demoAdminName", "Demo Admin");
        ReflectionTestUtils.setField(runner, "demoAdminEmail", "demo.admin@hotelbooking.local");
        ReflectionTestUtils.setField(runner, "demoHostName", "Demo Host");
        ReflectionTestUtils.setField(runner, "demoHostEmail", "demo.host@hotelbooking.local");
        ReflectionTestUtils.setField(runner, "demoUserName", "Demo User");
        ReflectionTestUtils.setField(runner, "demoUserEmail", "demo.user@hotelbooking.local");
        return runner;
    }
}
