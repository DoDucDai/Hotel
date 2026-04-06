import {
  currencyFormatter,
  formatDate,
  getPaymentMeta,
  getStatusMeta,
  nightsBetween,
} from "../accountUtils";

export default function HistoryTab({
  sortedBookings,
  selectedBooking,
  bookingAction,
  setBookingAction,
  handleSubmitBookingAction,
  actionSaving,
  bookingsLoading,
  bookingsError,
  disputesByBookingId,
  setActiveTab,
  setDisputeDraft,
  navigate,
}) {
  return (
    <section className="account-card account-history-card">
      <div className="history-head">
        <h2>Lịch sử đặt phòng của tôi</h2>
        <span>{sortedBookings.length} booking</span>
      </div>

      {selectedBooking && bookingAction ? (
        <div className="booking-action-panel">
          <h3>{bookingAction.mode === "cancel" ? "Hủy booking" : "Dời lịch booking"}</h3>
          <p>
            {selectedBooking.hotel?.name || "-"} - {selectedBooking.room?.name || "-"}
          </p>

          {bookingAction.mode === "cancel" ? (
            <label className="action-field">
              <span>Lý do hủy</span>
              <textarea
                value={bookingAction.reason || ""}
                onChange={(event) =>
                  setBookingAction((prev) => ({
                    ...prev,
                    reason: event.target.value,
                  }))
                }
                placeholder="Ví dụ: thay đổi kế hoạch di chuyển"
              />
            </label>
          ) : (
            <div className="action-field-row">
              <label className="action-field">
                <span>Ngày nhận phòng mới</span>
                <input
                  type="date"
                  value={bookingAction.checkInDate || ""}
                  onChange={(event) =>
                    setBookingAction((prev) => ({
                      ...prev,
                      checkInDate: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="action-field">
                <span>Ngày trả phòng mới</span>
                <input
                  type="date"
                  value={bookingAction.checkOutDate || ""}
                  onChange={(event) =>
                    setBookingAction((prev) => ({
                      ...prev,
                      checkOutDate: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          )}

          <div className="action-buttons">
            <button
              type="button"
              className="save-btn"
              onClick={handleSubmitBookingAction}
              disabled={actionSaving}
            >
              {actionSaving ? "Đang xử lý..." : "Xác nhận"}
            </button>
            <button type="button" className="action-text-btn" onClick={() => setBookingAction(null)}>
              Hủy thao tác
            </button>
          </div>
        </div>
      ) : null}

      {bookingsLoading ? (
        <div className="account-state">Đang tải lịch sử booking...</div>
      ) : bookingsError ? (
        <div className="account-state">{bookingsError}</div>
      ) : sortedBookings.length === 0 ? (
        <div className="account-state">Bạn chưa có booking nào.</div>
      ) : (
        <div className="history-table-wrap">
          <table className="history-table history-table-wide">
            <thead>
              <tr>
                <th>Khách sạn</th>
                <th>Phòng</th>
                <th>Nhận phòng</th>
                <th>Trả phòng</th>
                <th>Số đêm</th>
                <th>Tổng tiền</th>
                <th>Ghi chú</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedBookings.map((booking) => {
                const statusMeta = getStatusMeta(booking);
                const paymentMeta = getPaymentMeta(booking.paymentStatus);
                const totalPrice = Number(booking.finalPrice || booking.totalPrice || 0);
                const nights = nightsBetween(booking.checkInDate, booking.checkOutDate);
                const allowActions = booking.status === "CONFIRMED" && statusMeta.className === "upcoming";
                const existingDispute = disputesByBookingId[booking.id];

                return (
                  <tr key={booking.id || `${booking.roomId}-${booking.checkInDate}`}>
                    <td>{booking.hotel?.name || "-"}</td>
                    <td>{booking.room?.name || booking.roomId || "-"}</td>
                    <td>{formatDate(booking.checkInDate)}</td>
                    <td>{formatDate(booking.checkOutDate)}</td>
                    <td>{nights > 0 ? nights : "-"}</td>
                    <td>{Number.isFinite(totalPrice) ? currencyFormatter.format(totalPrice) : "-"}</td>
                    <td>{booking.note || "-"}</td>
                    <td>
                      <span className={`payment-pill ${paymentMeta.className}`}>{paymentMeta.label}</span>
                    </td>
                    <td>
                      <span className={`booking-status ${statusMeta.className}`}>{statusMeta.label}</span>
                    </td>
                    <td>
                      <div className="table-action-group">
                        {allowActions ? (
                          <>
                            <button
                              type="button"
                              className="table-action-btn"
                              onClick={() =>
                                setBookingAction({
                                  bookingId: booking.id,
                                  mode: "reschedule",
                                  checkInDate: booking.checkInDate,
                                  checkOutDate: booking.checkOutDate,
                                })
                              }
                            >
                              Dời lịch
                            </button>
                            <button
                              type="button"
                              className="table-action-btn danger"
                              onClick={() =>
                                setBookingAction({
                                  bookingId: booking.id,
                                  mode: "cancel",
                                  reason: "",
                                })
                              }
                            >
                              Hủy booking
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() =>
                              booking.hotel?.id
                                ? navigate(`/hotels/${booking.hotel.id}`, {
                                    state: { hotel: booking.hotel },
                                  })
                                : null
                            }
                          >
                            Xem khách sạn
                          </button>
                        )}
                        {existingDispute ? (
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => setActiveTab("payments")}
                          >
                            Xem tranh chấp
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => {
                              setActiveTab("payments");
                              setDisputeDraft({
                                bookingId: booking.id,
                                subject: booking.cancellationReason
                                  ? "Cần giải quyết booking đã hủy"
                                  : "Cần hỗ trợ booking",
                                description: booking.note ? `Chi tiết booking: ${booking.note}` : "",
                              });
                            }}
                          >
                            Báo cáo
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


