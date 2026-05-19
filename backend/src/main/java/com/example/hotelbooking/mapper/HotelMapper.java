package com.example.hotelbooking.mapper;

import com.example.hotelbooking.dto.HotelDTO;
import com.example.hotelbooking.model.Hotel;

public class HotelMapper {

    public static Hotel toEntity(HotelDTO dto){

        Hotel hotel = new Hotel();

        hotel.setName(dto.getName());
        hotel.setAddress(dto.getAddress());
        hotel.setCity(dto.getCity());
        hotel.setImageUrl(dto.getImageUrl());
        hotel.setImageUrls(dto.getImageUrls());

        return hotel;
    }
}
