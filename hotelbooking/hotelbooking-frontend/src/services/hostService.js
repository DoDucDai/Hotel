import axiosClient from "../utils/axiosClient";

export const getMyHostHotels = () => {
  return axiosClient.get("/host/hotels/my");
};

export const createHostHotel = (data) => {
  return axiosClient.post("/host/hotels", data);
};

export const updateHostHotel = (id, data) => {
  return axiosClient.put(`/host/hotels/${id}`, data);
};

export const deleteHostHotel = (id) => {
  return axiosClient.delete(`/host/hotels/${id}`);
};

export const getMyHostRooms = () => {
  return axiosClient.get("/host/rooms/my");
};

export const createHostRoom = (data) => {
  return axiosClient.post("/host/rooms", data);
};

export const updateHostRoom = (id, data) => {
  return axiosClient.put(`/host/rooms/${id}`, data);
};

export const deleteHostRoom = (id) => {
  return axiosClient.delete(`/host/rooms/${id}`);
};
