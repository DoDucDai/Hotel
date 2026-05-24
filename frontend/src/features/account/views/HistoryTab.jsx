import { useState } from "react";
import { useToast } from "../../../components/ToastProvider";
import { createReview } from "../../../services/reviewService";
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
  const toast = useToast();
  const [subTab, setSubTab] = useState("upcoming"); // "upcoming" | "completed" | "cancelled"
  const [reviewBooking, setReviewBooking] = useState(null); // Booking object currently being reviewed
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  // Categorize bookings
  const upcomingBookings = sortedBookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN"
  );
  const completedBookings = sortedBookings.filter((b) => b.status === "CHECKED_OUT");
  const cancelledBookings = sortedBookings.filter(
    (b) => b.status === "CANCELLED" || b.status === "NO_SHOW"
  );

  const activeBookings =
    subTab === "upcoming"
      ? upcomingBookings
      : subTab === "completed"
      ? completedBookings
      : cancelledBookings;

  const handleOpenReview = (booking) => {
    setReviewBooking(booking);
    setRating(5);
    setComment("");
  };

  const handleCloseReview = () => {
    setReviewBooking(null);
  };

  const handleSaveReview = async () => {
    if (!reviewBooking) return;
    setReviewSaving(true);
    try {
      await createReview({
        bookingId: reviewBooking.id,
        rating: rating,
        comment: comment.trim(),
      });
      toast.success("Gửi đánh giá thành công! Cảm ơn ý kiến của bạn.");
      handleCloseReview();
      // Reload page to update review status
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Không thể gửi đánh giá.");
    } finally {
      setReviewSaving(false);
    }
  };

  const renderProgressStepper = (booking) => {
    const isCancelled = booking.status === "CANCELLED";
    const isNoShow = booking.status === "NO_SHOW";
    
    if (isCancelled) {
      return (
        <div className="booking-progress-stepper cancelled">
          <div className="step active danger"><span>✓</span> Đặt phòng</div>
          <div className="step-line active danger"></div>
          <div className="step active danger"><span>✕</span> Đã hủy</div>
        </div>
      );
    }

    if (isNoShow) {
      return (
        <div className="booking-progress-stepper no-show">
          <div className="step active"><span>✓</span> Đặt phòng</div>
          <div className="step-line active"></div>
          <div className="step active warning"><span>✕</span> Không đến</div>
        </div>
      );
    }

    const steps = [
      { id: "CONFIRMED", label: "Đã đặt", active: true },
      { id: "CHECKED_IN", label: "Đang ở", active: booking.status === "CHECKED_IN" || booking.status === "CHECKED_OUT" },
      { id: "CHECKED_OUT", label: "Hoàn thành", active: booking.status === "CHECKED_OUT" }
    ];

    return (
      <div className="booking-progress-stepper">
        {steps.map((step, index) => (
          <div key={step.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div className={`step ${step.active ? "active" : ""}`}>
              <span className="step-num">{step.active ? "✓" : index + 1}</span>
              <span className="step-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-line ${steps[index + 1].active ? "active" : ""}`}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="account-card account-history-card">
      <style>{`
        /* Dynamic sub-tab styles */
        .booking-subtabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 10px;
        }
        .subtab-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.6);
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .subtab-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .subtab-btn.active {
          color: #fff;
          background: var(--color-primary, #F59E0B);
          border-color: var(--color-primary, #F59E0B);
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.25);
        }

        /* Glassmorphic progress stepper */
        .booking-progress-stepper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          padding: 12px 24px;
          border-radius: 12px;
          margin-bottom: 20px;
          gap: 12px;
        }
        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          position: relative;
          z-index: 2;
        }
        .step-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        .step.active .step-num {
          background: var(--color-primary, #F59E0B);
          border-color: var(--color-primary, #F59E0B);
          color: #fff;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }
        .step-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }
        .step.active .step-label {
          color: #fff;
        }
        .step-line {
          height: 2px;
          flex: 1;
          background: rgba(255, 255, 255, 0.08);
          margin-top: -18px;
          position: relative;
          z-index: 1;
          min-width: 40px;
        }
        .step-line.active {
          background: var(--color-primary, #F59E0B);
          box-shadow: 0 0 4px rgba(245, 158, 11, 0.25);
        }
        
        .booking-progress-stepper.cancelled .step.active.danger .step-num {
          background: #EF4444;
          border-color: #EF4444;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
        }
        .booking-progress-stepper.cancelled .step-line.active.danger {
          background: #EF4444;
        }
        
        .booking-progress-stepper.no-show .step.active.warning .step-num {
          background: #3B82F6;
          border-color: #3B82F6;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
        }

        /* Review Modal Glassmorphism */
        .review-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeIn 0.3s ease forwards;
        }
        .review-modal {
          background: rgba(18, 18, 18, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
          padding: 30px;
          border-radius: 20px;
          width: 100%;
          max-width: 500px;
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .star-rating-box {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin: 20px 0;
        }
        .star-rating-btn {
          background: none;
          border: none;
          font-size: 2.2rem;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.15);
          transition: transform 0.15s ease, color 0.15s ease;
        }
        .star-rating-btn:hover {
          transform: scale(1.2);
        }
        .star-rating-btn.active {
          color: #F59E0B;
          text-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
        }
        .review-textarea {
          width: 100%;
          height: 120px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px;
          color: #fff;
          font-size: 0.95rem;
          resize: none;
          margin-bottom: 20px;
          transition: border-color 0.25s ease;
        }
        .review-textarea:focus {
          outline: none;
          border-color: var(--color-primary, #F59E0B);
          background: rgba(255, 255, 255, 0.06);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="history-head">
        <h2>Lịch sử đặt phòng của tôi</h2>
        <span>{sortedBookings.length} booking</span>
      </div>

      {/* Glassmorphic Subtabs */}
      <div className="booking-subtabs">
        <button
          type="button"
          className={`subtab-btn ${subTab === "upcoming" ? "active" : ""}`}
          onClick={() => setSubTab("upcoming")}
        >
          Sắp đi ({upcomingBookings.length})
        </button>
        <button
          type="button"
          className={`subtab-btn ${subTab === "completed" ? "active" : ""}`}
          onClick={() => setSubTab("completed")}
        >
          Đã ở ({completedBookings.length})
        </button>
        <button
          type="button"
          className={`subtab-btn ${subTab === "cancelled" ? "active" : ""}`}
          onClick={() => setSubTab("cancelled")}
        >
          Đã hủy ({cancelledBookings.length})
        </button>
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
      ) : activeBookings.length === 0 ? (
        <div className="account-state">
          {subTab === "upcoming"
            ? "Bạn không có booking nào sắp diễn ra."
            : subTab === "completed"
            ? "Bạn chưa có booking nào hoàn tất."
            : "Bạn không có lịch sử booking đã hủy."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {activeBookings.map((booking) => {
            const statusMeta = getStatusMeta(booking);
            const paymentMeta = getPaymentMeta(booking.paymentStatus);
            const totalPrice = Number(booking.finalPrice || booking.totalPrice || 0);
            const nights = nightsBetween(booking.checkInDate, booking.checkOutDate);
            const allowActions = booking.status === "CONFIRMED" && statusMeta.className === "upcoming";
            const existingDispute = disputesByBookingId[booking.id];

            return (
              <article key={booking.id || `${booking.roomId}-${booking.checkInDate}`} className="booking-history-item-card" style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
              }}>
                {/* Visual Progress Stepper */}
                {renderProgressStepper(booking)}

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  marginBottom: "16px"
                }}>
                  <div>
                    <h4 style={{ margin: "0 0 6px 0", color: "var(--color-primary, #F59E0B)" }}>
                      {booking.hotel?.name || "Khách sạn mẫu"}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>
                      Phòng: {booking.room?.name || booking.roomId || "-"}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>THỜI GIAN</p>
                    <strong style={{ fontSize: "0.9rem" }}>
                      {formatDate(booking.checkInDate)} ➔ {formatDate(booking.checkOutDate)}
                    </strong>
                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginLeft: "8px" }}>
                      ({nights > 0 ? `${nights} đêm` : "-"})
                    </span>
                  </div>

                  <div>
                    <p style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>TỔNG THANH TOÁN</p>
                    <strong style={{ fontSize: "1.1rem", color: "#6EE7B7" }}>
                      {Number.isFinite(totalPrice) ? currencyFormatter.format(totalPrice) : "-"}
                    </strong>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span className={`payment-pill ${paymentMeta.className}`}>{paymentMeta.label}</span>
                    <span className={`booking-status ${statusMeta.className}`}>{statusMeta.label}</span>
                  </div>
                </div>

                {booking.note && (
                  <div style={{
                    background: "rgba(255,255,255,0.03)",
                    borderLeft: "3px solid rgba(255,255,255,0.15)",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: "16px"
                  }}>
                    <strong>Ghi chú đặt phòng:</strong> {booking.note}
                  </div>
                )}

                <div style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                  paddingTop: "16px"
                }}>
                  {allowActions ? (
                    <>
                      <button
                        type="button"
                        className="subtab-btn"
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
                        className="subtab-btn"
                        style={{ background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.2)", color: "#FCA5A5" }}
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
                      className="subtab-btn"
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

                  {/* Elegant Write Review Button for completed stay */}
                  {booking.status === "CHECKED_OUT" && (
                    <button
                      type="button"
                      className="subtab-btn"
                      style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        borderColor: "rgba(16, 185, 129, 0.25)",
                        color: "#34D399"
                      }}
                      onClick={() => handleOpenReview(booking)}
                    >
                      ★ Viết đánh giá
                    </button>
                  )}

                  {existingDispute ? (
                    <button
                      type="button"
                      className="subtab-btn"
                      onClick={() => setActiveTab("payments")}
                    >
                      Xem tranh chấp
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="subtab-btn"
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
              </article>
            );
          })}
        </div>
      )}

      {/* Premium Glassmorphic Review Modal */}
      {reviewBooking && (
        <div className="review-modal-backdrop" onClick={handleCloseReview}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "1.3rem" }}>Đánh giá phòng đã ở</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "0.9rem", color: "rgba(255,255,255,0.6)" }}>
              {reviewBooking.hotel?.name} — {reviewBooking.room?.name || reviewBooking.roomId}
            </p>

            <div style={{ textAlign: "center" }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                TRẢI NGHIỆM CỦA BẠN THẾ NÀO?
              </p>
              <div className="star-rating-box">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-rating-btn ${rating >= star ? "active" : ""}`}
                    onClick={() => setRating(star)}
                    aria-label={`${star} sao`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="review-textarea"
              placeholder="Chia sẻ chi tiết về dịch vụ phòng, sự hỗ trợ từ host hoặc các tiện ích bạn ưng ý..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="subtab-btn"
                onClick={handleCloseReview}
                disabled={reviewSaving}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="subtab-btn"
                style={{
                  background: "var(--color-primary, #F59E0B)",
                  borderColor: "var(--color-primary, #F59E0B)",
                  color: "#fff"
                }}
                onClick={handleSaveReview}
                disabled={reviewSaving}
              >
                {reviewSaving ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
