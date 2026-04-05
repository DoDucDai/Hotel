import axiosClient from "../utils/axiosClient";

function buildImageFormData(files) {
 const formData = new FormData();
 Array.from(files || []).forEach((file) => {
 formData.append("files", file);
 });
 return formData;
}

export const getMyHostHotels = () => {
 return axiosClient.get("/host/hotels/my");
};

export const getHostDashboard = () => {
 return axiosClient.get("/host/dashboard");
};

export const createHostHotel = (data) => {
 return axiosClient.post("/host/hotels", data);
};

export const updateHostHotel = (id, data) => {
 return axiosClient.put(`/host/hotels/${id}`, data);
};

export const uploadHostHotelImages = (id, files) => {
 return axiosClient.post(`/host/hotels/${id}/images`, buildImageFormData(files));
};

export const deleteHostHotel = (id) => {
 return axiosClient.delete(`/host/hotels/${id}`);
};

export const getMyHostRooms = () => {
 return axiosClient.get("/host/rooms/my");
};

export const createHostRoom = (data) => {
 return axiosClient.post("/host/rooms", data);
};

export const updateHostRoom = (id, data) => {
 return axiosClient.put(`/host/rooms/${id}`, data);
};

export const uploadHostRoomImages = (id, files) => {
 return axiosClient.post(`/host/rooms/${id}/images`, buildImageFormData(files));
};

export const deleteHostRoom = (id) => {
 return axiosClient.delete(`/host/rooms/${id}`);
};

export const getHostRoomInventory = (roomId, startDate, endDate) => {
 const params = new URLSearchParams();
 params.append("startDate", startDate);
 params.append("endDate", endDate);
 return axiosClient.get(`/host/rooms/${roomId}/inventory?${params.toString()}`);
};

export const getHostInventoryBlocks = (roomId) => {
 return axiosClient.get(`/host/rooms/${roomId}/inventory-blocks`);
};

export const createHostInventoryBlock = (roomId, payload) => {
 return axiosClient.post(`/host/rooms/${roomId}/inventory-blocks`, payload);
};

export const deleteHostInventoryBlock = (blockId) => {
 return axiosClient.delete(`/host/inventory-blocks/${blockId}`);
};
