export default function HostHotelsSection({
 editingHotelId,
 resetHotelForm,
 handleSubmitHotel,
 savingHotel,
 hotelForm,
 handleHotelChange,
 hotels,
 approvalMeta,
 formatDateTime,
 handleEditHotel,
 handleDeleteHotelRequest,
}) {
 return (
 <section className="host-card">
 <div className="card-head">
 <h2>{editingHotelId ? "Chỉnh sửa khách sạn" : "Tạo khách sạn mới"}</h2>
 {editingHotelId && (
 <button type="button" className="ghost-btn" onClick={resetHotelForm}>
 Hủy sửa
 </button>
 )}
 </div>

 <form className="host-form" onSubmit={handleSubmitHotel}>
 <label>
 <span>Tên khách sạn</span>
 <input
 name="name"
 value={hotelForm.name}
 onChange={handleHotelChange}
 placeholder="Ví dụ: Happy Stay"
 required
 />
 </label>

 <label>
 <span>Địa chỉ</span>
 <input
 name="address"
 value={hotelForm.address}
 onChange={handleHotelChange}
 placeholder="Số nhà, đường, phường"
 required
 />
 </label>

 <label>
 <span>Thành phố</span>
 <input
 name="city"
 value={hotelForm.city}
 onChange={handleHotelChange}
 placeholder="Hà Nội, Đà Nẵng..."
 required
 />
 </label>

 <div className="field-row">
 <label>
 <span>Số sao</span>
 <input
 name="starRating"
 type="number"
 min="1"
 max="5"
 value={hotelForm.starRating}
 onChange={handleHotelChange}
 required
 />
 </label>

 <label>
 <span>Tiện nghi</span>
 <input
 name="amenities"
 value={hotelForm.amenities}
 onChange={handleHotelChange}
 placeholder="Wifi, Bãi đỗ xe, Lễ tân 24/7"
 />
 </label>
 </div>

 <div className="field-row">
 <label>
 <span>Hủy miễn phí trước (ngày)</span>
 <input
 name="freeCancellationBeforeDays"
 type="number"
 min="0"
 value={hotelForm.freeCancellationBeforeDays}
 onChange={handleHotelChange}
 />
 </label>

 <label>
 <span>Hoàn tiền trễ (%)</span>
 <input
 name="lateCancellationRefundRate"
 type="number"
 min="0"
 max="100"
 value={hotelForm.lateCancellationRefundRate}
 onChange={handleHotelChange}
 />
 </label>
 </div>

 <button type="submit" disabled={savingHotel}>
 {savingHotel ? "Đang lưu..." : editingHotelId ? "Lưu khách sạn" : "Tạo khách sạn"}
 </button>
 </form>

 <div className="host-list">
 <h3>Khách sạn của bạn</h3>
 {hotels.length === 0 ? (
 <p className="inline-note">Bạn chưa tạo khách sạn nào.</p>
 ) : (
 hotels.map((hotel) => {
 const meta = approvalMeta(hotel.approvalStatus);

 return (
 <article key={hotel.id} className="list-item list-item-stack">
 <div className="list-item-main">
 <div className="list-item-top">
 <strong>{hotel.name}</strong>
 <span className={`status-chip ${meta.className}`}>{meta.label}</span>
 </div>
 <p>{hotel.address}</p>
 <small>
 {hotel.city} - {hotel.starRating || 3} sao
 {Array.isArray(hotel.amenities) && hotel.amenities.length
 ? ` - ${hotel.amenities.join(", ")}`
 : ""}
 </small>
 <div className="list-item-meta">
 <span>Hủy miễn phí trước {hotel.freeCancellationBeforeDays ?? 0} ngày</span>
 <span>Hoàn tiền muộn {hotel.lateCancellationRefundRate ?? 0}%</span>
 <span>Duyệt lúc {hotel.approvedAt ? formatDateTime(hotel.approvedAt) : "-"}</span>
 </div>
 {hotel.approvalNote ? (
 <p className="approval-note">Ghi chú admin: {hotel.approvalNote}</p>
 ) : null}
 </div>
 <div className="item-actions">
 <button type="button" onClick={() => handleEditHotel(hotel)}>
 Sửa
 </button>
 <button
 type="button"
 className="danger"
 onClick={() => handleDeleteHotelRequest(hotel)}
 >
 Xóa
 </button>
 </div>
 </article>
 );
 })
 )}
 </div>
 </section>
 );
}


