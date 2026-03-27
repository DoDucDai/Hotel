import axiosClient from "../utils/axiosClient";

export const getActiveCoupons = () => {
  return axiosClient.get("/coupons/active");
};
