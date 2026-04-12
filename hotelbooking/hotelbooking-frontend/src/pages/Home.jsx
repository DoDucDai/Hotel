import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
 FALLBACK_IMAGE,
 currencyFormatter,
 normalizeHotels,
 normalizeRooms,
 toPositiveInt,
} from "../features/hotels/hotelsPageUtils";
import { getHotels } from "../services/hotelService";
import { getRooms, searchRooms } from "../services/roomService";
import { addDaysToDateInput, formatDateInputLocal } from "../utils/dateInput";
import { getPrimaryImage } from "../utils/imageHelpers";
import "./Home.css";

const STAR = String.fromCodePoint(9733);

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

export default function Home() {
 const navigate = useNavigate();

 const [hotels, setHotels] = useState([]);
 const [rooms, setRooms] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 const [availabilityMap, setAvailabilityMap] = useState({});
 const [availabilityLoading, setAvailabilityLoading] = useState(false);
 const [availabilityError, setAvailabilityError] = useState("");
 const [availabilityFetched, setAvailabilityFetched] = useState(false);

 const [destination, setDestination] = useState("");
 const [checkIn, setCheckIn] = useState(() => formatDateInputLocal());
 const [checkOut, setCheckOut] = useState(() =>
 buildDefaultCheckOut(formatDateInputLocal())
 );
 const [guests, setGuests] = useState("2");
 const [roomCount, setRoomCount] = useState("1");
 const [stayType, setStayType] = useState("hotel");
 const [activeCity, setActiveCity] = useState("all");
 const [formError, setFormError] = useState("");

 useEffect(() => {
 let isMounted = true;

 const fetchCatalog = async () => {
 try {
 setLoading(true);
 const [hotelsRes, roomsRes] = await Promise.allSettled([
 getHotels(0, 200),
 getRooms(0, 2000),
 ]);

 if (hotelsRes.status !== "fulfilled") {
 throw hotelsRes.reason;
 }

 const parsedHotels = normalizeHotels(hotelsRes.value?.data);
 const parsedRooms =
 roomsRes.status === "fulfilled" ? normalizeRooms(roomsRes.value?.data) : [];

 if (isMounted) {
 setHotels(parsedHotels);
 setRooms(parsedRooms);
 setError("");
 }
 } catch (fetchError) {
 console.error("Cannot load home data", fetchError);
 if (isMounted) {
 setHotels([]);
 setRooms([]);
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

 const availableRooms = normalizeRooms(res?.data);
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

 const roomStatsByHotel = useMemo(() => {
 return rooms.reduce((acc, room) => {
 const hotelId = String(room?.hotelId || "");
 if (!hotelId) {
 return acc;
 }

 const current = acc[hotelId] || {
 roomTypeCount: 0,
 minRoomPrice: Number.POSITIVE_INFINITY,
 maxCapacity: 0,
 };

 current.roomTypeCount += 1;
 current.minRoomPrice = Math.min(current.minRoomPrice, Number(room.price || 0));
 current.maxCapacity = Math.max(current.maxCapacity, Number(room.capacity || 0));

 acc[hotelId] = current;
 return acc;
 }, {});
 }, [rooms]);

 const hotelsWithStats = useMemo(() => {
 return hotels.map((hotel, index) => {
 const hotelId = mapHotelId(hotel, index);
 const roomStats = roomStatsByHotel[hotelId] || {
 roomTypeCount: 0,
 minRoomPrice: Number.POSITIVE_INFINITY,
 maxCapacity: 0,
 };

 return {
 ...hotel,
 hotelId,
 cityNormalized: normalizeCityName(hotel.city),
 starRating: Number(hotel.starRating || 3),
 averageRating: Number(hotel.averageRating || 0),
 reviewCount: Number(hotel.reviewCount || 0),
 freeCancellationBeforeDays: Number(hotel.freeCancellationBeforeDays || 0),
 amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
 roomTypeCount: Number(roomStats.roomTypeCount || 0),
 maxCapacity: Number(roomStats.maxCapacity || 0),
 minRoomPrice: Number.isFinite(roomStats.minRoomPrice) ? roomStats.minRoomPrice : 0,
 availableRoomCount: Number(availabilityMap[hotelId] || 0),
 image: getPrimaryImage(hotel, FALLBACK_IMAGE, { includeNameFallback: true }),
 };
 });
 }, [availabilityMap, hotels, roomStatsByHotel]);

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

 const totalRoomTypes = Object.values(roomStatsByHotel).reduce(
 (sum, stats) => sum + Number(stats.roomTypeCount || 0),
 0
 );

 return [
 {
 id: "hotels",
 label: "Khach san dang mo ban",
 value: `${hotelsWithStats.length}+`,
 },
 {
 id: "cities",
 label: "Thanh pho co san",
 value: `${cityInsights.length}+`,
 },
 {
 id: "rooms",
 label: "Loai phong",
 value: `${totalRoomTypes || hotelsWithStats.length}+`,
 },
 {
 id: "rating",
 label: "Diem trung binh",
 value: avgRating ? avgRating.toFixed(1) : "Moi",
 },
 ];
 }, [cityInsights.length, hotelsWithStats, roomStatsByHotel]);

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
 setStayType("hotel");
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
 <section className="home-shell home-hero-section">
 <div className="home-hero-intro">
 <div className="home-service-tabs" role="tablist" aria-label="Loai luu tru">
 {[
 { key: "hotel", label: "Khach san" },
 { key: "resort", label: "Resort" },
 { key: "apartment", label: "Can ho" },
 { key: "villa", label: "Villa" },
 ].map((tab) => (
 <button
 key={tab.key}
 type="button"
 role="tab"
 aria-selected={stayType === tab.key}
 className={`home-service-tab ${stayType === tab.key ? "active" : ""}`}
 onClick={() => setStayType(tab.key)}
 >
 {tab.label}
 </button>
 ))}
 </div>

 <p className="home-kicker">Du lieu dong bo tu trang Hotels</p>
 <h1>Dat khach san nhanh, tim dung phong theo nhu cau chi trong vai thao tac</h1>
 <p className="home-hero-copy">
 Trang chu nay su dung cung nguon du lieu va bo loc voi trang Hotels, nen ket qua ban
 thay o day va khi chuyen trang se thong nhat voi nhau.
 </p>

 <div className="home-stat-grid">
 {quickStats.map((stat) => (
 <article key={stat.id} className="home-stat-card">
 <strong>{stat.value}</strong>
 <span>{stat.label}</span>
 </article>
 ))}
 </div>
 </div>

 <form className="home-search-card" onSubmit={handleSearchSubmit}>
 <h2>Tim phong theo lich o</h2>
 <p>
 Dien thong tin mot lan, he thong se truyen sang trang Hotels voi filter da dien san.
 </p>

 <div className="home-search-grid">
 <label className="home-search-field home-search-field-wide">
 <span>Diem den hoac ten khach san</span>
 <input
 type="text"
 value={destination}
 placeholder="Vi du: Da Nang, Muong Thanh, Quan 1"
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
 </form>
 </section>

 <section className="home-shell home-section">
 <div className="home-section-head">
 <div>
 <p className="home-section-kicker">Uu dai tu du lieu gia</p>
 <h2>Lua chon gia tot dang co tren he thong</h2>
 </div>
 <button type="button" className="home-section-link" onClick={() => navigateToHotels()}>
 Xem danh sach Hotels
 </button>
 </div>

 {bestValueHotels.length ? (
 <div className="home-offer-grid">
 {bestValueHotels.map((hotel) => (
 <article
 key={hotel.hotelId}
 className="home-offer-card"
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
 <div className="home-offer-media">
 <img
 src={hotel.image}
 alt={hotel.name || "Hotel image"}
 onError={(event) => {
 event.currentTarget.onerror = null;
 event.currentTarget.src = FALLBACK_IMAGE;
 }}
 />
 </div>
 <div className="home-offer-content">
 <p>{hotel.city || "Dia diem"}</p>
 <h3>{hotel.name || "Khach san"}</h3>
 <strong>
 {hotel.minRoomPrice
 ? `${currencyFormatter.format(hotel.minRoomPrice)} / dem`
 : "Dang cap nhat gia"}
 </strong>
 <span>
 {hotel.averageRating
 ? `${hotel.averageRating.toFixed(1)} diem - ${hotel.reviewCount} danh gia`
 : "Chua co danh gia"}
 </span>
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
 <p className="home-section-kicker">Cam hung diem den</p>
 <h2>Thanh pho co nhieu lua chon khach san</h2>
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
 <img
 src={city.image || FALLBACK_IMAGE}
 alt={city.city}
 onError={(event) => {
 event.currentTarget.onerror = null;
 event.currentTarget.src = FALLBACK_IMAGE;
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
 <p className="home-section-kicker">Nhieu lua chon khach san</p>
 <h2>Card du lieu thuc tu trang Hotels</h2>
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
 <p className="home-inline-note">Du lieu phong dang dong bo voi bo loc ngay o hien tai.</p>
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
 event.currentTarget.src = FALLBACK_IMAGE;
 }}
 />
 <span className="home-hotel-city">{hotel.city || "Dia diem noi bat"}</span>
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
 <p className="home-section-kicker">Tien nghi duoc tim nhieu</p>
 <h2>Ban do tien nghi tu du lieu hotels</h2>
 {popularAmenities.length ? (
 <div className="home-amenity-cloud">
 {popularAmenities.map((item) => (
 <span key={item.name}>{`${item.name} (${item.count})`}</span>
 ))}
 </div>
 ) : (
 <p className="home-empty-text">Chua co du lieu tien nghi de phan tich.</p>
 )}
 </article>

 <article className="home-insight-panel">
 <p className="home-section-kicker">Ly do nen dat phong</p>
 <h2>Nhung gi project hien dang ho tro</h2>
 <div className="home-reason-list">
 <div>
 <h3>Bo loc lien thong</h3>
 <p>Du lieu va bo loc Home to Hotels to Detail duoc giu thong nhat.</p>
 </div>
 <div>
 <h3>Gia theo room thuc</h3>
 <p>Gia "tu" tren Home lay tu bang room cua tung khach san.</p>
 </div>
 <div>
 <h3>Theo doi kha dung</h3>
 <p>Neu co ngay o hop le, Home se cap nhat so phong kha dung tu searchRooms.</p>
 </div>
 <div>
 <h3>Responsive day du</h3>
 <p>Toan bo section da duoc toi uu cho desktop, tablet va mobile.</p>
 </div>
 </div>
 </article>
 </section>
 </div>
 );
}
