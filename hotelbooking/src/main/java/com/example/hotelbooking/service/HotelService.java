package com.example.hotelbooking.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.repository.HotelRepository;

@Service
public class HotelService {

    private final HotelRepository hotelRepository;

    public HotelService(HotelRepository hotelRepository){
        this.hotelRepository = hotelRepository;
    }

    // pagination
    public Page<Hotel> getHotels(int page, int size){

        Pageable pageable = PageRequest.of(page, size);

        return hotelRepository.findAll(pageable);
    }

    // search
    public java.util.List<Hotel> searchHotel(String name){
        return hotelRepository.findByNameContainingIgnoreCase(name);
    }

}