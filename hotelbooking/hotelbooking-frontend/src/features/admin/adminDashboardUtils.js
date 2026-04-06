// Extracted constants/helpers to keep AdminDashboard page maintainable.

export const currencyFormatter = new Intl.NumberFormat("vi-VN", {
 style: "currency",
 currency: "VND",
 maximumFractionDigits: 0,
});

export const numberFormatter = new Intl.NumberFormat("vi-VN");

export const accountInitialState = {
 name: "",
 gender: "",
 dateOfBirth: "",
 citizenId: "",
};

export const accountMetaInitialState = {
 id: "",
 role: "ADMIN",
 emailVerified: false,
 emailVerifiedAt: "",
};

export const couponInitialState = {
 code: "",
 description: "",
 discountType: "PERCENT",
 discountValue: "",
 minOrderAmount: "0",
 expiresAt: "",
 active: true,
};

export const adminUserInitialState = {
 name: "",
 email: "",
 password: "",
 role: "USER",
 gender: "",
 dateOfBirth: "",
 citizenId: "",
};

export const adminUserRoleOptions = [
 { value: "USER", label: "USER" },
 { value: "ADMIN", label: "ADMIN" },
];

export const paymentStatusOptions = [
 { value: "PENDING", label: "Chờ thanh toán" },
 { value: "PAID", label: "Đã thanh toán" },
 { value: "REFUNDED", label: "Đã hoàn tiền" },
 { value: "FAILED", label: "Thất bại" },
];

export const paymentStatusFilterOptions = [
 { value: "all", label: "Tất cả payment" },
 ...paymentStatusOptions,
];

export const bookingStatusOptions = [
 { value: "CONFIRMED", label: "Đã xác nhận" },
 { value: "CHECKED_IN", label: "Checked-in" },
 { value: "CHECKED_OUT", label: "Checked-out" },
 { value: "NO_SHOW", label: "No-show" },
 { value: "CANCELLED", label: "Đã hủy" },
];

export const hotelApprovalOptions = [
 { value: "PENDING", label: "Chờ duyệt" },
 { value: "APPROVED", label: "Đã duyệt" },
 { value: "REJECTED", label: "Từ chối" },
];

export const disputeStatusOptions = [
 { value: "OPEN", label: "Mới tạo" },
 { value: "IN_REVIEW", label: "Đang xử lý" },
 { value: "RESOLVED", label: "Đã giải quyết" },
 { value: "REJECTED", label: "Từ chối" },
];

export const bookingStayStatusOptions = [
 { value: "all", label: "Tất cả trạng thái ở" },
 { value: "upcoming", label: "Sắp đến" },
 { value: "active", label: "Đang ở" },
 { value: "completed", label: "Hoàn tất" },
 { value: "cancelled", label: "Đã hủy" },
];

export const ADMIN_HOTELS_PER_PAGE = 8;

export function normalizeHotels(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.content)) {
 return payload.content;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

export function normalizeRooms(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.content)) {
 return payload.content;
 }

 if (Array.isArray(payload.data?.content)) {
 return payload.data.content;
 }

 return [];
}

