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
 <p className="panel-tag">Quan ly coupon</p>
 <h2>Dieu chinh uu dai va theo doi trang thai ma giam gia</h2>
 </div>
 <span className="panel-badge">{couponSummary.total} coupon</span>
 </div>

 <div className="admin-summary-grid">
 <div className="type-card">
 <h3>Dang hoat dong</h3>
 <p>{couponSummary.active} coupon co the ap dung cho booking moi</p>
 </div>
 <div className="type-card">
 <h3>Da het han</h3>
 <p>{couponSummary.expired} coupon can gia hon hoac tat ?i</p>
 </div>
 <div className="type-card">
 <h3>Tam tat</h3>
 <p>{couponSummary.inactive} coupon dang dong ? che do an</p>
 </div>
 </div>

 <div className="admin-coupon-grid">
 <article className="admin-coupon-editor">
 <h3>{editingCouponId ? "Cap nhat coupon" : "Tao coupon moi"}</h3>
 <p className="admin-account-note">
 Quan ly ma giam gia ngay trong dashboard admin va dong bo truc tiep sang trang
 booking.
 </p>

 <form className="admin-coupon-form" onSubmit={handleCouponSubmit}>
 <label>
 <span>Ma coupon</span>
 <input
 name="code"
 value={couponForm.code}
 onChange={handleCouponFieldChange}
 placeholder="VD: SUMMER15"
 required
 />
 </label>

 <label>
 <span>Mo ta</span>
 <textarea
 name="description"
 value={couponForm.description}
 onChange={handleCouponFieldChange}
 placeholder="Mo ta uu dai ?O user ?O nhan biet"
 rows="3"
 />
 </label>

 <div className="admin-coupon-form-grid">
 <label>
 <span>Loai giam</span>
 <select
 name="discountType"
 value={couponForm.discountType}
 onChange={handleCouponFieldChange}
 >
 <option value="PERCENT">Phan tram</option>
 <option value="FIXED">Tien mat</option>
 </select>
 </label>

 <label>
 <span>Gia tri giam</span>
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
 <span>Don tai thiOu</span>
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
 <span>Ngy het han</span>
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
 <span>Cho phep coupon hoat dong ngay</span>
 </label>

 {couponMessage && (
 <p className={`admin-form-message ${couponMessage.type}`}>
 {couponMessage.text}
 </p>
 )}

 <div className="admin-form-actions">
 <button type="submit" className="admin-save-btn" disabled={couponSaving}>
 {couponSaving
 ? "Dang luu..."
 : editingCouponId
 ? "Cap nhat coupon"
 : "Tao coupon"}
 </button>
 <button
 type="button"
 className="admin-save-btn secondary"
 onClick={resetCouponForm}
 disabled={couponSaving}
 >
 {editingCouponId ? "Bo soa" : "Dat lai form"}
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
 <p>{formatCellText(coupon.description, "Cha co mo ta")}</p>
 </div>
 <span className={`status-pill ${statusMeta.className}`}>
 {statusMeta.label}
 </span>
 </div>

 <ul className="coupon-meta-list">
 <li>
 <span>Gia tri giam</span>
 <strong>{formatCouponValue(coupon)}</strong>
 </li>
 <li>
 <span>Don tai thiOu</span>
 <strong>
 {currencyFormatter.format(Number(coupon.minOrderAmount || 0))}
 </strong>
 </li>
 <li>
 <span>Ngy het han</span>
 <strong>
 {coupon.expiresAt ? formatDate(coupon.expiresAt) : "Khong giai han"}
 </strong>
 </li>
 </ul>

 <div className="coupon-card-actions">
 <button
 type="button"
 className="coupon-edit-btn"
 onClick={() => handleCouponEdit(coupon)}
 >
 Chinh sua coupon
 </button>
 <button
 type="button"
 className="coupon-delete-btn"
 onClick={() => handleCouponDeleteRequest(coupon)}
 disabled={couponDeletingId === coupon.id}
 >
 {couponDeletingId === coupon.id ? "Dang xoa..." : "Xoa coupon"}
 </button>
 </div>
 </article>
 );
 })
 ) : (
 <div className="admin-empty-state">Cha co coupon nao trong he thong.</div>
 )}
 </div>
 </div>
 </article>
 </section>
 );
}
