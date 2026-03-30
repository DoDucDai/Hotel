import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import { getMyBookings } from "../services/bookingService";
import { getHotelById, getHotelRecommendations } from "../services/hotelService";
import { getHotelReviews, createReview } from "../services/reviewService";
import { getRoomsByHotel } from "../services/roomService";
import { addToWishlist, getMyWishlist, removeFromWishlist } from "../services/wishlistService";
import "./HotelDetail.css";

const API_BASE_URL = "http://localhost:8080";

const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#174981" />
        <stop offset="100%" stop-color="#1f84cf" />
      </linearGradient>
    </defs>
    <rect width="1200" height="700" fill="url(#bg)" />
    <circle cx="220" cy="120" r="150" fill="rgba(255,255,255,0.12)" />
    <circle cx="1020" cy="120" r="180" fill="rgba(255,255,255,0.08)" />
    <path d="M150 500h900v130H150z" fill="rgba(255,255,255,0.16)" />
    <text x="120" y="390" fill="white" font-size="88" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Hotel Booking</text>
  </svg>`
)}`;

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function resolveHotelImage(hotel) {
  if (hotel?.imageUrl) {
    return hotel.imageUrl.startsWith("http")
      ? hotel.imageUrl
      : `${API_BASE_URL}${hotel.imageUrl}`;
  }

  if (hotel?.name) {
    return `${API_BASE_URL}/uploads/${encodeURIComponent(hotel.name)}.jpg`;
  }

  return FALLBACK_IMAGE;
}

function normalizeRooms(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  return [];
}

