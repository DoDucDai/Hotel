export default function HotelsToolbarSection({
 filters,
 sortBy,
 handleFilterChange,
 setSortBy,
 setCurrentPage,
 amenityOptions,
 isLoggedIn,
 availabilityLoading,
 filteredHotelsCount,
 resetFilters,
 availabilityError,
}) {
 return (
 <section className="hotels-container hotels-toolbar">
 <div className="toolbar-grid toolbar-grid-main">
 <label className="filter-field">
 <span>Ở đâu</span>
 <input
 name="destination"
 type="text"
 value={filters.destination}
 onChange={handleFilterChange}
 placeholder="Nhập tên khách sạn, thành phố hoặc địa chỉ"
 />
 </label>

 <label className="filter-field">
 <span>Bao nhiêu người</span>
 <input
 name="guests"
 type="number"
 min="1"
 value={filters.guests}
 onChange={handleFilterChange}
 />
 </label>

 <label className="filter-field">
 <span>Mấy phòng</span>
 <input
 name="roomCount"
 type="number"
 min="1"
 value={filters.roomCount}
 onChange={handleFilterChange}
 />
 </label>
 </div>

 <div className="toolbar-grid toolbar-grid-sub">
 <label className="filter-field">
 <span>Ngày nhận phòng</span>
 <input
 name="checkIn"
 type="date"
 value={filters.checkIn}
 onChange={handleFilterChange}
 />
 </label>

 <label className="filter-field">
 <span>Ngày trả phòng</span>
 <input
 name="checkOut"
 type="date"
 value={filters.checkOut}
 onChange={handleFilterChange}
 />
 </label>

 <label className="filter-field">
 <span>Sắp xếp</span>
 <select
 value={sortBy}
 onChange={(event) => {
 setSortBy(event.target.value);
 setCurrentPage(1);
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
 </div>

 <div className="toolbar-grid toolbar-grid-advanced">
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

 <label className="filter-field">
 <span>Tiện nghi</span>
 <select name="amenity" value={filters.amenity} onChange={handleFilterChange}>
 <option value="all">Tất cả tiện nghi</option>
 {amenityOptions.map((amenity) => (
 <option key={amenity} value={amenity}>
 {amenity}
 </option>
 ))}
 </select>
 </label>

 <label className="wishlist-checkbox">
 <input
 type="checkbox"
 name="freeCancellationOnly"
 checked={filters.freeCancellationOnly}
 onChange={handleFilterChange}
 />
 <span>Có hủy miễn phí</span>
 </label>

 <label className="wishlist-checkbox">
 <input
 type="checkbox"
 name="wishlistOnly"
 checked={filters.wishlistOnly}
 onChange={handleFilterChange}
 disabled={!isLoggedIn}
 />
 <span>Chỉ xem wishlist của tôi</span>
 </label>
 </div>

 <div className="toolbar-footer">
 <span className="result-pill">
 {availabilityLoading
 ? "Đang cập nhật phòng khả dụng..."
 : `${filteredHotelsCount} khách sạn phù hợp`}
 </span>
 <button type="button" className="reset-btn" onClick={resetFilters}>
 Đặt lại bộ lọc
 </button>
 </div>

 {availabilityError && <p className="filter-hint">{availabilityError}</p>}
 </section>
 );
}
