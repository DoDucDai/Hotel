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
 setError("Khong the tai de lieu khach san. Vui long the lai sau.");
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
 { label: "Khach san", value: `${hotels.length}+` },
 { label: "Thonh phi", value: `${cities.length}+` },
 { label: "Dat nhanh", value: "24/7" },
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
 tag: "Diem den hot",
 title: `${city}: diem den duoc tim nhieu`,
 summary: `Kham pha ${city} voi nhieu lua chan phong linh hoat va gia phu hop cho nhieu nhu cau.`,
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
 tag: "Uu dai",
 title: "Deal dat som cho mua cao diem",
 summary:
 "Len lich truoc de giu gia tot va co nhieu lua chan phong hon vao cuoi tuan va dip le.",
 destination: "",
 image: getCover(1),
 },
 {
 id: "family-trend",
 tag: "Xu huong",
 title: "Nhieu gia dinh uu tien can ho mini",
 summary:
 "Loai phong co bep nho, may giat va khong gian chung dang duoc dat nhieu hon cho nhom 3-5 nguoi.",
 destination: "",
 image: getCover(2),
 },
 {
 id: "workation",
 tag: "Cam hung",
 title: "Workation: vua lam viec vua nghi duong",
 summary:
 "Chan khach san co wifi an denh, khong gian yen tinh va tien nghi 24/7 cho lich lam viec linh hoat.",
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
 <span className="hero-chip">Nen tang dat phong toan quoc</span>
 <h1>Dt phong khach san nhanh, gia tot moi ngay</h1>
 <p>
 So sanh nhieu lua chan trong vai giay, chan noi luu tru phu hop va
 ho n tat dat phong chi voi vai thao tac.
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
 <h2>Tim khach san theo nhu cau</h2>

 <label className="search-field">
 <span>Ten khach san hoac dua diem</span>
 <input
 type="text"
 value={keyword}
 onChange={(event) => setKeyword(event.target.value)}
 placeholder="Vi du: Muong Thanh, Ha Noi..."
 />
 </label>

 <label className="search-field">
 <span>Thonh phi</span>
 <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
 <option value="all">Tat ca thanh phi</option>
 {cities.map((city) => (
 <option key={city} value={city}>
 {city}
 </option>
 ))}
 </select>
 </label>

 <div className="search-actions">
 <button className="btn-main" type="button" onClick={handleExploreHotels}>
 Xem tat ca khach san
 </button>
 <button
 className="btn-sub"
 type="button"
 onClick={() => {
 setKeyword("");
 setCityFilter("all");
 }}
 >
 Dat lai bo luc
 </button>
 </div>
 </form>
 </section>

 <section className="home-container home-highlights">
 <article className="highlight-card">
 <span className="highlight-icon">01</span>
 <h3>Tim kiem tuc thi</h3>
 <p>Loc nhanh theo ten, thanh phi va dua diem noi bat chi trong 1 o.</p>
 </article>

 <article className="highlight-card">
 <span className="highlight-icon">02</span>
 <h3>Thong tin minh bach</h3>
 <p>Hien the day ten, dua chi va hinh anh de ban ra quyet dinh de hon.</p>
 </article>

 <article className="highlight-card">
 <span className="highlight-icon">03</span>
 <h3>Toi uu mobile</h3>
 <p>Trai nghiem muot tren dien thoai, tablet va desktop voi layout linh hoat.</p>
 </article>
 </section>

 <section className="home-container home-news">
 <div className="section-header">
 <div>
 <p className="section-label">Tin tuc du lich</p>
 <h2>Cam hung va xu huong dat phong</h2>
 </div>
 <span className="result-count">{travelStories.length} bai noi bat</span>
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
 <p className="section-label">Gui y hom nay</p>
 <h2>Khach san noi bat</h2>
 </div>
 <span className="result-count">{filteredHotels.length} ket qua</span>
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
 Khong tim thay khach san phu hop. Hay the tu khoa khac.
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
 <p className="hotel-city">{hotel.city || "Da diem noi bat"}</p>
 <h3>{hotel.name || "Khach san dang cap nhet"}</h3>
 <p className="hotel-address">
 {hotel.address || "Da chi se duoc cap nhat som."}
 </p>
 <span className="hotel-link">Xem chi tiet</span>
 </div>
 </article>
 ))}
 </div>
 )}
 </section>
 </div>
 );
}

