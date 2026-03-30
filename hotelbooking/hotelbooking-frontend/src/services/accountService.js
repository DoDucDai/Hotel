import axiosClient from "../utils/axiosClient";

export const getMyAccount = () => {
 return axiosClient.get("/users/me");
};

export const updateMyProfile = (data) => {
 return axiosClient.put("/users/me/profile", data);
};

export const updateMyEmail = (email) => {
 return axiosClient.put("/users/me/email", { email });
};
