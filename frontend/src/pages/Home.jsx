import { useEffect, useMemo, useRef, useState } from "react";
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
  FiSearch,
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
 { key: "business", label: "Công tác", icon: FiBriefcase },
 { key: "family", label: "Gia đình", icon: FiUsers },
 { key: "resort", label: "Nghỉ dưỡng", icon: FiSun },
 { key: "weekend", label: "Cuối tuần", icon: FiMoon },
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

function getDayOfWeekLabel(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const day = date.getDay();
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    return days[day];
  } catch (e) {
    return "";
  }
}

function formatAgodaDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${day} tháng ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
}

 export default function Home() {
  const navigate = useNavigate();
  const guestSelectorRef = useRef(null);
  const [showGuestSelector, setShowGuestSelector] = useState(false);

  // Close guest selector on click outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (guestSelectorRef.current && !guestSelectorRef.current.contains(event.target)) {
        setShowGuestSelector(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
  const priced = hotelsWithStats.filter((hotel) => hotel.minRoomPrice > 0);
  const source = priced.length > 0 ? priced : hotelsWithStats;
  return source
   .slice()
   .sort((a, b) => {
    if (a.minRoomPrice !== b.minRoomPrice) {
     return (a.minRoomPrice || 99999999) - (b.minRoomPrice || 99999999);
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
 label: "Khách sạn đang mở bán",
 value: `${hotelsWithStats.length}+`,
 },
 {
 id: "cities",
 icon: FiGlobe,
 label: "Thành phố có dữ liệu",
 value: `${cityInsights.length}+`,
 },
 {
 id: "rooms",
 icon: FiCompass,
 label: "Loại phòng khả dụng",
 value: `${totalRoomTypes || hotelsWithStats.length}+`,
 },
 {
 id: "rating",
 icon: FiStar,
 label: "Điểm đánh giá TB",
 value: avgRating ? avgRating.toFixed(1) : "Mới",
 },
 ];
 }, [cityInsights.length, hotelsWithStats]);

 const trustHighlights = useMemo(() => {
 const availabilityStatus = availabilityLoading
 ? "Đang cập nhật phòng trống..."
 : availabilityFetched
 ? "Đã đối chiếu phòng theo lịch ở"
 : "Kiểm tra phòng trống theo ngày";

 return [
 {
 id: "verified",
 icon: FiShield,
 title: "Danh mục tin cậy",
 copy: `${hotelsWithStats.length} khách sạn đang mở bán`,
 },
 {
 id: "coverage",
 icon: FiGlobe,
 title: "Độ phủ điểm đến",
 copy: `${cityInsights.length} thành phố có dữ liệu giá`,
 },
 {
 id: "availability",
 icon: FiCheckCircle,
 title: "Phòng trống",
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
 return preferred || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80";
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
  <section className="home-hero-shell">
  <div className="home-hero-backdrop">
    <img src={heroImage} alt="Travel destination" className="home-hero-bg-img" />
    <div className="home-hero-overlay" />

    <div className="home-hero-centered-content">
      <h1 className="hero-main-title">Find Your Perfect Stay</h1>
      <p className="hero-sub-title">Search from millions of hotels worldwide</p>

      {/* Floating White Search Card Container */}
      <div className="search-bar-card-container">
        <form className="search-bar-card-form" onSubmit={handleSearchSubmit}>
          <div className="search-card-grid">
            {/* Destination Field */}
            <div className="search-card-col">
              <label className="search-card-label">Where to?</label>
              <div className="search-card-input-wrapper">
                <FiMapPin className="search-card-icon" />
                <input
                  type="text"
                  className="search-card-input"
                  placeholder="City or hotel name"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                />
              </div>
            </div>

            {/* Check-In Field */}
            <div className="search-card-col">
              <label className="search-card-label">Check-in</label>
              <div className="search-card-input-wrapper">
                <FiCalendar className="search-card-icon" />
                <input
                  type="date"
                  className="search-card-input-date"
                  value={checkIn}
                  min={formatDateInputLocal()}
                  onChange={(event) => setCheckIn(event.target.value)}
                />
              </div>
            </div>

            {/* Check-Out Field */}
            <div className="search-card-col">
              <label className="search-card-label">Check-out</label>
              <div className="search-card-input-wrapper">
                <FiCalendar className="search-card-icon" />
                <input
                  type="date"
                  className="search-card-input-date"
                  value={checkOut}
                  min={checkIn || formatDateInputLocal()}
                  onChange={(event) => setCheckOut(event.target.value)}
                />
              </div>
            </div>

            {/* Guests Selector */}
            <div className="search-card-col" ref={guestSelectorRef} style={{ position: "relative" }}>
              <label className="search-card-label">Guests</label>
              <div
                className="search-card-input-wrapper"
                onClick={() => setShowGuestSelector(!showGuestSelector)}
                style={{ cursor: "pointer" }}
              >
                <FiUsers className="search-card-icon" />
                <div className="search-card-trigger-text">
                  {guests} Guests, {roomCount} Rooms
                </div>
              </div>

              {showGuestSelector && (
                <div className="home-guest-popup-dropdown search-card-dropdown">
                  <div className="home-guest-popup-row">
                    <div>
                      <strong>Số khách</strong>
                      <small>Người lớn &amp; Trẻ em</small>
                    </div>
                    <div className="home-counter-controls">
                      <button
                        type="button"
                        onClick={() => setGuests((prev) => String(Math.max(1, Number(prev) - 1)))}
                        disabled={Number(guests) <= 1}
                      >
                        -
                      </button>
                      <span>{guests}</span>
                      <button type="button" onClick={() => setGuests((prev) => String(Number(prev) + 1))}>
                        +
                      </button>
                    </div>
                  </div>
                  <div className="home-guest-popup-row">
                    <div>
                      <strong>Số phòng</strong>
                      <small>Số lượng phòng cần đặt</small>
                    </div>
                    <div className="home-counter-controls">
                      <button
                        type="button"
                        onClick={() => setRoomCount((prev) => String(Math.max(1, Number(prev) - 1)))}
                        disabled={Number(roomCount) <= 1}
                      >
                        -
                      </button>
                      <span>{roomCount}</span>
                      <button type="button" onClick={() => setRoomCount((prev) => String(Number(prev) + 1))}>
                        +
                      </button>
                    </div>
                  </div>
                  <div className="home-guest-popup-foot">
                    <button
                      type="button"
                      className="home-guest-done-btn"
                      onClick={() => setShowGuestSelector(false)}
                    >
                      Xong
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {formError && <p className="home-form-error-bubble" style={{ marginTop: "12px" }}>{formError}</p>}

          {/* Submit Button placed below columns inside card */}
          <div className="search-card-submit-wrap">
            <button type="submit" className="search-card-submit-btn">
              <FiSearch className="submit-icon" />
              <span>Search Hotels</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  </section>

 <section className="home-shell home-section">
 <div className="home-section-head">
 <div>
 <p className="home-section-kicker">
 <FiTag aria-hidden="true" />
 <span>Ưu đãi giá tốt</span>
 </p>
 <h2>Lựa chọn phù hợp ngân sách của bạn</h2>
 </div>
 <button type="button" className="home-section-link" onClick={() => navigateToHotels()}>
 Xem toàn bộ khách sạn
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
 <span className="home-media-badge">Ưu đãi lớn</span>
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
 <p>{hotel.city || "Địa điểm"}</p>
 <span className="home-deal-rating">
 {hotel.averageRating ? hotel.averageRating.toFixed(1) : "Mới"}
 </span>
 </div>
 <h3>{hotel.name || "Khách sạn"}</h3>
 <p className="home-deal-meta">
 {availabilityFetched
 ? `${hotel.availableRoomCount} phòng trống`
 : `${hotel.roomTypeCount} loại phòng`}
 {hotel.freeCancellationBeforeDays > 0 ? " · Hủy miễn phí" : " · Xác nhận nhanh"}
 </p>
 <div className="home-deal-foot">
 <strong>
 {hotel.minRoomPrice
 ? `${currencyFormatter.format(hotel.minRoomPrice)} / đêm`
 : "Liên hệ đặt phòng"}
 </strong>
 <span className="home-deal-cta">Xem chi tiết</span>
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
 <span>Điểm đến phổ biến</span>
 </p>
 <h2>Các thành phố được đặt nhiều</h2>
 </div>
 <span className="home-result-pill">{cityInsights.length} thành phố</span>
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
 <span className="home-media-badge">Phổ biến</span>
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
 <h3><FiMapPin className="city-pin-icon" /> {city.city}</h3>
 <p>{city.hotelCount} khách sạn đang mở bán</p>
 <div>
 <span>
 {city.averageRating
 ? `${city.averageRating.toFixed(1)} điểm trung bình`
 : "Đang cập nhật đánh giá"}
 </span>
 <strong>
 {city.minPrice ? `Từ ${currencyFormatter.format(city.minPrice)}` : "Giá đang cập nhật"}
 </strong>
 </div>
 </div>
 </article>
 ))}
 </div>
 ) : (
 <div className="home-empty-state">Chưa có dữ liệu thành phố để gợi ý.</div>
 )}
 </section>

 <section className="home-shell home-section">
 <div className="home-section-head">
 <div>
 <p className="home-section-kicker">
 <FiCalendar aria-hidden="true" />
 <span>Đề xuất theo lịch ở</span>
 </p>
 <h2>Khách sạn phù hợp với bộ lọc hiện tại</h2>
 </div>
 <span className="home-result-pill">{filteredHotels.length} kết quả</span>
 </div>

 <div className="home-hotels-toolbar">
 <div className="home-city-tabs" role="tablist" aria-label="Lọc theo thành phố">
 {cityFilterOptions.map((city) => (
 <button
 key={city}
 type="button"
 className={`home-city-tab ${activeCity === city ? "active" : ""}`}
 onClick={() => setActiveCity(city)}
 >
 {city === "all" ? "Tất cả" : city}
 </button>
 ))}
 </div>
 </div>

 {availabilityLoading ? (
 <p className="home-inline-note">Đang cập nhật số phòng khả dụng theo lịch đã chọn...</p>
 ) : availabilityError ? (
 <p className="home-inline-note warning">{availabilityError}</p>
 ) : (
 <p className="home-inline-note">Kết quả đã được đối chiếu theo lịch ở và số khách hiện tại.</p>
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
 <span>Thông tin giá theo điểm đến</span>
 </p>
 <h2>Giá tham khảo để lên kế hoạch đặt phòng</h2>

 <div className="home-price-rows">
 {priceInsightRows.map((row) => (
 <div key={row.city} className="home-price-row">
 <div>
 <strong>{row.city}</strong>
 <span>{row.hotels} khách sạn</span>
 </div>
 <div>
 <span>{row.rating ? `${row.rating.toFixed(1)} điểm` : "Mới"}</span>
 <strong>{row.minPrice ? `Từ ${currencyFormatter.format(row.minPrice)}` : "Đang cập nhật"}</strong>
 </div>
 </div>
 ))}
 {!priceInsightRows.length ? (
 <p className="home-empty-text">Chưa đủ dữ liệu giá theo điểm đến.</p>
 ) : null}
 </div>
 </article>

 <article className="home-insight-panel">
 <p className="home-section-kicker">
 <FiTrendingUp aria-hidden="true" />
 <span>Chỉ số thị trường</span>
 </p>
 <h2>Số liệu thực tế để bạn quyết định nhanh hơn</h2>

 <div className="home-market-grid">
 <article className="home-market-item">
 <span className="home-market-icon" aria-hidden="true">
 <FiTag />
 </span>
 <div>
 <p>Giá trung bình mỗi đêm</p>
 <strong>
 {marketSummary.avgNightPrice
 ? currencyFormatter.format(marketSummary.avgNightPrice)
 : "Đang cập nhật"}
 </strong>
 </div>
 </article>

 <article className="home-market-item">
 <span className="home-market-icon" aria-hidden="true">
 <FiShield />
 </span>
 <div>
 <p>Khách sạn có hủy miễn phí</p>
 <strong>{marketSummary.freeCancellationHotels} khách sạn</strong>
 </div>
 </article>

 <article className="home-market-item">
 <span className="home-market-icon" aria-hidden="true">
 <FiStar />
 </span>
 <div>
 <p>Khách sạn có đánh giá</p>
 <strong>{marketSummary.reviewedHotels} khách sạn</strong>
 </div>
 </article>

 <article className="home-market-item">
 <span className="home-market-icon" aria-hidden="true">
 <FiCheckCircle />
 </span>
 <div>
 <p>Tổng phòng khả dụng hiện tại</p>
 <strong>
 {availabilityFetched
 ? `${marketSummary.availableUnits} phòng`
 : "Cần chọn lịch ở để cập nhật"}
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