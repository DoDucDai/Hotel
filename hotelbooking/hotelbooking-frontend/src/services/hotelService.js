import axiosClient from "../utils/axiosClient";

export const getHotels = (pageOrParams = 0, size = 200, extraParams = {}) => {
 let params;

 if (typeof pageOrParams === "object" && pageOrParams !== null) {
 params = { page: 0, size: 200, ...pageOrParams };
 } else {
 params = { page: pageOrParams, size, ...extraParams };
 }

 return axiosClient.get("/hotels", { params });
};

export const getHotelById = (id) => {
 return axiosClient.get(`/hotels/${id}`);
};

export const createHotel = (data) => {
 return axiosClient.post("/hotels", data);
};

export const uploadHotelImage = (id, file) => {
 const formData = new FormData();
 formData.append("file", file);

 return axiosClient.post(`/hotels/${id}/image`, formData);
};

export const getHotelRecommendations = (id, limit = 4) => {
 return axiosClient.get(`/hotels/${id}/recommendations?limit=${limit}`);
};
