import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import {
 DEFAULT_HOTELS_PAGE_SIZE,
 getHotels,
} from "../services/hotelService";
import { searchRooms } from "../services/roomService";
import {
 addToWishlist,
 getMyWishlist,
 removeFromWishlist,
} from "../services/wishlistService";
import HotelsHeroSection from "../features/hotels/views/HotelsHeroSection";
import HotelsResultsSection from "../features/hotels/views/HotelsResultsSection";
import HotelsToolbarSection from "../features/hotels/views/HotelsToolbarSection";
import {
 buildInitialHotelFilters,
 currencyFormatter,
 FALLBACK_IMAGE,
 normalizeHotels,
 normalizeWishlist,
 toNonNegativeNumber,
 toPositiveInt,
} from "../features/hotels/hotelsPageUtils";
import "./Hotels.css";

function toApiSort(sortBy) {
 const normalized = String(sortBy || "").trim().toLowerCase();

 if (normalized === "name-desc") {
 return "name_desc";
 }

 if (normalized === "city-asc") {
 return "city_asc";
 }

 if (normalized === "city-desc") {
 return "city_desc";
 }

 if (normalized === "price-asc") {
 return "price_asc";
 }

 if (normalized === "price-desc") {
 return "price_desc";
 }

 if (normalized === "rating-desc") {
 return "rating_desc";
 }

 return "name_asc";
}

