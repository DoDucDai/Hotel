import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
 FiBriefcase,
 FiCalendar,
 FiCheckCircle,
 FiCompass,
 FiGlobe,
 FiMapPin,
 FiMoon,
 FiShield,
 FiStar,
 FiSun,
 FiTag,
 FiTrendingUp,
 FiUsers,
} from "react-icons/fi";
import {
 currencyFormatter,
 normalizeHotels,
 toPositiveInt,
} from "../features/hotels/hotelsPageUtils";
import { getHotels } from "../services/hotelService";
import { searchRooms } from "../services/roomService";
import homeCardFallback from "../assets/home-card-fallback.svg";
import homeHeroTravel from "../assets/home-hero-travel.svg";
import { addDaysToDateInput, formatDateInputLocal } from "../utils/dateInput";
import { getPrimaryImage } from "../utils/imageHelpers";
import "./Home.css";

const STAR = String.fromCodePoint(9733);
const SEED_IMAGE_MARKER = "seed_hotel_";

const STAY_OPTIONS = [
 { key: "business", label: "Cong tac", icon: FiBriefcase },
 { key: "family", label: "Gia dinh", icon: FiUsers },
 { key: "resort", label: "Nghi duong", icon: FiSun },
 { key: "weekend", label: "Cuoi tuan", icon: FiMoon },
];

function mapHotelId(hotel, index) {
 return String(hotel.id || hotel._id || `${hotel.name || "hotel"}-${index}`);
}

function normalizeCityName(value) {
 return String(value || "").trim();
}

function getReviewTone(rating) {
 if (rating >= 4.5) {
 return "Tuyet voi";
 }

 if (rating >= 4) {
 return "Rat tot";
 }

 if (rating >= 3) {
 return "Tot";
 }

 return "Moi";
}

function getStars(starRating) {
 const normalized = Math.max(1, Math.min(5, Math.round(Number(starRating) || 0)));
 return STAR.repeat(normalized);
}

function buildDefaultCheckOut(checkInValue) {
 return addDaysToDateInput(checkInValue, 1);
}

function buildSearchContext(destination, guests, roomCount, checkIn, checkOut) {
 return {
 destination,
 guests,
 roomCount,
 checkIn,
 checkOut,
 };
}

function isUsableHeroImage(value) {
 if (typeof value !== "string" || value.trim().length === 0) {
 return false;
 }

 const normalized = value.trim().toLowerCase();
 return (
 !normalized.startsWith("data:image") &&
 !normalized.includes(SEED_IMAGE_MARKER) &&
 !normalized.includes("fallback")
 );
}

