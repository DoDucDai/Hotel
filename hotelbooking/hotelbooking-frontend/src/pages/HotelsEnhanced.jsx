import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import { getHotels } from "../services/hotelService";
import { getRooms, searchRooms } from "../services/roomService";
import { getPrimaryImage } from "../utils/imageHelpers";
import { addToWishlist, getMyWishlist, removeFromWishlist } from "../services/wishlistService";
import "./Hotels.css";

const HOTELS_PER_PAGE = 9;

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
 <text x="130" y="400" fill="white" font-size="88" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Hotel Booking</text>
 </svg>`
)}`;

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
 style: "currency",
 currency: "VND",
 maximumFractionDigits: 0,
});

function normalizeHotels(payload) {
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

function normalizeRooms(payload) {
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

function normalizeWishlist(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

function toPositiveInt(value, fallback) {
 const numeric = Number(value);
 if (!Number.isFinite(numeric) || numeric < 1) {
 return fallback;
 }
 return Math.floor(numeric);
}

function toNonNegativeNumber(value) {
 if (value === "") {
 return null;
 }

 const numeric = Number(value);
 if (!Number.isFinite(numeric) || numeric < 0) {
 return null;
 }

 return numeric;
}

export default function HotelsEnhanced() {
 const navigate = useNavigate();
 const location = useLocation();
 const toast = useToast();
 const isLoggedIn = Boolean(localStorage.getItem("accessToken"));

 const [hotels, setHotels] = useState([]);
 const [rooms, setRooms] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [sortBy, setSortBy] = useState("name-asc");

 const [filters, setFilters] = useState(() => {
 const prefill = location.state?.prefillFilters || {};

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
 wishlistOnly: false,
 };
 });

 const [roomAvailability, setRoomAvailability] = useState({});
 const [availabilityLoading, setAvailabilityLoading] = useState(false);
 const [availabilityError, setAvailabilityError] = useState("");
 const [wishlistIds, setWishlistIds] = useState([]);
 const [wishlistLoading, setWishlistLoading] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);

 useEffect(() => {
 const prefill = location.state?.prefillFilters;
 if (!prefill) {
 return;
 }

 setFilters((prev) => ({
 ...prev,
 destination: prefill.destination ?? prev.destination,
 guests: String(toPositiveInt(prefill.guests, toPositiveInt(prev.guests, 1))),
 roomCount: String(toPositiveInt(prefill.roomCount, toPositiveInt(prev.roomCount, 1))),
 checkIn: prefill.checkIn ?? prev.checkIn,
 checkOut: prefill.checkOut ?? prev.checkOut,
 }));
 }, [location.state]);

 useEffect(() => {
 let isMounted = true;

 const fetchCatalog = async () => {
 try {
 setLoading(true);
 const [hotelsRes, roomsRes] = await Promise.all([getHotels(0, 200), getRooms(0, 2000)]);
 const hotelList = normalizeHotels(hotelsRes?.data);
 const roomList = normalizeRooms(roomsRes?.data);

 if (isMounted) {
 setHotels(hotelList);
 setRooms(roomList);
 setError("");
 }
 } catch (fetchError) {
 console.error(fetchError);
 if (isMounted) {
 setHotels([]);
 setRooms([]);
 setError("Khong the tai danh sach khach san. Vui long the lai sau.");
 }
 } finally {
 if (isMounted) {
 setLoading(false);
 }
 }
 };

 fetchCatalog();

 return () => {
 isMounted = false;
 };
 }, []);

 useEffect(() => {
 if (!isLoggedIn) {
 setWishlistIds([]);
 return;
 }

 let isMounted = true;

 const fetchWishlist = async () => {
 try {
 setWishlistLoading(true);
 const res = await getMyWishlist();
 const items = normalizeWishlist(res?.data);

 if (isMounted) {
 setWishlistIds(items.map((item) => item.hotelId).filter(Boolean));
 }
 } catch (fetchError) {
 console.error("Cannot load wishlist", fetchError);
 } finally {
 if (isMounted) {
 setWishlistLoading(false);
 }
 }
 };

 fetchWishlist();

 return () => {
 isMounted = false;
 };
 }, [isLoggedIn]);

 useEffect(() => {
 let isMounted = true;

 const fetchAvailableRooms = async () => {
 if (!hotels.length) {
 setRoomAvailability({});
 return;
 }

 const guests = toPositiveInt(filters.guests, 1);
 const checkIn = filters.checkIn || "";
 const checkOut = filters.checkOut || "";

 if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
 setRoomAvailability({});
 setAvailabilityError("Ng y tra phong phai sau ngay nhan phong.");
 return;
 }

 try {
 setAvailabilityLoading(true);
 const res = await searchRooms({ guests, checkIn, checkOut });
 const availableRooms = normalizeRooms(res?.data);

 if (isMounted) {
 const countByHotel = availableRooms.reduce((acc, room) => {
 const hotelId = room.hotelId;
 if (!hotelId) {
 return acc;
 }

 const availableUnits = Number(room.availableUnits);
 acc[hotelId] =
 (acc[hotelId] || 0) +
 (Number.isFinite(availableUnits) && availableUnits > 0 ? availableUnits : 1);
 return acc;
 }, {});

 setRoomAvailability(countByHotel);
 setAvailabilityError("");
 }
 } catch (fetchError) {
 console.error(fetchError);
 if (isMounted) {
 setRoomAvailability({});
 setAvailabilityError("Cha tai duoc de lieu phong theo bo luc hien tai.");
 }
 } finally {
 if (isMounted) {
 setAvailabilityLoading(false);
 }
 }
 };

 fetchAvailableRooms();

 return () => {
 isMounted = false;
 };
 }, [filters.checkIn, filters.checkOut, filters.guests, hotels.length]);

 const roomStatsByHotel = useMemo(() => {
 return rooms.reduce((acc, room) => {
 if (!room?.hotelId) {
 return acc;
 }

 const current = acc[room.hotelId] || {
 count: 0,
 minRoomPrice: Number.POSITIVE_INFINITY,
 };

 current.count += 1;
 current.minRoomPrice = Math.min(current.minRoomPrice, Number(room.price || 0));
 acc[room.hotelId] = current;
 return acc;
 }, {});
 }, [rooms]);

 const hotelCards = useMemo(() => {
 return hotels.map((hotel, index) => {
 const hotelId = hotel.id || hotel._id || `${hotel.name}-${index}`;
 const stats = roomStatsByHotel[hotelId] || {
 count: 0,
 minRoomPrice: Number.POSITIVE_INFINITY,
 };

 return {
 ...hotel,
 hotelId,
 starRating: Number(hotel.starRating || 3),
 averageRating: Number(hotel.averageRating || 0),
 reviewCount: Number(hotel.reviewCount || 0),
 amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
 roomCount: stats.count,
 minRoomPrice: Number.isFinite(stats.minRoomPrice) ? stats.minRoomPrice : 0,
 availableRoomCount: roomAvailability[hotelId] || 0,
 isWishlisted: wishlistIds.includes(hotelId),
 };
 });
 }, [hotels, roomAvailability, roomStatsByHotel, wishlistIds]);

 const amenityOptions = useMemo(() => {
 const uniqueAmenities = new Set();
 hotelCards.forEach((hotel) => {
 hotel.amenities.forEach((amenity) => uniqueAmenities.add(amenity));
 });
 return [...uniqueAmenities].sort((a, b) => a.localeCompare(b, "vi"));
 }, [hotelCards]);

 const filteredHotels = useMemo(() => {
 const destination = filters.destination.trim().toLowerCase();
 const roomNeed = toPositiveInt(filters.roomCount, 1);
 const guests = toPositiveInt(filters.guests, 1);
 const useRoomFilter =
 guests > 1 ||
 roomNeed > 1 ||
 Boolean(filters.checkIn) ||
 Boolean(filters.checkOut);
 const priceMin = toNonNegativeNumber(filters.priceMin);
 const priceMax = toNonNegativeNumber(filters.priceMax);
 const minRating = Number(filters.minRating || 0);
 const minStars = Number(filters.minStars || 0);

 const matched = hotelCards.filter((hotel) => {
 const name = hotel.name?.toLowerCase() || "";
 const city = hotel.city?.toLowerCase() || "";
 const address = hotel.addresso.toLowerCase() || "";

 const textMatch =
 !destination ||
 name.includes(destination) ||
 city.includes(destination) ||
 address.includes(destination);

 const roomMatch = !useRoomFilter || hotel.availableRoomCount >= roomNeed;
 const ratingMatch = hotel.averageRating >= minRating;
 const starsMatch = hotel.starRating >= minStars;
 const amenityMatch =
 filters.amenity === "all" || hotel.amenities.includes(filters.amenity);
 const wishlistMatch = !filters.wishlistOnly || hotel.isWishlisted;
 const minPriceMatch = priceMin == null || hotel.minRoomPrice >= priceMin;
 const maxPriceMatch = priceMax == null || hotel.minRoomPrice <= priceMax;

 return (
 textMatch &&
 roomMatch &&
 ratingMatch &&
 starsMatch &&
 amenityMatch &&
 wishlistMatch &&
 minPriceMatch &&
 maxPriceMatch
 );
 });

 const sorted = [...matched];

 if (sortBy === "name-asc") {
 sorted.sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi"));
 } else if (sortBy === "name-desc") {
 sorted.sort((a, b) => (b.name || "").localeCompare(a.name || "", "vi"));
 } else if (sortBy === "city-asc") {
 sorted.sort((a, b) => (a.city || "").localeCompare(b.city || "", "vi"));
 } else if (sortBy === "city-desc") {
 sorted.sort((a, b) => (b.city || "").localeCompare(a.city || "", "vi"));
 } else if (sortBy === "price-asc") {
 sorted.sort(
 (a, b) =>
 (a.minRoomPrice || Number.POSITIVE_INFINITY) -
 (b.minRoomPrice || Number.POSITIVE_INFINITY)
 );
 } else if (sortBy === "price-desc") {
 sorted.sort((a, b) => (b.minRoomPrice || 0) - (a.minRoomPrice || 0));
 } else if (sortBy === "rating-desc") {
 sorted.sort(
 (a, b) =>
 (b.averageRating || 0) - (a.averageRating || 0) ||
 (b.reviewCount || 0) - (a.reviewCount || 0)
 );
 }

 return sorted;
 }, [filters, hotelCards, sortBy]);

 const totalPages = useMemo(() => {
 if (!filteredHotels.length) {
 return 1;
 }
 return Math.ceil(filteredHotels.length / HOTELS_PER_PAGE);
 }, [filteredHotels.length]);

 const paginatedHotels = useMemo(() => {
 const startIndex = (currentPage - 1) * HOTELS_PER_PAGE;
 return filteredHotels.slice(startIndex, startIndex + HOTELS_PER_PAGE);
 }, [currentPage, filteredHotels]);

 const paginationPages = useMemo(() => {
 const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
 return [...pages]
 .filter((page) => page >= 1 && page <= totalPages)
 .sort((a, b) => a - b);
 }, [currentPage, totalPages]);

 useEffect(() => {
 setCurrentPage((prev) => {
 if (prev > totalPages) {
 return totalPages;
 }
 if (prev < 1) {
 return 1;
 }
 return prev;
 });
 }, [totalPages]);

 const totalHotels = hotels.length;
 const totalCities = useMemo(() => {
 const uniqueCities = new Set(
 hotels.map((hotel) => hotel.city?.trim()).filter((cityName) => Boolean(cityName))
 );
 return uniqueCities.size;
 }, [hotels]);

 const topRatedCount = useMemo(
 () => hotelCards.filter((hotel) => hotel.averageRating >= 4.5).length,
 [hotelCards]
 );

 const handleFilterChange = (event) => {
 const { name, value, type, checked } = event.target;
 setFilters((prev) => ({
 ...prev,
 [name]: type === "checkbox" ? checked : value,
 }));
 setCurrentPage(1);
 };

 const resetFilters = () => {
 setFilters({
 destination: "",
 guests: "1",
 roomCount: "1",
 checkIn: "",
 checkOut: "",
 priceMin: "",
 priceMax: "",
 minRating: "0",
 minStars: "0",
 amenity: "all",
 wishlistOnly: false,
 });
 setSortBy("name-asc");
 setCurrentPage(1);
 };

 const handleWishlistToggle = async (hotelId, event) => {
 event.stopPropagation();

 if (!isLoggedIn) {
 navigate("/login", {
 state: {
 from: location.pathname,
 redirectTo: "/hotels",
 },
 });
 return;
 }

 const alreadySaved = wishlistIds.includes(hotelId);

 try {
 if (alreadySaved) {
 await removeFromWishlist(hotelId);
 setWishlistIds((prev) => prev.filter((id) => id !== hotelId));
 toast.success("Da xoa khoi danh sach yeu thich");
 } else {
 await addToWishlist(hotelId);
 setWishlistIds((prev) => [...prev, hotelId]);
 toast.success("Da them vao wishlist");
 }
 } catch (wishlistError) {
 console.error("Cannot update wishlist", wishlistError);
 toast.error("Khong the cap nhat wishlist");
 }
 };

 return (
 <main className="hotels-page">
 <section className="hotels-container hotels-hero">
 <div className="hotels-hero-content">
 <span className="hotels-badge">Danh sach khach san toan quoc</span>
 <h1>Loc theo gia, rating, sao, tien nghi va luu khach san yeu thich</h1>
 <p>
 Ngoai tim theo dua diem va lich o, ban c? the loc sau hon theo muc gia, diem
 danh gia, hang sao, tien nghi va danh sach wishlist cua rieng minh.
 </p>

 <div className="hotels-metrics">
 <article className="metric-card">
 <strong>{totalHotels}+</strong>
 <span>Khach san</span>
 </article>
 <article className="metric-card">
 <strong>{totalCities}+</strong>
 <span>Thonh phi</span>
 </article>
 <article className="metric-card">
 <strong>{topRatedCount}</strong>
 <span>Rating 4.5+</span>
 </article>
 </div>
 </div>
 </section>

 <section className="hotels-container hotels-toolbar">
 <div className="toolbar-grid toolbar-grid-main">
 <label className="filter-field">
 <span>O dau</span>
 <input
 name="destination"
 type="text"
 value={filters.destination}
 onChange={handleFilterChange}
 placeholder="Nhap ten khach san, thanh phi hoac dua chi"
 />
 </label>

 <label className="filter-field">
 <span>Bao nguoi</span>
 <input
 name="guests"
 type="number"
 min="1"
 value={filters.guests}
 onChange={handleFilterChange}
 />
 </label>

 <label className="filter-field">
 <span>May phong</span>
 <input
 name="roomCount"
 type="number"
 min="1"
 value={filters.roomCount}
 onChange={handleFilterChange}
 />
 </label>
 </div>

 <div className="toolbar-grid toolbar-grid-sub">
 <label className="filter-field">
 <span>Ng y nhan phong</span>
 <input
 name="checkIn"
 type="date"
 value={filters.checkIn}
 onChange={handleFilterChange}
 />
 </label>

 <label className="filter-field">
 <span>Ng y tra phong</span>
 <input
 name="checkOut"
 type="date"
 value={filters.checkOut}
 onChange={handleFilterChange}
 />
 </label>

 <label className="filter-field">
 <span>Sap xep</span>
 <select
 value={sortBy}
 onChange={(event) => {
 setSortBy(event.target.value);
 setCurrentPage(1);
 }}
 >
 <option value="name-asc">Ten A - Z</option>
 <option value="name-desc">Ten Z - A</option>
 <option value="city-asc">Thonh phi A - Z</option>
 <option value="city-desc">Thonh phi Z - A</option>
 <option value="price-asc">Gia thap den cao</option>
 <option value="price-desc">Gia cao den thap</option>
 <option value="rating-desc">Rating cao nhat</option>
 </select>
 </label>
 </div>

 <div className="toolbar-grid toolbar-grid-advanced">
 <label className="filter-field">
 <span>Gia tu</span>
 <input
 name="priceMin"
 type="number"
 min="0"
 value={filters.priceMin}
 onChange={handleFilterChange}
 placeholder="0"
 />
 </label>

 <label className="filter-field">
 <span>Gia den</span>
 <input
 name="priceMax"
 type="number"
 min="0"
 value={filters.priceMax}
 onChange={handleFilterChange}
 placeholder="Khong giai han"
 />
 </label>

 <label className="filter-field">
 <span>Rating toi thieu</span>
 <select name="minRating" value={filters.minRating} onChange={handleFilterChange}>
 <option value="0">Tat ca</option>
 <option value="3">Tu 3.0</option>
 <option value="4">Tu 4.0</option>
 <option value="4.5">Tu 4.5</option>
 </select>
 </label>

 <label className="filter-field">
 <span>Hang sao</span>
 <select name="minStars" value={filters.minStars} onChange={handleFilterChange}>
 <option value="0">Tat ca</option>
 <option value="3">Tu 3 sao</option>
 <option value="4">Tu 4 sao</option>
 <option value="5">5 sao</option>
 </select>
 </label>

 <label className="filter-field">
 <span>Tien nghi</span>
 <select name="amenity" value={filters.amenity} onChange={handleFilterChange}>
 <option value="all">Tat ca tien nghi</option>
 {amenityOptions.map((amenity) => (
 <option key={amenity} value={amenity}>
 {amenity}
 </option>
 ))}
 </select>
 </label>

 <label className="wishlist-checkbox">
 <input
 type="checkbox"
 name="wishlistOnly"
 checked={filters.wishlistOnly}
 onChange={handleFilterChange}
 disabled={!isLoggedIn}
 />
 <span>Cho xem wishlist cua toi</span>
 </label>
 </div>

 <div className="toolbar-footer">
 <span className="result-pill">
 {availabilityLoading
 ? "Dang cap nhet phong kha dung..."
 : `${filteredHotels.length} khach san phu hop`}
 </span>
 <button type="button" className="reset-btn" onClick={resetFilters}>
 Dat lai bo luc
 </button>
 </div>

 {availabilityError && <p className="filter-hint">{availabilityError}</p>}
 </section>

 <section className="hotels-container hotels-results">
 {loading ? (
 <div className="hotels-grid skeleton-grid">
 {Array.from({ length: 8 }).map((_, idx) => (
 <div key={idx} className="hotel-card skeleton-card" />
 ))}
 </div>
 ) : error ? (
 <div className="result-state error-state">{error}</div>
 ) : filteredHotels.length === 0 ? (
 <div className="result-state empty-state">
 Khong tim thay khach san nao theo bo luc hien tai.
 </div>
 ) : (
 <>
 <div className="hotels-grid">
 {paginatedHotels.map((hotel) => (
 <article
 key={hotel.hotelId}
 className="hotel-card"
 onClick={() =>
 navigate(`/hotels/${hotel.hotelId}`, {
 state: {
 hotel,
 searchCriteria: {
 ...filters,
 guests: toPositiveInt(filters.guests, 1),
 roomCount: toPositiveInt(filters.roomCount, 1),
 },
 availableRoomCount: hotel.availableRoomCount,
 },
 })
 }
 onKeyDown={(event) => {
 if (event.key === "Enter" || event.key === " ") {
 event.preventDefault();
 navigate(`/hotels/${hotel.hotelId}`, {
 state: {
 hotel,
 searchCriteria: {
 ...filters,
 guests: toPositiveInt(filters.guests, 1),
 roomCount: toPositiveInt(filters.roomCount, 1),
 },
 availableRoomCount: hotel.availableRoomCount,
 },
 });
 }
 }}
 role="button"
 tabIndex={0}
 >
 <div className="hotel-image-wrap">
 <img
 src={getPrimaryImage(hotel, FALLBACK_IMAGE, { includeNameFallback: true })}
 alt={hotel.name || "Hotel image"}
 onError={(event) => {
 event.currentTarget.onerror = null;
 event.currentTarget.src = FALLBACK_IMAGE;
 }}
 />
 <button
 type="button"
 className={`wishlist-btn ${hotel.isWishlisted ? "active" : ""}`}
 onClick={(event) => handleWishlistToggle(hotel.hotelId, event)}
 disabled={wishlistLoading}
 aria-label={hotel.isWishlisted ? "Bo khoi yeu thich" : "Them vao yeu thich"}
 >
 {hotel.isWishlisted ? "a" : "a"}
 </button>
 </div>

 <div className="hotel-body">
 <div className="hotel-title-row">
 <p className="hotel-city">{hotel.city || "Da diem noi bat"}</p>
 <span className="hotel-stars">{hotel.starRating || 3} sao</span>
 </div>

 <h3>{hotel.name || "Khach san dang cap nhet"}</h3>
 <p className="hotel-address">
 {hotel.address || "Da chi dang duoc cap nhat"}
 </p>

 <div className="hotel-rating-row">
 <strong>{hotel.averageRating ? hotel.averageRating.toFixed(1) : "Moi"}</strong>
 <span>
 {hotel.reviewCount
 ? `${hotel.reviewCount} danh gia`
 : "Cha co danh gia"}
 </span>
 </div>

 <div className="hotel-chip-row">
 {hotel.amenities.slice(0, 3).map((amenity) => (
 <span key={amenity} className="hotel-chip">
 {amenity}
 </span>
 ))}
 </div>

 <p className="hotel-meta">Phong phu hop: {hotel.availableRoomCount}</p>
 <p className="hotel-price">
 Gia tu{" "}
 <strong>
 {hotel.minRoomPrice ? currencyFormatter.format(hotel.minRoomPrice) : "Lien he"}
 </strong>
 </p>
 <span className="detail-link">Xem chi tiet</span>
 </div>
 </article>
 ))}
 </div>

 <div className="hotels-pagination">
 <button
 type="button"
 className="page-btn"
 onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
 disabled={currentPage === 1}
 >
 Truoc
 </button>

 <div className="page-list">
 {paginationPages.map((page, index) => {
 const prevPage = paginationPages[index - 1];
 const showGap = prevPage && page - prevPage > 1;
 return (
 <span key={page} className="page-item-wrap">
 {showGap ? <span className="page-gap">...</span> : null}
 <button
 type="button"
 className={`page-btn page-number ${currentPage === page ? "active" : ""}`}
 onClick={() => setCurrentPage(page)}
 >
 {page}
 </button>
 </span>
 );
 })}
 </div>

 <button
 type="button"
 className="page-btn"
 onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
 disabled={currentPage >= totalPages}
 >
 Sau
 </button>
 </div>
 </>
 )}
 </section>
 </main>
 );
}

