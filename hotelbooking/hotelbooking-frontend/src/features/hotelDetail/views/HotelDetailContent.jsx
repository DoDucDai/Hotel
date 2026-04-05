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
 Quay lai
 </button>
 <span>
 Khach san / {hotel.city || "Viet Nam"} / {hotel.name || "Chi tiat"}
 </span>
 </div>

 <section className="detail-hero">
 <div className="hero-left">
 <p className="detail-city">{hotel.city || "Da diem noi bat"}</p>
 <h1>{hotel.name || "Khach san dang cap nhet"}</h1>
 <p className="detail-address">{hotel.address || "Dang cap nhet dua chi."}</p>

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
 <span>Thonh phi</span>
 <strong>{hotel.city || "-"}</strong>
 </li>
 <li>
 <span>Da chi</span>
 <strong>{hotel.address || "-"}</strong>
 </li>
 <li>
 <span>Hang sao</span>
 <strong>{hotel.starRating || 3} sao</strong>
 </li>
 <li>
 <span>Danh gia</span>
 <strong>
 {hotel.averageRating ? `${hotel.averageRating.toFixed(1)} / 5` : "Cha co"}
 </strong>
 </li>
 </ul>
 </article>

 <article className="info-card">
 <h2>Tien nghi phi bien</h2>
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
 <div className="inline-state">Dang toi danh sach phong...</div>
 ) : roomsError ? (
 <div className="inline-state error">{roomsError}</div>
 ) : rooms.length === 0 ? (
 <div className="inline-state">Cha co de lieu phong cho khach san nay.</div>
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
 alt={room.name || `Phong ${index + 1}`}
 onError={(event) => {
 event.currentTarget.onerror = null;
 event.currentTarget.src = FALLBACK_IMAGE;
 }}
 />
 </div>

 <div className="room-info">
 <h3>{room.name || `Phong ${index + 1}`}</h3>
 <p>
 {room.roomType || "STANDARD"} - {room.capacity || 1} khach -{" "}
 {room.totalUnits || 1} phong
 </p>
 <p>
 {room.bedType || "Cha khai bao loai giuong"}
 {room.availableUnits !== undefined ? ` - Con ${room.availableUnits} phong` : ""}
 {extractImageUrls(room).length ? ` - ${extractImageUrls(room).length} anh` : ""}
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
 Dt phong
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
 placeholder="Dieu gi khien ban an tuong v? ky luu tru nay?"
 />
 </label>

 <button type="submit" disabled={reviewSubmitting}>
 {reviewSubmitting ? "Dang gui..." : "Gui review"}
 </button>
 </form>
 ) : (
 <div className="inline-state">
 {hasToken
 ? "Ban c? the review sau khi ho n tat mot booking tai khach san nay."
 : "Dang nhap de luu yeu thich va gui review sau khi ket thuc booking."}
 </div>
 )}

 {reviewsLoading ? (
 <div className="inline-state">Dang toi review...</div>
 ) : reviews.length === 0 ? (
 <div className="inline-state">Cha co review nao cho khach san nay.</div>
 ) : (
 <div className="review-list">
 {reviews.map((review) => (
 <article key={review.id} className="review-card">
 <div className="review-head">
 <strong>{review.userName || "Nguoi dung"}</strong>
 <span>{formatReviewDate(review.createdAt)}</span>
 </div>
 <div className="review-rating">{review.rating}/5 sao</div>
 <p>{review.comment || "Khach hang danh gia tot v? trai nghiem luu tru."}</p>
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
 <h2>Gui y cho ban</h2>
 <span>{recommendations.length} khach san</span>
 </div>

 {recommendationsError ? (
 <div className="inline-state error">{recommendationsError}</div>
 ) : recommendations.length === 0 ? (
 <div className="inline-state">Cha co gui y phu hop cho khach san nay.</div>
 ) : (
 <div className="recommendation-grid">
 {recommendations.map((item) => (
 <article key={item.id} className="recommendation-card">
 <p>{item.city || "Viet Nam"}</p>
 <h3>{item.name || "Khach san"}</h3>
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
 <h3>{lowestPrice ? formatPrice(lowestPrice) : "Dang cap nhet"}</h3>
 <p className="booking-note">Gia co the thay doi theo thoi diem dat phong.</p>

 <a href={mapLink} target="_blank" rel="noreferrer">
 Xem vi tri tren ban do
 </a>

 <button type="button" onClick={handleReserve}>
 {hasToken ? "Dt phong ngay" : "Dang nhap de dat phong"}
 </button>
 </article>
 </aside>
 </section>
 </section>
 </main>
 );
}
