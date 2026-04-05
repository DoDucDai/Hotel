export const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(
 `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
 <defs>
 <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
 <stop offset="0%" stop-color="#174981" />
 <stop offset="100%" stop-color="#1f84cf" />
 </linearGradient>
 </defs>
 <rect width="1200" height="700" fill="url(#bg)" />
 <circle cx="220" cy="120" r="150" fill="rgba(255,255,255,0.12)" />
 <circle cx="1020" cy="120" r="180" fill="rgba(255,255,255,0.08)" />
 <path d="M150 500h900v130H150z" fill="rgba(255,255,255,0.16)" />
 <text x="120" y="390" fill="white" font-size="88" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Hotel Booking</text>
 </svg>`
)}`;

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
 style: "currency",
 currency: "VND",
 maximumFractionDigits: 0,
});

export function normalizeRooms(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.content)) {
 return payload.content;
 }

 return [];
}

export function normalizeHotels(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

export function normalizeReviews(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
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

 return [];
}

export function formatPrice(price) {
 const numeric = Number(price);
 if (!Number.isFinite(numeric)) {
 return "Lien he";
 }
 return currencyFormatter.format(numeric);
}

export function formatReviewDate(value) {
 if (!value) {
 return "";
 }

 const date = new Date(value);
 if (Number.isNaN(date.getTime())) {
 return "";
 }

 return date.toLocaleDateString("vi-VN");
}

export function savePendingBooking(state) {
 try {
 sessionStorage.setItem("pendingBooking", JSON.stringify(state));
 } catch (error) {
 console.error("Cannot save pending booking", error);
 }
}
