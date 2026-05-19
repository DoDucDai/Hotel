export default function DisputesView({
 sortedDisputes,
 userMap,
 hotelMap,
 roomMap,
 disputeStatusMeta,
 disputeStatusDrafts,
 disputeNotes,
 disputeUpdatingId,
 shortId,
 disputeStatusOptions,
 handleDisputeStatusDraftChange,
 handleDisputeNoteChange,
 formatDateTime,
 handleDisputeUpdate,
}) {
 return (
 <section className="admin-view-stack">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Tranh chấp booking</p>
 <h2>Xử lý ticket do người dùng gửi lên hệ thống</h2>
 </div>
 <span className="panel-badge">{sortedDisputes.length} tranh chấp</span>
 </div>

 {sortedDisputes.length ? (
 <div className="admin-dispute-list">
 {sortedDisputes.map((dispute) => {
 const user = userMap[dispute.userId] || null;
 const hotel = hotelMap[dispute.hotelId] || null;
 const room = roomMap[dispute.roomId] || null;
 const disputeMeta = disputeStatusMeta(dispute.status);
 const selectedStatus = disputeStatusDrafts[dispute.id] || dispute.status || "OPEN";
 const noteValue = disputeNotes[dispute.id] ?? dispute.resolutionNote ?? "";
 const statusDirty =
 selectedStatus !== (dispute.status || "OPEN") ||
 noteValue.trim() !== String(dispute.resolutionNote || "").trim();

 return (
 <article key={dispute.id} className="admin-dispute-card">
 <div className="admin-dispute-head">
 <div>
 <p className="panel-tag">Booking {shortId(dispute.bookingId)}</p>
 <h3>{dispute.subject || "Tranh chấp booking"}</h3>
 </div>
 <span className={`status-pill ${disputeMeta.className}`}>
 {disputeMeta.label}
 </span>
 </div>

 <div className="admin-hotel-meta">
 <span>User: {user?.name || user?.email || dispute.userId || "-"}</span>
 <span>Hotel: {hotel?.name || dispute.hotelId || "-"}</span>
 <span>Room: {room?.name || dispute.roomId || "-"}</span>
 </div>

 <p className="admin-dispute-body">{dispute.description || "-"}</p>

 <div className="admin-form-stack">
 <label className="admin-filter-field">
 <span>Trạng thái xử lý</span>
 <select
 value={selectedStatus}
 onChange={(event) =>
 handleDisputeStatusDraftChange(dispute.id, event.target.value)
 }
 disabled={disputeUpdatingId === dispute.id}
 >
 {disputeStatusOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>

 <label className="admin-filter-field">
 <span>Phản hồi admin</span>
 <textarea
 value={noteValue}
 onChange={(event) =>
 handleDisputeNoteChange(dispute.id, event.target.value)
 }
 placeholder="Cập nhật kết quả xử lý cho người dùng"
 />
 </label>
 </div>

 <div className="admin-card-actions">
 <span className="admin-cell-note">
 Cập nhật: {formatDateTime(dispute.updatedAt || dispute.createdAt)}
 </span>
 <button
 type="button"
 className="btn-action btn-primary"
 disabled={!statusDirty || disputeUpdatingId === dispute.id}
 onClick={() => handleDisputeUpdate(dispute)}
 >
 {disputeUpdatingId === dispute.id ? "Đang lưu..." : "Lưu xử lý"}
 </button>
 </div>
 </article>
 );
 })}
 </div>
 ) : (
 <div className="admin-empty-state">Chưa có tranh chấp nào cần xử lý.</div>
 )}
 </article>
 </section>
 );
}


