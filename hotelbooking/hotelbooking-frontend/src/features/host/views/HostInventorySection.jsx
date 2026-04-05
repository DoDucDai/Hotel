export default function HostInventorySection({
 rooms,
 inventoryRoomId,
 setInventoryRoomId,
 hotelsById,
 selectedInventoryRoom,
 inventoryRange,
 handleInventoryRangeChange,
 handleSubmitInventoryBlock,
 inventoryForm,
 handleInventoryFormChange,
 inventorySaving,
 inventoryLoading,
 inventoryCalendar,
 formatDate,
 inventoryBlocks,
 handleDeleteInventoryBlockRequest,
}) {
 return (
 <section className="host-card host-card-wide">
 <div className="card-head">
 <div>
 <h2>Lich phong theo ngay va quan ly ton kho</h2>
 <p className="inline-note">
 Block phong bao tri, khoa phong dip le va xem ton kho con trong theo tung ngay.
 </p>
 </div>

 <label className="inventory-room-picker">
 <span>Loai phong dang xem</span>
 <select
 value={inventoryRoomId}
 onChange={(event) => setInventoryRoomId(event.target.value)}
 disabled={!rooms.length}
 >
 {!rooms.length ? <option value="">Cha co loai phong</option> : null}
 {rooms.map((room) => (
 <option key={room.id} value={room.id}>
 {room.name} - {hotelsById[room.hotelId]?.name || "Khach san"}
 </option>
 ))}
 </select>
 </label>
 </div>

 {!selectedInventoryRoom ? (
 <p className="inline-note">Tao it nhat 1 loai phong de bat dau quan ly ton kho.</p>
 ) : (
 <>
 <div className="inventory-toolbar">
 <div className="inventory-summary">
 <strong>{selectedInventoryRoom.name}</strong>
 <span>{selectedInventoryRoom.roomType || "STANDARD"}</span>
 <p>
 Tong {selectedInventoryRoom.totalUnits || 1} phong tai{" "}
 {hotelsById[selectedInventoryRoom.hotelId]?.name || "-"}
 </p>
 </div>

 <div className="inventory-range">
 <label>
 <span>Tu ngay</span>
 <input
 type="date"
 name="startDate"
 value={inventoryRange.startDate}
 onChange={handleInventoryRangeChange}
 />
 </label>
 <label>
 <span>Den ngay</span>
 <input
 type="date"
 name="endDate"
 value={inventoryRange.endDate}
 onChange={handleInventoryRangeChange}
 />
 </label>
 </div>
 </div>

 <div className="inventory-grid">
 <form className="host-form inventory-form" onSubmit={handleSubmitInventoryBlock}>
 <h3>Tao block ton kho</h3>

 <div className="field-row">
 <label>
 <span>Bat dau</span>
 <input
 type="date"
 name="startDate"
 value={inventoryForm.startDate}
 onChange={handleInventoryFormChange}
 />
 </label>

 <label>
 <span>Ket thuc</span>
 <input
 type="date"
 name="endDate"
 value={inventoryForm.endDate}
 onChange={handleInventoryFormChange}
 />
 </label>
 </div>

 <label>
 <span>So phong block</span>
 <input
 type="number"
 min="1"
 max={selectedInventoryRoom.totalUnits || 1}
 name="blockedUnits"
 value={inventoryForm.blockedUnits}
 onChange={handleInventoryFormChange}
 />
 </label>

 <label>
 <span>Ly do</span>
 <textarea
 name="reason"
 value={inventoryForm.reason}
 onChange={handleInventoryFormChange}
 placeholder="Vi du: bao tri phong, khoa ban dip le, su kien noi bo"
 />
 </label>

 <button type="submit" disabled={inventorySaving}>
 {inventorySaving ? "dang block..." : "Them block ton kho"}
 </button>
 </form>

 <div className="inventory-side">
 <div className="inventory-table-wrap">
 <div className="table-section-head">
 <h3>Lich ton kho</h3>
 <span>{inventoryCalendar.length} ngay</span>
 </div>

 {inventoryLoading ? (
 <p className="inline-note">dang tai lich ton kho...</p>
 ) : inventoryCalendar.length === 0 ? (
 <p className="inline-note">Cha co du lieu ton kho trong khoang ngay nay.</p>
 ) : (
 <table className="inventory-table">
 <thead>
 <tr>
 <th>Ngay</th>
 <th>Tong</th>
 <th>Da dat</th>
 <th>Block</th>
 <th>Con trong</th>
 </tr>
 </thead>
 <tbody>
 {inventoryCalendar.map((day) => (
 <tr key={day.date}>
 <td>{formatDate(day.date)}</td>
 <td>{day.totalUnits}</td>
 <td>{day.bookedUnits}</td>
 <td>{day.blockedUnits}</td>
 <td>
 <span
 className={`status-chip ${
 Number(day.availableUnits) > 0 ? "success" : "danger"
 }`}
 >
 {day.availableUnits}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>

 <div className="inventory-block-list">
 <div className="table-section-head">
 <h3>Danh sach block</h3>
 <span>{inventoryBlocks.length} muc</span>
 </div>

 {inventoryBlocks.length === 0 ? (
 <p className="inline-note">Cha co block ton kho nao cho loai phong nay.</p>
 ) : (
 inventoryBlocks.map((block) => (
 <article key={block.id} className="inventory-block-item">
 <div>
 <strong>
 {formatDate(block.startDate)} - {formatDate(block.endDate)}
 </strong>
 <p>Block {block.blockedUnits} phong</p>
 <small>{block.reason || "Khong co ghi chu"}</small>
 </div>
 <button
 type="button"
 className="ghost-btn danger"
 onClick={() => handleDeleteInventoryBlockRequest(block)}
 >
 Go block
 </button>
 </article>
 ))
 )}
 </div>
 </div>
 </div>
 </>
 )}
 </section>
 );
}
