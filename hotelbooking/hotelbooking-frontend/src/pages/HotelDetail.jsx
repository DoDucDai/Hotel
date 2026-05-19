import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import { getMyBookings } from "../services/bookingService";
import { getHotelById, getHotelRecommendations } from "../services/hotelService";
import { createReview, getHotelReviews } from "../services/reviewService";
import { getRoomsByHotel } from "../services/roomService";
import {
 buildGoogleMapsSearchUrl,
 normalizeWishlistHotelIds,
 resolveHotelDetailState,
} from "../features/hotelDetail/hotelDetailUtils";
import {
 FALLBACK_IMAGE,
 formatPrice,
 formatReviewDate,
 normalizeBookings,
 normalizeHotels,
 normalizeReviews,
 normalizeRooms,
 savePendingBooking,
} from "../features/hotelDetail/hotelDetailPageUtils";
import HotelDetailContent from "../features/hotelDetail/views/HotelDetailContent";
import { extractImageUrls } from "../utils/imageHelpers";
import {
 addToWishlist,
 getMyWishlist,
 removeFromWishlist,
} from "../services/wishlistService";
import { formatDateInputLocal } from "../utils/dateInput";
import "./HotelDetail.css";

export default function HotelDetail() {
 const { id } = useParams();
 const navigate = useNavigate();
 const location = useLocation();
 const toast = useToast();
 const { preloadedHotel, searchCriteria } = useMemo(
 () => resolveHotelDetailState(location.state),
 [location.state]
 );

 const [hotel, setHotel] = useState(preloadedHotel);
 const [rooms, setRooms] = useState([]);
 const [reviews, setReviews] = useState([]);
 const [recommendations, setRecommendations] = useState([]);
 const [myBookings, setMyBookings] = useState([]);
 const [loading, setLoading] = useState(!preloadedHotel);
 const [roomsLoading, setRoomsLoading] = useState(true);
 const [reviewsLoading, setReviewsLoading] = useState(true);
 const [error, setError] = useState("");
 const [roomsError, setRoomsError] = useState("");
 const [recommendationsError, setRecommendationsError] = useState("");
 const [selectedImage, setSelectedImage] = useState(FALLBACK_IMAGE);
 const [selectedRating, setSelectedRating] = useState("5");
 const [reviewComment, setReviewComment] = useState("");
 const [reviewSubmitting, setReviewSubmitting] = useState(false);
 const [wishlistIds, setWishlistIds] = useState([]);

 const hasToken = Boolean(localStorage.getItem("accessToken"));
 const hotelId = String(id || "");

 useEffect(() => {
 let isMounted = true;

 const fetchHotel = async () => {
 try {
 setLoading(true);
 setError("");

 const res = await getHotelById(id);
 if (isMounted) {
 setHotel(res?.data || null);
 }
 } catch (fetchError) {
 console.error("Cannot load hotel detail", fetchError);
 if (isMounted) {
 setError("Không thể tải thông tin khách sạn. Vui lòng thử lại.");
 }
 } finally {
 if (isMounted) {
 setLoading(false);
 }
 }
 };

 fetchHotel();

 return () => {
 isMounted = false;
 };
 }, [id]);

 useEffect(() => {
 let isMounted = true;

 const fetchRecommendations = async () => {
 try {
 const res = await getHotelRecommendations(id, 4);
 if (isMounted) {
 setRecommendations(normalizeHotels(res?.data));
 setRecommendationsError("");
 }
 } catch (fetchError) {
 console.error("Cannot load recommendations", fetchError);
 if (isMounted) {
 setRecommendations([]);
 setRecommendationsError("Chưa tải được danh sách gợi ý lúc này.");
 }
 }
 };

 fetchRecommendations();

 return () => {
 isMounted = false;
 };
 }, [id]);

 useEffect(() => {
 let isMounted = true;

 const fetchRooms = async () => {
 try {
 setRoomsLoading(true);
 setRoomsError("");
 const res = await getRoomsByHotel(id);
 if (isMounted) {
 setRooms(normalizeRooms(res?.data));
 }
 } catch (fetchError) {
 console.error("Cannot load rooms", fetchError);
 if (isMounted) {
 setRooms([]);
 setRoomsError("Chưa tải được dữ liệu phòng. Vui lòng thử lại sau.");
 }
 } finally {
 if (isMounted) {
 setRoomsLoading(false);
 }
 }
 };

 fetchRooms();

 return () => {
 isMounted = false;
 };
 }, [id]);

 useEffect(() => {
 let isMounted = true;

 const fetchReviewsAndUserData = async () => {
 try {
 setReviewsLoading(true);

 const reviewPromise = getHotelReviews(id);
 const bookingPromise = hasToken ? getMyBookings() : Promise.resolve(null);
 const wishlistPromise = hasToken ? getMyWishlist() : Promise.resolve(null);

 const [reviewsRes, bookingsRes, wishlistRes] = await Promise.all([
 reviewPromise,
 bookingPromise,
 wishlistPromise,
 ]);

 if (isMounted) {
 setReviews(normalizeReviews(reviewsRes?.data));
 setMyBookings(normalizeBookings(bookingsRes?.data));
 setWishlistIds(normalizeWishlistHotelIds(wishlistRes?.data));
 }
 } catch (fetchError) {
 console.error("Cannot load review data", fetchError);
 if (isMounted) {
 setReviews([]);
 setMyBookings([]);
 }
 } finally {
 if (isMounted) {
 setReviewsLoading(false);
 }
 }
 };

 fetchReviewsAndUserData();

 return () => {
 isMounted = false;
 };
 }, [hasToken, id]);

 const galleryImages = useMemo(() => {
 const images = extractImageUrls(hotel, { includeNameFallback: true });
 return images.length ? images : [FALLBACK_IMAGE];
 }, [hotel]);

 useEffect(() => {
 setSelectedImage(galleryImages[0] || FALLBACK_IMAGE);
 }, [galleryImages]);

 const lowestPrice = useMemo(() => {
 const prices = rooms
 .map((room) => Number(room.price))
 .filter((price) => Number.isFinite(price));

 if (!prices.length) {
 return null;
 }

 return Math.min(...prices);
 }, [rooms]);

 const mapLink = useMemo(() => {
 return buildGoogleMapsSearchUrl(hotel);
 }, [hotel]);

 const hotelAmenities = useMemo(() => {
 if (Array.isArray(hotel?.amenities) && hotel.amenities.length) {
 return hotel.amenities;
 }

 return ["Wifi miễn phí", "Lễ tân 24/7", "Bãi đỗ xe"];
 }, [hotel?.amenities]);

 const policyItems = useMemo(() => {
 return [
 `Nhận phòng từ 14:00, trả phòng trước 12:00`,
 `Hủy miễn phí trước ${hotel?.freeCancellationBeforeDays ?? 0} ngày`,
 `Nếu hủy muộn, mức hoàn tiền còn lại là ${hotel?.lateCancellationRefundRate ?? 0}%`,
 "Cần xuất trình giấy tờ tùy thân khi check-in",
 "Hỗ trợ hóa đơn theo yêu cầu",
 ];
 }, [hotel?.freeCancellationBeforeDays, hotel?.lateCancellationRefundRate]);

 const eligibleBooking = useMemo(() => {
 if (!hasToken || !rooms.length) {
 return null;
 }

 const roomIds = new Set(rooms.map((room) => room.id).filter(Boolean));
 const reviewedBookingIds = new Set(reviews.map((review) => review.bookingId).filter(Boolean));
 const today = formatDateInputLocal(new Date());

 return myBookings.find((booking) => {
 if (!roomIds.has(booking.roomId)) {
 return false;
 }

 if (booking.status === "CANCELLED") {
 return false;
 }

 if (!booking.checkOutDate || booking.checkOutDate > today) {
 return false;
 }

 return !reviewedBookingIds.has(booking.id);
 });
 }, [hasToken, myBookings, reviews, rooms]);

 const isWishlisted = wishlistIds.includes(hotelId);

 const handleBookRoom = (room) => {
 const bookingState = {
 hotel,
 room,
 searchCriteria,
 };

 if (!room?.id) {
 return;
 }

 if (!hasToken) {
 savePendingBooking(bookingState);
 navigate("/login", {
 state: {
 from: `/hotels/${id}`,
 redirectTo: "/booking",
 redirectState: bookingState,
 },
 });
 return;
 }

 navigate("/booking", { state: bookingState });
 };

 const handleReserve = () => {
 if (!rooms.length) {
 navigate("/hotels");
 return;
 }

 handleBookRoom(rooms[0]);
 };

 const handleWishlistToggle = async () => {
 if (!hasToken) {
 navigate("/login", {
 state: {
 from: `/hotels/${id}`,
 redirectTo: `/hotels/${id}`,
 },
 });
 return;
 }

 try {
 if (isWishlisted) {
 await removeFromWishlist(hotelId);
 setWishlistIds((prev) => prev.filter((item) => item !== hotelId));
 toast.success("Đã bỏ khỏi wishlist");
 } else {
 await addToWishlist(hotelId);
 setWishlistIds((prev) => (prev.includes(hotelId) ? prev : [...prev, hotelId]));
 toast.success("Đã thêm vào wishlist");
 }
 } catch (wishlistError) {
 console.error("Cannot update wishlist", wishlistError);
 toast.error("Không thể cập nhật wishlist");
 }
 };

 const handleReviewSubmit = async (event) => {
 event.preventDefault();

 if (!eligibleBooking?.id) {
 toast.error("Bạn cần hoàn tất ít nhất 1 booking để đánh giá");
 return;
 }

 try {
 setReviewSubmitting(true);
 await createReview({
 bookingId: eligibleBooking.id,
 rating: Number(selectedRating),
 comment: reviewComment.trim(),
 });

 const [hotelRes, reviewsRes] = await Promise.all([
 getHotelById(id),
 getHotelReviews(id),
 ]);

 setHotel(hotelRes?.data || hotel);
 setReviews(normalizeReviews(reviewsRes?.data));
 setReviewComment("");
 setSelectedRating("5");
 toast.success("Đã gửi đánh giá thành công");
 } catch (reviewError) {
 console.error("Cannot create review", reviewError);
 toast.error(reviewError?.response?.data?.error || "Không thể gửi đánh giá");
 } finally {
 setReviewSubmitting(false);
 }
 };

 if (loading) {
 return (
 <main className="hotel-detail-page">
 <section className="detail-shell">
 <div className="detail-state">Đang tải thông tin khách sạn...</div>
 </section>
 </main>
 );
 }

 if (error || !hotel) {
 return (
 <main className="hotel-detail-page">
 <section className="detail-shell">
 <div className="detail-state error">
 {error || "Không tìm thấy khách sạn này."}
 <button type="button" onClick={() => navigate("/hotels")}>
 Quay lại danh sách
 </button>
 </div>
 </section>
 </main>
 );
 }

 return (
 <HotelDetailContent
 navigate={navigate}
 hotel={hotel}
 hotelAmenities={hotelAmenities}
 isWishlisted={isWishlisted}
 handleWishlistToggle={handleWishlistToggle}
 galleryImages={galleryImages}
 selectedImage={selectedImage}
 setSelectedImage={setSelectedImage}
 FALLBACK_IMAGE={FALLBACK_IMAGE}
 rooms={rooms}
 roomsLoading={roomsLoading}
 roomsError={roomsError}
 handleBookRoom={handleBookRoom}
 hasToken={hasToken}
 eligibleBooking={eligibleBooking}
 handleReviewSubmit={handleReviewSubmit}
 selectedRating={selectedRating}
 setSelectedRating={setSelectedRating}
 reviewComment={reviewComment}
 setReviewComment={setReviewComment}
 reviewSubmitting={reviewSubmitting}
 reviewsLoading={reviewsLoading}
 reviews={reviews}
 formatReviewDate={formatReviewDate}
 policyItems={policyItems}
 recommendationsError={recommendationsError}
 recommendations={recommendations}
 searchCriteria={searchCriteria}
 lowestPrice={lowestPrice}
 formatPrice={formatPrice}
 mapLink={mapLink}
 handleReserve={handleReserve}
 />
 );
}
