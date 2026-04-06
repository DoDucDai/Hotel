import { addDaysToDateInput, formatDateInputLocal } from "../../utils/dateInput.js";

export const initialHotelForm = {
 name: "",
 address: "",
 city: "",
 starRating: 3,
 amenities: "",
 freeCancellationBeforeDays: 3,
 lateCancellationRefundRate: 50,
};

export const initialRoomForm = {
 hotelId: "",
 name: "",
 capacity: 1,
 price: 0,
 roomType: "STANDARD",
 bedType: "",
 description: "",
 totalUnits: 1,
 amenities: "",
};

export const currencyFormatter = new Intl.NumberFormat("vi-VN", {
 style: "currency",
 currency: "VND",
 maximumFractionDigits: 0,
});

export function todayString() {
 return formatDateInputLocal(new Date());
}

export function addDays(value, amount) {
 return addDaysToDateInput(value, amount);
}

export function normalizeList(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload?.content)) {
 return payload.content;
 }

 if (Array.isArray(payload?.data)) {
 return payload.data;
 }

 return [];
}

export function parseCommaList(value) {
 return String(value || "")
 .split(",")
 .map((item) => item.trim())
 .filter(Boolean);
}

export function formatDate(value) {
 if (!value) {
 return "-";
 }

 const date = new Date(value);
 if (Number.isNaN(date.getTime())) {
 return value;
 }

 return date.toLocaleDateString("vi-VN");
}

export function formatDateTime(value) {
 if (!value) {
 return "-";
 }

 const date = new Date(value);
 if (Number.isNaN(date.getTime())) {
 return "-";
 }

 return date.toLocaleString("vi-VN");
}

export function approvalMeta(status) {
 switch (status) {
 case "APPROVED":
 return { label: "Đã duyệt", className: "success" };
 case "REJECTED":
 return { label: "Bị từ chối", className: "danger" };
 default:
 return { label: "Chờ duyệt", className: "pending" };
 }
}
