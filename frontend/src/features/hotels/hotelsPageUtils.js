export const HOTELS_PER_PAGE = 9;

export const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(
 `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
 <defs>
 <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
 <stop offset="0%" stop-color="#1f4f8d" />
 <stop offset="100%" stop-color="#3ba4d6" />
 </linearGradient>
 </defs>
 <rect width="1200" height="700" fill="url(#bg)" />
 <circle cx="210" cy="140" r="130" fill="rgba(255,255,255,0.12)" />
 <circle cx="1000" cy="130" r="170" fill="rgba(255,255,255,0.08)" />
 <path d="M170 500h860v130H170z" fill="rgba(255,255,255,0.15)" />
 <text x="130" y="400" fill="white" font-size="88" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Hotel Booking</text>
 </svg>`
)}`;

export const currencyFormatter = new Intl.NumberFormat("vi-VN", {
 style: "currency",
 currency: "VND",
 maximumFractionDigits: 0,
});

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

export function normalizeWishlist(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

export function toPositiveInt(value, fallback) {
 const numeric = Number(value);
 if (!Number.isFinite(numeric) || numeric < 1) {
 return fallback;
 }
 return Math.floor(numeric);
}

export function toNonNegativeNumber(value) {
 if (value === "") {
 return null;
 }

 const numeric = Number(value);
 if (!Number.isFinite(numeric) || numeric < 0) {
 return null;
 }

 return numeric;
}

export function buildInitialHotelFilters(prefill = {}) {
 return {
 destination: prefill.destination || "",
 guests: String(toPositiveInt(prefill.guests, 1)),
 roomCount: String(toPositiveInt(prefill.roomCount, 1)),
 checkIn: prefill.checkIn || "",
 checkOut: prefill.checkOut || "",
 priceMin: "",
 priceMax: "",
 minRating: "0",
 minStars: "0",
 amenity: "all",
 freeCancellationOnly: false,
 wishlistOnly: false,
 };
}
