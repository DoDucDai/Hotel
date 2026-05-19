package com.example.hotelbooking.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.hotelbooking.dto.HostDashboardDTO;
import com.example.hotelbooking.dto.InventoryBlockRequest;
import com.example.hotelbooking.dto.RoomInventoryDayDTO;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.RoomInventoryBlock;

/**
 * Backward-compatible facade for legacy controller/service wiring.
 * New code should inject HostHotelService, HostRoomService, HostInventoryService,
 * and HostDashboardService directly.
 */
@Service
@Deprecated
public class HostManagementService {

    private final HostHotelService hostHotelService;
    private final HostRoomService hostRoomService;
    private final HostInventoryService hostInventoryService;
    private final HostDashboardService hostDashboardService;

    @Deprecated
    public HostManagementService(
            HostHotelService hostHotelService,
            HostRoomService hostRoomService,
            HostInventoryService hostInventoryService,
            HostDashboardService hostDashboardService) {
        this.hostHotelService = hostHotelService;
        this.hostRoomService = hostRoomService;
        this.hostInventoryService = hostInventoryService;
        this.hostDashboardService = hostDashboardService;
    }

    @Deprecated
    public List<Hotel> getMyHotels(String email) {
        return hostHotelService.getMyHotels(email);
    }

    @Deprecated
    public Hotel createHotel(Hotel hotel, String email) {
        return hostHotelService.createHotel(hotel, email);
    }

    @Deprecated
    public Hotel updateHotel(String hotelId, Hotel updatedHotel, String email) {
        return hostHotelService.updateHotel(hotelId, updatedHotel, email);
    }

    @Deprecated
    public Map<String, String> deleteHotel(String hotelId, String email) {
        return hostHotelService.deleteHotel(hotelId, email);
    }

    @Deprecated
    public Hotel uploadHotelImages(String hotelId, MultipartFile[] files, String email) throws IOException {
        return hostHotelService.uploadHotelImages(hotelId, files, email);
    }

    @Deprecated
    public List<Room> getMyRooms(String email) {
        return hostRoomService.getMyRooms(email);
    }

    @Deprecated
    public Room createRoom(Room room, String email) {
        return hostRoomService.createRoom(room, email);
    }

    @Deprecated
    public Room updateRoom(String roomId, Room updatedRoom, String email) {
        return hostRoomService.updateRoom(roomId, updatedRoom, email);
    }

    @Deprecated
    public Map<String, String> deleteRoom(String roomId, String email) {
        return hostRoomService.deleteRoom(roomId, email);
    }

    @Deprecated
    public Room uploadRoomImages(String roomId, MultipartFile[] files, String email) throws IOException {
        return hostRoomService.uploadRoomImages(roomId, files, email);
    }

    @Deprecated
    public List<RoomInventoryDayDTO> getRoomInventory(String roomId, String startDate, String endDate, String email) {
        return hostInventoryService.getRoomInventory(roomId, startDate, endDate, email);
    }

    @Deprecated
    public List<RoomInventoryBlock> getRoomInventoryBlocks(String roomId, String email) {
        return hostInventoryService.getRoomInventoryBlocks(roomId, email);
    }

    @Deprecated
    public RoomInventoryBlock createInventoryBlock(String roomId, InventoryBlockRequest request, String email) {
        return hostInventoryService.createInventoryBlock(roomId, request, email);
    }

    @Deprecated
    public Map<String, String> deleteInventoryBlock(String blockId, String email) {
        return hostInventoryService.deleteInventoryBlock(blockId, email);
    }

    @Deprecated
    public HostDashboardDTO getDashboard(String email) {
        return hostDashboardService.getDashboard(email);
    }
}
