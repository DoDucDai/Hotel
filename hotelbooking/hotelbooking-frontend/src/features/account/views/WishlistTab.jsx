export default function WishlistTab({
  wishlistItems,
  wishlistLoading,
  wishlistError,
  navigate,
  handleRemoveWishlist,
}) {
  return (
    <section className="account-card">
      <div className="history-head">
        <h2>Khách sạn yêu thích</h2>
        <span>{wishlistItems.length} mục</span>
      </div>

      {wishlistLoading ? (
        <div className="account-state">Đang tải wishlist...</div>
      ) : wishlistError ? (
        <div className="account-state">{wishlistError}</div>
      ) : wishlistItems.length === 0 ? (
        <div className="account-state">Wishlist của bạn đang trống.</div>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map((item) => {
            const hotel = item.hotel;
            if (!hotel) {
              return null;
            }

            return (
              <article key={item.hotelId} className="wishlist-card">
                <p className="wishlist-city">{hotel.city || "Địa điểm nổi bật"}</p>
                <h3>{hotel.name || "Khách sạn"}</h3>
                <p>{hotel.address || "-"}</p>
                <small>
                  {hotel.starRating || 3} sao
                  {hotel.averageRating ? ` - rating ${Number(hotel.averageRating).toFixed(1)}` : ""}
                </small>
                <div className="wishlist-actions">
                  <button
                    type="button"
                    className="table-action-btn"
                    onClick={() =>
                      navigate(`/hotels/${hotel.id}`, {
                        state: { hotel },
                      })
                    }
                  >
                    Xem chi tiết
                  </button>
                  <button
                    type="button"
                    className="table-action-btn danger"
                    onClick={() => handleRemoveWishlist(item.hotelId)}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}


