export default function HotelsHeroSection({
 totalHotels,
 totalCities,
 topRatedCount,
}) {
 return (
 <section className="hotels-container hotels-hero">
 <div className="hotels-hero-content">
 <span className="hotels-badge">Danh sách khách sạn toàn quốc</span>
 <h1>Lọc theo giá, rating, sao, tiện nghi và lưu khách sạn yêu thích</h1>
 <p>
 Ngoài tìm theo địa điểm và lịch ở, bạn có thể lọc sâu hơn theo mức giá, điểm
 đánh giá, hạng sao, tiện nghi và danh sách wishlist của riêng mình.
 </p>

 <div className="hotels-metrics">
 <article className="metric-card">
 <strong>{totalHotels}+</strong>
 <span>Khách sạn</span>
 </article>
 <article className="metric-card">
 <strong>{totalCities}+</strong>
 <span>Thành phố</span>
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
