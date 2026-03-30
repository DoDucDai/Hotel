package com.example.hotelbooking.mapper;

import com.example.hotelbooking.dto.RoomDTO;
import com.example.hotelbooking.model.Room;

public class RoomMapper {

    public static RoomDTO toDTO(Room room) {
        return new RoomDTO(
                room.getId(),
                room.getHotelId(),
                room.getName(),
                room.getCapacity(),
                room.getPrice(),
                room.getRoomType(),
                room.getBedType(),
                room.getDescription(),
                room.getTotalUnits(),
                room.getAvailableUnits()
        );
    }
}
