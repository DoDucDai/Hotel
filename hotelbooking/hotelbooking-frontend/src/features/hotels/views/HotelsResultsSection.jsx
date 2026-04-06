import { getPrimaryImage } from "../../../utils/imageHelpers";

export default function HotelsResultsSection({
 loading,
 error,
 filteredHotels,
 paginatedHotels,
 navigateToDetail,
 FALLBACK_IMAGE,
 handleWishlistToggle,
 wishlistLoading,
 currencyFormatter,
 currentPage,
 setCurrentPage,
 paginationPages,
 totalPages,
}) {
 return (
 <section className="hotels-container hotels-results">
 {loading ? (
 <div className="hotels-grid skeleton-grid">
 {Array.from({ length: 8 }).map((_, idx) => (
 <div key={idx} className="hotel-card skeleton-card" />
 ))}
 </div>
 ) : error ? (
 <div className="result-state error-state">{error}</div>
 ) : filteredHotels.length === 0 ? (
 <div className="result-state empty-state">
 Không tìm thấy khách sạn nào theo bộ lọc hiện tại.
 </div>
 ) : (
 <>
 <div className="hotels-grid">
 {paginatedHotels.map((hotel) => (
 <article
 key={hotel.hotelId}
 className="hotel-card"
 onClick={() => navigateToDetail(hotel)}
 onKeyDown={(event) => {
 if (event.key === "Enter" || event.key === " ") {
 event.preventDefault();
 navigateToDetail(hotel);
 }
 }}
 role="button"
 tabIndex={0}
 >
 <div className="hotel-image-wrap">
 <img
 src={getPrimaryImage(hotel, FALLBACK_IMAGE, { includeNameFallback: true })}
 alt={hotel.name || "Hotel image"}
 onError={(event) => {
 event.currentTarget.onerror = null;
 event.currentTarget.src = FALLBACK_IMAGE;
 }}
 />
 <button
 type="button"
 className={`wishlist-btn ${hotel.isWishlisted ? "active" : ""}`}
 onClick={(event) => handleWishlistToggle(hotel.hotelId, event)}
 disabled={wishlistLoading}
 aria-label={hotel.isWishlisted ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
 >
 {hotel.isWishlisted ? "Đã lưu" : "Lưu"}
 </button>
 </div>

 <div className="hotel-body">
 <div className="hotel-title-row">
 <p className="hotel-city">{hotel.city || "Địa điểm nổi bật"}</p>
 <span className="hotel-stars">{hotel.starRating || 3} sao</span>
 </div>

 <h3>{hotel.name || "Khách sạn đang cập nhật"}</h3>
 <p className="hotel-address">{hotel.address || "Địa chỉ đang được cập nhật"}</p>

 <div className="hotel-rating-row">
 <strong>{hotel.averageRating ? hotel.averageRating.toFixed(1) : "Mới"}</strong>
 <span>
 {hotel.reviewCount ? `${hotel.reviewCount} đánh giá` : "Chưa có đánh giá"}
 </span>
 </div>

 <div className="hotel-chip-row">
 {hotel.amenities.slice(0, 3).map((amenity) => (
 <span key={amenity} className="hotel-chip">
 {amenity}
 </span>
 ))}
 </div>

 <p className="hotel-meta">Phòng phù hợp: {hotel.availableRoomCount}</p>
 <p className="hotel-price">
 Giá từ{" "}
 <strong>
 {hotel.minRoomPrice ? currencyFormatter.format(hotel.minRoomPrice) : "Liên hệ"}
 </strong>
 </p>
 <span className="detail-link">Xem chi tiết</span>
 </div>
 </article>
 ))}
 </div>

 <div className="hotels-pagination">
 <button
 type="button"
 className="page-btn"
 onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
 disabled={currentPage === 1}
 >
 Trước
 </button>

 <div className="page-list">
 {paginationPages.map((page, index) => {
 const prevPage = paginationPages[index - 1];
 const showGap = prevPage && page - prevPage > 1;
 return (
 <span key={page} className="page-item-wrap">
 {showGap ? <span className="page-gap">...</span> : null}
 <button
 type="button"
 className={`page-btn page-number ${currentPage === page ? "active" : ""}`}
 onClick={() => setCurrentPage(page)}
 >
 {page}
 </button>
 </span>
 );
 })}
 </div>

 <button
 type="button"
 className="page-btn"
 onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
 disabled={currentPage >= totalPages}
 >
 Sau
 </button>
 </div>
 </>
 )}
 </section>
 );
}
