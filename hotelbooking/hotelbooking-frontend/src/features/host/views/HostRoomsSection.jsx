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
 <h2>{editingRoomId ? "Chinh sua loai phong" : "Tao loai phong moi"}</h2>
 {editingRoomId && (
 <button type="button" className="ghost-btn" onClick={resetRoomForm}>
 Huy sua
 </button>
 )}
 </div>

 <form className="host-form" onSubmit={handleSubmitRoom}>
 <label>
 <span>Chon khach san</span>
 <select
 name="hotelId"
 value={roomForm.hotelId}
 onChange={handleRoomChange}
 required
 disabled={!hotels.length}
 >
 {!hotels.length ? <option value="">Can tao khach san truoc</option> : null}
 {hotels.map((hotel) => (
 <option key={hotel.id} value={hotel.id}>
 {hotel.name} - {hotel.city}
 </option>
 ))}
 </select>
 </label>

 <label>
 <span>Ten phong</span>
 <input
 name="name"
 value={roomForm.name}
 onChange={handleRoomChange}
 placeholder="Phong Deluxe, Phong doi..."
 required
 />
 </label>

 <div className="field-row">
 <label>
 <span>Loai phong</span>
 <input
 name="roomType"
 value={roomForm.roomType}
 onChange={handleRoomChange}
 placeholder="STANDARD, DELUXE, SUITE..."
 />
 </label>

 <label>
 <span>Loai giuong</span>
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
 <span>Suc chua</span>
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
 <span>Gia / dem (VND)</span>
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
 <span>Tong so phong</span>
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
 <span>Tien nghi phong</span>
 <input
 name="amenities"
 value={roomForm.amenities}
 onChange={handleRoomChange}
 placeholder="May lanh, Ban cong, Bon tam..."
 />
 </label>
 </div>

 <label>
 <span>Mo ta ngan</span>
 <textarea
 name="description"
 value={roomForm.description}
 onChange={handleRoomChange}
 placeholder="Mo ta diem khac biet cua loai phong nay"
 />
 </label>

 <button type="submit" disabled={savingRoom || !hotels.length}>
 {savingRoom ? "dang luu..." : editingRoomId ? "Lu loai phong" : "Tao loai phong"}
 </button>
 </form>

 <div className="host-list">
 <h3>Danh sach loai phong da dang</h3>
 {rooms.length === 0 ? (
 <p className="inline-note">Cha co phong nao duoc dang.</p>
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
 <p>{hotel?.name || "Khach san khong ton tai"}</p>
 <small>
 {room.capacity} khach -{" "}
 {Number.isFinite(Number(room.price))
 ? currencyFormatter.format(Number(room.price))
 : "-"}
 </small>
 <div className="list-item-meta">
 <span>Tong so phong: {room.totalUnits || 1}</span>
 <span>Con trong: {room.availableUnits ?? room.totalUnits ?? 1}</span>
 <span>{room.bedType || "Cha khai bao loai giuong"}</span>
 </div>
 {room.description ? <p className="approval-note">{room.description}</p> : null}
 </div>
 <div className="item-actions item-actions-stack">
 <button type="button" onClick={() => handleEditRoom(room)}>
 Sua
 </button>
 <button
 type="button"
 className={activeInventory ? "active" : ""}
 onClick={() => setInventoryRoomId(room.id)}
 >
 Ton kho
 </button>
 <button
 type="button"
 className="danger"
 onClick={() => handleDeleteRoomRequest(room)}
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
