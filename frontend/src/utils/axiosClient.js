import axios from "axios";
import { API_BASE_URL } from "./apiConfig.js";

const api = axios.create({
 baseURL: API_BASE_URL,
});

let refreshPromise = null;

function clearAuthStorage() {
 localStorage.removeItem("accessToken");
 localStorage.removeItem("refreshToken");
 localStorage.removeItem("role");
}

function redirectToLogin() {
 if (window.location.pathname !== "/login") {
 window.location.href = "/login";
 }
}

function isRefreshRequest(config) {
 return String(config?.url || "").includes("/auth/refresh");
}

function isAuthRequest(config) {
 return String(config?.url || "").includes("/auth/");
}

function refreshAccessToken() {
 if (!refreshPromise) {
 const refreshToken = localStorage.getItem("refreshToken");

 if (!refreshToken) {
 return Promise.reject(new Error("Missing refresh token"));
 }

 refreshPromise = axios
 .post(`${API_BASE_URL}/auth/refresh`, null, {
 params: { refreshToken },
 })
 .then((res) => {
 const accessToken = res?.data?.accessToken;
 if (!accessToken) {
 throw new Error("Refresh endpoint did not return an access token");
 }

 localStorage.setItem("accessToken", accessToken);
 return accessToken;
 })
 .finally(() => {
 refreshPromise = null;
 });
 }

 return refreshPromise;
}

api.interceptors.request.use((config) => {
 const token = localStorage.getItem("accessToken");

 if (token) {
 config.headers = config.headers || {};
 config.headers.Authorization = `Bearer ${token}`;
 }

 return config;
});

api.interceptors.response.use(
 (response) => response,
 async (error) => {
 const originalRequest = error?.config;
 const status = error?.response?.status;
 const hasRefreshToken = Boolean(localStorage.getItem("refreshToken"));

 if (
 status === 401 &&
 originalRequest &&
 !originalRequest._retry &&
 !isRefreshRequest(originalRequest) &&
 !isAuthRequest(originalRequest) &&
 hasRefreshToken
 ) {
 originalRequest._retry = true;

 try {
 const nextAccessToken = await refreshAccessToken();
 originalRequest.headers = originalRequest.headers || {};
 originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
 return api(originalRequest);
 } catch (refreshError) {
 clearAuthStorage();
 redirectToLogin();
 return Promise.reject(refreshError);
 }
 }

 if (status === 401) {
 const hadSession = Boolean(
 localStorage.getItem("accessToken") || localStorage.getItem("refreshToken")
 );
 clearAuthStorage();
 if (hadSession) {
 redirectToLogin();
 }
 }

 return Promise.reject(error);
 }
);

export default api;
