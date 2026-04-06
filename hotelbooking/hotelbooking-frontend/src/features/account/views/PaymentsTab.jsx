import { currencyFormatter, formatDate, formatDateTime, getPaymentMeta } from "../accountUtils";

export default function PaymentsTab({
  sortedBookings,
  bookingsLoading,
  bookingsError,
  disputeDraft,
  setDisputeDraft,
  handleSubmitDispute,
  disputeSaving,
  disputesByBookingId,
  sortedDisputes,
  disputesLoading,
  disputesError,
  refreshDisputes,
}) {
  return (
    <section className="account-card payments-card">
      <div className="history-head">
        <h2>Lịch sử thanh toán và tranh chấp</h2>
        <span>{sortedBookings.length} giao dịch</span>
      </div>

      <div className="payments-grid">
        <section className="payments-panel">
          <h3>Dòng tiền booking</h3>
          <p className="card-note">
            Theo dõi payment method, thời điểm thanh toán, coupon đã dùng và số tiền hoàn lại.
          </p>

          {bookingsLoading ? (
            <div className="account-state">Đang tải lịch sử thanh toán...</div>
          ) : bookingsError ? (
            <div className="account-state">{bookingsError}</div>
          ) : sortedBookings.length === 0 ? (
            <p className="inline-note">Bạn chưa có giao dịch nào.</p>
          ) : (
            <div className="history-table-wrap">
              <table className="history-table payments-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Thanh toán</th>
                    <th>Phương thức</th>
                    <th>Đã trả</th>
                    <th>Hoàn tiền</th>
                    <th>Coupon</th>
                    <th>Cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBookings.map((booking) => {
                    const paymentMeta = getPaymentMeta(booking.paymentStatus);
                    return (
                      <tr key={`payment-${booking.id}`}>
                        <td>
                          <strong>{booking.hotel?.name || "-"}</strong>
                          <div>{booking.room?.name || "-"}</div>
                        </td>
                        <td>
                          <span className={`payment-pill ${paymentMeta.className}`}>{paymentMeta.label}</span>
                        </td>
                        <td>{booking.paymentMethod || "PAY_AT_HOTEL"}</td>
                        <td>
                          {Number(booking.finalPrice || booking.totalPrice || 0) > 0
                            ? currencyFormatter.format(Number(booking.finalPrice || booking.totalPrice || 0))
                            : "-"}
                        </td>
                        <td>
                          {Number(booking.refundAmount || 0) > 0
                            ? currencyFormatter.format(Number(booking.refundAmount || 0))
                            : "-"}
                        </td>
                        <td>{booking.couponCode || "-"}</td>
                        <td>{formatDateTime(booking.paidAt || booking.updatedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="payments-panel">
          <h3>Gửi tranh chấp / báo cáo</h3>
          <p className="card-note">
            Khi có vấn đề về thanh toán, phòng không đúng mô tả hoặc cần admin hỗ trợ, bạn có thể gửi
            tranh chấp tại đây.
          </p>

          <form className="account-form" onSubmit={handleSubmitDispute}>
            <label>
              <span>Booking</span>
              <select
                value={disputeDraft.bookingId}
                onChange={(event) =>
                  setDisputeDraft((prev) => ({
                    ...prev,
                    bookingId: event.target.value,
                  }))
                }
              >
                <option value="">Chọn booking cần báo cáo</option>
                {sortedBookings.map((booking) => (
                  <option
                    key={`dispute-option-${booking.id}`}
                    value={booking.id}
                    disabled={Boolean(disputesByBookingId[booking.id])}
                  >
                    {booking.hotel?.name || "-"} - {formatDate(booking.checkInDate)}
                    {disputesByBookingId[booking.id] ? " (đã gửi)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Chủ đề</span>
              <input
                value={disputeDraft.subject}
                onChange={(event) =>
                  setDisputeDraft((prev) => ({
                    ...prev,
                    subject: event.target.value,
                  }))
                }
                placeholder="Ví dụ: Hoàn tiền chậm, phòng không đúng mô tả"
              />
            </label>

            <label>
              <span>Nội dung</span>
              <textarea
                value={disputeDraft.description}
                onChange={(event) =>
                  setDisputeDraft((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Mô tả cụ thể vấn đề để admin có thể xử lý nhanh hơn"
              />
            </label>

            <button type="submit" className="save-btn" disabled={disputeSaving}>
              {disputeSaving ? "Đang gửi..." : "Gửi tranh chấp"}
            </button>
          </form>

          <div className="payments-disputes">
            <div className="history-head compact-head">
              <h3>Tranh chấp của tôi</h3>
              <button type="button" className="table-action-btn" onClick={refreshDisputes}>
                Tải lại
              </button>
            </div>

            {disputesLoading ? (
              <div className="account-state">Đang tải danh sách tranh chấp...</div>
            ) : disputesError ? (
              <div className="account-state">{disputesError}</div>
            ) : sortedDisputes.length === 0 ? (
              <p className="inline-note">Bạn chưa gửi tranh chấp nào.</p>
            ) : (
              <div className="dispute-list">
                {sortedDisputes.map((dispute) => (
                  <article key={dispute.id} className="dispute-card">
                    <div className="dispute-head">
                      <strong>{dispute.subject || "Tranh chấp booking"}</strong>
                      <span className={`booking-status ${String(dispute.status || "").toLowerCase()}`}>
                        {dispute.status || "OPEN"}
                      </span>
                    </div>
                    <p>{dispute.description || "-"}</p>
                    <small>
                      Booking: {dispute.bookingId || "-"} - Cập nhật:{" "}
                      {formatDateTime(dispute.updatedAt || dispute.createdAt)}
                    </small>
                    {dispute.resolutionNote ? (
                      <div className="resolution-note">Admin: {dispute.resolutionNote}</div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}


