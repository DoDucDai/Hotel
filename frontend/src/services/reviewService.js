import axiosClient from "../utils/axiosClient";

export const getHotelReviews = (hotelId) => {
 return axiosClient.get(`/reviews?hotelId=${encodeURIComponent(hotelId)}`);
};

export const createReview = (data) => {
 return axiosClient.post("/reviews", data);
};