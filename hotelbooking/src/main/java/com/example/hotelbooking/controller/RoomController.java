package com.example.hotelbooking.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

    @Autowired
    private RoomService roomService;

    @GetMapping
    public Page<RoomDTO> getAllRooms(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);

        return roomService.getAllRooms(pageable);
    }

    @GetMapping("/{id}")
    public Room getRoomById(@PathVariable String id) {
        return roomService.getRoomById(id);
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
            @RequestParam String checkOut) {

        LocalDate checkInDate = LocalDate.parse(checkIn);
        LocalDate checkOutDate = LocalDate.parse(checkOut);

        return roomService.findAvailableRooms(checkInDate, checkOutDate);
    }

    @GetMapping("/search")
    public List<Room> searchRooms(
            @RequestParam(required = false) String checkIn,
            @RequestParam(required = false) String checkOut,
            @RequestParam(defaultValue = "1") int guests) {

        if (checkIn == null || checkOut == null || checkIn.isBlank() || checkOut.isBlank()) {
            return roomService.getRoomsByGuestCount(guests);
        }

        LocalDate checkInDate = LocalDate.parse(checkIn);
        LocalDate checkOutDate = LocalDate.parse(checkOut);

        return roomService.searchRooms(checkInDate, checkOutDate, guests);
    }

    @GetMapping("/hotel/{hotelId}")
    public List<Room> getRoomsByHotel(@PathVariable String hotelId) {
        return roomService.getRoomsByHotel(hotelId);
    }

    @GetMapping("/{id}/inventory")
    public List<RoomInventoryDayDTO> getRoomInventory(
            @PathVariable String id,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return roomService.getInventoryCalendar(id, LocalDate.parse(startDate), LocalDate.parse(endDate));
    }
    
}
