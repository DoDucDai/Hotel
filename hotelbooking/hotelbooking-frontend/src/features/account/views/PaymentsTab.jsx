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
        <h2>Lich so thanh toan va tranh chap</h2>
        <span>{sortedBookings.length} giao dich</span>
      </div>

      <div className="payments-grid">
        <section className="payments-panel">
          <h3>Dang tien booking</h3>
          <p className="card-note">
            Theo doi payment method, thoi diem thanh toan, coupon da dung va so tien hoan lai.
          </p>

          {bookingsLoading ? (
            <div className="account-state">Dang tai lich su thanh toan...</div>
          ) : bookingsError ? (
            <div className="account-state">{bookingsError}</div>
          ) : sortedBookings.length === 0 ? (
            <p className="inline-note">Ban chua co giao dich nao.</p>
          ) : (
            <div className="history-table-wrap">
              <table className="history-table payments-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Thanh toan</th>
                    <th>Phuong thuc</th>
                    <th>Da tra</th>
                    <th>Hoan tien</th>
                    <th>Coupon</th>
                    <th>Cap nhat</th>
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
          <h3>Gui tranh chap / bao cao</h3>
          <p className="card-note">
            Khi co van de ve thanh toan, phong khong dung mo ta hoac can admin ho tro, ban co the gui
            tranh chap tai day.
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
                <option value="">Chon booking can bao cao</option>
                {sortedBookings.map((booking) => (
                  <option
                    key={`dispute-option-${booking.id}`}
                    value={booking.id}
                    disabled={Boolean(disputesByBookingId[booking.id])}
                  >
                    {booking.hotel?.name || "-"} - {formatDate(booking.checkInDate)}
                    {disputesByBookingId[booking.id] ? " (da gui)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Chu de</span>
              <input
                value={disputeDraft.subject}
                onChange={(event) =>
                  setDisputeDraft((prev) => ({
                    ...prev,
                    subject: event.target.value,
                  }))
                }
                placeholder="Vi du: Hoan tien cham, phong khong dung mo ta"
              />
            </label>

            <label>
              <span>Noi dung</span>
              <textarea
                value={disputeDraft.description}
                onChange={(event) =>
                  setDisputeDraft((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Mo ta cu the van de de admin co the xu ly nhanh hon"
              />
            </label>

            <button type="submit" className="save-btn" disabled={disputeSaving}>
              {disputeSaving ? "Dang gui..." : "Gui tranh chap"}
            </button>
          </form>

          <div className="payments-disputes">
            <div className="history-head compact-head">
              <h3>Tranh chap cua toi</h3>
              <button type="button" className="table-action-btn" onClick={refreshDisputes}>
                Tai lai
              </button>
            </div>

            {disputesLoading ? (
              <div className="account-state">Dang tai danh sach tranh chap...</div>
            ) : disputesError ? (
              <div className="account-state">{disputesError}</div>
            ) : sortedDisputes.length === 0 ? (
              <p className="inline-note">Ban chua gui tranh chap nao.</p>
            ) : (
              <div className="dispute-list">
                {sortedDisputes.map((dispute) => (
                  <article key={dispute.id} className="dispute-card">
                    <div className="dispute-head">
                      <strong>{dispute.subject || "Tranh chap booking"}</strong>
                      <span className={`booking-status ${String(dispute.status || "").toLowerCase()}`}>
                        {dispute.status || "OPEN"}
                      </span>
                    </div>
                    <p>{dispute.description || "-"}</p>
                    <small>
                      Booking: {dispute.bookingId || "-"} - Cap nhat:{" "}
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
