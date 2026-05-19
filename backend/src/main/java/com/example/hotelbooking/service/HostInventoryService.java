package com.example.hotelbooking.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.InventoryBlockRequest;
import com.example.hotelbooking.dto.RoomInventoryDayDTO;
import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.RoomInventoryBlock;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.RoomRepository;

@Service
public class HostInventoryService {

    private final HostAccessService hostAccessService;
    private final RoomRepository roomRepository;
    private final RoomInventoryService roomInventoryService;
    private final AuditLogService auditLogService;

    public HostInventoryService(
            HostAccessService hostAccessService,
            RoomRepository roomRepository,
            RoomInventoryService roomInventoryService,
            AuditLogService auditLogService) {
        this.hostAccessService = hostAccessService;
        this.roomRepository = roomRepository;
        this.roomInventoryService = roomInventoryService;
        this.auditLogService = auditLogService;
    }

    public List<RoomInventoryDayDTO> getRoomInventory(
            String roomId,
            String startDate,
            String endDate,
            String email) {

        User user = hostAccessService.requireCurrentUser(email);
        Room room = roomRepository.findById(hostAccessService.requireNonBlank(roomId, "Room id is required"))
                .orElseThrow(() -> new NotFoundException("Room not found"));
        hostAccessService.assertRoomOwner(user, room);

        return roomInventoryService.buildInventoryCalendar(
                room,
                LocalDate.parse(startDate),
                LocalDate.parse(endDate));
    }

    public List<RoomInventoryBlock> getRoomInventoryBlocks(String roomId, String email) {
        User user = hostAccessService.requireCurrentUser(email);
        Room room = roomRepository.findById(hostAccessService.requireNonBlank(roomId, "Room id is required"))
                .orElseThrow(() -> new NotFoundException("Room not found"));
        hostAccessService.assertRoomOwner(user, room);
        return roomInventoryService.getBlocksByRoomId(room.getId());
    }

    public RoomInventoryBlock createInventoryBlock(String roomId, InventoryBlockRequest request, String email) {
        User user = hostAccessService.requireCurrentUser(email);
        Room room = roomRepository.findById(hostAccessService.requireNonBlank(roomId, "Room id is required"))
                .orElseThrow(() -> new NotFoundException("Room not found"));
        hostAccessService.assertRoomOwner(user, room);

        if (request == null) {
            throw new BadRequestException("Inventory block request is required");
        }

        InventoryBlockRequest safeRequest = request;
        LocalDate startDate = safeRequest.getStartDate();
        LocalDate endDate = safeRequest.getEndDate();
        if (startDate == null) {
            throw new BadRequestException("Ngay bat dau la bat buoc");
        }

        if (endDate == null) {
            throw new BadRequestException("Ngay ket thuc la bat buoc");
        }

        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("Ngay ket thuc block khong hop le");
        }

        int blockedUnits = Math.max(safeRequest.getBlockedUnits(), 1);
        if (blockedUnits > Math.max(room.getTotalUnits(), 1)) {
            throw new BadRequestException("So phong block vuot qua tong so luong phong");
        }

        RoomInventoryBlock block = new RoomInventoryBlock();
        block.setRoomId(room.getId());
        block.setStartDate(startDate);
        block.setEndDate(endDate);
        block.setBlockedUnits(blockedUnits);
        block.setReason(trimToNull(safeRequest.getReason()));
        block.setCreatedByUserId(user.getId());
        block.setCreatedAt(LocalDateTime.now());

        RoomInventoryBlock savedBlock = roomInventoryService.saveBlock(block);
        auditLogService.record("BLOCK_ROOM_INVENTORY", "ROOM", room.getId(), user, "Block ton kho theo ngay");
        return savedBlock;
    }

    public Map<String, String> deleteInventoryBlock(String blockId, String email) {
        User user = hostAccessService.requireCurrentUser(email);
        String normalizedBlockId = hostAccessService.requireNonBlank(blockId, "Inventory block id is required");
        RoomInventoryBlock block = roomInventoryService.getBlockById(normalizedBlockId);
        Room room = roomRepository.findById(hostAccessService.requireNonBlank(block.getRoomId(), "Room id is required"))
                .orElseThrow(() -> new NotFoundException("Room not found"));
        hostAccessService.assertRoomOwner(user, room);

        roomInventoryService.deleteBlock(normalizedBlockId);
        auditLogService.record("UNBLOCK_ROOM_INVENTORY", "ROOM", room.getId(), user, "Go block ton kho");
        return Map.of("message", "Inventory block deleted");
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
