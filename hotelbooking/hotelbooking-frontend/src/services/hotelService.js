import axiosClient from "../utils/axiosClient";

// lay danh sach hotel (pagination)
export const getHotels = (page = 0, size = 10) => {
 return axiosClient.get(`/hotels?page=${page}&size=${size}`);
};

// lay ch? tiet hotel
export const getHotelById = (id) => {
 return axiosClient.get(`/hotels/${id}`);
};

// tao hotel
export const createHotel = (data) => {
 return axiosClient.post("/hotels", data);
};

// upload anh
export const uploadHotelImage = (id, file) => {
 const formData = new FormData();
 formData.append("file", file);

 return axiosClient.post(`/hotels/${id}/image`, formData);
};

export const getHotelRecommendations = (id, limit = 4) => {
 return axiosClient.get(`/hotels/${id}/recommendations?limit=${limit}`);
};

