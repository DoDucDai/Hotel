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

export const requestMyEmailChangeOtp = (email) => {
 return axiosClient.post("/users/me/email/request-otp", { email });
};

export const verifyMyEmailChangeOtp = (email, otp) => {
 return axiosClient.post("/users/me/email/verify-otp", { email, otp });
};