export function normalizeBookings(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.content)) {
 return payload.content;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

export function normalizeUsers(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

export function toAdminUserFormState(user) {
 return {
 name: user?.name || "",
 email: user?.email || "",
 password: "",
 role: user?.role || "USER",
 gender: user?.gender || "",
 dateOfBirth: user?.dateOfBirth || "",
 citizenId: user?.citizenId || "",
 };
}

export function normalizeCoupons(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

export function normalizeDisputes(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

export function normalizeLogs(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

export function parseDate(value) {
 if (!value) {
 return null;
 }

 const date = new Date(value);
 if (Number.isNaN(date.getTime())) {
 return null;
 }

 date.setHours(0, 0, 0, 0);
 return date;
}

export function formatDate(value) {
 const date = parseDate(value);
 if (!date) {
 return "-";
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

export function bookingStayFilterValue(booking) {
 const meta = bookingStatusMeta(booking);

 if (meta.className === "pending") {
 return "upcoming";
 }

 if (meta.className === "success") {
 return "active";
 }

 if (meta.className === "danger") {
 return "cancelled";
 }

 return "completed";
}

export function bookingMatchesDateRange(booking, dateFromValue, dateToValue) {
 const rawStart = parseDate(dateFromValue);
 const rawEnd = parseDate(dateToValue);

 if (!rawStart && !rawEnd) {
 return true;
 }

 let rangeStart = rawStart;
 let rangeEnd = rawEnd;

 if (rangeStart && rangeEnd && rangeStart > rangeEnd) {
 rangeStart = rawEnd;
 rangeEnd = rawStart;
 }

 const checkIn = parseDate(booking?.checkInDate);
 const checkOut = parseDate(booking?.checkOutDate);
 if (!checkIn || !checkOut) {
 return false;
 }

 if (rangeStart && checkOut <= rangeStart) {
 return false;
 }

 if (rangeEnd) {
 const rangeEndExclusive = new Date(rangeEnd);
 rangeEndExclusive.setDate(rangeEndExclusive.getDate() + 1);
 if (checkIn >= rangeEndExclusive) {
 return false;
 }
 }

 return true;
}

export function bookingRevenueValue(booking) {
 return Number(booking?.finalPrice || booking?.totalPrice || 0);
}

export function bookingStatusMeta(booking) {
 switch (booking?.status) {
 case "CANCELLED":
 return { label: "Đã hủy", className: "danger" };
 case "CHECKED_IN":
 return { label: "Đang ở", className: "success" };
 case "CHECKED_OUT":
 return { label: "Đã trả phòng", className: "neutral" };
 case "NO_SHOW":
 return { label: "No-show", className: "info" };
 case "CONFIRMED": {
 const checkIn = parseDate(booking?.checkInDate);
 const today = new Date();
 today.setHours(0, 0, 0, 0);

 if (checkIn && today < checkIn) {
 return { label: "Sắp đến", className: "pending" };
 }

 return { label: "Đã xác nhận", className: "pending" };
 }
 default:
 return { label: "Không rõ", className: "neutral" };
 }
}

export function paymentStatusMeta(status) {
 switch (status) {
 case "PAID":
 return { label: "Đã thanh toán", className: "success", kind: "paid" };
 case "PENDING":
 return { label: "Chờ thanh toán", className: "pending", kind: "pending" };
 case "REFUNDED":
 return { label: "Đã hoàn tiền", className: "info", kind: "refunded" };
 case "FAILED":
 return { label: "Thất bại", className: "danger", kind: "failed" };
 default:
 return { label: "Không rõ", className: "neutral", kind: "unknown" };
 }
}

export function hotelApprovalMeta(status) {
 switch (status) {
 case "APPROVED":
 return { label: "Đã duyệt", className: "success" };
 case "REJECTED":
 return { label: "Từ chối", className: "danger" };
 default:
 return { label: "Chờ duyệt", className: "pending" };
 }
}

export function disputeStatusMeta(status) {
 switch (status) {
 case "RESOLVED":
 return { label: "Đã giải quyết", className: "success" };
 case "IN_REVIEW":
 return { label: "Đang xử lý", className: "info" };
 case "REJECTED":
 return { label: "Từ chối", className: "danger" };
 default:
 return { label: "Mới tạo", className: "pending" };
 }
}

export function paymentMethodLabel(method) {
 switch (method) {
 case "BANK_TRANSFER":
 return "Chuyển khoản";
 case "E_WALLET":
 return "Ví điện tử";
 case "PAY_AT_HOTEL":
 return "Tại khách sạn";
 default:
 return "-";
 }
}

export function couponStatusMeta(coupon) {
 const today = new Date();
 today.setHours(0, 0, 0, 0);

 if (!coupon?.active) {
 return { label: "Tạm tắt", className: "neutral", kind: "inactive" };
 }

 const expiresAt = parseDate(coupon?.expiresAt);
 if (expiresAt && expiresAt < today) {
 return { label: "Hết hạn", className: "danger", kind: "expired" };
 }

 return { label: "Đang hoạt động", className: "success", kind: "active" };
}

export function formatCouponValue(coupon) {
 if (!coupon) {
 return "-";
 }

 if (coupon.discountType === "FIXED") {
 return currencyFormatter.format(Number(coupon.discountValue || 0));
 }

 return `${numberFormatter.format(Number(coupon.discountValue || 0))}%`;
}

export function formatCellText(value, fallback = "-") {
 if (value === null || value === undefined) {
 return fallback;
 }

 const normalized = typeof value === "string" ? value.trim() : value;
 return normalized === "" ? fallback : normalized;
}

export function toCouponFormState(coupon) {
 return {
 code: coupon?.code || "",
 description: coupon?.description || "",
 discountType: coupon?.discountType || "PERCENT",
 discountValue:
 coupon?.discountValue === undefined || coupon?.discountValue === null
 ? ""
 : String(coupon.discountValue),
 minOrderAmount:
 coupon?.minOrderAmount === undefined || coupon?.minOrderAmount === null
 ? "0"
 : String(coupon.minOrderAmount),
 expiresAt: coupon?.expiresAt || "",
 active: coupon?.active ?? true,
 };
}

export function shortId(value) {
 if (!value) {
 return "-";
 }

 return value.length > 10 ? `${value.slice(0, 10)}...` : value;
}

export function getAvatarText(name, fallback = "AD") {
 const source = name?.trim();

 if (!source) {
 return fallback;
 }

 const parts = source.split(/\s+/).filter(Boolean);
 if (parts.length >= 2) {
 return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
 }

 return source.slice(0, 2).toUpperCase();
}

export function formatRoleLabel(role) {
 const source = String(role || "").trim();
 if (!source) {
 return "Admin";
 }

 return source
 .toLowerCase()
 .split("_")
 .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
 .join(" ");
}

export function maskCitizenId(value) {
 const source = String(value || "").trim();
 if (!source) {
 return "Chưa cập nhật";
 }

 if (source.length <= 4) {
 return source.replace(/./g, "*");
 }

 return `${"*".repeat(Math.max(source.length - 4, 2))}${source.slice(-4)}`;
}

export function clampPercent(value) {
 const parsed = Number(value || 0);
 if (!Number.isFinite(parsed)) {
 return 0;
 }

 return Math.min(Math.max(Math.round(parsed), 0), 100);
}

export function parseNonNegative(value, max = Number.POSITIVE_INFINITY) {
 const parsed = Number(value);
 if (!Number.isFinite(parsed) || parsed < 0) {
 return 0;
 }

 return Math.min(Math.floor(parsed), max);
}



