import axiosClient from "../utils/axiosClient";

// lấy danh sách hotel (pagination)
export const getHotels = (page = 0, size = 10) => {
  return axiosClient.get(`/hotels?page=${page}&size=${size}`);
};

// lấy chi tiết hotel
export const getHotelById = (id) => {
  return axiosClient.get(`/hotels/${id}`);
};

// tạo hotel
export const createHotel = (data) => {
  return axiosClient.post("/hotels", data);
};

// upload ảnh
export const uploadHotelImage = (id, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return axiosClient.post(`/hotels/${id}/image`, formData);
};
