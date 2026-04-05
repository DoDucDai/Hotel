import axiosClient from "../utils/axiosClient";

export const createBooking = (data) => {
 return axiosClient.post("/bookings", data);
};

export const createPaymentCheckout = (bookingId) => {
 return axiosClient.post(`/payments/checkout/${bookingId}`);
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

export const createDispute = (data) => {
 return axiosClient.post("/disputes", data);
};

export const getMyDisputes = () => {
 return axiosClient.get("/disputes/my");
};
