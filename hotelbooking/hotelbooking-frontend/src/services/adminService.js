import axiosClient from "../utils/axiosClient";

export const getAdminDashboard = () => {
  return axiosClient.get("/admin/dashboard");
};

export const getAdminHotelsAll = () => {
  return axiosClient.get("/admin/hotels");
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

export const getAdminCoupons = () => {
  return axiosClient.get("/coupons");
};

export const createAdminCoupon = (payload) => {
  return axiosClient.post("/coupons", payload);
};

export const updateAdminCoupon = (couponId, payload) => {
  return axiosClient.put(`/coupons/${couponId}`, payload);
};

export const deleteAdminCoupon = (couponId) => {
  return axiosClient.delete(`/coupons/${couponId}`);
};

export const updateAdminBookingPaymentStatus = (bookingId, payload) => {
  return axiosClient.put(`/bookings/${bookingId}/payment-status`, payload);
};

export const updateAdminBookingStatus = (bookingId, payload) => {
  return axiosClient.put(`/bookings/${bookingId}/status`, payload);
};

export const updateAdminHotelApproval = (hotelId, payload) => {
  return axiosClient.put(`/admin/hotels/${hotelId}/approval`, payload);
};

export const getAdminDisputes = () => {
  return axiosClient.get("/admin/disputes");
};

export const updateAdminDisputeStatus = (disputeId, payload) => {
  return axiosClient.put(`/admin/disputes/${disputeId}`, payload);
};

export const getAdminLogs = () => {
  return axiosClient.get("/admin/logs");
};
