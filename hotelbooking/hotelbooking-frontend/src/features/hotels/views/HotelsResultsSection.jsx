import { getPrimaryImage } from "../../../utils/imageHelpers";
function getScoreMeta(rating) {
 if (rating >= 4.5) {
 return { label: "Tuyệt vời", className: "excellent" };
 }

 if (rating >= 4) {
 return { label: "Rất tốt", className: "great" };
 }

 if (rating >= 3) {
 return { label: "Tốt", className: "good" };
 }

 return { label: "Mới", className: "new" };
}

function getStarText(starRating) {
 const normalizedStars = Math.max(1, Math.min(5, Math.round(Number(starRating) || 0)));
 return "★".repeat(normalizedStars);
}

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
 filters,
 sortBy,
 setSortBy,
 setCurrentPageFromSort,
}) {
 return (
 <section className="hotels-results-panel">
 <header className="results-head">
 <div>
 <p className="results-kicker">Khách sạn nổi bật</p>
 <h2>
 {loading
 ? "Đang tải khách sạn..."
 : `${filteredHotels.length} khách sạn phù hợp với bạn`}
 </h2>
 <p className="results-copy">
 {filters.destination
 ? `Điểm đến đang xem: ${filters.destination}`
 : "Toàn bộ điểm đến đang mở bán trên hệ thống."}
 </p>
 </div>

 <label className="results-sort-field">
 <span>Sắp xếp</span>
 <select
 value={sortBy}
 onChange={(event) => {
 setSortBy(event.target.value);
 setCurrentPageFromSort(1);
 }}
 >
 <option value="name-asc">Tên A - Z</option>
 <option value="name-desc">Tên Z - A</option>
 <option value="city-asc">Thành phố A - Z</option>
 <option value="city-desc">Thành phố Z - A</option>
 <option value="price-asc">Giá thấp đến cao</option>
 <option value="price-desc">Giá cao đến thấp</option>
 <option value="rating-desc">Rating cao nhất</option>
 </select>
 </label>
 </header>

 {loading ? (
 <div className="hotels-list skeleton-list">
 {Array.from({ length: 8 }).map((_, idx) => (
 <div key={idx} className="hotel-list-card skeleton-card" />
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
 <div className="hotels-list">
 {paginatedHotels.map((hotel) => {
 const scoreMeta = getScoreMeta(hotel.averageRating || 0);
 return (
 <article
 key={hotel.hotelId}
 className="hotel-list-card"
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
 <div className="hotel-list-media">
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
 className={`hotel-save-btn ${hotel.isWishlisted ? "active" : ""}`}
 onClick={(event) => handleWishlistToggle(hotel.hotelId, event)}
 disabled={wishlistLoading}
 aria-label={hotel.isWishlisted ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
 >
 {hotel.isWishlisted ? "Đã lưu" : "Lưu"}
 </button>
 </div>

 <div className="hotel-list-content">
 <div className="hotel-list-top">
 <div>
 <p className="hotel-city">{hotel.city || "Địa điểm nổi bật"}</p>
 <h3>{hotel.name || "Khách sạn đang cập nhật"}</h3>
 <p className="hotel-star-line">{getStarText(hotel.starRating)} {hotel.starRating || 3} sao</p>
 <p className="hotel-address">{hotel.address || "Địa chỉ đang được cập nhật"}</p>
 </div>
 <div className={`hotel-score-chip ${scoreMeta.className}`}>
 <strong>{hotel.averageRating ? hotel.averageRating.toFixed(1) : "Mới"}</strong>
 <span>{scoreMeta.label}</span>
 </div>
 </div>

 <div className="hotel-chip-row">
 {hotel.amenities.slice(0, 4).map((amenity) => (
 <span key={amenity} className="hotel-chip">
 {amenity}
 </span>
 ))}
 {!hotel.amenities.length ? (
 <span className="hotel-chip muted">Đang cập nhật tiện nghi</span>
 ) : null}
 </div>

 <div className="hotel-list-facts">
 <span>{hotel.roomCount || 0} loại phòng</span>
 <span>{hotel.availableRoomCount} phòng phù hợp</span>
 <span>
 {hotel.reviewCount ? `${hotel.reviewCount} đánh giá` : "Chưa có đánh giá"}
 </span>
 </div>
 {Number(hotel.freeCancellationBeforeDays || 0) > 0 ? (
 <p className="hotel-policy-note">Có hủy miễn phí</p>
 ) : null}
 </div>

 <div className="hotel-list-aside">
 <div className="hotel-price-box">
 <span className="hotel-price-label">Giá trung bình mỗi đêm</span>
 <strong>
 {hotel.minRoomPrice ? currencyFormatter.format(hotel.minRoomPrice) : "Liên hệ"}
 </strong>
 <span className="hotel-room-label">
 {hotel.roomCount ? `${hotel.roomCount} loại phòng` : "Đang cập nhật loại phòng"}
 </span>
 <span className="hotel-meal-label">
 {Number(hotel.freeCancellationBeforeDays || 0) > 0 ? "Linh hoạt thay đổi" : "Xác nhận nhanh"}
 </span>
 <span className="detail-link">
 <span>Xem chi tiết</span>
 <i aria-hidden="true">›</i>
 </span>
 </div>
 </div>
 </article>
 );
 })}
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
