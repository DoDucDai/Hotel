export default function HotelsHeroSection({
 totalHotels,
 totalCities,
 topRatedCount,
}) {
 return (
 <section className="hotels-container hotels-hero">
 <div className="hotels-hero-content">
 <span className="hotels-badge">Danh sach khach san toan quoc</span>
 <h1>Loc theo gia, rating, sao, tien nghi va luu khach san yeu thich</h1>
 <p>
 Ngoai tim theo dua diem va lich o, ban c? the loc sau hon theo muc gia, diem
 danh gia, hang sao, tien nghi va danh sach wishlist cua rieng minh.
 </p>

 <div className="hotels-metrics">
 <article className="metric-card">
 <strong>{totalHotels}+</strong>
 <span>Khach san</span>
 </article>
 <article className="metric-card">
 <strong>{totalCities}+</strong>
 <span>Thonh phi</span>
 </article>
 <article className="metric-card">
 <strong>{topRatedCount}</strong>
 <span>Rating 4.5+</span>
 </article>
 </div>
 </div>
 </section>
 );
}
