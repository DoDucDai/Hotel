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
 <h2>{editingHotelId ? "Chinh sua khach san" : "Tao khach san moi"}</h2>
 {editingHotelId && (
 <button type="button" className="ghost-btn" onClick={resetHotelForm}>
 Huy sua
 </button>
 )}
 </div>

 <form className="host-form" onSubmit={handleSubmitHotel}>
 <label>
 <span>Ten khach san</span>
 <input
 name="name"
 value={hotelForm.name}
 onChange={handleHotelChange}
 placeholder="Vi du: Happy Stay"
 required
 />
 </label>

 <label>
 <span>Dia chi</span>
 <input
 name="address"
 value={hotelForm.address}
 onChange={handleHotelChange}
 placeholder="So nha, duong, phuong"
 required
 />
 </label>

 <label>
 <span>Thanh pho</span>
 <input
 name="city"
 value={hotelForm.city}
 onChange={handleHotelChange}
 placeholder="Ha Noi, Da Nang..."
 required
 />
 </label>

 <div className="field-row">
 <label>
 <span>So sao</span>
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
 <span>Tien nghi</span>
 <input
 name="amenities"
 value={hotelForm.amenities}
 onChange={handleHotelChange}
 placeholder="Wifi, Bai do xe, Le tan 24/7"
 />
 </label>
 </div>

 <div className="field-row">
 <label>
 <span>Huy mien phi truoc (ngay)</span>
 <input
 name="freeCancellationBeforeDays"
 type="number"
 min="0"
 value={hotelForm.freeCancellationBeforeDays}
 onChange={handleHotelChange}
 />
 </label>

 <label>
 <span>Hoan tien tre (%)</span>
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
 {savingHotel ? "dang luu..." : editingHotelId ? "Lu khach san" : "Tao khach san"}
 </button>
 </form>

 <div className="host-list">
 <h3>Khach san cua ban</h3>
 {hotels.length === 0 ? (
 <p className="inline-note">Ban chua tao khach san nao.</p>
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
 <span>Huy mien phi truoc {hotel.freeCancellationBeforeDays ?? 0} ngay</span>
 <span>Hoan tien muon {hotel.lateCancellationRefundRate ?? 0}%</span>
 <span>Duyet luc {hotel.approvedAt ? formatDateTime(hotel.approvedAt) : "-"}</span>
 </div>
 {hotel.approvalNote ? (
 <p className="approval-note">Ghi chu admin: {hotel.approvalNote}</p>
 ) : null}
 </div>
 <div className="item-actions">
 <button type="button" onClick={() => handleEditHotel(hotel)}>
 Sua
 </button>
 <button
 type="button"
 className="danger"
 onClick={() => handleDeleteHotelRequest(hotel)}
 >
 Xoa
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
