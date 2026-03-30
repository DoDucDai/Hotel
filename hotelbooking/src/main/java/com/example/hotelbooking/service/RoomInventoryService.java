package com.example.hotelbooking.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.RoomInventoryDayDTO;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.RoomInventoryBlock;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.RoomInventoryBlockRepository;

@Service
public class RoomInventoryService {

    private final BookingRepository bookingRepository;
    private final RoomInventoryBlockRepository roomInventoryBlockRepository;

    public RoomInventoryService(
            BookingRepository bookingRepository,
            RoomInventoryBlockRepository roomInventoryBlockRepository) {
        this.bookingRepository = bookingRepository;
        this.roomInventoryBlockRepository = roomInventoryBlockRepository;
    }

    public List<RoomInventoryDayDTO> buildInventoryCalendar(Room room, LocalDate startDate, LocalDate endDate) {
        return buildInventoryCalendar(room, startDate, endDate, null);
    }

    public List<RoomInventoryDayDTO> buildInventoryCalendar(
            Room room,
            LocalDate startDate,
            LocalDate endDate,
            String excludedBookingId) {

        Room safeRoom = requireRoom(room);
        if (startDate == null || endDate == null || endDate.isBefore(startDate)) {
            throw new RuntimeException("Khoang ngay ton kho khong hop le");
        }

        List<Booking> bookings = bookingRepository.findByRoomId(safeRoom.getId());
        List<RoomInventoryBlock> blocks = roomInventoryBlockRepository.findByRoomIdOrderByStartDateAsc(safeRoom.getId());
        List<RoomInventoryDayDTO> result = new ArrayList<>();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            final LocalDate currentDate = date;
            int bookedUnits = (int) bookings.stream()
                    .filter(this::bookingConsumesInventory)
                    .filter((booking) -> excludedBookingId == null || !excludedBookingId.equals(booking.getId()))
                    .filter((booking) -> bookingOccupiesDate(booking, currentDate))
                    .count();

            int blockedUnits = blocks.stream()
                    .filter((block) -> blockOccupiesDate(block, currentDate))
                    .mapToInt(RoomInventoryBlock::getBlockedUnits)
                    .sum();

            int totalUnits = Math.max(safeRoom.getTotalUnits(), 1);
            int availableUnits = Math.max(totalUnits - bookedUnits - blockedUnits, 0);

            result.add(new RoomInventoryDayDTO(currentDate, totalUnits, bookedUnits, blockedUnits, availableUnits));
        }

        return result;
    }

    public int getMinimumAvailableUnits(
            Room room,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            String excludedBookingId) {

        if (checkInDate == null || checkOutDate == null || !checkOutDate.isAfter(checkInDate)) {
            throw new RuntimeException("Ngay nhan va ngay tra phong khong hop le");
        }

        LocalDate lastNight = checkOutDate.minusDays(1);
        return buildInventoryCalendar(requireRoom(room), checkInDate, lastNight, excludedBookingId)
                .stream()
                .mapToInt(RoomInventoryDayDTO::getAvailableUnits)
                .min()
                .orElse(Math.max(room.getTotalUnits(), 1));
    }

    public void applyInventorySnapshot(Room room, LocalDate checkInDate, LocalDate checkOutDate) {
        Room safeRoom = requireRoom(room);

        if (checkInDate == null || checkOutDate == null || !checkOutDate.isAfter(checkInDate)) {
            safeRoom.setBookedUnits(0);
            safeRoom.setBlockedUnits(0);
            safeRoom.setAvailableUnits(Math.max(safeRoom.getTotalUnits(), 1));
            return;
        }

        List<RoomInventoryDayDTO> days = buildInventoryCalendar(safeRoom, checkInDate, checkOutDate.minusDays(1));
        int minAvailable = days.stream().mapToInt(RoomInventoryDayDTO::getAvailableUnits).min().orElse(0);
        int maxBooked = days.stream().mapToInt(RoomInventoryDayDTO::getBookedUnits).max().orElse(0);
        int maxBlocked = days.stream().mapToInt(RoomInventoryDayDTO::getBlockedUnits).max().orElse(0);

        safeRoom.setAvailableUnits(minAvailable);
        safeRoom.setBookedUnits(maxBooked);
        safeRoom.setBlockedUnits(maxBlocked);
    }

    public List<RoomInventoryBlock> getBlocksByRoomId(String roomId) {
        return roomInventoryBlockRepository.findByRoomIdOrderByStartDateAsc(requireNonBlank(roomId, "Room id is required"));
    }

    public RoomInventoryBlock saveBlock(RoomInventoryBlock block) {
        return roomInventoryBlockRepository.save(block);
    }

    public RoomInventoryBlock getBlockById(String blockId) {
        return roomInventoryBlockRepository.findById(requireNonBlank(blockId, "Block id is required"))
                .orElseThrow(() -> new RuntimeException("Khong tim thay block ton kho"));
    }

    public void deleteBlock(String blockId) {
        roomInventoryBlockRepository.deleteById(requireNonBlank(blockId, "Block id is required"));
    }

    public void deleteBlocksByRoomId(String roomId) {
        roomInventoryBlockRepository.deleteByRoomId(requireNonBlank(roomId, "Room id is required"));
    }

    private Room requireRoom(Room room) {
        if (room == null || room.getId() == null || room.getId().isBlank()) {
            throw new RuntimeException("Room khong hop le");
        }

        return room;
    }

    private boolean bookingConsumesInventory(Booking booking) {
        if (booking == null || booking.getStatus() == null) {
            return false;
        }

        return booking.getStatus() == BookingStatus.CONFIRMED
                || booking.getStatus() == BookingStatus.CHECKED_IN;
    }

    private boolean bookingOccupiesDate(Booking booking, LocalDate date) {
        return booking.getCheckInDate() != null
                && booking.getCheckOutDate() != null
                && !date.isBefore(booking.getCheckInDate())
                && date.isBefore(booking.getCheckOutDate());
    }

    private boolean blockOccupiesDate(RoomInventoryBlock block, LocalDate date) {
        return block.getStartDate() != null
                && block.getEndDate() != null
                && !date.isBefore(block.getStartDate())
                && !date.isAfter(block.getEndDate());
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }

        return value;
    }
}
