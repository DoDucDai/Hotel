export default function HostDashboardSection({
 dashboardLoading,
 hostDashboard,
 currencyFormatter,
 formatDate,
 formatDateTime,
}) {
 return (
 <section className="host-card host-card-wide">
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
 <div className="host-list-meta-grid">
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
 <strong>{currencyFormatter.format(hostDashboard.totalRevenue || 0)}</strong>
 <small>Doanh thu tính đến hiện tại</small>
 </article>
 </div>

 <div className="host-list">
 <h3>Booking gần đây</h3>
 {hostDashboard.recentBookings.length === 0 ? (
 <p className="inline-note">Chưa có booking nào liên quan đến danh sách phòng của bạn.</p>
 ) : (
 hostDashboard.recentBookings.slice(0, 8).map((booking) => (
 <article key={booking.bookingId} className="list-item list-item-stack">
 <div className="list-item-main">
 <div className="list-item-top">
 <strong>{booking.hotelName || "Khách sạn"}</strong>
 <span className="status-chip neutral">{booking.status || "-"}</span>
 </div>
 <p>
 {booking.roomName || "Loại phòng"} - {booking.userName || booking.userId || "Khách"}
 </p>
 <small>
 {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)} -{" "}
 {currencyFormatter.format(Number(booking.finalPrice || 0))}
 </small>
 <div className="list-item-meta">
 <span>Payment: {booking.paymentStatus || "-"}</span>
 <span>Tạo lúc: {formatDateTime(booking.createdAt)}</span>
 </div>
 </div>
 </article>
 ))
 )}
 </div>
 </>
 )}
 </section>
 );
}

