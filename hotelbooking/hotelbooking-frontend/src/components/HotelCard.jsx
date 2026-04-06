import "./HotelCard.css";
import { getPrimaryImage } from "../utils/imageHelpers";

const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(
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
 <text x="130" y="400" fill="white" font-size="88" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Hotel</text>
 </svg>`
)}`;

export default function HotelCard({ hotel, onView }) {
 if (!hotel) {
 return null;
 }

 return (
 <article className="admin-hotel-card">
 <div className="admin-hotel-image-wrap">
 <img
 src={getPrimaryImage(hotel, FALLBACK_IMAGE, { includeNameFallback: true })}
 alt={hotel.name || "Hotel image"}
 onError={(event) => {
 event.currentTarget.onerror = null;
 event.currentTarget.src = FALLBACK_IMAGE;
 }}
 />
 </div>

 <div className="admin-hotel-content">
 <p className="admin-hotel-city">{hotel.city || "Đang cập nhật"}</p>
 <h3>{hotel.name || "Khách sạn"}</h3>
 <p className="admin-hotel-address">{hotel.address || "-"}</p>

 <div className="admin-hotel-metrics">
 <span>{hotel.totalRooms || 0} phòng</span>
 <span>{hotel.totalBookings || 0} booking</span>
 <span>{hotel.occupancy || 0}% lấp đầy</span>
 </div>

 {typeof onView === "function" ? (
 <button type="button" className="admin-hotel-btn" onClick={() => onView(hotel)}>
 Xem chi tiết
 </button>
 ) : null}
 </div>
 </article>
 );
}


