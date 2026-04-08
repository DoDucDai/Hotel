export default function HotelsToolbarSection({
 filters,
 handleFilterChange,
 amenityOptions,
 isLoggedIn,
 resetFilters,
 availabilityError,
}) {
 const activeFilters = [
 filters.priceMin,
 filters.priceMax,
 Number(filters.minRating) > 0,
 Number(filters.minStars) > 0,
 filters.amenity !== "all",
 filters.freeCancellationOnly,
 filters.wishlistOnly,
 ].filter(Boolean).length;

 return (
 <aside className="hotels-sidebar">
 <section className="sidebar-summary-card">
 <div className="sidebar-head">
 <div>
 <p className="sidebar-kicker">Bộ lọc</p>
 <h2>Thu hẹp kết quả</h2>
 </div>
 <span className="sidebar-count">{activeFilters} đang bật</span>
 </div>
 <button type="button" className="sidebar-clear-btn" onClick={resetFilters}>
 Xóa tất cả bộ lọc
 </button>
 {availabilityError ? <p className="filter-hint">{availabilityError}</p> : null}
 </section>

 <section className="hotels-filter-box">
 <div className="filter-box-head">
 <h3>Ngân sách</h3>
 <span>Khoảng giá mỗi đêm</span>
 </div>
 <div className="sidebar-field-row">
 <label className="filter-field">
 <span>Giá từ</span>
 <input
 name="priceMin"
 type="number"
 min="0"
 value={filters.priceMin}
 onChange={handleFilterChange}
 placeholder="0"
 />
 </label>

 <label className="filter-field">
 <span>Giá đến</span>
 <input
 name="priceMax"
 type="number"
 min="0"
 value={filters.priceMax}
 onChange={handleFilterChange}
 placeholder="Không giới hạn"
 />
 </label>
 </div>
 </section>

 <section className="hotels-filter-box">
 <div className="filter-box-head">
 <h3>Đánh giá</h3>
 <span>Chọn chất lượng lưu trú</span>
 </div>
 <label className="filter-field">
 <span>Rating tối thiểu</span>
 <select name="minRating" value={filters.minRating} onChange={handleFilterChange}>
 <option value="0">Tất cả</option>
 <option value="3">Từ 3.0</option>
 <option value="4">Từ 4.0</option>
 <option value="4.5">Từ 4.5</option>
 </select>
 </label>

 <label className="filter-field">
 <span>Hạng sao</span>
 <select name="minStars" value={filters.minStars} onChange={handleFilterChange}>
 <option value="0">Tất cả</option>
 <option value="3">Từ 3 sao</option>
 <option value="4">Từ 4 sao</option>
 <option value="5">5 sao</option>
 </select>
 </label>
 </section>

 <section className="hotels-filter-box">
 <div className="filter-box-head">
 <h3>Tiện nghi</h3>
 <span>Tiện ích nổi bật</span>
 </div>
 <label className="filter-field">
 <span>Tiện nghi chính</span>
 <select name="amenity" value={filters.amenity} onChange={handleFilterChange}>
 <option value="all">Tất cả tiện nghi</option>
 {amenityOptions.map((amenity) => (
 <option key={amenity} value={amenity}>
 {amenity}
 </option>
 ))}
 </select>
 </label>
 </section>

 <section className="hotels-filter-box">
 <div className="filter-box-head">
 <h3>Tùy chọn thêm</h3>
 <span>Ưu tiên khi tìm phòng</span>
 </div>
 <label className="sidebar-check">
 <input
 type="checkbox"
 name="freeCancellationOnly"
 checked={filters.freeCancellationOnly}
 onChange={handleFilterChange}
 />
 <span>Có hủy miễn phí</span>
 </label>

 <label className={`sidebar-check ${!isLoggedIn ? "disabled" : ""}`}>
 <input
 type="checkbox"
 name="wishlistOnly"
 checked={filters.wishlistOnly}
 onChange={handleFilterChange}
 disabled={!isLoggedIn}
 />
 <span>Chỉ xem wishlist của tôi</span>
 </label>
 </section>
 </aside>
 );
}
