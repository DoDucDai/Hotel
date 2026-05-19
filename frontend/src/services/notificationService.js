import axiosClient from "../utils/axiosClient";

export const getMyNotifications = () => {
 return axiosClient.get("/notifications/my");
};

export const getUnreadNotificationCount = () => {
 return axiosClient.get("/notifications/my/unread-count");
};

export const markNotificationAsRead = (notificationId) => {
 return axiosClient.put(`/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsRead = () => {
 return axiosClient.put("/notifications/my/read-all");
};