import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import { getHotels } from "../services/hotelService";
import { getRooms, searchRooms } from "../services/roomService";
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
 HOTELS_PER_PAGE,
 normalizeHotels,
 normalizeRooms,
 normalizeWishlist,
 toNonNegativeNumber,
 toPositiveInt,
} from "../features/hotels/hotelsPageUtils";
import "./Hotels.css";

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
 return;
 }

 const guests = toPositiveInt(filters.guests, 1);
 const checkIn = filters.checkIn || "";
 const checkOut = filters.checkOut || "";
 const minPrice = filters.priceMin === "" ? "" : Number(filters.priceMin);
 const maxPrice = filters.priceMax === "" ? "" : Number(filters.priceMax);
 const amenity = filters.amenity === "all" ? "" : filters.amenity;

 if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
 setRoomAvailability({});
 setAvailabilityError("Ng y tra phong phai sau ngay nhan phong.");
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
 }, [
 filters.amenity,
 filters.checkIn,
 filters.checkOut,
 filters.guests,
 filters.priceMax,
 filters.priceMin,
 hotels.length,
 ]);

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
 const hotelId = String(hotel.id || hotel._id || `${hotel.name}-${index}`);
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
 const freeCancellationOnly = Boolean(filters.freeCancellationOnly);

 const matched = hotelCards.filter((hotel) => {
 const name = hotel.name?.toLowerCase() || "";
 const city = hotel.city?.toLowerCase() || "";
 const address = hotel.address?.toLowerCase() || "";

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
 const freeCancellationMatch =
 !freeCancellationOnly || Number(hotel.freeCancellationBeforeDays || 0) > 0;
 const wishlistMatch = !filters.wishlistOnly || hotel.isWishlisted;
 const minPriceMatch = priceMin == null || hotel.minRoomPrice >= priceMin;
 const maxPriceMatch = priceMax == null || hotel.minRoomPrice <= priceMax;

 return (
 textMatch &&
 roomMatch &&
 ratingMatch &&
 starsMatch &&
 amenityMatch &&
 freeCancellationMatch &&
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
 toast.success("Da xoa khoi danh sach yeu thich");
 } else {
 await addToWishlist(normalizedHotelId);
 setWishlistIds((prev) => [...prev, normalizedHotelId]);
 toast.success("Da them vao wishlist");
 }
 } catch (wishlistError) {
 console.error("Cannot update wishlist", wishlistError);
 toast.error("Khong the cap nhat wishlist");
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
 totalCities={totalCities}
 topRatedCount={topRatedCount}
 />

 <HotelsToolbarSection
 filters={filters}
 sortBy={sortBy}
 handleFilterChange={handleFilterChange}
 setSortBy={setSortBy}
 setCurrentPage={setCurrentPage}
 amenityOptions={amenityOptions}
 isLoggedIn={isLoggedIn}
 availabilityLoading={availabilityLoading}
 filteredHotelsCount={filteredHotels.length}
 resetFilters={resetFilters}
 availabilityError={availabilityError}
 />

 <HotelsResultsSection
 loading={loading}
 error={error}
 filteredHotels={filteredHotels}
 paginatedHotels={paginatedHotels}
 navigateToDetail={navigateToDetail}
 FALLBACK_IMAGE={FALLBACK_IMAGE}
 handleWishlistToggle={handleWishlistToggle}
 wishlistLoading={wishlistLoading}
 currencyFormatter={currencyFormatter}
 currentPage={currentPage}
 setCurrentPage={setCurrentPage}
 paginationPages={paginationPages}
 totalPages={totalPages}
 />
 </main>
 );
}
