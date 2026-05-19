package com.example.hotelbooking.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

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
import org.springframework.web.multipart.MultipartFile;

import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.security.AuthenticationEmailResolver;
import com.example.hotelbooking.service.HostRoomService;

@RestController
@RequestMapping("/host/rooms")
public class HostRoomController {

    private final HostRoomService hostRoomService;
    private final AuthenticationEmailResolver authenticationEmailResolver;

    public HostRoomController(
            HostRoomService hostRoomService,
            AuthenticationEmailResolver authenticationEmailResolver) {
        this.hostRoomService = hostRoomService;
        this.authenticationEmailResolver = authenticationEmailResolver;
    }

    @GetMapping("/my")
    public List<Room> getMyRooms(Authentication authentication) {
        return hostRoomService.getMyRooms(authenticationEmailResolver.requireEmail(authentication));
    }

    @PostMapping
    public Room createRoom(@RequestBody Room room, Authentication authentication) {
        return hostRoomService.createRoom(room, authenticationEmailResolver.requireEmail(authentication));
    }

    @PutMapping("/{id}")
    public Room updateRoom(
            @PathVariable String id,
            @RequestBody Room updatedRoom,
            Authentication authentication) {
        return hostRoomService.updateRoom(id, updatedRoom, authenticationEmailResolver.requireEmail(authentication));
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteRoom(
            @PathVariable String id,
            Authentication authentication) {
        return hostRoomService.deleteRoom(id, authenticationEmailResolver.requireEmail(authentication));
    }

    @PostMapping("/{id}/images")
    public Room uploadRoomImages(
            @PathVariable String id,
            @RequestParam("files") MultipartFile[] files,
            Authentication authentication) throws IOException {
        return hostRoomService.uploadRoomImages(id, files, authenticationEmailResolver.requireEmail(authentication));
    }
}