function normalizeHotels(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function normalizeReviews(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function normalizeWishlist(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function normalizeBookings(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  return [];
}

function formatPrice(price) {
  const numeric = Number(price);
  if (!Number.isFinite(numeric)) {
    return "Lien he";
  }
  return currencyFormatter.format(numeric);
}

function formatReviewDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("vi-VN");
}

function savePendingBooking(state) {
  try {
    sessionStorage.setItem("pendingBooking", JSON.stringify(state));
  } catch (error) {
    console.error("Cannot save pending booking", error);
  }
}

export default function HotelDetailEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const preloadedHotel = location.state?.hotel || null;
  const searchCriteria = location.state?.searchCriteria || {};

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
          setError("Khong the tai thong tin khach san. Vui long thu lai.");
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
          setRecommendationsError("Chua tai duoc danh sach goi y luc nay.");
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
          setRoomsError("Chua tai duoc du lieu phong. Vui long thu lai sau.");
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
          setWishlistIds(normalizeWishlist(wishlistRes?.data).map((item) => item.hotelId));
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
    const primary = resolveHotelImage(hotel);
    const byName = hotel?.name
      ? `${API_BASE_URL}/uploads/${encodeURIComponent(hotel.name)}.jpg`
      : FALLBACK_IMAGE;

    return [primary, byName, FALLBACK_IMAGE, primary].filter(
      (image, index, all) => Boolean(image) && all.indexOf(image) === index
    );
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
    const query = `${hotel?.name || ""} ${hotel?.address || ""}`.trim();
    if (!query) {
      return "https://www.google.com/maps";
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }, [hotel?.address, hotel?.name]);

  const hotelAmenities = useMemo(() => {
    if (Array.isArray(hotel?.amenities) && hotel.amenities.length) {
      return hotel.amenities;
    }

    return ["Wifi mien phi", "Le tan 24/7", "Bai do xe"];
  }, [hotel?.amenities]);

  const policyItems = useMemo(() => {
    return [
      `Nhan phong tu 14:00, tra phong truoc 12:00`,
      `Huy mien phi truoc ${hotel?.freeCancellationBeforeDays ?? 0} ngay`,
      `Neu huy muon, muc hoan tien con lai la ${hotel?.lateCancellationRefundRate ?? 0}%`,
      "Can xuat trinh giay to tuy than khi check-in",
      "Ho tro hoa don theo yeu cau",
    ];
  }, [hotel?.freeCancellationBeforeDays, hotel?.lateCancellationRefundRate]);

  const eligibleBooking = useMemo(() => {
    if (!hasToken || !rooms.length) {
      return null;
    }

    const roomIds = new Set(rooms.map((room) => room.id).filter(Boolean));
    const reviewedBookingIds = new Set(reviews.map((review) => review.bookingId).filter(Boolean));
    const today = new Date().toISOString().slice(0, 10);

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

  const isWishlisted = wishlistIds.includes(id);

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
        await removeFromWishlist(id);
        setWishlistIds((prev) => prev.filter((item) => item !== id));
        toast.success("Da bo khoi wishlist");
      } else {
        await addToWishlist(id);
        setWishlistIds((prev) => [...prev, id]);
        toast.success("Da them vao wishlist");
      }
    } catch (wishlistError) {
      console.error("Cannot update wishlist", wishlistError);
      toast.error("Khong the cap nhat wishlist");
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!eligibleBooking?.id) {
      toast.error("Ban can hoan tat it nhat 1 booking de danh gia");
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
      toast.success("Da gui danh gia thanh cong");
    } catch (reviewError) {
      console.error("Cannot create review", reviewError);
      toast.error(reviewError?.response?.data?.error || "Khong the gui danh gia");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="hotel-detail-page">
        <section className="detail-shell">
          <div className="detail-state">Dang tai thong tin khach san...</div>
        </section>
      </main>
    );
  }

  if (error || !hotel) {
    return (
      <main className="hotel-detail-page">
        <section className="detail-shell">
          <div className="detail-state error">
            {error || "Khong tim thay khach san nay."}
            <button type="button" onClick={() => navigate("/hotels")}>
              Quay lai danh sach
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="hotel-detail-page">
      <section className="detail-shell">
        <div className="detail-breadcrumb">
          <button type="button" onClick={() => navigate("/hotels")}>
            Quay lai
          </button>
          <span>
            Khach san / {hotel.city || "Viet Nam"} / {hotel.name || "Chi tiet"}
          </span>
        </div>

        <section className="detail-hero">
          <div className="hero-left">
            <p className="detail-city">{hotel.city || "Dia diem noi bat"}</p>
            <h1>{hotel.name || "Khach san dang cap nhat"}</h1>
            <p className="detail-address">{hotel.address || "Dang cap nhat dia chi."}</p>

            <div className="hero-tags">
              {hotelAmenities.slice(0, 4).map((amenity) => (
                <span key={amenity}>{amenity}</span>
              ))}
            </div>

            <div className="hero-actions">
              <button type="button" className="detail-secondary-btn" onClick={handleWishlistToggle}>
                {isWishlisted ? "Bo yeu thich" : "Them yeu thich"}
              </button>
            </div>
          </div>

          <article className="score-card">
            <strong>{hotel.averageRating ? hotel.averageRating.toFixed(1) : "Moi"}</strong>
            <span>Diem danh gia</span>
            <small>
              {hotel.reviewCount
                ? `${hotel.reviewCount} review, ${hotel.starRating || 3} sao`
                : `${hotel.starRating || 3} sao, chua co review`}
            </small>
          </article>
        </section>

        <section className="detail-gallery">
          <div className="gallery-main">
            <img
              src={selectedImage}
              alt={hotel.name || "Hotel"}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>

          <div className="gallery-thumbs">
            {galleryImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`thumb-btn ${selectedImage === image ? "active" : ""}`}
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image}
                  alt={`hotel-thumb-${index + 1}`}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
              </button>
            ))}
          </div>
        </section>

        <section className="detail-content">
          <div className="detail-main-col">
            <article className="info-card">
              <h2>Thong tin co ban</h2>
              <p>
                Khach san nam tai khu vuc thuan tien di chuyen, co bo tien nghi co ban va
                cho phep ban dat phong truc tiep tren he thong.
              </p>

              <ul className="info-list">
                <li>
                  <span>Thanh pho</span>
                  <strong>{hotel.city || "-"}</strong>
                </li>
                <li>
                  <span>Dia chi</span>
                  <strong>{hotel.address || "-"}</strong>
                </li>
                <li>
                  <span>Hang sao</span>
                  <strong>{hotel.starRating || 3} sao</strong>
                </li>
                <li>
                  <span>Danh gia</span>
                  <strong>
                    {hotel.averageRating ? `${hotel.averageRating.toFixed(1)} / 5` : "Chua co"}
                  </strong>
                </li>
              </ul>
            </article>

            <article className="info-card">
              <h2>Tien nghi pho bien</h2>
              <div className="amenity-grid">
                {hotelAmenities.map((amenity) => (
                  <span key={amenity}>{amenity}</span>
                ))}
              </div>
            </article>

            <article className="info-card">
              <div className="card-head">
                <h2>Danh sach phong</h2>
                <span>{rooms.length} phong</span>
              </div>

              {roomsLoading ? (
                <div className="inline-state">Dang tai danh sach phong...</div>
              ) : roomsError ? (
                <div className="inline-state error">{roomsError}</div>
              ) : rooms.length === 0 ? (
                <div className="inline-state">Chua co du lieu phong cho khach san nay.</div>
              ) : (
                <div className="room-list">
                  {rooms.map((room, index) => (
                    <article key={room.id || `${room.name}-${index}`} className="room-row">
                      <div>
                        <h3>{room.name || `Phong ${index + 1}`}</h3>
                        <p>
                          {room.roomType || "STANDARD"} - {room.capacity || 1} khach -{" "}
                          {room.totalUnits || 1} phong
                        </p>
                        <p>
                          {room.bedType || "Chua khai bao loai giuong"}
                          {room.availableUnits !== undefined
                            ? ` - Con ${room.availableUnits} phong`
                            : ""}
                        </p>
                        {room.description ? <p>{room.description}</p> : null}
                      </div>

                      <div className="room-price-block">
                        <div className="room-price">
                          <strong>{formatPrice(room.price)}</strong>
                          <span>/ dem</span>
                        </div>

                        <button
                          type="button"
                          className="room-book-btn"
                          onClick={() => handleBookRoom(room)}
                        >
                          Dat phong
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className="info-card">
              <div className="card-head">
                <h2>Review va rating</h2>
                <span>{reviews.length} review</span>
              </div>

              {hasToken && eligibleBooking ? (
                <form className="review-form" onSubmit={handleReviewSubmit}>
                  <label>
                    <span>Danh gia cua ban</span>
                    <select
                      value={selectedRating}
                      onChange={(event) => setSelectedRating(event.target.value)}
                    >
                      <option value="5">5 sao</option>
                      <option value="4">4 sao</option>
                      <option value="3">3 sao</option>
                      <option value="2">2 sao</option>
                      <option value="1">1 sao</option>
                    </select>
                  </label>

                  <label>
                    <span>Chia se trai nghiem</span>
                    <textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      placeholder="Dieu gi khien ban an tuong ve ky luu tru nay?"
                    />
                  </label>

                  <button type="submit" disabled={reviewSubmitting}>
                    {reviewSubmitting ? "Dang gui..." : "Gui review"}
                  </button>
                </form>
              ) : (
                <div className="inline-state">
                  {hasToken
                    ? "Ban co the review sau khi hoan tat mot booking tai khach san nay."
                    : "Dang nhap de luu yeu thich va gui review sau khi ket thuc booking."}
                </div>
              )}

              {reviewsLoading ? (
                <div className="inline-state">Dang tai review...</div>
              ) : reviews.length === 0 ? (
                <div className="inline-state">Chua co review nao cho khach san nay.</div>
              ) : (
                <div className="review-list">
                  {reviews.map((review) => (
                    <article key={review.id} className="review-card">
                      <div className="review-head">
                        <strong>{review.userName || "Nguoi dung"}</strong>
                        <span>{formatReviewDate(review.createdAt)}</span>
                      </div>
                      <div className="review-rating">{review.rating}/5 sao</div>
                      <p>{review.comment || "Khach hang danh gia tot ve trai nghiem luu tru."}</p>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className="info-card">
              <h2>Chinh sach luu tru</h2>
              <ul className="policy-list">
                {policyItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="info-card">
              <div className="card-head">
                <h2>Goi y cho ban</h2>
                <span>{recommendations.length} khach san</span>
              </div>

              {recommendationsError ? (
                <div className="inline-state error">{recommendationsError}</div>
              ) : recommendations.length === 0 ? (
                <div className="inline-state">Chua co goi y phu hop cho khach san nay.</div>
              ) : (
                <div className="recommendation-grid">
                  {recommendations.map((item) => (
                    <article key={item.id} className="recommendation-card">
                      <p>{item.city || "Viet Nam"}</p>
                      <h3>{item.name || "Khach san"}</h3>
                      <small>
                        {item.starRating || 3} sao
                        {item.averageRating
                          ? ` - ${Number(item.averageRating).toFixed(1)}/5`
                          : ""}
                      </small>
                      <button
                        type="button"
                        className="detail-secondary-btn"
                        onClick={() =>
                          navigate(`/hotels/${item.id}`, {
                            state: { hotel: item, searchCriteria },
                          })
                        }
                      >
                        Xem chi tiet
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </div>

          <aside className="detail-side-col">
            <article className="booking-card">
              <p className="booking-label">Gia tham khao tu</p>
              <h3>{lowestPrice ? formatPrice(lowestPrice) : "Dang cap nhat"}</h3>
              <p className="booking-note">Gia co the thay doi theo thoi diem dat phong.</p>

              <a href={mapLink} target="_blank" rel="noreferrer">
                Xem vi tri tren ban do
              </a>

              <button type="button" onClick={handleReserve}>
                {hasToken ? "Dat phong ngay" : "Dang nhap de dat phong"}
              </button>
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}
