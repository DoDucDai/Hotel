export default function HotelsView({
  hotelCardPage,
  hotelCardTotalPages,
  filteredHotelCards,
  hotelCards,
  hotelFilters,
  handleHotelFilterChange,
  hotelCityOptions,
  resetHotelFilters,
  numberFormatter,
  rooms,
  bookings,
  topFilteredHotel,
  pagedHotelCards,
  hotelApprovalMeta,
  hotelApprovalDrafts,
  hotelApprovalNotes,
  hotelApprovalOptions,
  hotelApprovalUpdatingId,
  handleHotelApprovalDraftChange,
  handleHotelApprovalNoteChange,
  navigate,
  handleHotelApprovalUpdate,
  setHotelCardPage,
  hotelCardPaginationPages,
}) {
  return (
    <section className="admin-view-stack">
      <article className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-tag">Danh sách hotels</p>
            <h2>Tách riêng từng card để dễ mở rộng</h2>
          </div>
          <span className="panel-badge">
            Trang {hotelCardPage}/{hotelCardTotalPages} - {filteredHotelCards.length}/
            {hotelCards.length} hotels
          </span>
        </div>

        <div className="admin-hotel-filters">
          <label className="admin-filter-field">
            <span>Thành phố</span>
            <select name="city" value={hotelFilters.city} onChange={handleHotelFilterChange}>
              <option value="all">Tất cả thành phố</option>
              {hotelCityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-filter-field">
            <span>Số phòng tối thiểu</span>
            <input
              type="number"
              min="0"
              name="minRooms"
              value={hotelFilters.minRooms}
              onChange={handleHotelFilterChange}
            />
          </label>

          <label className="admin-filter-field">
            <span>Lấp đầy tối thiểu (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              name="minOccupancy"
              value={hotelFilters.minOccupancy}
              onChange={handleHotelFilterChange}
            />
          </label>

          <button type="button" className="admin-filter-reset" onClick={resetHotelFilters}>
            Đặt lại bộ lọc
          </button>
        </div>

        <div className="admin-summary-grid">
          <div className="type-card">
            <h3>Phòng hoạt động</h3>
            <p>{numberFormatter.format(rooms.length)} phòng trong hệ thống</p>
          </div>
          <div className="type-card">
            <h3>Booking theo hotel</h3>
            <p>{numberFormatter.format(bookings.length)} lượt đặt phòng</p>
          </div>
          <div className="type-card">
            <h3>Khách sạn lấp đầy cao</h3>
            <p>{topFilteredHotel ? `${topFilteredHotel.name} - ${topFilteredHotel.occupancy}%` : "Chưa có dữ liệu"}</p>
          </div>
        </div>

        {hotelCards.length ? (
          filteredHotelCards.length ? (
            <>
              <div className="admin-hotel-grid">
                {pagedHotelCards.map((hotel) => {
                  const approvalMetaItem = hotelApprovalMeta(hotel.approvalStatus);
                  const selectedStatus = hotelApprovalDrafts[hotel.id] || hotel.approvalStatus || "PENDING";
                  const noteValue = hotelApprovalNotes[hotel.id] ?? hotel.approvalNote ?? "";
                  const statusDirty =
                    selectedStatus !== (hotel.approvalStatus || "PENDING") ||
                    noteValue.trim() !== String(hotel.approvalNote || "").trim();

                  return (
                    <article key={hotel.id} className="admin-hotel-admin-card">
                      <div className="admin-hotel-card-head">
                        <div>
                          <p className="panel-tag">{hotel.city || "Việt Nam"}</p>
                          <h3>{hotel.name || "Khách sạn"}</h3>
                        </div>
                        <span className={`status-pill ${approvalMetaItem.className}`}>{approvalMetaItem.label}</span>
                      </div>

                      <p className="admin-hotel-address">{hotel.address || "-"}</p>

                      <div className="admin-hotel-meta">
                        <span>{hotel.starRating || 3} sao</span>
                        <span>{hotel.totalRooms || 0} loại phòng</span>
                        <span>{hotel.totalBookings || 0} booking</span>
                        <span>Lấp đầy {hotel.occupancy || 0}%</span>
                      </div>

                      <div className="admin-hotel-meta">
                        <span>Hủy miễn phí: {hotel.freeCancellationBeforeDays ?? 0} ngày</span>
                        <span>Hoàn tiền muộn: {hotel.lateCancellationRefundRate ?? 0}%</span>
                      </div>

                      <div className="admin-form-stack">
                        <label className="admin-filter-field">
                          <span>Duyệt hotel</span>
                          <select
                            value={selectedStatus}
                            onChange={(event) => handleHotelApprovalDraftChange(hotel.id, event.target.value)}
                            disabled={hotelApprovalUpdatingId === hotel.id}
                          >
                            {hotelApprovalOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="admin-filter-field">
                          <span>Ghi chú admin</span>
                          <textarea
                            value={noteValue}
                            onChange={(event) => handleHotelApprovalNoteChange(hotel.id, event.target.value)}
                            placeholder="Lý do duyệt, từ chối hoặc cần host bổ sung thông tin"
                          />
                        </label>
                      </div>

                      <div className="admin-card-actions">
                        <button
                          type="button"
                          className="btn-action btn-secondary"
                          onClick={() =>
                            navigate(`/hotels/${hotel.id}`, {
                              state: { hotel },
                            })
                          }
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-primary"
                          disabled={!statusDirty || hotelApprovalUpdatingId === hotel.id}
                          onClick={() => handleHotelApprovalUpdate(hotel)}
                        >
                          {hotelApprovalUpdatingId === hotel.id ? "Đang lưu..." : "Lưu duyệt"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="admin-hotel-pagination">
                <button
                  type="button"
                  className="admin-pagination-btn"
                  onClick={() => setHotelCardPage((prev) => Math.max(prev - 1, 1))}
                  disabled={hotelCardPage === 1}
                >
                  Trước
                </button>

                <div className="admin-pagination-list">
                  {hotelCardPaginationPages.map((page, index) => {
                    const prevPage = hotelCardPaginationPages[index - 1];
                    const showGap = prevPage && page - prevPage > 1;
                    return (
                      <span key={page} className="admin-pagination-item-wrap">
                        {showGap ? <span className="admin-pagination-gap">...</span> : null}
                        <button
                          type="button"
                          className={`admin-pagination-btn number ${hotelCardPage === page ? "active" : ""}`}
                          onClick={() => setHotelCardPage(page)}
                        >
                          {page}
                        </button>
                      </span>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="admin-pagination-btn"
                  onClick={() => setHotelCardPage((prev) => Math.min(prev + 1, hotelCardTotalPages))}
                  disabled={hotelCardPage >= hotelCardTotalPages}
                >
                  Sau
                </button>
              </div>
            </>
          ) : (
            <div className="admin-empty-state">Không có khách sạn phù hợp bộ lọc hiện tại.</div>
          )
        ) : (
          <div className="admin-empty-state">Chưa có khách sạn nào trong hệ thống.</div>
        )}
      </article>
    </section>
  );
}


