export default function HostDashboardSection({
  dashboardLoading,
  hostDashboard,
  currencyFormatter,
  formatDate,
  formatDateTime,
}) {
  const total = hostDashboard.totalBookings || 0;
  const upcomingPct = total > 0 ? (hostDashboard.upcomingBookings / total) * 100 : 0;
  const activePct = total > 0 ? (hostDashboard.activeBookings / total) * 100 : 0;
  const completedPct = total > 0 ? (hostDashboard.completedBookings / total) * 100 : 0;
  const cancelledPct = total > 0 ? (hostDashboard.cancelledBookings / total) * 100 : 0;

  // Occupancy rate estimate: active bookings out of total rooms
  const totalRooms = hostDashboard.totalRooms || 1;
  const occupancyRate = Math.min(Math.round(((hostDashboard.activeBookings || 0) / totalRooms) * 100), 100);

  return (
    <section className="host-card host-card-wide">
      <style>{`
        /* Dashboard premium enhancements */
        .host-stats-container {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-top: 20px;
        }
        @media (max-width: 991px) {
          .host-stats-container {
            grid-template-columns: 1fr;
          }
        }
        
        /* Occupancy gauge styled */
        .occupancy-gauge-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        
        .circle-gauge {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 15px 0;
        }
        .circle-bg {
          fill: none;
          stroke: rgba(255,255,255,0.05);
          stroke-width: 8px;
        }
        .circle-progress {
          fill: none;
          stroke: var(--color-primary, #F59E0B);
          stroke-width: 8px;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.6s ease;
          stroke-dasharray: 283;
          stroke-dashoffset: \${283 - (283 * occupancyRate) / 100};
          filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.4));
        }
        .gauge-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .gauge-text strong {
          font-size: 1.5rem;
          color: #fff;
          font-weight: 700;
        }
        .gauge-text span {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          margin-top: -2px;
        }

        /* SVG bar distribution */
        .chart-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        .chart-header h3 {
          margin: 0;
          font-size: 0.95rem;
          color: #fff;
        }
        .stacked-bar {
          display: flex;
          height: 24px;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255,255,255,0.05);
          margin: 20px 0;
        }
        .bar-slice {
          height: 100%;
          transition: width 0.5s ease;
        }
        .bar-slice.upcoming { background: #3B82F6; box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.5); }
        .bar-slice.active { background: #10B981; box-shadow: inset 0 0 10px rgba(16, 185, 129, 0.5); }
        .bar-slice.completed { background: #8B5CF6; box-shadow: inset 0 0 10px rgba(139, 92, 246, 0.5); }
        .bar-slice.cancelled { background: #EF4444; box-shadow: inset 0 0 10px rgba(239, 68, 68, 0.5); }

        .chart-legend {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 575px) {
          .chart-legend {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .legend-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .legend-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .legend-dot.upcoming { background: #3B82F6; }
        .legend-dot.active { background: #10B981; }
        .legend-dot.completed { background: #8B5CF6; }
        .legend-dot.cancelled { background: #EF4444; }
        .legend-item strong {
          color: #fff;
          font-size: 1rem;
        }
      `}</style>

      <div className="card-head">
        <div>
          <h2>Tổng quan vận hành booking</h2>
          <p className="inline-note">
            Theo dõi booking liên quan đến các room/hotel bạn đang quản lý.
          </p>
        </div>
      </div>

      {dashboardLoading ? (
        <p className="inline-note">đang tải thống kê booking...</p>
      ) : (
        <>
          <div className="host-list-meta-grid" style={{ marginBottom: "24px" }}>
            <article className="list-item">
              <strong>{hostDashboard.totalHotels}</strong>
              <small>Khách sạn</small>
            </article>
            <article className="list-item">
              <strong>{hostDashboard.totalRooms}</strong>
              <small>Loại phòng</small>
            </article>
            <article className="list-item">
              <strong>{hostDashboard.totalBookings}</strong>
              <small>Tổng booking</small>
            </article>
            <article className="list-item">
              <strong>{hostDashboard.upcomingBookings}</strong>
              <small>Sắp đến</small>
            </article>
            <article className="list-item">
              <strong>{hostDashboard.activeBookings}</strong>
              <small>Đang lưu trú</small>
            </article>
            <article className="list-item">
              <strong style={{ color: "#6EE7B7" }}>{currencyFormatter.format(hostDashboard.totalRevenue || 0)}</strong>
              <small>Doanh thu tính đến hiện tại</small>
            </article>
          </div>

          {/* Premium stats container containing SVG chart and Occupancy gauge */}
          <div className="host-stats-container">
            {/* 1. Stacked Bar Chart Distribution */}
            <div className="chart-box">
              <div className="chart-header">
                <h3>Phân bổ trạng thái đặt phòng</h3>
                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{total} booking</span>
              </div>
              
              {total > 0 ? (
                <div className="stacked-bar">
                  {upcomingPct > 0 && <div className="bar-slice upcoming" style={{ width: `${upcomingPct}%` }} title={`Sắp đến: ${upcomingPct.toFixed(0)}%`} />}
                  {activePct > 0 && <div className="bar-slice active" style={{ width: `${activePct}%` }} title={`Đang ở: ${activePct.toFixed(0)}%`} />}
                  {completedPct > 0 && <div className="bar-slice completed" style={{ width: `${completedPct}%` }} title={`Hoàn thành: ${completedPct.toFixed(0)}%`} />}
                  {cancelledPct > 0 && <div className="bar-slice cancelled" style={{ width: `${cancelledPct}%` }} title={`Đã hủy: ${cancelledPct.toFixed(0)}%`} />}
                </div>
              ) : (
                <div style={{ height: "24px", margin: "20px 0", background: "rgba(255,255,255,0.03)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>
                  Chưa có dữ liệu phân bổ
                </div>
              )}

              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-label">
                    <span className="legend-dot upcoming"></span>
                    Sắp đến
                  </span>
                  <strong>{hostDashboard.upcomingBookings}</strong>
                </div>
                <div className="legend-item">
                  <span className="legend-label">
                    <span className="legend-dot active"></span>
                    Đang ở
                  </span>
                  <strong>{hostDashboard.activeBookings}</strong>
                </div>
                <div className="legend-item">
                  <span className="legend-label">
                    <span className="legend-dot completed"></span>
                    Hoàn thành
                  </span>
                  <strong>{hostDashboard.completedBookings}</strong>
                </div>
                <div className="legend-item">
                  <span className="legend-label">
                    <span className="legend-dot cancelled"></span>
                    Đã hủy
                  </span>
                  <strong>{hostDashboard.cancelledBookings}</strong>
                </div>
              </div>
            </div>

            {/* 2. Round Occupancy Rate Gauge */}
            <div className="occupancy-gauge-card">
              <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#fff" }}>Độ lấp đầy phòng</h3>
              <div className="circle-gauge">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle className="circle-bg" cx="60" cy="60" r="45" />
                  <circle className="circle-progress" cx="60" cy="60" r="45" transform="rotate(-90 60 60)" />
                </svg>
                <div className="gauge-text">
                  <strong>{occupancyRate}%</strong>
                  <span>Đang dùng</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                Dựa trên {hostDashboard.activeBookings} phòng đang ở / {hostDashboard.totalRooms} phòng quản lý
              </p>
            </div>
          </div>

          <div className="host-list" style={{ marginTop: "24px" }}>
            <h3>Booking gần đây</h3>
            {hostDashboard.recentBookings.length === 0 ? (
              <p className="inline-note">Chưa có booking nào liên quan đến danh sách phòng của bạn.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {hostDashboard.recentBookings.slice(0, 6).map((booking) => (
                  <article key={booking.bookingId} className="list-item list-item-stack" style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.04)",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}>
                    <div className="list-item-main" style={{ width: "100%" }}>
                      <div className="list-item-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <strong style={{ fontSize: "0.95rem", color: "#fff" }}>{booking.hotelName || "Khách sạn"}</strong>
                        <span className="status-chip neutral" style={{
                          background: booking.status === "CANCELLED" ? "rgba(239, 68, 68, 0.15)" : booking.status === "CHECKED_OUT" ? "rgba(139, 92, 246, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          color: booking.status === "CANCELLED" ? "#FCA5A5" : booking.status === "CHECKED_OUT" ? "#C4B5FD" : "#A7F3D0",
                          border: "1px solid transparent",
                          fontSize: "0.75rem",
                          padding: "2px 8px",
                          borderRadius: "10px"
                        }}>{booking.status || "-"}</span>
                      </div>
                      <p style={{ margin: "0 0 6px 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                        {booking.roomName || "Loại phòng"} - {booking.userName || booking.userId || "Khách"}
                      </p>
                      <small style={{ display: "block", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>
                        Thời gian: {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                      </small>
                      <div className="list-item-meta" style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,0.4)",
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                        paddingTop: "8px"
                      }}>
                        <span>Thanh toán: <strong style={{ color: booking.paymentStatus === "PAID" ? "#6EE7B7" : "#FDE68A" }}>{booking.paymentStatus || "-"}</strong></span>
                        <span>{currencyFormatter.format(Number(booking.finalPrice || 0))}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
