import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHotels } from "../services/hotelService";
import { getPrimaryImage } from "../utils/imageHelpers";
import "./Home.css";

const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(
 `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
 <defs>
 <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
 <stop offset="0%" stop-color="#154a8a" />
 <stop offset="100%" stop-color="#2b86cf" />
 </linearGradient>
 </defs>
 <rect width="1200" height="700" fill="url(#bg)" />
 <circle cx="220" cy="120" r="130" fill="rgba(255,255,255,0.1)" />
 <circle cx="1030" cy="90" r="170" fill="rgba(255,255,255,0.08)" />
 <path d="M220 460h760v150H220z" fill="rgba(255,255,255,0.16)" />
 <text x="120" y="375" fill="white" font-size="86" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Hotel Booking</text>
 </svg>`
)}`;

function normalizeHotels(data) {
 if (Array.isArray(data)) {
 return data;
 }

 if (Array.isArray(data?.content)) {
 return data.content;
 }

 if (Array.isArray(data?.data)) {
 return data.data;
 }

 return [];
}

function mapHotelId(hotel, index) {
 return hotel.id || hotel._id || `${hotel.name || "hotel"}-${index}`;
}

function normalizeCityName(value) {
 return String(value || "").trim();
}

export default function Home() {
 const navigate = useNavigate();

 const [hotels, setHotels] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [keyword, setKeyword] = useState("");
 const [cityFilter, setCityFilter] = useState("all");

 useEffect(() => {
 let isMounted = true;

 const fetchHotels = async () => {
 try {
 setLoading(true);
 const res = await getHotels();
 const parsedHotels = normalizeHotels(res?.data);

 if (isMounted) {
 setHotels(parsedHotels);
 setError("");
 }
 } catch (fetchError) {
 console.error("Cannot load hotels:", fetchError);
 if (isMounted) {
 setHotels([]);
 setError("Không thể tải dữ liệu khách sạn. Vui lòng thử lại sau.");
 }
 } finally {
 if (isMounted) {
 setLoading(false);
 }
 }
 };

 fetchHotels();

 return () => {
 isMounted = false;
 };
 }, []);

 const cities = useMemo(() => {
 const citySet = new Set(
 hotels
 .map((hotel) => hotel.city?.trim())
 .filter((city) => Boolean(city))
 );

 return Array.from(citySet).sort((a, b) => a.localeCompare(b, "vi"));
 }, [hotels]);

 const filteredHotels = useMemo(() => {
 const normalizedKeyword = keyword.trim().toLowerCase();

 return hotels.filter((hotel) => {
 const city = hotel.city?.toLowerCase() || "";
 const address = hotel.address?.toLowerCase() || "";
 const name = hotel.name?.toLowerCase() || "";

 const matchesKeyword =
 !normalizedKeyword ||
 name.includes(normalizedKeyword) ||
 city.includes(normalizedKeyword) ||
 address.includes(normalizedKeyword);

 const matchesCity = cityFilter === "all" || hotel.city === cityFilter;

 return matchesKeyword && matchesCity;
 });
 }, [hotels, keyword, cityFilter]);

 const stats = useMemo(
 () => [
 { label: "Khách sạn", value: `${hotels.length}+` },
 { label: "Thành phố", value: `${cities.length}+` },
 { label: "Đặt nhanh", value: "24/7" },
 ],
 [hotels.length, cities.length]
 );

 const travelStories = useMemo(() => {
 const cityLeads = {};
 hotels.forEach((hotel) => {
 const city = normalizeCityName(hotel.city);
 if (!city || cityLeads[city]) {
 return;
 }
 cityLeads[city] = hotel;
 });

 const cityStories = Object.entries(cityLeads)
 .slice(0, 3)
 .map(([city, hotel], index) => ({
 id: `city-${city}-${index}`,
 tag: "Điểm đến hot",
 title: `${city}: điểm đến được tìm nhiều`,
 summary: `Khám phá ${city} với nhiều lựa chọn phòng linh hoạt và giá phù hợp cho nhiều nhu cầu.`,
 destination: city,
 image: getPrimaryImage(hotel, FALLBACK_IMAGE, { includeNameFallback: true }),
 }));

 const coverPool = hotels.slice(0, 4).map((hotel) =>
 getPrimaryImage(hotel, FALLBACK_IMAGE, { includeNameFallback: true })
 );
 const fallbackCover = coverPool.length ? coverPool[0] : FALLBACK_IMAGE;
 const getCover = (index) => coverPool[index] || fallbackCover;

 const editorialStories = [
 {
 id: "deal-early",
 tag: "Ưu đãi",
 title: "Deal đặt sớm cho mùa cao điểm",
 summary:
 "Lên lịch trước để giữ giá tốt và có nhiều lựa chọn phòng hơn vào cuối tuần và dịp lễ.",
 destination: "",
 image: getCover(1),
 },
 {
 id: "family-trend",
 tag: "Xu hướng",
 title: "Nhiều gia đình ưu tiên căn hộ mini",
 summary:
 "Loại phòng có bếp nhỏ, máy giặt và không gian chung đang được đặt nhiều hơn cho nhóm 3-5 người.",
 destination: "",
 image: getCover(2),
 },
 {
 id: "workation",
 tag: "Cảm hứng",
 title: "Workation: vừa làm việc vừa nghỉ dưỡng",
 summary:
 "Chọn khách sạn có wifi ổn định, không gian yên tĩnh và tiện nghi 24/7 cho lịch làm việc linh hoạt.",
 destination: "",
 image: getCover(3),
 },
 ];

 return [...cityStories, ...editorialStories].slice(0, 6);
 }, [hotels]);

 const handleExploreHotels = () => {
 const destination = cityFilter !== "all" ? cityFilter : keyword.trim();
 navigate("/hotels", {
 state: {
 prefillFilters: {
 destination,
 guests: "1",
 roomCount: "1",
 checkIn: "",
 checkOut: "",
 },
 },
 });
 };

 const openHotelDetail = (hotel, index) => {
 const hotelId = mapHotelId(hotel, index);
 navigate(`/hotels/${hotelId}`, {
 state: { hotel },
 });
 };

 const openStory = (story) => {
 navigate("/hotels", {
 state: {
 prefillFilters: {
 destination: story.destination || "",
 guests: "1",
 roomCount: "1",
 checkIn: "",
 checkOut: "",
 },
 },
 });
 };

 return (
 <div className="home-page">
 <section className="home-container home-hero">
 <div className="hero-content">
 <span className="hero-chip">Nền tảng đặt phòng toàn quốc</span>
 <h1>Đặt phòng khách sạn nhanh, giá tốt mỗi ngày</h1>
 <p>
 So sánh nhiều lựa chọn trong vài giây, chọn nơi lưu trú phù hợp và
 hoàn tất đặt phòng chỉ với vài thao tác.
 </p>

 <div className="hero-stats">
 {stats.map((item) => (
 <article key={item.label} className="hero-stat-card">
 <strong>{item.value}</strong>
 <span>{item.label}</span>
 </article>
 ))}
 </div>
 </div>

 <form className="home-search-panel" onSubmit={(event) => event.preventDefault()}>
 <h2>Tìm khách sạn theo nhu cầu</h2>

 <label className="search-field">
 <span>Tên khách sạn hoặc địa điểm</span>
 <input
 type="text"
 value={keyword}
 onChange={(event) => setKeyword(event.target.value)}
 placeholder="Ví dụ: Mường Thanh, Hà Nội..."
 />
 </label>

 <label className="search-field">
 <span>Thành phố</span>
 <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
 <option value="all">Tất cả thành phố</option>
 {cities.map((city) => (
 <option key={city} value={city}>
 {city}
 </option>
 ))}
 </select>
 </label>

 <div className="search-actions">
 <button className="btn-main" type="button" onClick={handleExploreHotels}>
 Xem tất cả khách sạn
 </button>
 <button
 className="btn-sub"
 type="button"
 onClick={() => {
 setKeyword("");
 setCityFilter("all");
 }}
 >
 Đặt lại bộ lọc
 </button>
 </div>
 </form>
 </section>

 <section className="home-container home-highlights">
 <article className="highlight-card">
 <span className="highlight-icon">01</span>
 <h3>Tìm kiếm tức thì</h3>
 <p>Lọc nhanh theo tên, thành phố và địa điểm nổi bật chỉ trong 1 ô.</p>
 </article>

 <article className="highlight-card">
 <span className="highlight-icon">02</span>
 <h3>Thông tin minh bạch</h3>
 <p>Hiển thị đầy đủ tên, địa chỉ và hình ảnh để bạn ra quyết định dễ hơn.</p>
 </article>

 <article className="highlight-card">
 <span className="highlight-icon">03</span>
 <h3>Tối ưu mobile</h3>
 <p>Trải nghiệm mượt trên điện thoại, tablet và desktop với layout linh hoạt.</p>
 </article>
 </section>

 <section className="home-container home-news">
 <div className="section-header">
 <div>
 <p className="section-label">Tin tức du lịch</p>
 <h2>Cảm hứng và xu hướng đặt phòng</h2>
 </div>
 <span className="result-count">{travelStories.length} bài nổi bật</span>
 </div>

 <div className="news-grid">
 {travelStories.map((story) => (
 <article key={story.id} className="news-card">
 <div className="news-media">
 <img
 src={story.image}
 alt={story.title}
 onError={(event) => {
 event.currentTarget.onerror = null;
 event.currentTarget.src = FALLBACK_IMAGE;
 }}
 />
 </div>
 <div className="news-content">
 <span className="news-tag">{story.tag}</span>
 <h3>{story.title}</h3>
 <p>{story.summary}</p>
 <button type="button" className="news-link-btn" onClick={() => openStory(story)}>
 Xem ngay
 </button>
 </div>
 </article>
 ))}
 </div>
 </section>

 <section className="home-container home-hotels">
 <div className="section-header">
 <div>
 <p className="section-label">Gợi ý hôm nay</p>
 <h2>Khách sạn nổi bật</h2>
 </div>
 <span className="result-count">{filteredHotels.length} kết quả</span>
 </div>

 {loading ? (
 <div className="hotel-grid skeleton-grid">
 {Array.from({ length: 6 }).map((_, index) => (
 <div key={index} className="hotel-card skeleton-card" />
 ))}
 </div>
 ) : error ? (
 <div className="empty-state">{error}</div>
 ) : filteredHotels.length === 0 ? (
 <div className="empty-state">
 Không tìm thấy khách sạn phù hợp. Hãy thử từ khóa khác.
 </div>
 ) : (
 <div className="hotel-grid">
 {filteredHotels.slice(0, 8).map((hotel, index) => (
 <article
 key={mapHotelId(hotel, index)}
 className="hotel-card"
 role="button"
 tabIndex={0}
 onClick={() => openHotelDetail(hotel, index)}
 onKeyDown={(event) => {
 if (event.key === "Enter" || event.key === " ") {
 event.preventDefault();
 openHotelDetail(hotel, index);
 }
 }}
 >
 <div className="hotel-media">
 <img
 src={getPrimaryImage(hotel, FALLBACK_IMAGE, { includeNameFallback: true })}
 alt={hotel.name || "Hotel image"}
 onError={(event) => {
 event.currentTarget.onerror = null;
 event.currentTarget.src = FALLBACK_IMAGE;
 }}
 />
 </div>

 <div className="hotel-content">
 <p className="hotel-city">{hotel.city || "Địa điểm nổi bật"}</p>
 <h3>{hotel.name || "Khách sạn đang cập nhật"}</h3>
 <p className="hotel-address">
 {hotel.address || "Địa chỉ sẽ được cập nhật sớm."}
 </p>
 <span className="hotel-link">Xem chi tiết</span>
 </div>
 </article>
 ))}
 </div>
 )}
 </section>
 </div>
 );
}
