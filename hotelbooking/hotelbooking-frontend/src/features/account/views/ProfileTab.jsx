export default function ProfileTab({
  profile,
  handleProfileChange,
  handleSaveProfile,
  profileSaving,
  email,
  setEmail,
  handleSaveEmail,
  emailSaving,
}) {
  return (
    <section className="account-card profile-card">
      <div className="profile-section">
        <h3>Thông tin cá nhân</h3>
        <p className="card-note">
          Cập nhật họ tên, giới tính, ngày sinh và số căn cước của bạn.
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

          <button type="submit" className="save-btn" disabled={profileSaving}>
            {profileSaving ? "Đang lưu..." : "Lưu profile"}
          </button>
        </form>
      </div>

      <div className="profile-section">
        <h3>Cài đặt tài khoản</h3>
        <p className="card-note">
          Đổi email đăng nhập. Hệ thống sẽ cấp token mới ngay sau khi đổi.
        </p>

        <form className="account-form" onSubmit={handleSaveEmail}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
              required
            />
          </label>

          <button type="submit" className="save-btn secondary" disabled={emailSaving}>
            {emailSaving ? "Đang cập nhật..." : "Cập nhật email"}
          </button>
        </form>
      </div>
    </section>
  );
}


