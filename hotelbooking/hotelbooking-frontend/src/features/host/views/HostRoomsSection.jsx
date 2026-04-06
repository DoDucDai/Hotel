export default function HostRoomsSection({
 editingRoomId,
 resetRoomForm,
 handleSubmitRoom,
 savingRoom,
 hotels,
 roomForm,
 handleRoomChange,
 rooms,
 hotelsById,
 inventoryRoomId,
 currencyFormatter,
 handleEditRoom,
 setInventoryRoomId,
 handleDeleteRoomRequest,
}) {
 return (
 <section className="host-card">
 <div className="card-head">
 <h2>{editingRoomId ? "Chỉnh sửa loại phòng" : "Tạo loại phòng mới"}</h2>
 {editingRoomId && (
 <button type="button" className="ghost-btn" onClick={resetRoomForm}>
 Hủy sửa
 </button>
 )}
 </div>

 <form className="host-form" onSubmit={handleSubmitRoom}>
 <label>
 <span>Chọn khách sạn</span>
 <select
 name="hotelId"
 value={roomForm.hotelId}
 onChange={handleRoomChange}
 required
 disabled={!hotels.length}
 >
 {!hotels.length ? <option value="">Cần tạo khách sạn trước</option> : null}
 {hotels.map((hotel) => (
 <option key={hotel.id} value={hotel.id}>
 {hotel.name} - {hotel.city}
 </option>
 ))}
 </select>
 </label>

 <label>
 <span>Tên phòng</span>
 <input
 name="name"
 value={roomForm.name}
 onChange={handleRoomChange}
 placeholder="Phòng Deluxe, Phòng đôi..."
 required
 />
 </label>

 <div className="field-row">
 <label>
 <span>Loại phòng</span>
 <input
 name="roomType"
 value={roomForm.roomType}
 onChange={handleRoomChange}
 placeholder="STANDARD, DELUXE, SUITE..."
 />
 </label>

 <label>
 <span>Loại giường</span>
 <input
 name="bedType"
 value={roomForm.bedType}
 onChange={handleRoomChange}
 placeholder="1 king bed, 2 queen..."
 />
 </label>
 </div>

 <div className="field-row">
 <label>
 <span>Sức chứa</span>
 <input
 name="capacity"
 type="number"
 min="1"
 value={roomForm.capacity}
 onChange={handleRoomChange}
 required
 />
 </label>

 <label>
 <span>Giá / đêm (VND)</span>
 <input
 name="price"
 type="number"
 min="0"
 step="10000"
 value={roomForm.price}
 onChange={handleRoomChange}
 required
 />
 </label>
 </div>

 <div className="field-row">
 <label>
 <span>Tổng số phòng</span>
 <input
 name="totalUnits"
 type="number"
 min="1"
 value={roomForm.totalUnits}
 onChange={handleRoomChange}
 required
 />
 </label>

 <label>
 <span>Tiện nghi phòng</span>
 <input
 name="amenities"
 value={roomForm.amenities}
 onChange={handleRoomChange}
 placeholder="Máy lạnh, Ban công, Bồn tắm..."
 />
 </label>
 </div>

 <label>
 <span>Mô tả ngắn</span>
 <textarea
 name="description"
 value={roomForm.description}
 onChange={handleRoomChange}
 placeholder="Mô tả điểm khác biệt của loại phòng này"
 />
 </label>

 <button type="submit" disabled={savingRoom || !hotels.length}>
 {savingRoom ? "Đang lưu..." : editingRoomId ? "Lưu loại phòng" : "Tạo loại phòng"}
 </button>
 </form>

 <div className="host-list">
 <h3>Danh sách loại phòng đã đăng</h3>
 {rooms.length === 0 ? (
 <p className="inline-note">Chưa có phòng nào được đăng.</p>
 ) : (
 rooms.map((room) => {
 const hotel = hotelsById[room.hotelId];
 const activeInventory = inventoryRoomId === room.id;
 return (
 <article key={room.id} className="list-item list-item-stack">
 <div className="list-item-main">
 <div className="list-item-top">
 <strong>{room.name}</strong>
 <span className={`status-chip ${activeInventory ? "info" : "neutral"}`}>
 {room.roomType || "STANDARD"}
 </span>
 </div>
 <p>{hotel?.name || "Khách sạn không tồn tại"}</p>
 <small>
 {room.capacity} khách -{" "}
 {Number.isFinite(Number(room.price))
 ? currencyFormatter.format(Number(room.price))
 : "-"}
 </small>
 <div className="list-item-meta">
 <span>Tổng số phòng: {room.totalUnits || 1}</span>
 <span>Còn trống: {room.availableUnits ?? room.totalUnits ?? 1}</span>
 <span>{room.bedType || "Chưa khai báo loại giường"}</span>
 </div>
 {room.description ? <p className="approval-note">{room.description}</p> : null}
 </div>
 <div className="item-actions item-actions-stack">
 <button type="button" onClick={() => handleEditRoom(room)}>
 Sửa
 </button>
 <button
 type="button"
 className={activeInventory ? "active" : ""}
 onClick={() => setInventoryRoomId(room.id)}
 >
 Tồn kho
 </button>
 <button
 type="button"
 className="danger"
 onClick={() => handleDeleteRoomRequest(room)}
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


