export default function CouponsView({
 couponSummary,
 editingCouponId,
 couponForm,
 handleCouponFieldChange,
 couponMessage,
 couponSaving,
 resetCouponForm,
 handleCouponSubmit,
 sortedCoupons,
 couponStatusMeta,
 formatCellText,
 formatCouponValue,
 currencyFormatter,
 formatDate,
 handleCouponEdit,
 handleCouponDeleteRequest,
 couponDeletingId,
}) {
 return (
 <section className="admin-view-stack">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Quản lý coupon</p>
 <h2>Điều chỉnh ưu đãi và theo dõi trạng thái mã giảm giá</h2>
 </div>
 <span className="panel-badge">{couponSummary.total} coupon</span>
 </div>

 <div className="admin-summary-grid">
 <div className="type-card">
 <h3>Đang hoạt động</h3>
 <p>{couponSummary.active} coupon có thể áp dụng cho booking mới</p>
 </div>
 <div className="type-card">
 <h3>Đã hết hạn</h3>
 <p>{couponSummary.expired} coupon cần gia hạn hoặc tắt đi</p>
 </div>
 <div className="type-card">
 <h3>Tạm tắt</h3>
 <p>{couponSummary.inactive} coupon đang đóng ở chế độ ẩn</p>
 </div>
 </div>

 <div className="admin-coupon-grid">
 <article className="admin-coupon-editor">
 <h3>{editingCouponId ? "Cập nhật coupon" : "Tạo coupon mới"}</h3>
 <p className="admin-account-note">
 Quản lý mã giảm giá ngay trong dashboard admin và đồng bộ trực tiếp sang trang
 booking.
 </p>

 <form className="admin-coupon-form" onSubmit={handleCouponSubmit}>
 <label>
 <span>Mã coupon</span>
 <input
 name="code"
 value={couponForm.code}
 onChange={handleCouponFieldChange}
 placeholder="VD: SUMMER15"
 required
 />
 </label>

 <label>
 <span>Mô tả</span>
 <textarea
 name="description"
 value={couponForm.description}
 onChange={handleCouponFieldChange}
 placeholder="Mô tả ưu đãi để user dễ nhận biết"
 rows="3"
 />
 </label>

 <div className="admin-coupon-form-grid">
 <label>
 <span>Loại giảm</span>
 <select
 name="discountType"
 value={couponForm.discountType}
 onChange={handleCouponFieldChange}
 >
 <option value="PERCENT">Phần trăm</option>
 <option value="FIXED">Tiền mặt</option>
 </select>
 </label>

 <label>
 <span>Giá trị giảm</span>
 <input
 type="number"
 min="0"
 step="1"
 name="discountValue"
 value={couponForm.discountValue}
 onChange={handleCouponFieldChange}
 placeholder="10"
 required
 />
 </label>
 </div>

 <div className="admin-coupon-form-grid">
 <label>
 <span>Đơn tối thiểu</span>
 <input
 type="number"
 min="0"
 step="1000"
 name="minOrderAmount"
 value={couponForm.minOrderAmount}
 onChange={handleCouponFieldChange}
 />
 </label>

 <label>
 <span>Ngày hết hạn</span>
 <input
 type="date"
 name="expiresAt"
 value={couponForm.expiresAt}
 onChange={handleCouponFieldChange}
 />
 </label>
 </div>

 <label className="admin-checkbox-field">
 <input
 type="checkbox"
 name="active"
 checked={couponForm.active}
 onChange={handleCouponFieldChange}
 />
 <span>Cho phép coupon hoạt động ngay</span>
 </label>

 {couponMessage && (
 <p className={`admin-form-message ${couponMessage.type}`}>
 {couponMessage.text}
 </p>
 )}

 <div className="admin-form-actions">
 <button type="submit" className="admin-save-btn" disabled={couponSaving}>
 {couponSaving
 ? "Đang lưu..."
 : editingCouponId
 ? "Cập nhật coupon"
 : "Tạo coupon"}
 </button>
 <button
 type="button"
 className="admin-save-btn secondary"
 onClick={resetCouponForm}
 disabled={couponSaving}
 >
 {editingCouponId ? "Bỏ sửa" : "Đặt lại form"}
 </button>
 </div>
 </form>
 </article>

 <div className="admin-coupon-list">
 {sortedCoupons.length ? (
 sortedCoupons.map((coupon) => {
 const statusMeta = couponStatusMeta(coupon);

 return (
 <article key={coupon.id || coupon.code} className="coupon-card">
 <div className="coupon-card-head">
 <div>
 <h3>{coupon.code || "COUPON"}</h3>
 <p>{formatCellText(coupon.description, "Chưa có mô tả")}</p>
 </div>
 <span className={`status-pill ${statusMeta.className}`}>
 {statusMeta.label}
 </span>
 </div>

 <ul className="coupon-meta-list">
 <li>
 <span>Giá trị giảm</span>
 <strong>{formatCouponValue(coupon)}</strong>
 </li>
 <li>
 <span>Đơn tối thiểu</span>
 <strong>
 {currencyFormatter.format(Number(coupon.minOrderAmount || 0))}
 </strong>
 </li>
 <li>
 <span>Ngày hết hạn</span>
 <strong>
 {coupon.expiresAt ? formatDate(coupon.expiresAt) : "Không giới hạn"}
 </strong>
 </li>
 </ul>

 <div className="coupon-card-actions">
 <button
 type="button"
 className="coupon-edit-btn"
 onClick={() => handleCouponEdit(coupon)}
 >
 Chỉnh sửa coupon
 </button>
 <button
 type="button"
 className="coupon-delete-btn"
 onClick={() => handleCouponDeleteRequest(coupon)}
 disabled={couponDeletingId === coupon.id}
 >
 {couponDeletingId === coupon.id ? "Đang xóa..." : "Xóa coupon"}
 </button>
 </div>
 </article>
 );
 })
 ) : (
 <div className="admin-empty-state">Chưa có coupon nào trong hệ thống.</div>
 )}
 </div>
 </div>
 </article>
 </section>
 );
}


