export default function ProfileTab({
  profile,
  handleProfileChange,
  handleSaveProfile,
  profileSaving,
  email,
  handleEmailInputChange,
  emailOtp,
  setEmailOtp,
  emailOtpSent,
  handleSaveEmail,
  handleConfirmEmailOtp,
  emailSaving,
}) {
  return (
    <section className="account-card profile-card">
      <div className="profile-section">
        <h3>Thông tin cá nhân</h3>
        <p className="card-note">
          Cập nhật họ tên, giới tính, ngày sinh, số căn cước và STK nhận cọc khi bạn đăng phòng.
        </p>

        <form className="account-form" onSubmit={handleSaveProfile}>
          <label>
            <span>Họ tên</span>
            <input
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="Nhập họ tên đầy đủ"
              required
            />
          </label>

          <label>
            <span>Giới tính</span>
            <select name="gender" value={profile.gender} onChange={handleProfileChange}>
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
              value={profile.dateOfBirth}
              onChange={handleProfileChange}
            />
          </label>

          <label>
            <span>Số căn cước</span>
            <input
              name="citizenId"
              value={profile.citizenId}
              onChange={handleProfileChange}
              placeholder="Nhập số căn cước"
            />
          </label>

          <div className="profile-bank-grid">
            <label>
              <span>Ngân hàng nhận cọc</span>
              <input
                name="bankProvider"
                value={profile.bankProvider}
                onChange={handleProfileChange}
                placeholder="VD: MB Bank, Vietcombank..."
              />
            </label>

            <label>
              <span>Tên chủ tài khoản</span>
              <input
                name="bankAccountName"
                value={profile.bankAccountName}
                onChange={handleProfileChange}
                placeholder="Tên trùng với thông tin ngân hàng"
              />
            </label>
          </div>

          <label>
            <span>Số tài khoản nhận cọc</span>
            <input
              name="bankAccountNumber"
              value={profile.bankAccountNumber}
              onChange={handleProfileChange}
              placeholder="Nhập số tài khoản cá nhân"
            />
          </label>

          <button type="submit" className="save-btn" disabled={profileSaving}>
            {profileSaving ? "Đang lưu..." : "Lưu profile"}
          </button>
        </form>
      </div>

      <div className="profile-section">
        <h3>Cài đặt tài khoản</h3>
        <p className="card-note">
          Đổi email đăng nhập bằng OTP gửi về email mới. Chỉ đổi thành công sau khi xác thực OTP.
        </p>

        <form className="account-form" onSubmit={handleSaveEmail}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => handleEmailInputChange(event.target.value)}
              placeholder="example@email.com"
              required
            />
          </label>

          <button type="submit" className="save-btn secondary" disabled={emailSaving}>
            {emailSaving ? "Đang gửi..." : emailOtpSent ? "Gửi lại OTP" : "Gửi OTP xác nhận"}
          </button>

          {emailOtpSent ? (
            <div className="email-otp-row">
              <label>
                <span>Mã OTP 6 số</span>
                <input
                  value={emailOtp}
                  onChange={(event) => {
                    const normalized = event.target.value.replace(/\D/g, "").slice(0, 6);
                    setEmailOtp(normalized);
                  }}
                  placeholder="Nhập OTP đã gửi qua email"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                />
              </label>

              <p className="email-otp-hint">
                Sau khi nhập OTP đúng, hệ thống mới cập nhật email và cấp token đăng nhập mới.
              </p>

              <button
                type="button"
                className="save-btn"
                disabled={emailSaving}
                onClick={handleConfirmEmailOtp}
              >
                {emailSaving ? "Đang xác nhận..." : "Xác nhận OTP và đổi email"}
              </button>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}


