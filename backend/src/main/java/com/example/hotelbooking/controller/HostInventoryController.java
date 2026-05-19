package com.example.hotelbooking.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.InventoryBlockRequest;
import com.example.hotelbooking.dto.RoomInventoryDayDTO;
import com.example.hotelbooking.model.RoomInventoryBlock;
import com.example.hotelbooking.security.AuthenticationEmailResolver;
import com.example.hotelbooking.service.HostInventoryService;

@RestController
@RequestMapping("/host")
public class HostInventoryController {

    private final HostInventoryService hostInventoryService;
    private final AuthenticationEmailResolver authenticationEmailResolver;

    public HostInventoryController(
            HostInventoryService hostInventoryService,
            AuthenticationEmailResolver authenticationEmailResolver) {
        this.hostInventoryService = hostInventoryService;
        this.authenticationEmailResolver = authenticationEmailResolver;
    }

    @GetMapping("/rooms/{roomId}/inventory")
    public List<RoomInventoryDayDTO> getRoomInventory(
            @PathVariable String roomId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            Authentication authentication) {
        return hostInventoryService.getRoomInventory(
                roomId,
                startDate,
                endDate,
                authenticationEmailResolver.requireEmail(authentication));
    }

    @GetMapping("/rooms/{roomId}/inventory-blocks")
    public List<RoomInventoryBlock> getRoomInventoryBlocks(
            @PathVariable String roomId,
            Authentication authentication) {
        return hostInventoryService.getRoomInventoryBlocks(
                roomId,
                authenticationEmailResolver.requireEmail(authentication));
    }

    @PostMapping("/rooms/{roomId}/inventory-blocks")
    public RoomInventoryBlock createInventoryBlock(
            @PathVariable String roomId,
            @RequestBody InventoryBlockRequest request,
            Authentication authentication) {
        return hostInventoryService.createInventoryBlock(
                roomId,
                request,
                authenticationEmailResolver.requireEmail(authentication));
    }

    @DeleteMapping("/inventory-blocks/{blockId}")
    public Map<String, String> deleteInventoryBlock(
            @PathVariable String blockId,
            Authentication authentication) {
        return hostInventoryService.deleteInventoryBlock(
                blockId,
                authenticationEmailResolver.requireEmail(authentication));
    }
}
