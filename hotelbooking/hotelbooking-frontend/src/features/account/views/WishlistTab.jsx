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
        <h2>Khach san yeu thich</h2>
        <span>{wishlistItems.length} muc</span>
      </div>

      {wishlistLoading ? (
        <div className="account-state">Dang tai wishlist...</div>
      ) : wishlistError ? (
        <div className="account-state">{wishlistError}</div>
      ) : wishlistItems.length === 0 ? (
        <div className="account-state">Wishlist cua ban dang trong.</div>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map((item) => {
            const hotel = item.hotel;
            if (!hotel) {
              return null;
            }

            return (
              <article key={item.hotelId} className="wishlist-card">
                <p className="wishlist-city">{hotel.city || "Da diem noi bat"}</p>
                <h3>{hotel.name || "Khach san"}</h3>
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
                    Xem chi tiet
                  </button>
                  <button
                    type="button"
                    className="table-action-btn danger"
                    onClick={() => handleRemoveWishlist(item.hotelId)}
                  >
                    Xoa
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
