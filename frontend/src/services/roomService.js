import axiosClient from "../utils/axiosClient";

export const getRoomsByHotel = (hotelId) => {
 return axiosClient.get(`/rooms/hotel/${hotelId}`);
};

export const getRooms = (page = 0, size = 500) => {
 return axiosClient.get(`/rooms?page=${page}&size=${size}`);
};

export const getRoomById = (roomId) => {
 return axiosClient.get(`/rooms/${roomId}`);
};

export const getRoomInventory = (roomId, startDate, endDate) => {
 const params = new URLSearchParams();
 params.append("startDate", startDate);
 params.append("endDate", endDate);
 return axiosClient.get(`/rooms/${roomId}/inventory?${params.toString()}`);
};

export const searchRooms = ({
 guests = 1,
 checkIn = "",
 checkOut = "",
 minPrice = "",
 maxPrice = "",
 amenity = "",
 sortBy = "price_asc",
}) => {
 const params = new URLSearchParams();
 params.append("guests", String(guests || 1));

 if (checkIn) {
 params.append("checkIn", checkIn);
 }

 if (checkOut) {
 params.append("checkOut", checkOut);
 }

 if (minPrice !== "" && minPrice !== null && minPrice !== undefined) {
 params.append("minPrice", String(minPrice));
 }

 if (maxPrice !== "" && maxPrice !== null && maxPrice !== undefined) {
 params.append("maxPrice", String(maxPrice));
 }

 if (amenity) {
 params.append("amenity", amenity);
 }

 if (sortBy) {
 params.append("sortBy", sortBy);
 }

 return axiosClient.get(`/rooms/search?${params.toString()}`);
};
