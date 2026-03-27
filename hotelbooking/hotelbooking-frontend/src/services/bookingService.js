import axiosClient from "../utils/axiosClient";

export const createBooking = (data) => {
  return axiosClient.post("/bookings", data);
};

export const getMyBookings = () => {
  return axiosClient.get("/bookings/my");
};

export const cancelBooking = (bookingId, reason) => {
  return axiosClient.put(`/bookings/${bookingId}/cancel`, { reason });
};

export const rescheduleBooking = (bookingId, data) => {
  return axiosClient.put(`/bookings/${bookingId}/reschedule`, data);
};
