export const initialProfile = {
  name: "",
  gender: "",
  dateOfBirth: "",
  citizenId: "",
  bankProvider: "",
  bankAccountName: "",
  bankAccountNumber: "",
};

export const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
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

export function nightsBetween(checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate) {
    return 0;
  }

  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diff = end.getTime() - start.getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

export function getStatusMeta(booking) {
  switch (booking?.status) {
    case "CANCELLED":
      return { label: "Đã hủy", className: "cancelled" };
    case "CHECKED_IN":
      return { label: "Đang lưu trú", className: "active" };
    case "CHECKED_OUT":
      return { label: "Đã trả phòng", className: "done" };
    case "NO_SHOW":
      return { label: "Không đến", className: "neutral" };
    case "CONFIRMED": {
      const checkIn = new Date(booking?.checkInDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (!Number.isNaN(checkIn.getTime()) && now < checkIn) {
        return { label: "Sắp đến", className: "upcoming" };
      }

      return { label: "Đã xác nhận", className: "pending" };
    }
    default:
      return { label: "Không rõ", className: "neutral" };
  }
}

export function getPaymentMeta(status) {
  if (status === "PAID") {
    return { label: "Đã thanh toán", className: "paid" };
  }

  if (status === "REFUNDED") {
    return { label: "Đã hoàn tiền", className: "refunded" };
  }

  if (status === "FAILED") {
    return { label: "Thất bại", className: "failed" };
  }

  return { label: "Thanh toán sau", className: "pending" };
}

export function normalizeBookings(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  return [];
}

export function normalizeWishlist(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

export function normalizeDisputes(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

export function getAvatarText(name) {
  const source = name?.trim() || "GU";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function resolveInitialTab(locationState) {
  if (locationState?.focus === "history") {
    return "history";
  }

  if (locationState?.focus === "payments") {
    return "payments";
  }

  if (locationState?.focus === "wishlist") {
    return "wishlist";
  }

  return "profile";
}