export default function Hotels() {
 const navigate = useNavigate();
 const location = useLocation();
 const toast = useToast();
 const isLoggedIn = Boolean(localStorage.getItem("accessToken"));

 const [hotels, setHotels] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [sortBy, setSortBy] = useState("name-asc");
 const [totalPages, setTotalPages] = useState(1);
 const [totalElements, setTotalElements] = useState(0);

 const [filters, setFilters] = useState(() => {
 const prefill = location.state?.prefillFilters || {};
 return buildInitialHotelFilters(prefill);
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

 const catalogParams = useMemo(() => {
 const normalizedDestination = filters.destination.trim();
 const minPrice = toNonNegativeNumber(filters.priceMin);
 const maxPrice = toNonNegativeNumber(filters.priceMax);
 const minRating = Number(filters.minRating || 0);
 const minStars = Number(filters.minStars || 0);

 return {
 page: Math.max(currentPage - 1, 0),
 size: DEFAULT_HOTELS_PAGE_SIZE,
 destination: normalizedDestination || undefined,
 minPrice: minPrice == null ? undefined : minPrice,
 maxPrice: maxPrice == null ? undefined : maxPrice,
 minRating: minRating > 0 ? minRating : undefined,
 minStars: minStars > 0 ? minStars : undefined,
 amenity: filters.amenity === "all" ? undefined : filters.amenity,
 freeCancellation: filters.freeCancellationOnly ? true : undefined,
 sortBy: toApiSort(sortBy),
 };
 }, [
 currentPage,
 filters.amenity,
 filters.destination,
 filters.freeCancellationOnly,
 filters.minRating,
 filters.minStars,
 filters.priceMax,
 filters.priceMin,
 sortBy,
 ]);

 useEffect(() => {
 let isMounted = true;
 const timeoutId = setTimeout(async () => {
 try {
 setLoading(true);
 const hotelsRes = await getHotels(catalogParams);
 const payload = hotelsRes?.data || {};
 const hotelList = normalizeHotels(payload);

 if (!isMounted) {
 return;
 }

 const nextTotalPagesRaw = Number(payload.totalPages || 0);
 const nextTotalPages = Math.max(nextTotalPagesRaw, 1);
 setHotels(hotelList);
 setTotalPages(nextTotalPages);
 setTotalElements(Number(payload.totalElements || 0));
 setError("");
 } catch (fetchError) {
 console.error(fetchError);
 if (isMounted) {
 setHotels([]);
 setTotalPages(1);
 setTotalElements(0);
 setError("Không thể tải danh sách khách sạn. Vui lòng thử lại sau.");
 }
 } finally {
 if (isMounted) {
 setLoading(false);
 }
 }
 }, 220);

 return () => {
 isMounted = false;
 clearTimeout(timeoutId);
 };
 }, [catalogParams]);

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
 setWishlistIds(items.map((item) => String(item?.hotelId || "")).filter(Boolean));
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
 setAvailabilityError("");
 return;
 }

 const guests = toPositiveInt(filters.guests, 1);
 const roomNeed = toPositiveInt(filters.roomCount, 1);
 const checkIn = filters.checkIn || "";
 const checkOut = filters.checkOut || "";
 const minPrice = filters.priceMin === "" ? "" : Number(filters.priceMin);
 const maxPrice = filters.priceMax === "" ? "" : Number(filters.priceMax);
 const amenity = filters.amenity === "all" ? "" : filters.amenity;
 const shouldCheckAvailability =
 guests > 1 ||
 roomNeed > 1 ||
 Boolean(checkIn) ||
 Boolean(checkOut);

 if (!shouldCheckAvailability) {
 setRoomAvailability({});
 setAvailabilityError("");
 return;
 }

 if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
 setRoomAvailability({});
 setAvailabilityError("Ngày trả phòng phải sau ngày nhận phòng.");
 return;
 }

 try {
 setAvailabilityLoading(true);
 const res = await searchRooms({
 guests,
 checkIn,
 checkOut,
 minPrice,
 maxPrice,
 amenity,
 sortBy: "availability_desc",
 });
 const availableRooms = Array.isArray(res?.data) ? res.data : [];

 if (isMounted) {
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

 setRoomAvailability(countByHotel);
 setAvailabilityError("");
 }
 } catch (fetchError) {
 console.error(fetchError);
 if (isMounted) {
 setRoomAvailability({});
 setAvailabilityError("Chưa tải được dữ liệu phòng theo bộ lọc hiện tại.");
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
 }, [
 filters.amenity,
 filters.checkIn,
 filters.checkOut,
 filters.guests,
 filters.priceMax,
 filters.priceMin,
 filters.roomCount,
 hotels,
 ]);

 const hotelCards = useMemo(() => {
 return hotels.map((hotel, index) => {
 const hotelId = String(hotel.id || hotel._id || `${hotel.name}-${index}`);

 return {
 ...hotel,
 hotelId,
 starRating: Number(hotel.starRating || 3),
 averageRating: Number(hotel.averageRating || 0),
 reviewCount: Number(hotel.reviewCount || 0),
 amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
 roomCount: Number(hotel.roomCount || 0),
 minRoomPrice: Number(hotel.minRoomPrice || 0),
 availableRoomCount: roomAvailability[hotelId] || 0,
 isWishlisted: wishlistIds.includes(hotelId),
 };
 });
 }, [hotels, roomAvailability, wishlistIds]);

 const amenityOptions = useMemo(() => {
 const uniqueAmenities = new Set();
 hotelCards.forEach((hotel) => {
 hotel.amenities.forEach((amenity) => uniqueAmenities.add(amenity));
 });

 if (filters.amenity !== "all") {
 uniqueAmenities.add(filters.amenity);
 }

 return [...uniqueAmenities].sort((a, b) => a.localeCompare(b, "vi"));
 }, [filters.amenity, hotelCards]);

 const needsClientAvailabilityFilter = useMemo(() => {
 const guests = toPositiveInt(filters.guests, 1);
 const roomNeed = toPositiveInt(filters.roomCount, 1);
 return guests > 1 || roomNeed > 1 || Boolean(filters.checkIn) || Boolean(filters.checkOut);
 }, [filters.checkIn, filters.checkOut, filters.guests, filters.roomCount]);

 const filteredHotels = useMemo(() => {
 const roomNeed = toPositiveInt(filters.roomCount, 1);

 return hotelCards.filter((hotel) => {
 const roomMatch = !needsClientAvailabilityFilter || hotel.availableRoomCount >= roomNeed;
 const wishlistMatch = !filters.wishlistOnly || hotel.isWishlisted;
 return roomMatch && wishlistMatch;
 });
 }, [filters.roomCount, filters.wishlistOnly, hotelCards, needsClientAvailabilityFilter]);

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

 const totalHotels = totalElements;
 const filteredHotelsCount =
 filters.wishlistOnly || needsClientAvailabilityFilter
 ? filteredHotels.length
 : totalElements;

 const handleFilterChange = (event) => {
 const { name, value, type, checked } = event.target;
 setFilters((prev) => ({
 ...prev,
 [name]: type === "checkbox" ? checked : value,
 }));
 setCurrentPage(1);
 };

 const resetFilters = () => {
 setFilters(buildInitialHotelFilters());
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

 const normalizedHotelId = String(hotelId || "");
 const alreadySaved = wishlistIds.includes(normalizedHotelId);

 try {
 if (alreadySaved) {
 await removeFromWishlist(normalizedHotelId);
 setWishlistIds((prev) => prev.filter((id) => id !== normalizedHotelId));
 toast.success("Đã xóa khỏi danh sách yêu thích");
 } else {
 await addToWishlist(normalizedHotelId);
 setWishlistIds((prev) => [...prev, normalizedHotelId]);
 toast.success("Đã thêm vào danh sách yêu thích");
 }
 } catch (wishlistError) {
 console.error("Cannot update wishlist", wishlistError);
 toast.error("Không thể cập nhật danh sách yêu thích");
 }
 };

 const navigateToDetail = (hotel) => {
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
 };

 return (
 <main className="hotels-page">
 <HotelsHeroSection
 totalHotels={totalHotels}
 filteredHotelsCount={filteredHotelsCount}
 filters={filters}
 handleFilterChange={handleFilterChange}
 resetFilters={resetFilters}
 availabilityLoading={availabilityLoading}
 />

 <section className="hotels-container hotels-catalog-layout">
 <HotelsToolbarSection
 filters={filters}
 handleFilterChange={handleFilterChange}
 amenityOptions={amenityOptions}
 isLoggedIn={isLoggedIn}
 resetFilters={resetFilters}
 availabilityError={availabilityError}
 />

 <HotelsResultsSection
 loading={loading}
 error={error}
 filteredHotels={filteredHotels}
 paginatedHotels={filteredHotels}
 navigateToDetail={navigateToDetail}
 FALLBACK_IMAGE={FALLBACK_IMAGE}
 handleWishlistToggle={handleWishlistToggle}
 wishlistLoading={wishlistLoading}
 currencyFormatter={currencyFormatter}
 currentPage={currentPage}
 setCurrentPage={setCurrentPage}
 paginationPages={paginationPages}
 totalPages={totalPages}
 filters={filters}
 sortBy={sortBy}
 setSortBy={setSortBy}
 setCurrentPageFromSort={setCurrentPage}
 />
 </section>
 </main>
 );
}