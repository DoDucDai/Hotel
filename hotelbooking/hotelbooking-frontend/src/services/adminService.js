import axiosClient from "../utils/axiosClient";

export const getAdminDashboard = () => {
  return axiosClient.get("/admin/dashboard");
};

export const getAdminUsers = () => {
  return axiosClient.get("/users");
};

export const getAdminBookings = () => {
  return axiosClient.get("/bookings");
};

export const getAdminRooms = (page = 0, size = 5000) => {
  return axiosClient.get(`/rooms?page=${page}&size=${size}`);
};
