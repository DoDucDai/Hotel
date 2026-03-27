package com.example.hotelbooking.controller;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;

@RestController
@RequestMapping("/host")
@SuppressWarnings("null")
public class HostController {

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;

    public HostController(
            UserRepository userRepository,
            HotelRepository hotelRepository,
            RoomRepository roomRepository) {
        this.userRepository = userRepository;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
    }

    @GetMapping("/hotels/my")
    public List<Hotel> getMyHotels(Authentication authentication) {
        User user = getCurrentUser(authentication);
        if (isAdmin(user)) {
            return hotelRepository.findAll();
        }

        return hotelRepository.findByOwnerId(requireUserId(user));
    }

    @PostMapping("/hotels")
    public Hotel createHotel(@RequestBody Hotel hotel, Authentication authentication) {
        Hotel payload = Objects.requireNonNull(hotel, "Hotel payload is required");
        User user = getCurrentUser(authentication);
        validateHotelInput(payload);

        Hotel newHotel = new Hotel();
        newHotel.setName(payload.getName().trim());
        newHotel.setAddress(payload.getAddress().trim());
        newHotel.setCity(payload.getCity().trim());
        newHotel.setImageUrl(payload.getImageUrl());
        newHotel.setStarRating(normalizeStarRating(payload.getStarRating()));
        newHotel.setAmenities(normalizeAmenities(payload.getAmenities()));
        newHotel.setOwnerId(requireUserId(user));

        return hotelRepository.save(newHotel);
    }

    @PutMapping("/hotels/{id}")
    public Hotel updateHotel(
            @PathVariable String id,
            @RequestBody Hotel updatedHotel,
            Authentication authentication) {

        String hotelId = requireNonBlank(id, "Hotel id is required");
        Hotel payload = Objects.requireNonNull(updatedHotel, "Hotel payload is required");

        User user = getCurrentUser(authentication);
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        assertHotelOwner(user, hotel);
        validateHotelInput(payload);

        hotel.setName(payload.getName().trim());
        hotel.setAddress(payload.getAddress().trim());
        hotel.setCity(payload.getCity().trim());
        hotel.setImageUrl(payload.getImageUrl());
        hotel.setStarRating(normalizeStarRating(payload.getStarRating()));
        hotel.setAmenities(normalizeAmenities(payload.getAmenities()));

        return hotelRepository.save(hotel);
    }

    @DeleteMapping("/hotels/{id}")
    public Map<String, String> deleteHotel(
            @PathVariable String id,
            Authentication authentication) {

        String hotelId = requireNonBlank(id, "Hotel id is required");
        User user = getCurrentUser(authentication);
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        assertHotelOwner(user, hotel);

        List<Room> rooms = roomRepository.findByHotelId(hotelId);
        if (!rooms.isEmpty()) {
            roomRepository.deleteAll(rooms);
        }

        hotelRepository.deleteById(hotelId);
        return Map.of("message", "Hotel deleted");
    }

    @GetMapping("/rooms/my")
    public List<Room> getMyRooms(Authentication authentication) {
        User user = getCurrentUser(authentication);
        if (isAdmin(user)) {
            return roomRepository.findAll();
        }

        return roomRepository.findByOwnerId(requireUserId(user));
    }

    @PostMapping("/rooms")
    public Room createRoom(@RequestBody Room room, Authentication authentication) {
        Room payload = Objects.requireNonNull(room, "Room payload is required");
        User user = getCurrentUser(authentication);
        validateRoomInput(payload);

        String hotelId = requireNonBlank(payload.getHotelId(), "hotelId is required");
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        assertHotelOwner(user, hotel);

        Room newRoom = new Room();
        newRoom.setOwnerId(requireUserId(user));
        newRoom.setHotelId(hotel.getId());
        newRoom.setName(payload.getName().trim());
        newRoom.setCapacity(payload.getCapacity());
        newRoom.setPrice(payload.getPrice());

        return roomRepository.save(newRoom);
    }

    @PutMapping("/rooms/{id}")
    public Room updateRoom(
            @PathVariable String id,
            @RequestBody Room updatedRoom,
            Authentication authentication) {

        String roomId = requireNonBlank(id, "Room id is required");
        Room payload = Objects.requireNonNull(updatedRoom, "Room payload is required");
        User user = getCurrentUser(authentication);
        validateRoomInput(payload);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!isAdmin(user) && !requireUserId(user).equals(room.getOwnerId())) {
            throw new RuntimeException("You do not have permission to update this room");
        }

        String hotelId = requireNonBlank(payload.getHotelId(), "hotelId is required");
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        assertHotelOwner(user, hotel);

        room.setHotelId(hotel.getId());
        room.setName(payload.getName().trim());
        room.setCapacity(payload.getCapacity());
        room.setPrice(payload.getPrice());

        return roomRepository.save(room);
    }

    @DeleteMapping("/rooms/{id}")
    public Map<String, String> deleteRoom(
            @PathVariable String id,
            Authentication authentication) {

        String roomId = requireNonBlank(id, "Room id is required");
        User user = getCurrentUser(authentication);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!isAdmin(user) && !requireUserId(user).equals(room.getOwnerId())) {
            throw new RuntimeException("You do not have permission to delete this room");
        }

        roomRepository.deleteById(roomId);
        return Map.of("message", "Room deleted");
    }

    private void validateHotelInput(Hotel hotel) {
        if (hotel.getName() == null || hotel.getName().isBlank()) {
            throw new RuntimeException("Hotel name is required");
        }

        if (hotel.getAddress() == null || hotel.getAddress().isBlank()) {
            throw new RuntimeException("Hotel address is required");
        }

        if (hotel.getCity() == null || hotel.getCity().isBlank()) {
            throw new RuntimeException("Hotel city is required");
        }

        if (hotel.getStarRating() < 1 || hotel.getStarRating() > 5) {
            throw new RuntimeException("Star rating phai tu 1 den 5");
        }
    }

    private void validateRoomInput(Room room) {
        if (room.getHotelId() == null || room.getHotelId().isBlank()) {
            throw new RuntimeException("hotelId is required");
        }

        if (room.getName() == null || room.getName().isBlank()) {
            throw new RuntimeException("Room name is required");
        }

        if (room.getCapacity() < 1) {
            throw new RuntimeException("Room capacity must be at least 1");
        }

        if (room.getPrice() < 0) {
            throw new RuntimeException("Room price must be non-negative");
        }
    }

    private void assertHotelOwner(User user, Hotel hotel) {
        if (isAdmin(user)) {
            return;
        }

        if (hotel.getOwnerId() == null || !hotel.getOwnerId().equals(requireUserId(user))) {
            throw new RuntimeException("You do not have permission for this hotel");
        }
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            throw new RuntimeException("Unauthorized");
        }

        String email = requireNonBlank(authentication.getName(), "Unauthorized");

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private boolean isAdmin(User user) {
        return user.getRole() == Role.ADMIN;
    }

    private String requireUserId(User user) {
        return requireNonBlank(user.getId(), "Current user id is missing");
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }

        return value;
    }

    private int normalizeStarRating(int starRating) {
        return starRating < 1 || starRating > 5 ? 3 : starRating;
    }

    private List<String> normalizeAmenities(List<String> amenities) {
        if (amenities == null) {
            return List.of();
        }

        return amenities.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }
}

