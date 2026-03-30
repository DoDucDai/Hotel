import axiosClient from "../utils/axiosClient";

export const getHotelReviews = (hotelId) => {
 return axiosClient.get(`/reviewsohotelId=${encodeURIComponent(hotelId)}`);
};

export const createReview = (data) => {
 return axiosClient.post("/reviews", data);
};
