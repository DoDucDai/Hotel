export default function HotelsHeroSection({
 totalHotels,
 filteredHotelsCount,
 filters,
 handleFilterChange,
 resetFilters,
 availabilityLoading,
}) {
 const destinationLabel = filters.destination?.trim() || "";
 const hasDestination = Boolean(destinationLabel);
 const pageTitle = hasDestination ? `Khách sạn tại ${destinationLabel}` : "Danh sách khách sạn";
 const pageDescription = availabilityLoading
 ? "Đang cập nhật số lượng phòng khả dụng theo bộ lọc hiện tại."
 : hasDestination
 ? `${filteredHotelsCount} lựa chọn phù hợp cho điểm đến ${destinationLabel} trong tổng số ${totalHotels} khách sạn đang mở bán.`
 : `${filteredHotelsCount} lựa chọn phù hợp trong tổng số ${totalHotels} khách sạn đang mở bán trên hệ thống.`;

 return (
 <section className="hotels-container hotels-search-shell">
 <p className="hotels-breadcrumbs">
 {hasDestination ? `Trang chủ / Khách sạn / ${destinationLabel}` : "Trang chủ / Khách sạn"}
 </p>

 <div className="hotels-page-head">
 <div className="hotels-page-copy">
 <p className="page-overline">Tìm kiếm khách sạn</p>
 <h1>{pageTitle}</h1>
 <p>{pageDescription}</p>
 </div>

 <div className="page-head-chip">
 <strong>{filteredHotelsCount}</strong>
 <span>khách sạn phù hợp</span>
 </div>
 </div>

 <div className="hotels-search-strip">
 <div className="hotels-search-top">
 <label className="search-field search-field-wide">
 <span>Điểm đến</span>
 <input
 name="destination"
 type="text"
 value={filters.destination}
 onChange={handleFilterChange}
 placeholder="Tên khách sạn, thành phố hoặc địa chỉ"
 />
 </label>

 <label className="search-field">
 <span>Nhận phòng</span>
 <input
 name="checkIn"
 type="date"
 value={filters.checkIn}
 onChange={handleFilterChange}
 />
 </label>

 <label className="search-field">
 <span>Trả phòng</span>
 <input
 name="checkOut"
 type="date"
 value={filters.checkOut}
 onChange={handleFilterChange}
 />
 </label>

 <label className="search-field search-field-compact">
 <span>Khách</span>
 <input
 name="guests"
 type="number"
 min="1"
 value={filters.guests}
 onChange={handleFilterChange}
 />
 </label>

 <label className="search-field search-field-compact">
 <span>Phòng</span>
 <input
 name="roomCount"
 type="number"
 min="1"
 value={filters.roomCount}
 onChange={handleFilterChange}
 />
 </label>

 <button type="button" className="search-strip-reset" onClick={resetFilters}>
 Đặt lại
 </button>
 </div>
 </div>

 <div className="hotels-search-bottom">
 <div className="search-summary">
 <strong>
 {availabilityLoading
 ? "Đang cập nhật phòng khả dụng..."
 : `${filteredHotelsCount} khách sạn phù hợp`}
 </strong>
 <span>
 {hasDestination
 ? `Điểm đến đang xem: ${destinationLabel}`
 : "Đang hiển thị toàn bộ khách sạn trong hệ thống"}
 </span>
 </div>
 <p className="search-strip-note">
 Lọc tự động theo lịch ở, mức giá, hạng sao, tiện nghi và wishlist của bạn.
 </p>
 </div>
 </section>
 );
}
