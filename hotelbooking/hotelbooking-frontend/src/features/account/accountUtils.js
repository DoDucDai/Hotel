export const initialProfile = {
  name: "",
  gender: "",
  dateOfBirth: "",
  citizenId: "",
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
      return { label: "Da huy", className: "cancelled" };
    case "CHECKED_IN":
      return { label: "Dang luu tru", className: "active" };
    case "CHECKED_OUT":
      return { label: "Da tra phong", className: "done" };
    case "NO_SHOW":
      return { label: "Khong den", className: "neutral" };
    case "CONFIRMED": {
      const checkIn = new Date(booking?.checkInDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (!Number.isNaN(checkIn.getTime()) && now < checkIn) {
        return { label: "Sap den", className: "upcoming" };
      }

      return { label: "Da xac nhan", className: "pending" };
    }
    default:
      return { label: "Khong ro", className: "neutral" };
  }
}

export function getPaymentMeta(status) {
  if (status === "PAID") {
    return { label: "Da thanh toan", className: "paid" };
  }

  if (status === "REFUNDED") {
    return { label: "Da hoan tien", className: "refunded" };
  }

  if (status === "FAILED") {
    return { label: "That bai", className: "failed" };
  }

  return { label: "Thanh toan sau", className: "pending" };
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
