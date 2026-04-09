export default function OverviewView({
 numberFormatter,
 dashboard,
 userSummary,
 citySummary,
 currencyFormatter,
 averageRoomPrice,
 overviewStatus,
 monthlyRevenue,
 topBarMax,
 occupancyRows,
 sortedBookings,
 shortId,
 formatDate,
 bookingRevenueValue,
 paymentSummary,
 couponSummary,
 openView,
}) {
 const activeOccupancyRows = occupancyRows.filter(
 (hotel) => Number(hotel?.occupancy || 0) > 0
 );
 const occupancyDisplayRows = activeOccupancyRows.slice(0, 6);
 const hasActiveOccupancy = occupancyDisplayRows.length > 0;

 const formatOccupancyPercent = (value) => {
 const normalized = Number(value || 0);
 return `${normalized.toLocaleString("vi-VN", {
 minimumFractionDigits: 0,
 maximumFractionDigits: 1,
 })}%`;
 };

 return (
 <>
 <section className="kpi-grid">
 <article className="kpi-card">
 <p className="kpi-label">Tổng người dùng</p>
 <h3>{numberFormatter.format(dashboard.totalUsers || 0)}</h3>
 <p className="kpi-trend up">{userSummary.admins} admin đang quản lý</p>
 </article>
 <article className="kpi-card">
 <p className="kpi-label">Tổng khách sạn</p>
 <h3>{numberFormatter.format(dashboard.totalHotels || 0)}</h3>
 <p className="kpi-trend up">{citySummary.length} thành phố nổi bật</p>
 </article>
 <article className="kpi-card">
 <p className="kpi-label">Tổng phòng</p>
 <h3>{numberFormatter.format(dashboard.totalRooms || 0)}</h3>
 <p className="kpi-trend up">
 Giá TB {currencyFormatter.format(averageRoomPrice || 0)}
 </p>
 </article>
 <article className="kpi-card">
 <p className="kpi-label">Tổng booking</p>
 <h3>{numberFormatter.format(dashboard.totalBookings || 0)}</h3>
 <p className="kpi-trend down">
 {overviewStatus.upcoming} sắp đến | {overviewStatus.cancelled} đã hủy
 </p>
 </article>
 </section>

 <section className="analytics-grid">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Doanh thu 7 tháng gần nhất</p>
 <h2>{currencyFormatter.format(dashboard.totalRevenue || 0)}</h2>
 </div>
 <span className="panel-badge">{overviewStatus.active} đang lưu trú</span>
 </div>

 <div className="revenue-chart">
 {monthlyRevenue.map((item) => (
 <div key={item.key} className="bar-col">
 <div className="bar-track">
 <span
 className="bar-fill"
 style={{
 height: `${Math.max((item.value / topBarMax) * 100, 5)}%`,
 }}
 />
 </div>
 <strong>{item.label}</strong>
 <span>{numberFormatter.format(Math.round(item.value / 1000000))}M</span>
 </div>
 ))}
 </div>
 </article>

 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Hiệu suất lấp đầy</p>
 <h2>Top hotel lấp đầy cao nhất</h2>
 <p className="occupancy-caption">
 {hasActiveOccupancy
 ? `${occupancyDisplayRows.length} hotel đang có khách lưu trú`
 : "Hiện chưa có khách check-in, tỷ lệ lấp đầy đang ở mức 0%"}
 </p>
 </div>
 </div>

 <div className="occupancy-list">
 {hasActiveOccupancy ? (
 occupancyDisplayRows.map((hotel) => (
 <div key={hotel.id} className="occupancy-row">
 <div className="occupancy-title">
 <span>{hotel.name || "Khách sạn"}</span>
 <strong>{formatOccupancyPercent(hotel.occupancy)}</strong>
 </div>
 <p className="occupancy-meta">
 {hotel.activeStays || 0}/{hotel.totalRooms || 0} phòng đang ở
 </p>
 <div className="progress">
 <span style={{ width: `${Math.max(Number(hotel.occupancy || 0), 2)}%` }} />
 </div>
 </div>
 ))
 ) : (
 <div className="admin-empty-state occupancy-empty">
 Hệ thống chưa ghi nhận khách đang lưu trú theo thời gian thực.
 </div>
 )}
 </div>
 </article>
 </section>

 <section className="bottom-grid">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Booking gần đây</p>
 <h2>Danh sách đặt phòng mới nhất</h2>
 </div>
 </div>

 <div className="table-wrap">
 <table>
 <thead>
 <tr>
 <th>Mã</th>
 <th>Người đặt</th>
 <th>Khách sạn</th>
 <th>Ngày ở</th>
 <th>Tổng tiền</th>
 <th>Trạng thái</th>
 </tr>
 </thead>
 <tbody>
 {sortedBookings.slice(0, 8).map((booking) => (
 <tr key={booking.id}>
 <td>{shortId(booking.id)}</td>
 <td>{booking.user?.name || booking.user?.email || "-"}</td>
 <td>{booking.hotel?.name || "-"}</td>
 <td>
 {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
 </td>
 <td>{currencyFormatter.format(bookingRevenueValue(booking))}</td>
 <td>
 <span className={`status-pill ${booking.status.className}`}>
 {booking.status.label}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </article>

 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Tổng quan nhanh</p>
 <h2>Dữ liệu vận hành</h2>
 </div>
 </div>

 <div className="type-grid">
 <article className="type-card">
 <h3>Trạng thái booking</h3>
 <p>
 Sắp đến: {overviewStatus.upcoming} | Đang ở: {overviewStatus.active} | Hoàn tất:{" "}
 {overviewStatus.completed} | Đã hủy: {overviewStatus.cancelled}
 </p>
 <button type="button" onClick={() => openView("bookings")}>
 Xem booking
 </button>
 </article>
 <article className="type-card">
 <h3>Thanh toán</h3>
 <p>
 Đã thanh toán: {paymentSummary.paid} | Chờ thanh toán: {paymentSummary.pending} |
 Hoàn tiền: {paymentSummary.refunded} | Thất bại: {paymentSummary.failed}
 </p>
 <button type="button" onClick={() => openView("bookings")}>
 Xem payment
 </button>
 </article>
 <article className="type-card">
 <h3>Phân bố thành phố</h3>
 <p>
 {citySummary.length
 ? citySummary.map((item) => `${item.city} (${item.count})`).join(", ")
 : "Chưa có dữ liệu thành phố"}
 </p>
 <button type="button" onClick={() => openView("hotels")}>
 Xem hotels
 </button>
 </article>
 <article className="type-card">
 <h3>Coupon đang dùng</h3>
 <p>
 Hoạt động: {couponSummary.active} | Hết hạn: {couponSummary.expired} | Tạm tắt:{" "}
 {couponSummary.inactive}
 </p>
 <button type="button" onClick={() => openView("coupons")}>
 Quản lý coupon
 </button>
 </article>
 <article className="type-card">
 <h3>Phân quyền người dùng</h3>
 <p>
 Admin: {userSummary.admins} | User: {userSummary.usersNormal} | Tổng:{" "}
 {userSummary.total}
 </p>
 <button type="button" onClick={() => openView("users")}>
 Xem users
 </button>
 </article>
 </div>
 </article>
 </section>
 </>
 );
}

