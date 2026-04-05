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
 <span>O dau</span>
 <input
 name="destination"
 type="text"
 value={filters.destination}
 onChange={handleFilterChange}
 placeholder="Nhap ten khach san, thanh phi hoac dua chi"
 />
 </label>

 <label className="filter-field">
 <span>Bao nguoi</span>
 <input
 name="guests"
 type="number"
 min="1"
 value={filters.guests}
 onChange={handleFilterChange}
 />
 </label>

 <label className="filter-field">
 <span>May phong</span>
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
 <span>Ng y nhan phong</span>
 <input
 name="checkIn"
 type="date"
 value={filters.checkIn}
 onChange={handleFilterChange}
 />
 </label>

 <label className="filter-field">
 <span>Ng y tra phong</span>
 <input
 name="checkOut"
 type="date"
 value={filters.checkOut}
 onChange={handleFilterChange}
 />
 </label>

 <label className="filter-field">
 <span>Sap xep</span>
 <select
 value={sortBy}
 onChange={(event) => {
 setSortBy(event.target.value);
 setCurrentPage(1);
 }}
 >
 <option value="name-asc">Ten A - Z</option>
 <option value="name-desc">Ten Z - A</option>
 <option value="city-asc">Thonh phi A - Z</option>
 <option value="city-desc">Thonh phi Z - A</option>
 <option value="price-asc">Gia thap den cao</option>
 <option value="price-desc">Gia cao den thap</option>
 <option value="rating-desc">Rating cao nhat</option>
 </select>
 </label>
 </div>

 <div className="toolbar-grid toolbar-grid-advanced">
 <label className="filter-field">
 <span>Gia tu</span>
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
 <span>Gia den</span>
 <input
 name="priceMax"
 type="number"
 min="0"
 value={filters.priceMax}
 onChange={handleFilterChange}
 placeholder="Khong giai han"
 />
 </label>

 <label className="filter-field">
 <span>Rating toi thieu</span>
 <select name="minRating" value={filters.minRating} onChange={handleFilterChange}>
 <option value="0">Tat ca</option>
 <option value="3">Tu 3.0</option>
 <option value="4">Tu 4.0</option>
 <option value="4.5">Tu 4.5</option>
 </select>
 </label>

 <label className="filter-field">
 <span>Hang sao</span>
 <select name="minStars" value={filters.minStars} onChange={handleFilterChange}>
 <option value="0">Tat ca</option>
 <option value="3">Tu 3 sao</option>
 <option value="4">Tu 4 sao</option>
 <option value="5">5 sao</option>
 </select>
 </label>

 <label className="filter-field">
 <span>Tien nghi</span>
 <select name="amenity" value={filters.amenity} onChange={handleFilterChange}>
 <option value="all">Tat ca tien nghi</option>
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
 <span>Co huy mien phi</span>
 </label>

 <label className="wishlist-checkbox">
 <input
 type="checkbox"
 name="wishlistOnly"
 checked={filters.wishlistOnly}
 onChange={handleFilterChange}
 disabled={!isLoggedIn}
 />
 <span>Cho xem wishlist cua toi</span>
 </label>
 </div>

 <div className="toolbar-footer">
 <span className="result-pill">
 {availabilityLoading
 ? "Dang cap nhet phong kha dung..."
 : `${filteredHotelsCount} khach san phu hop`}
 </span>
 <button type="button" className="reset-btn" onClick={resetFilters}>
 Dat lai bo luc
 </button>
 </div>

 {availabilityError && <p className="filter-hint">{availabilityError}</p>}
 </section>
 );
}
