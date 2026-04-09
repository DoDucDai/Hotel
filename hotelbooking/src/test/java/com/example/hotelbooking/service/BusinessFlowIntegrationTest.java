package com.example.hotelbooking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.hotelbooking.dto.CreateBookingRequest;
import com.example.hotelbooking.dto.PaymentCheckoutResponse;
import com.example.hotelbooking.dto.SandboxPaymentWebhookRequest;
import com.example.hotelbooking.dto.UpdateHotelApprovalRequest;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.HotelApprovalStatus;
import com.example.hotelbooking.model.PaymentMethod;
import com.example.hotelbooking.model.PaymentStatus;
import com.example.hotelbooking.model.PaymentWebhookEvent;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.PaymentWebhookEventRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BusinessFlowIntegrationTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentWebhookEventRepository paymentWebhookEventRepository;

    @Mock
    private CouponService couponService;

    @Mock
    private RoomInventoryService roomInventoryService;

    @Mock
    private RoomBookingLockService roomBookingLockService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UploadStorageService uploadStorageService;

    @Mock
    private DisputeService disputeService;

    private final Map<String, User> users = new LinkedHashMap<>();
    private final Map<String, Hotel> hotels = new LinkedHashMap<>();
    private final Map<String, Room> rooms = new LinkedHashMap<>();
    private final Map<String, Booking> bookings = new LinkedHashMap<>();
    private final Map<String, PaymentWebhookEvent> webhookEvents = new LinkedHashMap<>();

    private final AtomicInteger hotelIdSequence = new AtomicInteger(0);
    private final AtomicInteger roomIdSequence = new AtomicInteger(0);
    private final AtomicInteger bookingIdSequence = new AtomicInteger(0);
    private final AtomicInteger webhookIdSequence = new AtomicInteger(0);

    private HostHotelService hostHotelService;
    private HostRoomService hostRoomService;
    private BookingService bookingService;
    private PaymentService paymentService;
    private AdminService adminService;

    @BeforeEach
    void setUp() {
        mockRepositories();
        mockSupportServices();
        initServices();
        seedUsers();
    }

    @Test
    void hostBookingAdminPaymentFlowShouldWorkEndToEnd() {
        Hotel hotelPayload = new Hotel();
        hotelPayload.setName("River View Hotel");
        hotelPayload.setAddress("12 Tran Hung Dao");
        hotelPayload.setCity("Ha Noi");
        hotelPayload.setStarRating(4);
        hotelPayload.setAmenities(List.of("Wifi", "Bai do xe"));
        hotelPayload.setFreeCancellationBeforeDays(3);
        hotelPayload.setLateCancellationRefundRate(60);

        Hotel createdHotel = hostHotelService.createHotel(hotelPayload, "host@hotel.test");
        assertNotNull(createdHotel.getId());
        assertEquals("u-host", createdHotel.getOwnerId());
        assertEquals(HotelApprovalStatus.PENDING, createdHotel.getApprovalStatus());

        Room roomPayload = new Room();
        roomPayload.setHotelId(createdHotel.getId());
        roomPayload.setName("Deluxe Double");
        roomPayload.setCapacity(2);
        roomPayload.setPrice(1_200_000);
        roomPayload.setTotalUnits(5);
        roomPayload.setAmenities(List.of("Dieu hoa", "Ban cong"));

        Room createdRoom = hostRoomService.createRoom(roomPayload, "host@hotel.test");
        assertNotNull(createdRoom.getId());
        assertEquals(createdHotel.getId(), createdRoom.getHotelId());

        CreateBookingRequest request = new CreateBookingRequest();
        request.setRoomId(createdRoom.getId());
        request.setCheckInDate(LocalDate.now().plusDays(7));
        request.setCheckOutDate(LocalDate.now().plusDays(9));
        request.setGuestCount(2);
        request.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        request.setNote("Can phong yen tinh");

        Booking createdBooking = bookingService.createBooking(request, "guest@hotel.test");
        assertNotNull(createdBooking.getId());
        assertEquals(PaymentStatus.PENDING, createdBooking.getPaymentStatus());

        PaymentCheckoutResponse checkout =
                paymentService.createSandboxCheckout(createdBooking.getId(), "guest@hotel.test");
        assertNotNull(checkout.getCheckoutUrl());

        SandboxPaymentWebhookRequest webhookRequest = new SandboxPaymentWebhookRequest();
        webhookRequest.setBookingId(createdBooking.getId());
        webhookRequest.setTransactionRef(checkout.getTransactionRef());
        webhookRequest.setAmount(checkout.getAmount());
        webhookRequest.setStatus("SUCCESS");
        webhookRequest.setSignature(paymentService.buildSandboxWebhookSignature(
                createdBooking.getId(),
                checkout.getTransactionRef(),
                checkout.getAmount(),
                "SUCCESS"));

        Map<String, Object> webhookResult = paymentService.processSandboxWebhook(webhookRequest);
        assertEquals(Boolean.TRUE, webhookResult.get("applied"));
        assertEquals("PAID", webhookResult.get("paymentStatus"));
        assertEquals(PaymentStatus.PAID, bookings.get(createdBooking.getId()).getPaymentStatus());

        UpdateHotelApprovalRequest approvalRequest = new UpdateHotelApprovalRequest();
        approvalRequest.setStatus(HotelApprovalStatus.APPROVED);
        approvalRequest.setNote("Thong tin day du, da duyet.");

        Hotel approvedHotel =
                adminService.updateHotelApproval(createdHotel.getId(), approvalRequest, "admin@hotel.test");
        assertEquals(HotelApprovalStatus.APPROVED, approvedHotel.getApprovalStatus());
        assertEquals("u-admin", approvedHotel.getApprovedByUserId());
    }

    private void initServices() {
        HostAccessService hostAccessService = new HostAccessService(userRepository);

        hostHotelService = new HostHotelService(
                hostAccessService,
                hotelRepository,
                roomRepository,
                bookingRepository,
                roomInventoryService,
                auditLogService,
                uploadStorageService);

        hostRoomService = new HostRoomService(
                hostAccessService,
                hotelRepository,
                roomRepository,
                bookingRepository,
                roomInventoryService,
                auditLogService,
                uploadStorageService);

        bookingService = new BookingService(
                bookingRepository,
                roomRepository,
                userRepository,
                couponService,
                hotelRepository,
                roomInventoryService,
                roomBookingLockService,
                auditLogService,
                notificationService);

        paymentService = new PaymentService(
                bookingRepository,
                userRepository,
                roomRepository,
                paymentWebhookEventRepository,
                auditLogService,
                notificationService);
        ReflectionTestUtils.setField(paymentService, "backendUrl", "http://localhost:8080");
        ReflectionTestUtils.setField(paymentService, "frontendUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(paymentService, "sandboxSecret", "test-sandbox-secret-123");

        adminService = new AdminService(
                userRepository,
                hotelRepository,
                roomRepository,
                bookingRepository,
                disputeService,
                auditLogService,
                notificationService);
    }

    private void seedUsers() {
        User admin = new User("Admin", "admin@hotel.test", "x", Role.ADMIN);
        admin.setId("u-admin");
        admin.setEmailVerified(true);
        users.put(admin.getId(), admin);

        User host = new User("Host", "host@hotel.test", "x", Role.USER);
        host.setId("u-host");
        host.setEmailVerified(true);
        users.put(host.getId(), host);

        User guest = new User("Guest", "guest@hotel.test", "x", Role.USER);
        guest.setId("u-guest");
        guest.setEmailVerified(true);
        users.put(guest.getId(), guest);
    }

    private void mockSupportServices() {
        when(couponService.validateCoupon(any(), anyDouble())).thenReturn(null);
        when(couponService.getCouponForExistingBooking(any())).thenReturn(null);
        when(couponService.calculateDiscount(anyDouble(), any())).thenReturn(0.0);

        when(roomInventoryService.getMinimumAvailableUnits(any(), any(), any(), any())).thenReturn(3);

        when(roomBookingLockService.executeWithLock(anyString(), org.mockito.ArgumentMatchers.<Supplier<?>>any()))
                .thenAnswer(invocation -> {
                    Supplier<?> supplier = invocation.getArgument(1);
                    return supplier.get();
                });
    }

    private void mockRepositories() {
        when(userRepository.findByEmail(anyString())).thenAnswer(invocation -> {
            String email = invocation.getArgument(0, String.class).trim().toLowerCase();
            return users.values().stream()
                    .filter(user -> email.equalsIgnoreCase(user.getEmail()))
                    .findFirst();
        });
        when(userRepository.findById(anyString())).thenAnswer(invocation ->
                Optional.ofNullable(users.get(invocation.getArgument(0))));
        when(userRepository.findAll()).thenAnswer(invocation -> new ArrayList<>(users.values()));
        when(userRepository.count()).thenAnswer(invocation -> (long) users.size());

        when(hotelRepository.findById(anyString())).thenAnswer(invocation ->
                Optional.ofNullable(hotels.get(invocation.getArgument(0))));
        when(hotelRepository.findByOwnerId(anyString())).thenAnswer(invocation -> {
            String ownerId = invocation.getArgument(0);
            return hotels.values().stream()
                    .filter(hotel -> ownerId.equals(hotel.getOwnerId()))
                    .toList();
        });
        when(hotelRepository.findAll()).thenAnswer(invocation -> new ArrayList<>(hotels.values()));
        when(hotelRepository.count()).thenAnswer(invocation -> (long) hotels.size());
        when(hotelRepository.save(any(Hotel.class))).thenAnswer(invocation -> {
            Hotel hotel = invocation.getArgument(0);
            if (hotel.getId() == null || hotel.getId().isBlank()) {
                hotel.setId("h-" + hotelIdSequence.incrementAndGet());
            }
            hotels.put(hotel.getId(), hotel);
            return hotel;
        });
        when(roomRepository.findById(anyString())).thenAnswer(invocation ->
                Optional.ofNullable(rooms.get(invocation.getArgument(0))));
        when(roomRepository.findAll()).thenAnswer(invocation -> new ArrayList<>(rooms.values()));
        when(roomRepository.count()).thenAnswer(invocation -> (long) rooms.size());
        when(roomRepository.findByHotelId(anyString())).thenAnswer(invocation -> {
            String hotelId = invocation.getArgument(0);
            return rooms.values().stream()
                    .filter(room -> hotelId.equals(room.getHotelId()))
                    .toList();
        });
        when(roomRepository.findByOwnerId(anyString())).thenAnswer(invocation -> {
            String ownerId = invocation.getArgument(0);
            return rooms.values().stream()
                    .filter(room -> ownerId.equals(room.getOwnerId()))
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
        when(bookingRepository.findById(anyString())).thenAnswer(invocation ->
                Optional.ofNullable(bookings.get(invocation.getArgument(0))));
        when(bookingRepository.findAll()).thenAnswer(invocation -> new ArrayList<>(bookings.values()));
        when(bookingRepository.count()).thenAnswer(invocation -> (long) bookings.size());
        when(bookingRepository.findByRoomId(anyString())).thenAnswer(invocation -> {
            String roomId = invocation.getArgument(0);
            return bookings.values().stream()
                    .filter(booking -> roomId.equals(booking.getRoomId()))
                    .toList();
        });
        when(bookingRepository.findByUserId(anyString())).thenAnswer(invocation -> {
            String userId = invocation.getArgument(0);
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

        when(paymentWebhookEventRepository.findByEventKey(anyString())).thenAnswer(invocation ->
                webhookEvents.values().stream()
                        .filter(event -> invocation.getArgument(0, String.class).equals(event.getEventKey()))
                        .findFirst());
        when(paymentWebhookEventRepository.save(any(PaymentWebhookEvent.class))).thenAnswer(invocation -> {
            PaymentWebhookEvent event = invocation.getArgument(0);
            if (event.getId() == null || event.getId().isBlank()) {
                event.setId("w-" + webhookIdSequence.incrementAndGet());
            }
            webhookEvents.put(event.getId(), event);
            return event;
        });
    }
}
