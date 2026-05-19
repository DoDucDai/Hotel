import { extractImageUrls, getPrimaryImage } from "../../../utils/imageHelpers";

export default function HotelDetailContent({
 navigate,
 hotel,
 hotelAmenities,
 isWishlisted,
 handleWishlistToggle,
 galleryImages,
 selectedImage,
 setSelectedImage,
 FALLBACK_IMAGE,
 rooms,
 roomsLoading,
 roomsError,
 handleBookRoom,
 hasToken,
 eligibleBooking,
 handleReviewSubmit,
 selectedRating,
 setSelectedRating,
 reviewComment,
 setReviewComment,
 reviewSubmitting,
 reviewsLoading,
 reviews,
 formatReviewDate,
 policyItems,
 recommendationsError,
 recommendations,
 searchCriteria,
 lowestPrice,
 formatPrice,
 mapLink,
 handleReserve,
}) {
 return (
 <main className="hotel-detail-page">
 <section className="detail-shell">
 <div className="detail-breadcrumb">
 <button type="button" onClick={() => navigate("/hotels")}>
 Quay lại
 </button>
 <span>
 Khách sạn / {hotel.city || "Việt Nam"} / {hotel.name || "Chi tiết"}
 </span>
 </div>

 <section className="detail-hero">
 <div className="hero-left">
 <p className="detail-city">{hotel.city || "Địa điểm nổi bật"}</p>
 <h1>{hotel.name || "Khách sạn đang cập nhật"}</h1>
 <p className="detail-address">{hotel.address || "Đang cập nhật địa chỉ."}</p>

 <div className="hero-tags">
 {hotelAmenities.slice(0, 4).map((amenity) => (
 <span key={amenity}>{amenity}</span>
 ))}
 </div>

 <div className="hero-actions">
 <button type="button" className="detail-secondary-btn" onClick={handleWishlistToggle}>
 {isWishlisted ? "Bỏ yêu thích" : "Thêm yêu thích"}
 </button>
 </div>
 </div>

 <article className="score-card">
 <strong>{hotel.averageRating ? hotel.averageRating.toFixed(1) : "Mới"}</strong>
 <span>Điểm đánh giá</span>
 <small>
 {hotel.reviewCount
 ? `${hotel.reviewCount} review, ${hotel.starRating || 3} sao`
 : `${hotel.starRating || 3} sao, chưa có review`}
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
 <h2>Thông tin cơ bản</h2>
 <p>
 Khách sạn nằm tại khu vực thuận tiện di chuyển, có bộ tiện nghi cơ bản và
 cho phép bạn đặt phòng trực tiếp trên hệ thống.
 </p>

 <ul className="info-list">
 <li>
 <span>Thành phố</span>
 <strong>{hotel.city || "-"}</strong>
 </li>
 <li>
 <span>Địa chỉ</span>
 <strong>{hotel.address || "-"}</strong>
 </li>
 <li>
 <span>Hạng sao</span>
 <strong>{hotel.starRating || 3} sao</strong>
 </li>
 <li>
 <span>Đánh giá</span>
 <strong>
 {hotel.averageRating ? `${hotel.averageRating.toFixed(1)} / 5` : "Chưa có"}
 </strong>
 </li>
 </ul>
 </article>

 <article className="info-card">
 <h2>Tiện nghi phổ biến</h2>
 <div className="amenity-grid">
 {hotelAmenities.map((amenity) => (
 <span key={amenity}>{amenity}</span>
 ))}
 </div>
 </article>

 <article className="info-card">
 <div className="card-head">
 <h2>Danh sách phòng</h2>
 <span>{rooms.length} phòng</span>
 </div>

 {roomsLoading ? (
 <div className="inline-state">Đang tải danh sách phòng...</div>
 ) : roomsError ? (
 <div className="inline-state error">{roomsError}</div>
 ) : rooms.length === 0 ? (
 <div className="inline-state">Chưa có dữ liệu phòng cho khách sạn này.</div>
 ) : (
 <div className="room-list">
 {rooms.map((room, index) => (
 <article key={room.id || `${room.name}-${index}`} className="room-row">
 <div className="room-media">
 <img
 src={getPrimaryImage(
 room,
 getPrimaryImage(hotel, FALLBACK_IMAGE, {
 includeNameFallback: true,
 })
 )}
 alt={room.name || `Phòng ${index + 1}`}
 onError={(event) => {
 event.currentTarget.onerror = null;
 event.currentTarget.src = FALLBACK_IMAGE;
 }}
 />
 </div>

 <div className="room-info">
 <h3>{room.name || `Phòng ${index + 1}`}</h3>
 <p>
 {room.roomType || "STANDARD"} - {room.capacity || 1} khách -{" "}
 {room.totalUnits || 1} phòng
 </p>
 <p>
 {room.bedType || "Chưa khai báo loại giường"}
 {room.availableUnits !== undefined ? ` - Còn ${room.availableUnits} phòng` : ""}
 {extractImageUrls(room).length ? ` - ${extractImageUrls(room).length} ảnh` : ""}
 </p>
 {room.description ? <p>{room.description}</p> : null}
 </div>

 <div className="room-price-block">
 <div className="room-price">
 <strong>{formatPrice(room.price)}</strong>
 <span>/ đêm</span>
 </div>

 <button
 type="button"
 className="room-book-btn"
 onClick={() => handleBookRoom(room)}
 >
 Đặt phòng
 </button>
 </div>
 </article>
 ))}
 </div>
 )}
 </article>

 <article className="info-card">
 <div className="card-head">
 <h2>Review và rating</h2>
 <span>{reviews.length} review</span>
 </div>

 {hasToken && eligibleBooking ? (
 <form className="review-form" onSubmit={handleReviewSubmit}>
 <label>
 <span>Đánh giá của bạn</span>
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
 <span>Chia sẻ trải nghiệm</span>
 <textarea
 value={reviewComment}
 onChange={(event) => setReviewComment(event.target.value)}
 placeholder="Điều gì khiến bạn ấn tượng về kỳ lưu trú này?"
 />
 </label>

 <button type="submit" disabled={reviewSubmitting}>
 {reviewSubmitting ? "Đang gửi..." : "Gửi review"}
 </button>
 </form>
 ) : (
 <div className="inline-state">
 {hasToken
 ? "Bạn có thể review sau khi hoàn tất một booking tại khách sạn này."
 : "Đăng nhập để lưu yêu thích và gửi review sau khi kết thúc booking."}
 </div>
 )}

 {reviewsLoading ? (
 <div className="inline-state">Đang tải review...</div>
 ) : reviews.length === 0 ? (
 <div className="inline-state">Chưa có review nào cho khách sạn này.</div>
 ) : (
 <div className="review-list">
 {reviews.map((review) => (
 <article key={review.id} className="review-card">
 <div className="review-head">
 <strong>{review.userName || "Người dùng"}</strong>
 <span>{formatReviewDate(review.createdAt)}</span>
 </div>
 <div className="review-rating">{review.rating}/5 sao</div>
 <p>{review.comment || "Khách hàng đánh giá tốt về trải nghiệm lưu trú."}</p>
 </article>
 ))}
 </div>
 )}
 </article>

 <article className="info-card">
 <h2>Chính sách lưu trú</h2>
 <ul className="policy-list">
 {policyItems.map((item) => (
 <li key={item}>{item}</li>
 ))}
 </ul>
 </article>

 <article className="info-card">
 <div className="card-head">
 <h2>Gợi ý cho bạn</h2>
 <span>{recommendations.length} khách sạn</span>
 </div>

 {recommendationsError ? (
 <div className="inline-state error">{recommendationsError}</div>
 ) : recommendations.length === 0 ? (
 <div className="inline-state">Chưa có gợi ý phù hợp cho khách sạn này.</div>
 ) : (
 <div className="recommendation-grid">
 {recommendations.map((item) => (
 <article key={item.id} className="recommendation-card">
 <p>{item.city || "Việt Nam"}</p>
 <h3>{item.name || "Khách sạn"}</h3>
 <small>
 {item.starRating || 3} sao
 {item.averageRating ? ` - ${Number(item.averageRating).toFixed(1)}/5` : ""}
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
 Xem chi tiết
 </button>
 </article>
 ))}
 </div>
 )}
 </article>
 </div>

 <aside className="detail-side-col">
 <article className="booking-card">
 <p className="booking-label">Giá tham khảo từ</p>
 <h3>{lowestPrice ? formatPrice(lowestPrice) : "Đang cập nhật"}</h3>
 <p className="booking-note">Giá có thể thay đổi theo thời điểm đặt phòng.</p>

 <a href={mapLink} target="_blank" rel="noreferrer">
 Xem vị trí trên bản đồ
 </a>

 <button type="button" onClick={handleReserve}>
 {hasToken ? "Đặt phòng ngay" : "Đăng nhập để đặt phòng"}
 </button>
 </article>
 </aside>
 </section>
 </section>
 </main>
 );
}
