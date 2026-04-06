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
 <h2>Lịch phòng theo ngày và quản lý tồn kho</h2>
 <p className="inline-note">
 Block phòng bảo trì, khóa phòng dịp lễ và xem tồn kho còn trống theo từng ngày.
 </p>
 </div>

 <label className="inventory-room-picker">
 <span>Loại phòng đang xem</span>
 <select
 value={inventoryRoomId}
 onChange={(event) => setInventoryRoomId(event.target.value)}
 disabled={!rooms.length}
 >
 {!rooms.length ? <option value="">Chưa có loại phòng</option> : null}
 {rooms.map((room) => (
 <option key={room.id} value={room.id}>
 {room.name} - {hotelsById[room.hotelId]?.name || "Khách sạn"}
 </option>
 ))}
 </select>
 </label>
 </div>

 {!selectedInventoryRoom ? (
 <p className="inline-note">Tạo ít nhất 1 loại phòng để bắt đầu quản lý tồn kho.</p>
 ) : (
 <>
 <div className="inventory-toolbar">
 <div className="inventory-summary">
 <strong>{selectedInventoryRoom.name}</strong>
 <span>{selectedInventoryRoom.roomType || "STANDARD"}</span>
 <p>
 Tổng {selectedInventoryRoom.totalUnits || 1} phòng tại{" "}
 {hotelsById[selectedInventoryRoom.hotelId]?.name || "-"}
 </p>
 </div>

 <div className="inventory-range">
 <label>
 <span>Từ ngày</span>
 <input
 type="date"
 name="startDate"
 value={inventoryRange.startDate}
 onChange={handleInventoryRangeChange}
 />
 </label>
 <label>
 <span>Đến ngày</span>
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
 <h3>Tạo block tồn kho</h3>

 <div className="field-row">
 <label>
 <span>Bắt đầu</span>
 <input
 type="date"
 name="startDate"
 value={inventoryForm.startDate}
 onChange={handleInventoryFormChange}
 />
 </label>

 <label>
 <span>Kết thúc</span>
 <input
 type="date"
 name="endDate"
 value={inventoryForm.endDate}
 onChange={handleInventoryFormChange}
 />
 </label>
 </div>

 <label>
 <span>Số phòng block</span>
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
 <span>Lý do</span>
 <textarea
 name="reason"
 value={inventoryForm.reason}
 onChange={handleInventoryFormChange}
 placeholder="Ví dụ: bảo trì phòng, khóa bán dịp lễ, sự kiện nội bộ"
 />
 </label>

 <button type="submit" disabled={inventorySaving}>
 {inventorySaving ? "Đang block..." : "Thêm block tồn kho"}
 </button>
 </form>

 <div className="inventory-side">
 <div className="inventory-table-wrap">
 <div className="table-section-head">
 <h3>Lịch tồn kho</h3>
 <span>{inventoryCalendar.length} ngày</span>
 </div>

 {inventoryLoading ? (
 <p className="inline-note">đang tải lịch tồn kho...</p>
 ) : inventoryCalendar.length === 0 ? (
 <p className="inline-note">Chưa có dữ liệu tồn kho trong khoảng ngày này.</p>
 ) : (
 <table className="inventory-table">
 <thead>
 <tr>
 <th>Ngày</th>
 <th>Tổng</th>
 <th>Đã đặt</th>
 <th>Block</th>
 <th>Còn trống</th>
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
 <h3>Danh sách block</h3>
 <span>{inventoryBlocks.length} mục</span>
 </div>

 {inventoryBlocks.length === 0 ? (
 <p className="inline-note">Chưa có block tồn kho nào cho loại phòng này.</p>
 ) : (
 inventoryBlocks.map((block) => (
 <article key={block.id} className="inventory-block-item">
 <div>
 <strong>
 {formatDate(block.startDate)} - {formatDate(block.endDate)}
 </strong>
 <p>Block {block.blockedUnits} phòng</p>
 <small>{block.reason || "Không có ghi chú"}</small>
 </div>
 <button
 type="button"
 className="ghost-btn danger"
 onClick={() => handleDeleteInventoryBlockRequest(block)}
 >
 Gỡ block
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

