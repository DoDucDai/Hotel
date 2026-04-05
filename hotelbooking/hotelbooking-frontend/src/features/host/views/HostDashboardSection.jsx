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
 <h2>Tong quan van hanh booking</h2>
 <p className="inline-note">
 Theo doi booking lien quan den cac room/hotel ban dang quan ly.
 </p>
 </div>
 </div>

 {dashboardLoading ? (
 <p className="inline-note">dang tai thong ke booking...</p>
 ) : (
 <>
 <div className="host-list-meta-grid">
 <article className="list-item">
 <strong>{hostDashboard.totalHotels}</strong>
 <small>Khach san</small>
 </article>
 <article className="list-item">
 <strong>{hostDashboard.totalRooms}</strong>
 <small>Loai phong</small>
 </article>
 <article className="list-item">
 <strong>{hostDashboard.totalBookings}</strong>
 <small>Tong booking</small>
 </article>
 <article className="list-item">
 <strong>{hostDashboard.upcomingBookings}</strong>
 <small>Sap den</small>
 </article>
 <article className="list-item">
 <strong>{hostDashboard.activeBookings}</strong>
 <small>Dang luu tru</small>
 </article>
 <article className="list-item">
 <strong>{currencyFormatter.format(hostDashboard.totalRevenue || 0)}</strong>
 <small>Doanh thu tinh den hien tai</small>
 </article>
 </div>

 <div className="host-list">
 <h3>Booking gan day</h3>
 {hostDashboard.recentBookings.length === 0 ? (
 <p className="inline-note">Cha co booking nao lien quan den danh sach phong cua ban.</p>
 ) : (
 hostDashboard.recentBookings.slice(0, 8).map((booking) => (
 <article key={booking.bookingId} className="list-item list-item-stack">
 <div className="list-item-main">
 <div className="list-item-top">
 <strong>{booking.hotelName || "Khach san"}</strong>
 <span className="status-chip neutral">{booking.status || "-"}</span>
 </div>
 <p>
 {booking.roomName || "Loai phong"} - {booking.userName || booking.userId || "Khach"}
 </p>
 <small>
 {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)} -{" "}
 {currencyFormatter.format(Number(booking.finalPrice || 0))}
 </small>
 <div className="list-item-meta">
 <span>Payment: {booking.paymentStatus || "-"}</span>
 <span>Tao luc: {formatDateTime(booking.createdAt)}</span>
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