export default function Home() {
 const navigate = useNavigate();

 const [hotels, setHotels] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 const [availabilityMap, setAvailabilityMap] = useState({});
 const [availabilityLoading, setAvailabilityLoading] = useState(false);
 const [availabilityError, setAvailabilityError] = useState("");
 const [availabilityFetched, setAvailabilityFetched] = useState(false);

 const [destination, setDestination] = useState("");
 const [checkIn, setCheckIn] = useState(() => formatDateInputLocal());
 const [checkOut, setCheckOut] = useState(() => buildDefaultCheckOut(formatDateInputLocal()));
 const [guests, setGuests] = useState("2");
 const [roomCount, setRoomCount] = useState("1");
 const [stayType, setStayType] = useState("business");
 const [activeCity, setActiveCity] = useState("all");
 const [formError, setFormError] = useState("");

 useEffect(() => {
 let isMounted = true;

 const fetchCatalog = async () => {
 try {
 setLoading(true);
 const hotelsRes = await getHotels({
 page: 0,
 size: 40,
 sortBy: "rating_desc",
 });
 const parsedHotels = normalizeHotels(hotelsRes?.data);

 if (isMounted) {
 setHotels(parsedHotels);
 setError("");
 }
 } catch (fetchError) {
 console.error("Cannot load home data", fetchError);
 if (isMounted) {
 setHotels([]);
 setError("Khong the tai du lieu khach san. Vui long thu lai sau.");
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
 let isMounted = true;

 const checkInDate = new Date(checkIn);
 const checkOutDate = new Date(checkOut);
 const hasValidDates =
 Boolean(checkIn) &&
 Boolean(checkOut) &&
 Number.isFinite(checkInDate.getTime()) &&
 Number.isFinite(checkOutDate.getTime()) &&
 checkOutDate > checkInDate;

 if (!hotels.length) {
 setAvailabilityMap({});
 setAvailabilityError("");
 setAvailabilityFetched(false);
 return undefined;
 }

 if (!hasValidDates) {
 setAvailabilityMap({});
 setAvailabilityFetched(false);
 if (checkIn && checkOut && checkOutDate <= checkInDate) {
 setAvailabilityError("Ngay tra phong phai sau ngay nhan phong.");
 } else {
 setAvailabilityError("");
 }
 return undefined;
 }

 const fetchAvailability = async () => {
 try {
 setAvailabilityLoading(true);
 setAvailabilityError("");
 setAvailabilityFetched(false);

 const res = await searchRooms({
 guests: toPositiveInt(guests, 1),
 checkIn,
 checkOut,
 sortBy: "availability_desc",
 });

 const availableRooms = Array.isArray(res?.data) ? res.data : [];
 const countByHotel = availableRooms.reduce((acc, room) => {
 const hotelId = String(room?.hotelId || "");
 if (!hotelId) {
 return acc;
 }

 const availableUnits = Number(room.availableUnits);
 acc[hotelId] =
 (acc[hotelId] || 0) +
 (Number.isFinite(availableUnits) && availableUnits > 0 ? availableUnits : 1);

 return acc;
 }, {});

 if (isMounted) {
 setAvailabilityMap(countByHotel);
 setAvailabilityFetched(true);
 }
 } catch (fetchError) {
 console.error("Cannot load room availability", fetchError);
 if (isMounted) {
 setAvailabilityMap({});
 setAvailabilityFetched(false);
 setAvailabilityError("Chua tai duoc so phong kha dung theo lich da chon.");
 }
 } finally {
 if (isMounted) {
 setAvailabilityLoading(false);
 }
 }
 };

 fetchAvailability();

 return () => {
 isMounted = false;
 };
 }, [checkIn, checkOut, guests, hotels.length]);

 const hotelsWithStats = useMemo(() => {
 return hotels.map((hotel, index) => {
 const hotelId = mapHotelId(hotel, index);

 return {
 ...hotel,
 hotelId,
 cityNormalized: normalizeCityName(hotel.city),
 starRating: Number(hotel.starRating || 3),
 averageRating: Number(hotel.averageRating || 0),
 reviewCount: Number(hotel.reviewCount || 0),
 freeCancellationBeforeDays: Number(hotel.freeCancellationBeforeDays || 0),
 amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
 roomTypeCount: Number(hotel.roomCount || 0),
 minRoomPrice: Number(hotel.minRoomPrice || 0),
 availableRoomCount: Number(availabilityMap[hotelId] || 0),
 image: getPrimaryImage(hotel, homeCardFallback, { includeNameFallback: true }),
 };
 });
 }, [availabilityMap, hotels]);

 const cityInsights = useMemo(() => {
 const cityMap = new Map();

 hotelsWithStats.forEach((hotel) => {
 const city = normalizeCityName(hotel.city);
 if (!city) {
 return;
 }

 const current = cityMap.get(city) || {
 city,
 hotelCount: 0,
 reviewCount: 0,
 totalRating: 0,
 ratedCount: 0,
 minPrice: Number.POSITIVE_INFINITY,
 image: hotel.image,
 };

 current.hotelCount += 1;
 current.reviewCount += Number(hotel.reviewCount || 0);

 if (hotel.averageRating > 0) {
 current.totalRating += hotel.averageRating;
 current.ratedCount += 1;
 }

 if (hotel.minRoomPrice > 0) {
 current.minPrice = Math.min(current.minPrice, hotel.minRoomPrice);
 }

 if (!current.image) {
 current.image = hotel.image;
 }

 cityMap.set(city, current);
 });

 return [...cityMap.values()]
 .map((item) => ({
 ...item,
 averageRating: item.ratedCount > 0 ? item.totalRating / item.ratedCount : 0,
 minPrice: Number.isFinite(item.minPrice) ? item.minPrice : 0,
 }))
 .sort((a, b) => {
 if (b.hotelCount !== a.hotelCount) {
 return b.hotelCount - a.hotelCount;
 }

 if (b.averageRating !== a.averageRating) {
 return b.averageRating - a.averageRating;
 }

 return a.city.localeCompare(b.city, "vi");
 });
 }, [hotelsWithStats]);

 const cityFilterOptions = useMemo(() => {
 return ["all", ...cityInsights.map((item) => item.city).slice(0, 8)];
 }, [cityInsights]);

 const bestValueHotels = useMemo(() => {
 return hotelsWithStats
 .filter((hotel) => hotel.minRoomPrice > 0)
 .sort((a, b) => {
 if (a.minRoomPrice !== b.minRoomPrice) {
 return a.minRoomPrice - b.minRoomPrice;
 }

 if (b.averageRating !== a.averageRating) {
 return b.averageRating - a.averageRating;
 }

 return (a.name || "").localeCompare(b.name || "", "vi");
 })
 .slice(0, 4);
 }, [hotelsWithStats]);

 const quickStats = useMemo(() => {
 const ratedHotels = hotelsWithStats.filter((hotel) => hotel.averageRating > 0);
 const avgRating = ratedHotels.length
 ? ratedHotels.reduce((sum, hotel) => sum + hotel.averageRating, 0) / ratedHotels.length
 : 0;

 const totalRoomTypes = hotelsWithStats.reduce(
 (sum, hotel) => sum + Number(hotel.roomTypeCount || 0),
 0
 );

 return [
 {
 id: "hotels",
 icon: FiMapPin,
 label: "Khach san dang mo ban",
 value: `${hotelsWithStats.length}+`,
 },
 {
 id: "cities",
 icon: FiGlobe,
 label: "Thanh pho co du lieu",
 value: `${cityInsights.length}+`,
 },
 {
 id: "rooms",
 icon: FiCompass,
 label: "Loai phong kha dung",
 value: `${totalRoomTypes || hotelsWithStats.length}+`,
 },
 {
 id: "rating",
 icon: FiStar,
 label: "Diem danh gia TB",
 value: avgRating ? avgRating.toFixed(1) : "Moi",
 },
 ];
 }, [cityInsights.length, hotelsWithStats]);

 const trustHighlights = useMemo(() => {
 const availabilityStatus = availabilityLoading
 ? "Dang cap nhat phong trong"
 : availabilityFetched
 ? "Da doi chieu phong theo lich o"
 : "Kiem tra phong trong theo ngay";

 return [
 {
 id: "verified",
 icon: FiShield,
 title: "Danh muc tin cay",
 copy: `${hotelsWithStats.length} khach san dang mo ban`,
 },
 {
 id: "coverage",
 icon: FiGlobe,
 title: "Do phu diem den",
 copy: `${cityInsights.length} thanh pho co du lieu gia`,
 },
 {
 id: "availability",
 icon: FiCheckCircle,
 title: "Phong trong",
 copy: availabilityStatus,
 },
 ];
 }, [availabilityFetched, availabilityLoading, cityInsights.length, hotelsWithStats.length]);

 const popularAmenities = useMemo(() => {
 const amenityMap = new Map();

 hotelsWithStats.forEach((hotel) => {
 hotel.amenities.forEach((amenity) => {
 const name = String(amenity || "").trim();
 if (!name) {
 return;
 }

 amenityMap.set(name, (amenityMap.get(name) || 0) + 1);
 });
 });

 return [...amenityMap.entries()]
 .map(([name, count]) => ({ name, count }))
 .sort((a, b) => {
 if (b.count !== a.count) {
 return b.count - a.count;
 }

 return a.name.localeCompare(b.name, "vi");
 })
 .slice(0, 12);
 }, [hotelsWithStats]);

 const filteredHotels = useMemo(() => {
 const normalizedDestination = destination.trim().toLowerCase();
 const roomsNeeded = toPositiveInt(roomCount, 1);
 const applyAvailabilityFilter = availabilityFetched && Boolean(checkIn) && Boolean(checkOut);

 return hotelsWithStats
 .filter((hotel) => {
 const city = hotel.city?.toLowerCase() || "";
 const address = hotel.address?.toLowerCase() || "";
 const name = hotel.name?.toLowerCase() || "";

 const matchDestination =
 !normalizedDestination ||
 name.includes(normalizedDestination) ||
 city.includes(normalizedDestination) ||
 address.includes(normalizedDestination);

 const matchCity = activeCity === "all" || hotel.cityNormalized === activeCity;
 const matchRooms =
 !applyAvailabilityFilter || Number(hotel.availableRoomCount || 0) >= roomsNeeded;

 return matchDestination && matchCity && matchRooms;
 })
 .sort((a, b) => {
 const ratingDiff = (b.averageRating || 0) - (a.averageRating || 0);
 if (ratingDiff !== 0) {
 return ratingDiff;
 }

 const reviewDiff = (b.reviewCount || 0) - (a.reviewCount || 0);
 if (reviewDiff !== 0) {
 return reviewDiff;
 }

 const priceA = a.minRoomPrice || Number.POSITIVE_INFINITY;
 const priceB = b.minRoomPrice || Number.POSITIVE_INFINITY;
 if (priceA !== priceB) {
 return priceA - priceB;
 }

 return (a.name || "").localeCompare(b.name || "", "vi");
 });
 }, [
 activeCity,
 availabilityFetched,
 checkIn,
 checkOut,
 destination,
 hotelsWithStats,
 roomCount,
 ]);

 const featuredHotels = useMemo(() => filteredHotels.slice(0, 8), [filteredHotels]);

 const heroImage = useMemo(() => {
 const candidates = [
 cityInsights[0]?.image,
 cityInsights[1]?.image,
 featuredHotels[0]?.image,
 featuredHotels[1]?.image,
 ];

 const preferred = candidates.find(isUsableHeroImage);
 return preferred || homeHeroTravel;
 }, [cityInsights, featuredHotels]);

 const priceInsightRows = useMemo(() => {
 return cityInsights.slice(0, 6).map((city) => ({
 city: city.city,
 hotels: city.hotelCount,
 rating: city.averageRating,
 minPrice: city.minPrice,
 }));
 }, [cityInsights]);

 const marketSummary = useMemo(() => {
 const pricedHotels = hotelsWithStats.filter((hotel) => Number(hotel.minRoomPrice) > 0);
 const avgNightPrice = pricedHotels.length
 ? pricedHotels.reduce((sum, hotel) => sum + Number(hotel.minRoomPrice || 0), 0) / pricedHotels.length
 : 0;

 const freeCancellationHotels = hotelsWithStats.filter(
 (hotel) => Number(hotel.freeCancellationBeforeDays || 0) > 0
 ).length;

 const reviewedHotels = hotelsWithStats.filter((hotel) => Number(hotel.reviewCount || 0) > 0).length;

 const availableUnits = hotelsWithStats.reduce(
 (sum, hotel) => sum + Number(hotel.availableRoomCount || 0),
 0
 );

 return {
 avgNightPrice,
 freeCancellationHotels,
 reviewedHotels,
 availableUnits,
 };
 }, [hotelsWithStats]);

 const navigateToHotels = (overrideDestination = "") => {
 const resolvedDestination =
 overrideDestination || (activeCity !== "all" ? activeCity : destination.trim());

 navigate("/hotels", {
 state: {
 prefillFilters: buildSearchContext(
 resolvedDestination,
 String(toPositiveInt(guests, 1)),
 String(toPositiveInt(roomCount, 1)),
 checkIn,
 checkOut
 ),
 },
 });
 };

 const validateDateRange = () => {
 const checkInDate = new Date(checkIn);
 const checkOutDate = new Date(checkOut);

 if (checkIn && checkOut && checkOutDate <= checkInDate) {
 setFormError("Ngay tra phong phai sau ngay nhan phong.");
 return false;
 }

 setFormError("");
 return true;
 };

 const handleSearchSubmit = (event) => {
 event.preventDefault();
 if (!validateDateRange()) {
 return;
 }

 navigateToHotels();
 };

 const handleReset = () => {
 const currentDate = formatDateInputLocal();
 setDestination("");
 setActiveCity("all");
 setCheckIn(currentDate);
 setCheckOut(buildDefaultCheckOut(currentDate));
 setGuests("2");
 setRoomCount("1");
 setStayType("business");
 setFormError("");
 };

 const openHotelDetail = (hotel) => {
 navigate(`/hotels/${hotel.hotelId}`, {
 state: {
 hotel,
 searchCriteria: buildSearchContext(
 activeCity !== "all" ? activeCity : destination.trim(),
 toPositiveInt(guests, 1),
 toPositiveInt(roomCount, 1),
 checkIn,
 checkOut
 ),
 },
 });
 };

 const openDestination = (city) => {
 setActiveCity(city);
 setDestination(city);
 navigateToHotels(city);
 };

 return (
 <div className="home-page">
 <section className="home-shell home-hero-shell">
 <div className="home-hero-backdrop">
 <img src={heroImage} alt="Travel destination" />
 <div className="home-hero-overlay" />

 <div className="home-hero-grid">
 <div className="home-hero-content">
 <p className="home-hero-badge">Trai nghiem dat phong thong minh</p>
 <h1>Tim noi luu tru ly tuong, khop lich trinh va ngan sach cua ban</h1>
 <p>
 Bo loc va tim kiem duoc ket noi truc tiep voi du lieu khach san thuc te. Ban co the
 so sanh gia, danh gia va tinh trang phong trong ngay tai trang chu.
 </p>

 <div className="home-hero-metrics">
 {quickStats.map((stat) => (
 <article key={stat.id} className="home-hero-metric">
 <span className="home-hero-metric-icon" aria-hidden="true">
 <stat.icon />
 </span>
 <strong>{stat.value}</strong>
 <span>{stat.label}</span>
 </article>
 ))}
 </div>
 </div>

 <aside className="home-search-panel" aria-label="Tim kiem khach san">
 <div className="home-product-tabs" role="tablist" aria-label="Loai chuyen di">
 {STAY_OPTIONS.map((tab) => (
 <button
 key={tab.key}
 type="button"
 role="tab"
 aria-selected={stayType === tab.key}
 className={`home-product-tab ${stayType === tab.key ? "active" : ""}`}
 onClick={() => setStayType(tab.key)}
 >
 <tab.icon aria-hidden="true" />
 {tab.label}
 </button>
 ))}
 </div>

 <form className="home-search-form" onSubmit={handleSearchSubmit}>
 <div className="home-search-grid">
 <label className="home-search-field home-search-field-wide">
 <span>Diem den / ten khach san</span>
 <input
 type="text"
 value={destination}
 placeholder="Nhap thanh pho, khu vuc hoac ten khach san"
 onChange={(event) => setDestination(event.target.value)}
 />
 </label>

 <label className="home-search-field">
 <span>Nhan phong</span>
 <input
 type="date"
 value={checkIn}
 min={formatDateInputLocal()}
 onChange={(event) => setCheckIn(event.target.value)}
 />
 </label>

 <label className="home-search-field">
 <span>Tra phong</span>
 <input
 type="date"
 value={checkOut}
 min={checkIn || formatDateInputLocal()}
 onChange={(event) => setCheckOut(event.target.value)}
 />
 </label>

 <label className="home-search-field home-search-field-compact">
 <span>Khach</span>
 <input
 type="number"
 min="1"
 value={guests}
 onChange={(event) => setGuests(String(toPositiveInt(event.target.value, 1)))}
 />
 </label>

 <label className="home-search-field home-search-field-compact">
 <span>Phong</span>
 <input
 type="number"
 min="1"
 value={roomCount}
 onChange={(event) => setRoomCount(String(toPositiveInt(event.target.value, 1)))}
 />
 </label>
 </div>

 {formError ? <p className="home-form-error">{formError}</p> : null}

 <div className="home-search-actions">
 <button type="submit" className="home-btn-primary">
 Tim khach san
 </button>
 <button type="button" className="home-btn-soft" onClick={() => navigateToHotels()}>
 Xem tat ca
 </button>
 <button type="button" className="home-btn-ghost" onClick={handleReset}>
 Dat lai
 </button>
 </div>

 <p className="home-search-disclaimer">
 Gia hien thi la gia moi dem va co the thay doi theo ngay o, loai phong, chinh sach.
 </p>
 </form>

 <div className="home-trust-inline" aria-label="Thong tin nhanh">
 {trustHighlights.map((item) => (
 <article key={item.id} className="home-trust-item">
 <p className="home-trust-title">
 <item.icon aria-hidden="true" />
 <span>{item.title}</span>
 </p>
 <p className="home-trust-copy">{item.copy}</p>
 </article>
 ))}
 </div>
 </aside>
 </div>
 </div>
 </section>

 <section className="home-shell home-section">
 <div className="home-section-head">
 <div>
 <p className="home-section-kicker">
 <FiTag aria-hidden="true" />
 <span>Deal gia tot</span>
 </p>
 <h2>Lua chon phu hop ngan sach cua ban</h2>
 </div>
 <button type="button" className="home-section-link" onClick={() => navigateToHotels()}>
 Xem toan bo khach san
 </button>
 </div>

 {bestValueHotels.length ? (
 <div className="home-deal-grid">
 {bestValueHotels.map((hotel) => (
 <article
 key={hotel.hotelId}
 className="home-deal-card"
 role="button"
 tabIndex={0}
 onClick={() => openHotelDetail(hotel)}
 onKeyDown={(event) => {
 if (event.key === "Enter" || event.key === " ") {
 event.preventDefault();
 openHotelDetail(hotel);
 }
 }}
 >
 <div className="home-deal-media">
 <span className="home-media-badge">Gia tot</span>
 <img
 src={hotel.image}
 alt={hotel.name || "Hotel image"}
 onError={(event) => {
 event.currentTarget.onerror = null;
 event.currentTarget.src = homeCardFallback;
 }}
 />
 </div>
 <div className="home-deal-content">
 <div className="home-deal-top">
 <p>{hotel.city || "Dia diem"}</p>
 <span className="home-deal-rating">
 {hotel.averageRating ? hotel.averageRating.toFixed(1) : "Moi"}
 </span>
 </div>
 <h3>{hotel.name || "Khach san"}</h3>
 <p className="home-deal-meta">
 {availabilityFetched
 ? `${hotel.availableRoomCount} phong trong`
 : `${hotel.roomTypeCount} loai phong`}
 {hotel.freeCancellationBeforeDays > 0 ? " · Huy mien phi" : " · Xac nhan nhanh"}
 </p>
 <div className="home-deal-foot">
 <strong>
 {hotel.minRoomPrice
 ? `${currencyFormatter.format(hotel.minRoomPrice)} / dem`
 : "Dang cap nhat gia"}
 </strong>
 <span className="home-deal-cta">Xem chi tiet</span>
 </div>
 </div>
 </article>
 ))}
 </div>
 ) : (
 <div className="home-empty-state">Dang cap nhat du lieu gia khach san.</div>
 )}
 </section>

 <section className="home-shell home-section">
 <div className="home-section-head">
 <div>
 <p className="home-section-kicker">
 <FiMapPin aria-hidden="true" />
 <span>Diem den pho bien</span>
 </p>
 <h2>Cac thanh pho duoc dat nhieu</h2>
 </div>
 <span className="home-result-pill">{cityInsights.length} thanh pho</span>
 </div>

 {cityInsights.length ? (
 <div className="home-city-grid">
 {cityInsights.slice(0, 6).map((city) => (
 <article
 key={city.city}
 className="home-city-card"
 role="button"
 tabIndex={0}
 onClick={() => openDestination(city.city)}
 onKeyDown={(event) => {
 if (event.key === "Enter" || event.key === " ") {
 event.preventDefault();
 openDestination(city.city);
 }
 }}
 >
 <div className="home-city-media">
 <span className="home-media-badge">Pho bien</span>
 <img
 src={city.image || homeCardFallback}
 alt={city.city}
 onError={(event) => {
 event.currentTarget.onerror = null;
 event.currentTarget.src = homeCardFallback;
 }}
 />
 </div>
 <div className="home-city-content">
 <h3>{city.city}</h3>
 <p>{city.hotelCount} khach san dang mo ban</p>
 <div>
 <span>
 {city.averageRating
 ? `${city.averageRating.toFixed(1)} diem trung binh`
 : "Dang cap nhat danh gia"}
 </span>
 <strong>
 {city.minPrice ? `Tu ${currencyFormatter.format(city.minPrice)}` : "Gia dang cap nhat"}
 </strong>
 </div>
 </div>
 </article>
 ))}
 </div>
 ) : (
 <div className="home-empty-state">Chua co du lieu thanh pho de goi y.</div>
 )}
 </section>

 <section className="home-shell home-section">
 <div className="home-section-head">
 <div>
 <p className="home-section-kicker">
 <FiCalendar aria-hidden="true" />
 <span>De xuat theo lich o</span>
 </p>
 <h2>Khach san phu hop voi bo loc hien tai</h2>
 </div>
 <span className="home-result-pill">{filteredHotels.length} ket qua</span>
 </div>

 <div className="home-hotels-toolbar">
 <div className="home-city-tabs" role="tablist" aria-label="Loc theo thanh pho">
 {cityFilterOptions.map((city) => (
 <button
 key={city}
 type="button"
 className={`home-city-tab ${activeCity === city ? "active" : ""}`}
 onClick={() => setActiveCity(city)}
 >
 {city === "all" ? "Tat ca" : city}
 </button>
 ))}
 </div>
 </div>

 {availabilityLoading ? (
 <p className="home-inline-note">Dang cap nhat so phong kha dung theo lich da chon...</p>
 ) : availabilityError ? (
 <p className="home-inline-note warning">{availabilityError}</p>
 ) : (
 <p className="home-inline-note">Ket qua da duoc doi chieu theo lich o va so khach hien tai.</p>
 )}

 {loading ? (
 <div className="home-hotel-grid home-skeleton-grid">
 {Array.from({ length: 8 }).map((_, index) => (
 <div key={index} className="home-hotel-card home-skeleton-card" />
 ))}
 </div>
 ) : error ? (
 <div className="home-empty-state">{error}</div>
 ) : featuredHotels.length === 0 ? (
 <div className="home-empty-state">Khong tim thay khach san phu hop voi bo loc hien tai.</div>
 ) : (
 <div className="home-hotel-grid">
 {featuredHotels.map((hotel) => (
 <article
 key={hotel.hotelId}
 className="home-hotel-card"
 role="button"
 tabIndex={0}
 onClick={() => openHotelDetail(hotel)}
 onKeyDown={(event) => {
 if (event.key === "Enter" || event.key === " ") {
 event.preventDefault();
 openHotelDetail(hotel);
 }
 }}
 >
 <div className="home-hotel-media">
 <img
 src={hotel.image}
 alt={hotel.name || "Hotel image"}
 onError={(event) => {
 event.currentTarget.onerror = null;
 event.currentTarget.src = homeCardFallback;
 }}
 />
 <span className="home-hotel-city">{hotel.city || "Dia diem"}</span>
 </div>

 <div className="home-hotel-body">
 <div className="home-hotel-head">
 <h3>{hotel.name || "Khach san"}</h3>
 <span className="home-hotel-score">
 <strong>{hotel.averageRating ? hotel.averageRating.toFixed(1) : "Moi"}</strong>
 <small>{getReviewTone(hotel.averageRating)}</small>
 </span>
 </div>

 <p className="home-hotel-stars">
 {getStars(hotel.starRating)} {hotel.starRating} sao
 </p>
 <p className="home-hotel-address">{hotel.address || "Dia chi dang cap nhat"}</p>

 <div className="home-hotel-amenities">
 {hotel.amenities.slice(0, 3).map((amenity) => (
 <span key={amenity}>{amenity}</span>
 ))}
 {!hotel.amenities.length ? <span>Dang cap nhat tien nghi</span> : null}
 </div>

 <div className="home-hotel-foot">
 <div>
 <span>Gia tu</span>
 <strong>
 {hotel.minRoomPrice
 ? `${currencyFormatter.format(hotel.minRoomPrice)} / dem`
 : "Dang cap nhat"}
 </strong>
 </div>
 <div>
 <span>
 {availabilityFetched
 ? `${hotel.availableRoomCount} phong phu hop`
 : `${hotel.roomTypeCount} loai phong`}
 </span>
 <span>
 {hotel.reviewCount ? `${hotel.reviewCount} danh gia` : "Chua co danh gia"}
 </span>
 </div>
 </div>

 {hotel.freeCancellationBeforeDays > 0 ? (
 <p className="home-policy-chip">Co huy mien phi</p>
 ) : null}
 </div>
 </article>
 ))}
 </div>
 )}
 </section>

 <section className="home-shell home-insight-layout">
 <article className="home-insight-panel">
 <p className="home-section-kicker">
 <FiCompass aria-hidden="true" />
 <span>Thong tin gia theo diem den</span>
 </p>
 <h2>Gia tham khao de len ke hoach dat phong</h2>

 <div className="home-price-rows">
 {priceInsightRows.map((row) => (
 <div key={row.city} className="home-price-row">
 <div>
 <strong>{row.city}</strong>
 <span>{row.hotels} khach san</span>
 </div>
 <div>
 <span>{row.rating ? `${row.rating.toFixed(1)} diem` : "Moi"}</span>
 <strong>{row.minPrice ? `Tu ${currencyFormatter.format(row.minPrice)}` : "Dang cap nhat"}</strong>
 </div>
 </div>
 ))}
 {!priceInsightRows.length ? (
 <p className="home-empty-text">Chua du du lieu gia theo diem den.</p>
 ) : null}
 </div>
 </article>

 <article className="home-insight-panel">
 <p className="home-section-kicker">
 <FiTrendingUp aria-hidden="true" />
 <span>Chi so thi truong</span>
 </p>
 <h2>So lieu thuc te de ban quyet dinh nhanh hon</h2>

 <div className="home-market-grid">
 <article className="home-market-item">
 <span className="home-market-icon" aria-hidden="true">
 <FiTag />
 </span>
 <div>
 <p>Gia trung binh moi dem</p>
 <strong>
 {marketSummary.avgNightPrice
 ? currencyFormatter.format(marketSummary.avgNightPrice)
 : "Dang cap nhat"}
 </strong>
 </div>
 </article>

 <article className="home-market-item">
 <span className="home-market-icon" aria-hidden="true">
 <FiShield />
 </span>
 <div>
 <p>Khach san co huy mien phi</p>
 <strong>{marketSummary.freeCancellationHotels} khach san</strong>
 </div>
 </article>

 <article className="home-market-item">
 <span className="home-market-icon" aria-hidden="true">
 <FiStar />
 </span>
 <div>
 <p>Khach san co danh gia</p>
 <strong>{marketSummary.reviewedHotels} khach san</strong>
 </div>
 </article>

 <article className="home-market-item">
 <span className="home-market-icon" aria-hidden="true">
 <FiCheckCircle />
 </span>
 <div>
 <p>Tong phong kha dung hien tai</p>
 <strong>
 {availabilityFetched
 ? `${marketSummary.availableUnits} phong`
 : "Can chon lich o de cap nhat"}
 </strong>
 </div>
 </article>
 </div>

 {popularAmenities.length ? (
 <div className="home-amenity-cloud">
 {popularAmenities.map((item) => (
 <span key={item.name}>{`${item.name} (${item.count})`}</span>
 ))}
 </div>
 ) : null}
 </article>
 </section>
 </div>
 );
}