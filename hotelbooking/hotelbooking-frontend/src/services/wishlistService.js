import axiosClient from "../utils/axiosClient";

export const getMyWishlist = () => {
  return axiosClient.get("/wishlist");
};

export const addToWishlist = (hotelId) => {
  return axiosClient.post(`/wishlist/${hotelId}`);
};

export const removeFromWishlist = (hotelId) => {
  return axiosClient.delete(`/wishlist/${hotelId}`);
};
