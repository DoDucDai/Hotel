package com.example.hotelbooking.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.hotelbooking.model.RoomInventoryBlock;

public interface RoomInventoryBlockRepository extends MongoRepository<RoomInventoryBlock, String> {

    List<RoomInventoryBlock> findByRoomIdOrderByStartDateAsc(String roomId);

    void deleteByRoomId(String roomId);
}
