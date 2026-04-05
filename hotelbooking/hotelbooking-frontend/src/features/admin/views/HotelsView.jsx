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
            <p className="panel-tag">Danh sach hotels</p>
            <h2>Tach rieng tung card de de mo rong</h2>
          </div>
          <span className="panel-badge">
            Trang {hotelCardPage}/{hotelCardTotalPages} - {filteredHotelCards.length}/
            {hotelCards.length} hotels
          </span>
        </div>

        <div className="admin-hotel-filters">
          <label className="admin-filter-field">
            <span>Thanh pho</span>
            <select name="city" value={hotelFilters.city} onChange={handleHotelFilterChange}>
              <option value="all">Tat ca thanh pho</option>
              {hotelCityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-filter-field">
            <span>So phong toi thieu</span>
            <input
              type="number"
              min="0"
              name="minRooms"
              value={hotelFilters.minRooms}
              onChange={handleHotelFilterChange}
            />
          </label>

          <label className="admin-filter-field">
            <span>Lap day tai thiOu (%)</span>
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
            Dat lai bo loc
          </button>
        </div>

        <div className="admin-summary-grid">
          <div className="type-card">
            <h3>Phong hoat dong</h3>
            <p>{numberFormatter.format(rooms.length)} phong trong he thong</p>
          </div>
          <div className="type-card">
            <h3>Booking theo hotel</h3>
            <p>{numberFormatter.format(bookings.length)} luot dat phong</p>
          </div>
          <div className="type-card">
            <h3>Khach san lap day cao</h3>
            <p>{topFilteredHotel ? `${topFilteredHotel.name} - ${topFilteredHotel.occupancy}%` : "Chua co du lieu"}</p>
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
                          <p className="panel-tag">{hotel.city || "Viet Nam"}</p>
                          <h3>{hotel.name || "Khach san"}</h3>
                        </div>
                        <span className={`status-pill ${approvalMetaItem.className}`}>{approvalMetaItem.label}</span>
                      </div>

                      <p className="admin-hotel-address">{hotel.address || "-"}</p>

                      <div className="admin-hotel-meta">
                        <span>{hotel.starRating || 3} sao</span>
                        <span>{hotel.totalRooms || 0} loai phong</span>
                        <span>{hotel.totalBookings || 0} booking</span>
                        <span>Lap day {hotel.occupancy || 0}%</span>
                      </div>

                      <div className="admin-hotel-meta">
                        <span>Huy mien phi: {hotel.freeCancellationBeforeDays ?? 0} ngay</span>
                        <span>Hoan tien muon: {hotel.lateCancellationRefundRate ?? 0}%</span>
                      </div>

                      <div className="admin-form-stack">
                        <label className="admin-filter-field">
                          <span>Duyet hotel</span>
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
                          <span>Ghi chu admin</span>
                          <textarea
                            value={noteValue}
                            onChange={(event) => handleHotelApprovalNoteChange(hotel.id, event.target.value)}
                            placeholder="Ly do duyet, tu choi hoac can host bo sung thong tin"
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
                          Xem chi tiet
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-primary"
                          disabled={!statusDirty || hotelApprovalUpdatingId === hotel.id}
                          onClick={() => handleHotelApprovalUpdate(hotel)}
                        >
                          {hotelApprovalUpdatingId === hotel.id ? "Dang luu..." : "Lu duyet"}
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
                  Truoc
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
            <div className="admin-empty-state">Khong co khach san phu hop bo loc hien tai.</div>
          )
        ) : (
          <div className="admin-empty-state">Cha co khach san nao trong he thong.</div>
        )}
      </article>
    </section>
  );
}
