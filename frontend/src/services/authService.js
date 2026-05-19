import axiosClient from "../utils/axiosClient";

export const login = (data) => {
 return axiosClient.post("/auth/login", data);
};

export const register = (data) => {
 return axiosClient.post("/auth/register", data);
};

export const resendVerificationEmail = (email) => {
 return axiosClient.post("/auth/resend-verification", { email });
};

export const forgotPassword = (email) => {
 return axiosClient.post("/auth/forgot-password", { email });
};

export const validateResetPasswordToken = (token) => {
 return axiosClient.get("/auth/reset-password/validate", {
 params: { token },
 });
};

export const resetPassword = (token, password) => {
 return axiosClient.post("/auth/reset-password", { token, password });
};

export const verifyEmail = (token) => {
 return axiosClient.get("/auth/verify-email", {
 params: { token },
 });
};
