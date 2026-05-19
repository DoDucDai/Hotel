export default function AccountView({
 accountLoading,
 accountError,
 getAvatarText,
 profileData,
 email,
 accountSummary,
 shortId,
 accountId,
 handleProfileSave,
 setProfileData,
 profileMessage,
 profileSaving,
 handleEmailSave,
 handleEmailInputChange,
 emailOtp,
 emailOtpSent,
 handleEmailOtpChange,
 handleVerifyEmailOtp,
 emailMessage,
 emailSaving,
 dashboard,
 currencyFormatter,
}) {
 return (
 <section className="admin-account-section">
 {accountLoading ? (
 <div className="admin-account-state">đang tải profile admin...</div>
 ) : accountError ? (
 <div className="admin-account-state error">{accountError}</div>
 ) : (
 <div className="admin-account-grid">
 <article className="admin-account-card admin-account-overview">
 <div className="admin-account-hero">
 <span className="admin-account-avatar">{getAvatarText(profileData.name)}</span>
 <div className="admin-account-hero-text">
 <h2>{profileData.name || "Quản trị viên"}</h2>
 <p>{email || "admin@hotelbooking.com"}</p>
 <div className="admin-account-tags">
 <span className="admin-role-pill">{accountSummary.roleLabel}</span>
 <span
 className={`admin-verify-pill ${
 accountSummary.verified ? "verified" : "unverified"
 }`}
 >
 {accountSummary.verificationLabel}
 </span>
 </div>
 </div>
 </div>

 <div className="admin-account-progress">
 <div className="admin-account-progress-head">
 <span>Mức độ hoàn thiện profile</span>
 <strong>{accountSummary.completionPercent}%</strong>
 </div>
 <div className="admin-account-progress-track">
 <span style={{ width: `${accountSummary.completionPercent}%` }} />
 </div>
 </div>

 <ul className="admin-account-highlights">
 <li>
 <span>ID admin</span>
 <strong>{shortId(accountId)}</strong>
 </li>
 <li>
 <span>CCCD hiển thị</span>
 <strong>{accountSummary.maskedCitizenId}</strong>
 </li>
 <li>
 <span>Xác thực email lúc</span>
 <strong>{accountSummary.verificationTime}</strong>
 </li>
 </ul>
 </article>

 <article className="admin-account-card">
 <h2>Thông tin cá nhân admin</h2>
 <p className="admin-account-note">
 Cập nhật thông tin chuẩn để profile admin hiển thị giống tài khoản thật.
 </p>

 <form className="admin-account-form" onSubmit={handleProfileSave}>
 <label>
 <span>Họ tên</span>
 <input
 name="name"
 value={profileData.name}
 onChange={(event) =>
 setProfileData((prev) => ({ ...prev, name: event.target.value }))
 }
 placeholder="Nhập họ tên"
 required
 />
 </label>

 <label>
 <span>Giới tính</span>
 <select
 name="gender"
 value={profileData.gender}
 onChange={(event) =>
 setProfileData((prev) => ({ ...prev, gender: event.target.value }))
 }
 >
 <option value="">Chọn giới tính</option>
 <option value="Nam">Nam</option>
 <option value="Nu">Nữ</option>
 <option value="Khac">Khác</option>
 </select>
 </label>

 <label>
 <span>Ngày sinh</span>
 <input
 type="date"
 name="dateOfBirth"
 value={profileData.dateOfBirth}
 onChange={(event) =>
 setProfileData((prev) => ({ ...prev, dateOfBirth: event.target.value }))
 }
 />
 </label>

 <label>
 <span>Căn cước công dân</span>
 <input
 name="citizenId"
 value={profileData.citizenId}
 onChange={(event) =>
 setProfileData((prev) => ({ ...prev, citizenId: event.target.value }))
 }
 placeholder="Số CCCD"
 />
 </label>

 {profileMessage && (
 <p className={`admin-form-message ${profileMessage.type}`}>
 {profileMessage.text}
 </p>
 )}

 <button type="submit" className="admin-save-btn" disabled={profileSaving}>
 {profileSaving ? "Đang lưu..." : "Lưu profile"}
 </button>
 </form>
 </article>

 <article className="admin-account-card">
 <h2>Cài đặt email đăng nhập</h2>
 <p className="admin-account-note">
 Đổi email đăng nhập bằng OTP gửi về email mới. Email chỉ được cập nhật sau khi xác thực OTP.
 </p>

 <form className="admin-account-form" onSubmit={handleEmailSave}>
 <label>
 <span>Email</span>
 <input
 type="email"
 value={email}
 onChange={(event) => handleEmailInputChange(event.target.value)}
 placeholder="admin@email.com"
 required
 />
 </label>

 {emailMessage && (
 <p className={`admin-form-message ${emailMessage.type}`}>
 {emailMessage.text}
 </p>
 )}

 <button
 type="submit"
 className="admin-save-btn secondary"
 disabled={emailSaving}
 >
 {emailSaving ? "Đang gửi..." : emailOtpSent ? "Gửi lại OTP" : "Gửi OTP xác nhận"}
 </button>

 {emailOtpSent ? (
 <div className="admin-email-otp-block">
 <label>
 <span>Mã OTP 6 số</span>
 <input
 value={emailOtp}
 onChange={(event) => handleEmailOtpChange(event.target.value)}
 placeholder="Nhập OTP đã gửi qua email"
 autoComplete="one-time-code"
 inputMode="numeric"
 maxLength={6}
 />
 </label>
 <p className="admin-email-otp-hint">
 Sau khi xác nhận OTP, hệ thống sẽ cập nhật email admin và cấp access token mới.
 </p>
 <button
 type="button"
 className="admin-save-btn"
 disabled={emailSaving}
 onClick={handleVerifyEmailOtp}
 >
 {emailSaving ? "Đang xác nhận..." : "Xác nhận OTP và đổi email"}
 </button>
 </div>
 ) : null}
 </form>

 <ul className="admin-info-list">
 <li>
 <span>Role hiện tại</span>
 <strong>{accountSummary.roleLabel}</strong>
 </li>
 <li>
 <span>ID admin</span>
 <strong>{shortId(accountId)}</strong>
 </li>
 <li>
 <span>Trạng thái email</span>
 <strong>{accountSummary.verificationLabel}</strong>
 </li>
 <li>
 <span>Tổng doanh thu hệ thống</span>
 <strong>{currencyFormatter.format(dashboard.totalRevenue || 0)}</strong>
 </li>
 </ul>
 </article>
 </div>
 )}
 </section>
 );
}



