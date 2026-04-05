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

import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.security.AuthenticationEmailResolver;
import com.example.hotelbooking.service.HostHotelService;

@RestController
@RequestMapping("/host/hotels")
public class HostHotelController {

    private final HostHotelService hostHotelService;
    private final AuthenticationEmailResolver authenticationEmailResolver;

    public HostHotelController(
            HostHotelService hostHotelService,
            AuthenticationEmailResolver authenticationEmailResolver) {
        this.hostHotelService = hostHotelService;
        this.authenticationEmailResolver = authenticationEmailResolver;
    }

    @GetMapping("/my")
    public List<Hotel> getMyHotels(Authentication authentication) {
        return hostHotelService.getMyHotels(authenticationEmailResolver.requireEmail(authentication));
    }

    @PostMapping
    public Hotel createHotel(@RequestBody Hotel hotel, Authentication authentication) {
        return hostHotelService.createHotel(hotel, authenticationEmailResolver.requireEmail(authentication));
    }

    @PutMapping("/{id}")
    public Hotel updateHotel(
            @PathVariable String id,
            @RequestBody Hotel updatedHotel,
            Authentication authentication) {
        return hostHotelService.updateHotel(id, updatedHotel, authenticationEmailResolver.requireEmail(authentication));
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteHotel(
            @PathVariable String id,
            Authentication authentication) {
        return hostHotelService.deleteHotel(id, authenticationEmailResolver.requireEmail(authentication));
    }

    @PostMapping("/{id}/images")
    public Hotel uploadHotelImages(
            @PathVariable String id,
            @RequestParam("files") MultipartFile[] files,
            Authentication authentication) throws IOException {
        return hostHotelService.uploadHotelImages(id, files, authenticationEmailResolver.requireEmail(authentication));
    }
}
