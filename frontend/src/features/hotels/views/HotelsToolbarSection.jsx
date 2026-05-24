import { useState } from "react";

export default function HotelsToolbarSection({
  filters,
  handleFilterChange,
  amenityOptions,
  isLoggedIn,
  resetFilters,
  availabilityError,
}) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const activeFilters = [
    filters.priceMin,
    filters.priceMax,
    Number(filters.minRating) > 0,
    Number(filters.minStars) > 0,
    filters.amenity !== "all",
    filters.freeCancellationOnly,
    filters.wishlistOnly,
  ].filter(Boolean).length;

  const handleStarSelect = (stars) => {
    const nextVal = Number(filters.minStars) === stars ? 0 : stars;
    handleFilterChange({
      target: { name: "minStars", value: String(nextVal) }
    });
  };

  const handleAmenitySelect = (amenity) => {
    const nextVal = filters.amenity === amenity ? "all" : amenity;
    handleFilterChange({
      target: { name: "amenity", value: nextVal }
    });
  };

  return (
    <>
      <style>{`
        /* Floating toggle button for mobile views */
        .mobile-filter-trigger {
          display: none;
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 999;
          background: var(--color-primary, #F59E0B);
          color: #fff;
          border: none;
          border-radius: 30px;
          padding: 12px 24px;
          font-weight: 600;
          box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4);
          cursor: pointer;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mobile-filter-trigger:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 12px 28px rgba(245, 158, 11, 0.5);
        }

        /* Responsive sidebar adjustments */
        @media (max-width: 991px) {
          .mobile-filter-trigger {
            display: flex;
          }
          .hotels-sidebar {
            position: fixed;
            top: 0;
            left: -320px;
            width: 300px;
            height: 100vh;
            background: rgba(18, 18, 18, 0.95) !important;
            backdrop-filter: blur(15px);
            z-index: 10000;
            box-shadow: 20px 0 40px rgba(0, 0, 0, 0.6);
            overflow-y: auto;
            padding: 30px 20px !important;
            transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border-right: 1px solid rgba(255, 255, 255, 0.08);
          }
          .hotels-sidebar.open {
            left: 0;
          }
          .sidebar-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 9999;
            animation: fadeIn 0.3s ease;
          }
        }

        /* Star Selector Glassmorphism */
        .stars-row {
          display: flex;
          gap: 6px;
          margin-top: 8px;
        }
        .star-filter-chip {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.6);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .star-filter-chip:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.15);
        }
        .star-filter-chip.active {
          background: rgba(245, 158, 11, 0.12);
          border-color: var(--color-primary, #F59E0B);
          color: var(--color-primary, #F59E0B);
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.15);
        }

        /* Amenities tag grid */
        .amenities-tag-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }
        .amenity-tag {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .amenity-tag:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .amenity-tag.active {
          color: #fff;
          background: var(--color-primary, #F59E0B);
          border-color: var(--color-primary, #F59E0B);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }

        /* Glass Toggles */
        .sidebar-check-premium {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          cursor: pointer;
        }
        .sidebar-check-premium span {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .sidebar-check-premium.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .toggle-switch {
          position: relative;
          width: 44px;
          height: 22px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 11px;
          transition: background 0.3s ease;
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          top: 2px;
          left: 2px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        input[type="checkbox"]:checked + .toggle-switch {
          background: var(--color-primary, #F59E0B);
        }
        input[type="checkbox"]:checked + .toggle-switch::after {
          transform: translateX(22px);
        }

        .close-sidebar-btn {
          display: none;
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          font-size: 1.5rem;
          cursor: pointer;
          position: absolute;
          top: 20px;
          right: 20px;
        }
        @media (max-width: 991px) {
          .close-sidebar-btn {
            display: block;
          }
        }
      `}</style>

      {/* Backdrop overlay for mobile drawer */}
      {isOpenMobile && (
        <div className="sidebar-backdrop" onClick={() => setIsOpenMobile(false)}></div>
      )}

      {/* Floating trigger for mobile */}
      <button
        type="button"
        className="mobile-filter-trigger"
        onClick={() => setIsOpenMobile(true)}
      >
        <span>🔍 Lọc nâng cao</span>
        {activeFilters > 0 && (
          <span style={{
            background: "#fff",
            color: "var(--color-primary, #F59E0B)",
            borderRadius: "50%",
            width: "18px",
            height: "18px",
            fontSize: "0.75rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {activeFilters}
          </span>
        )}
      </button>

      <aside className={`hotels-sidebar ${isOpenMobile ? "open" : ""}`}>
        <button
          type="button"
          className="close-sidebar-btn"
          onClick={() => setIsOpenMobile(false)}
        >
          ✕
        </button>

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

        {/* Price filter box */}
        <section className="hotels-filter-box">
          <div className="filter-box-head">
            <h3>Ngân sách</h3>
            <span>Khoảng giá mỗi đêm</span>
          </div>
          <div className="sidebar-field-row">
            <label className="filter-field">
              <span>Giá từ (VND)</span>
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
              <span>Giá đến (VND)</span>
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

        {/* Star Rating & Review Quality filter box */}
        <section className="hotels-filter-box">
          <div className="filter-box-head">
            <h3>Hạng sao</h3>
            <span>Lọc theo đẳng cấp chỗ nghỉ</span>
          </div>
          <div className="stars-row">
            {[3, 4, 5].map((star) => {
              const active = Number(filters.minStars) === star;
              return (
                <button
                  key={star}
                  type="button"
                  className={`star-filter-chip ${active ? "active" : ""}`}
                  onClick={() => handleStarSelect(star)}
                >
                  ★ {star} {star === 5 ? "" : "+"}
                </button>
              );
            })}
          </div>
        </section>

        <section className="hotels-filter-box">
          <div className="filter-box-head">
            <h3>Đánh giá khách hàng</h3>
            <span>Chọn chất lượng lưu trú</span>
          </div>
          <label className="filter-field">
            <span>Rating tối thiểu</span>
            <select name="minRating" value={filters.minRating} onChange={handleFilterChange}>
              <option value="0">Tất cả điểm số</option>
              <option value="3">Khá tốt (Từ 3.0 ★)</option>
              <option value="4">Rất tốt (Từ 4.0 ★)</option>
              <option value="4.5">Tuyệt vời (Từ 4.5 ★)</option>
            </select>
          </label>
        </section>

        {/* Amenities tag grid */}
        <section className="hotels-filter-box">
          <div className="filter-box-head">
            <h3>Tiện nghi khách sạn</h3>
            <span>Tiện ích nổi bật được chọn lọc</span>
          </div>
          <div className="amenities-tag-grid">
            <button
              type="button"
              className={`amenity-tag ${filters.amenity === "all" ? "active" : ""}`}
              onClick={() => handleAmenitySelect("all")}
            >
              Tất cả tiện nghi
            </button>
            {amenityOptions.map((amenity) => {
              const active = filters.amenity === amenity;
              return (
                <button
                  key={amenity}
                  type="button"
                  className={`amenity-tag ${active ? "active" : ""}`}
                  onClick={() => handleAmenitySelect(amenity)}
                >
                  {amenity}
                </button>
              );
            })}
          </div>
        </section>

        {/* Extra options switch box */}
        <section className="hotels-filter-box">
          <div className="filter-box-head">
            <h3>Tùy chọn thêm</h3>
            <span>Ưu tiên khi tìm phòng</span>
          </div>

          <label className="sidebar-check-premium">
            <span>Có hủy miễn phí</span>
            <input
              type="checkbox"
              name="freeCancellationOnly"
              checked={filters.freeCancellationOnly}
              onChange={handleFilterChange}
              style={{ display: "none" }}
            />
            <div className="toggle-switch"></div>
          </label>

          <label className={`sidebar-check-premium ${!isLoggedIn ? "disabled" : ""}`}>
            <span>Chỉ xem wishlist của tôi</span>
            <input
              type="checkbox"
              name="wishlistOnly"
              checked={filters.wishlistOnly}
              onChange={handleFilterChange}
              disabled={!isLoggedIn}
              style={{ display: "none" }}
            />
            <div className="toggle-switch"></div>
          </label>
        </section>
      </aside>
    </>
  );
}
