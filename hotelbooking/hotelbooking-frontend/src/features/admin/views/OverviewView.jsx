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
 return (
 <>
 <section className="kpi-grid">
 <article className="kpi-card">
 <p className="kpi-label">Tng nguoi dung</p>
 <h3>{numberFormatter.format(dashboard.totalUsers || 0)}</h3>
 <p className="kpi-trend up">{userSummary.admins} admin dang quan ly</p>
 </article>
 <article className="kpi-card">
 <p className="kpi-label">Tng khach san</p>
 <h3>{numberFormatter.format(dashboard.totalHotels || 0)}</h3>
 <p className="kpi-trend up">{citySummary.length} thanh phi noi bat</p>
 </article>
 <article className="kpi-card">
 <p className="kpi-label">Tng phong</p>
 <h3>{numberFormatter.format(dashboard.totalRooms || 0)}</h3>
 <p className="kpi-trend up">
 Gia TB {currencyFormatter.format(averageRoomPrice || 0)}
 </p>
 </article>
 <article className="kpi-card">
 <p className="kpi-label">Tng booking</p>
 <h3>{numberFormatter.format(dashboard.totalBookings || 0)}</h3>
 <p className="kpi-trend down">
 {overviewStatus.upcoming} sap ?en | {overviewStatus.cancelled} da huy
 </p>
 </article>
 </section>

 <section className="analytics-grid">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Doanh thu 7 thang gan nhat</p>
 <h2>{currencyFormatter.format(dashboard.totalRevenue || 0)}</h2>
 </div>
 <span className="panel-badge">{overviewStatus.active} dang luu tru</span>
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
 <p className="panel-tag">Hieu suat lap day</p>
 <h2>Top hotel lap day cao nhat</h2>
 </div>
 </div>

 <div className="occupancy-list">
 {occupancyRows.length ? (
 occupancyRows.map((hotel) => (
 <div key={hotel.id} className="occupancy-row">
 <div className="occupancy-title">
 <span>{hotel.name || "Khach san"}</span>
 <strong>{hotel.occupancy}%</strong>
 </div>
 <div className="progress">
 <span style={{ width: `${hotel.occupancy}%` }} />
 </div>
 </div>
 ))
 ) : (
 <div className="admin-empty-state">Cha co ?O lieu occupancy theo hotel.</div>
 )}
 </div>
 </article>
 </section>

 <section className="bottom-grid">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Booking gan day</p>
 <h2>Danh sach ?at phong moi nhat</h2>
 </div>
 </div>

 <div className="table-wrap">
 <table>
 <thead>
 <tr>
 <th>Ma</th>
 <th>Nguoi dat</th>
 <th>Khach san</th>
 <th>Ngy o</th>
 <th>Tng tien</th>
 <th>Trang thai</th>
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
 <p className="panel-tag">Tng quan nhanh</p>
 <h2>DO lieu van hanh</h2>
 </div>
 </div>

 <div className="type-grid">
 <article className="type-card">
 <h3>Trang thai booking</h3>
 <p>
 Sap ?en: {overviewStatus.upcoming} | Dang ?: {overviewStatus.active} | Hoan tat:{" "}
 {overviewStatus.completed} | Da huy: {overviewStatus.cancelled}
 </p>
 <button type="button" onClick={() => openView("bookings")}>
 Xem booking
 </button>
 </article>
 <article className="type-card">
 <h3>Thanh toan</h3>
 <p>
 Da thanh toan: {paymentSummary.paid} | Cho thanh toan: {paymentSummary.pending} |
 Hoan tien: {paymentSummary.refunded} | Thet bai: {paymentSummary.failed}
 </p>
 <button type="button" onClick={() => openView("bookings")}>
 Xem payment
 </button>
 </article>
 <article className="type-card">
 <h3>Phan bo thanh phi</h3>
 <p>
 {citySummary.length
 ? citySummary.map((item) => `${item.city} (${item.count})`).join(", ")
 : "Cha co ?O lieu thanh phi"}
 </p>
 <button type="button" onClick={() => openView("hotels")}>
 Xem hotels
 </button>
 </article>
 <article className="type-card">
 <h3>Coupon dang dung</h3>
 <p>
 Hoat dong: {couponSummary.active} | Het han: {couponSummary.expired} | Tam tat:{" "}
 {couponSummary.inactive}
 </p>
 <button type="button" onClick={() => openView("coupons")}>
 Quan ly coupon
 </button>
 </article>
 <article className="type-card">
 <h3>Phan quyen nguoi dung</h3>
 <p>
 Admin: {userSummary.admins} | User: {userSummary.usersNormal} | Tng:{" "}
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
