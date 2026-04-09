package com.example.hotelbooking.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.RoomDTO;
import com.example.hotelbooking.dto.RoomInventoryDayDTO;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.service.RoomService;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public Page<RoomDTO> getAllRooms(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        Pageable pageable = PageRequest.of(page, size);

        return roomService.getAllRooms(pageable, isAdmin(authentication));
    }

    @GetMapping("/{id}")
    public Room getRoomById(@PathVariable String id, Authentication authentication) {
        return roomService.getRoomById(id, isAdmin(authentication));
    }

    @PostMapping
    public Room createRoom(@RequestBody Room room) {
        return roomService.createRoom(room);
    }

    @PutMapping("/{id}")
    public Room updateRoom(@PathVariable String id, @RequestBody Room room) {
        return roomService.updateRoom(id, room);
    }

    @DeleteMapping("/{id}")
    public void deleteRoom(@PathVariable String id) {
        roomService.deleteRoom(id);
    }

    @GetMapping("/available")
    public List<Room> getAvailableRooms(
            @RequestParam String checkIn,
            @RequestParam String checkOut,
            Authentication authentication) {

        LocalDate checkInDate = LocalDate.parse(checkIn);
        LocalDate checkOutDate = LocalDate.parse(checkOut);

        return roomService.findAvailableRooms(checkInDate, checkOutDate, isAdmin(authentication));
    }

    @GetMapping("/search")
    public List<Room> searchRooms(
            @RequestParam(required = false) String checkIn,
            @RequestParam(required = false) String checkOut,
            @RequestParam(defaultValue = "1") int guests,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String amenity,
            @RequestParam(required = false, defaultValue = "price_asc") String sortBy,
            Authentication authentication) {

        LocalDate checkInDate = (checkIn == null || checkIn.isBlank()) ? null : LocalDate.parse(checkIn);
        LocalDate checkOutDate = (checkOut == null || checkOut.isBlank()) ? null : LocalDate.parse(checkOut);

        return roomService.searchRooms(
                checkInDate,
                checkOutDate,
                guests,
                minPrice,
                maxPrice,
                amenity,
                sortBy,
                isAdmin(authentication));
    }

    @GetMapping("/hotel/{hotelId}")
    public List<Room> getRoomsByHotel(@PathVariable String hotelId, Authentication authentication) {
        return roomService.getRoomsByHotel(hotelId, isAdmin(authentication));
    }

    @GetMapping("/{id}/inventory")
    public List<RoomInventoryDayDTO> getRoomInventory(
            @PathVariable String id,
            @RequestParam String startDate,
            @RequestParam String endDate,
            Authentication authentication) {
        return roomService.getInventoryCalendar(
                id,
                LocalDate.parse(startDate),
                LocalDate.parse(endDate),
                isAdmin(authentication));
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .anyMatch((authority) -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
