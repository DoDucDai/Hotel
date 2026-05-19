export default function BookingsView({
 sortedBookings,
 filteredBookings,
 bookingFilters,
 handleBookingFilterChange,
 paymentStatusFilterOptions,
 bookingStayStatusOptions,
 resetBookingFilters,
 paymentDrafts,
 paymentUpdatingId,
 bookingStatusDrafts,
 bookingStatusNotes,
 bookingStatusUpdatingId,
 paymentStatusOptions,
 bookingStatusOptions,
 shortId,
 formatDate,
 currencyFormatter,
 bookingRevenueValue,
 paymentMethodLabel,
 formatCellText,
 handlePaymentDraftChange,
 handlePaymentStatusUpdate,
 handleBookingStatusDraftChange,
 handleBookingStatusUpdate,
 handleBookingStatusNoteChange,
}) {
 return (
 <section className="admin-view-stack">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Tất cả booking</p>
 <h2>Quan sát booking theo tình trạng thực tế</h2>
 </div>
 <span className="panel-badge">
 {filteredBookings.length}/{sortedBookings.length} booking
 </span>
 </div>

 <div className="admin-booking-filters">
 <label className="admin-filter-field">
 <span>Payment status</span>
 <select
 name="paymentStatus"
 value={bookingFilters.paymentStatus}
 onChange={handleBookingFilterChange}
 >
 {paymentStatusFilterOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>

 <label className="admin-filter-field">
 <span>User</span>
 <input
 type="text"
 name="userQuery"
 value={bookingFilters.userQuery}
 onChange={handleBookingFilterChange}
 placeholder="Tên, email người đặt"
 />
 </label>

 <label className="admin-filter-field">
 <span>Hotel</span>
 <input
 type="text"
 name="hotelQuery"
 value={bookingFilters.hotelQuery}
 onChange={handleBookingFilterChange}
 placeholder="Tên hotel hoặc phòng"
 />
 </label>

 <label className="admin-filter-field">
 <span>Trạng thái ở</span>
 <select
 name="stayStatus"
 value={bookingFilters.stayStatus}
 onChange={handleBookingFilterChange}
 >
 {bookingStayStatusOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>

 <label className="admin-filter-field">
 <span>Từ ngày</span>
 <input
 type="date"
 name="dateFrom"
 value={bookingFilters.dateFrom}
 onChange={handleBookingFilterChange}
 />
 </label>

 <label className="admin-filter-field">
 <span>Đến ngày</span>
 <input
 type="date"
 name="dateTo"
 value={bookingFilters.dateTo}
 onChange={handleBookingFilterChange}
 />
 </label>

 <button
 type="button"
 className="admin-filter-reset"
 onClick={resetBookingFilters}
 >
 Đặt lại bộ lọc
 </button>
 </div>

 {filteredBookings.length ? (
 <div className="table-wrap">
 <table>
 <thead>
 <tr>
 <th>Mã booking</th>
 <th>User</th>
 <th>Hotel</th>
 <th>Room</th>
 <th>Check-in</th>
 <th>Check-out</th>
 <th>Tổng tiền</th>
 <th>Thanh toán</th>
 <th>Coupon</th>
 <th>Ghi chú</th>
 <th>Trạng thái</th>
 </tr>
 </thead>
 <tbody>
 {filteredBookings.map((booking) => {
 const selectedPaymentStatus =
 paymentDrafts[booking.id] || booking.paymentStatus || "PENDING";
 const paymentDirty =
 selectedPaymentStatus !== (booking.paymentStatus || "PENDING");
 const selectedBookingStatus =
 bookingStatusDrafts[booking.id] || booking.rawStatus || "CONFIRMED";
 const noteValue = bookingStatusNotes[booking.id] ?? booking.note ?? "";
 const bookingStatusDirty =
 selectedBookingStatus !== (booking.rawStatus || "CONFIRMED") ||
 noteValue.trim() !== String(booking.note || "").trim();

 return (
 <tr key={booking.id}>
 <td>{shortId(booking.id)}</td>
 <td>{booking.user?.name || booking.user?.email || booking.userId || "-"}</td>
 <td>{booking.hotel?.name || "-"}</td>
 <td>{booking.room?.name || booking.roomId || "-"}</td>
 <td>{formatDate(booking.checkInDate)}</td>
 <td>{formatDate(booking.checkOutDate)}</td>
 <td>{currencyFormatter.format(bookingRevenueValue(booking))}</td>
 <td>
 <div className="admin-table-stack">
 <span className={`status-pill ${booking.paymentMeta.className}`}>
 {booking.paymentMeta.label}
 </span>
 <span className="admin-cell-note">
 {paymentMethodLabel(booking.paymentMethod)}
 </span>
 <div className="admin-payment-editor">
 <select
 value={selectedPaymentStatus}
 onChange={(event) =>
 handlePaymentDraftChange(booking.id, event.target.value)
 }
 disabled={paymentUpdatingId === booking.id}
 >
 {paymentStatusOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 <button
 type="button"
 className="admin-mini-btn"
 disabled={!paymentDirty || paymentUpdatingId === booking.id}
 onClick={() => handlePaymentStatusUpdate(booking)}
 >
 {paymentUpdatingId === booking.id ? "Đang lưu..." : "Lưu"}
 </button>
 </div>
 </div>
 </td>
 <td>
 <div className="admin-table-stack">
 <strong>{booking.couponCode || "-"}</strong>
 {Number(booking.discountAmount || 0) > 0 ? (
 <span className="admin-cell-note">
 -{currencyFormatter.format(Number(booking.discountAmount || 0))}
 </span>
 ) : null}
 </div>
 </td>
 <td>
 <div className="admin-table-stack">
 <span className="admin-note-cell">
 {formatCellText(booking.note, "Không có ghi chú")}
 </span>
 {booking.cancellationReason ? (
 <span className="admin-cell-note">
 Lý do hủy: {booking.cancellationReason}
 </span>
 ) : null}
 </div>
 </td>
 <td>
 <div className="admin-table-stack">
 <span className={`status-pill ${booking.status.className}`}>
 {booking.status.label}
 </span>
 <div className="admin-payment-editor">
 <select
 value={selectedBookingStatus}
 onChange={(event) =>
 handleBookingStatusDraftChange(booking.id, event.target.value)
 }
 disabled={bookingStatusUpdatingId === booking.id}
 >
 {bookingStatusOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 <button
 type="button"
 className="admin-mini-btn"
 disabled={!bookingStatusDirty || bookingStatusUpdatingId === booking.id}
 onClick={() => handleBookingStatusUpdate(booking)}
 >
 {bookingStatusUpdatingId === booking.id ? "Đang lưu..." : "Lưu"}
 </button>
 </div>
 <input
 type="text"
 className="admin-inline-input"
 value={noteValue}
 onChange={(event) =>
 handleBookingStatusNoteChange(booking.id, event.target.value)
 }
 placeholder="Ghi chú check-in/out"
 />
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="admin-empty-state">
 Không có booking phù hợp bộ lọc payment status hiện tại.
 </div>
 )}
 </article>
 </section>
 );
}

