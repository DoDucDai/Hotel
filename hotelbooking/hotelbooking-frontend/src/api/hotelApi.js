import axiosClient from "../utils/axiosClient"; 

export const getHotels = () => {
  return axiosClient.get("/hotels");
};