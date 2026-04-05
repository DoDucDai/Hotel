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
 setEmail,
 emailMessage,
 emailSaving,
 dashboard,
 currencyFormatter,
}) {
 return (
 <section className="admin-account-section">
 {accountLoading ? (
 <div className="admin-account-state">dang tai profile admin...</div>
 ) : accountError ? (
 <div className="admin-account-state error">{accountError}</div>
 ) : (
 <div className="admin-account-grid">
 <article className="admin-account-card admin-account-overview">
 <div className="admin-account-hero">
 <span className="admin-account-avatar">{getAvatarText(profileData.name)}</span>
 <div className="admin-account-hero-text">
 <h2>{profileData.name || "Quan tri vien"}</h2>
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
 <span>Muc do hoan thien profile</span>
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
 <span>CCCD hien thi</span>
 <strong>{accountSummary.maskedCitizenId}</strong>
 </li>
 <li>
 <span>Xac thuc email luc</span>
 <strong>{accountSummary.verificationTime}</strong>
 </li>
 </ul>
 </article>

 <article className="admin-account-card">
 <h2>Thong tin ca nhan admin</h2>
 <p className="admin-account-note">
 Cap nhat thong tin chuan de profile admin hien thi giong tai khoan that.
 </p>

 <form className="admin-account-form" onSubmit={handleProfileSave}>
 <label>
 <span>Ho ten</span>
 <input
 name="name"
 value={profileData.name}
 onChange={(event) =>
 setProfileData((prev) => ({ ...prev, name: event.target.value }))
 }
 placeholder="Nhap ho ten"
 required
 />
 </label>

 <label>
 <span>Gioi tinh</span>
 <select
 name="gender"
 value={profileData.gender}
 onChange={(event) =>
 setProfileData((prev) => ({ ...prev, gender: event.target.value }))
 }
 >
 <option value="">Chon gioi tinh</option>
 <option value="Nam">Nam</option>
 <option value="Nu">Nu</option>
 <option value="Khac">Khac</option>
 </select>
 </label>

 <label>
 <span>Ngay sinh</span>
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
 <span>Can cuoc cong dan</span>
 <input
 name="citizenId"
 value={profileData.citizenId}
 onChange={(event) =>
 setProfileData((prev) => ({ ...prev, citizenId: event.target.value }))
 }
 placeholder="So CCCD"
 />
 </label>

 {profileMessage && (
 <p className={`admin-form-message ${profileMessage.type}`}>
 {profileMessage.text}
 </p>
 )}

 <button type="submit" className="admin-save-btn" disabled={profileSaving}>
 {profileSaving ? "Dang luu..." : "Luu profile"}
 </button>
 </form>
 </article>

 <article className="admin-account-card">
 <h2>Cai dat email dang nhap</h2>
 <p className="admin-account-note">
 Email nay duoc dung de dang nhap va nhan link dat lai mat khau.
 </p>

 <form className="admin-account-form" onSubmit={handleEmailSave}>
 <label>
 <span>Email</span>
 <input
 type="email"
 value={email}
 onChange={(event) => setEmail(event.target.value)}
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
 {emailSaving ? "Dang cap nhat..." : "Cap nhat email"}
 </button>
 </form>

 <ul className="admin-info-list">
 <li>
 <span>Role hien tai</span>
 <strong>{accountSummary.roleLabel}</strong>
 </li>
 <li>
 <span>ID admin</span>
 <strong>{shortId(accountId)}</strong>
 </li>
 <li>
 <span>Trang thai email</span>
 <strong>{accountSummary.verificationLabel}</strong>
 </li>
 <li>
 <span>Tong doanh thu he thong</span>
 <strong>{currencyFormatter.format(dashboard.totalRevenue || 0)}</strong>
 </li>
 </ul>
 </article>
 </div>
 )}
 </section>
 );
}

