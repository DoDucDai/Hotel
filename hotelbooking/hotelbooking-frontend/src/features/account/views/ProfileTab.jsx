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
        <h3>Thong tin ca nhan</h3>
        <p className="card-note">
          Cap nhat ho ten, gioi tinh, ngay sinh va so can cuoc cua ban.
        </p>

        <form className="account-form" onSubmit={handleSaveProfile}>
          <label>
            <span>Ho ten</span>
            <input
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="Nhap ho ten day du"
              required
            />
          </label>

          <label>
            <span>Gioi tinh</span>
            <select name="gender" value={profile.gender} onChange={handleProfileChange}>
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
              value={profile.dateOfBirth}
              onChange={handleProfileChange}
            />
          </label>

          <label>
            <span>So can cuoc</span>
            <input
              name="citizenId"
              value={profile.citizenId}
              onChange={handleProfileChange}
              placeholder="Nhap so can cuoc"
            />
          </label>

          <button type="submit" className="save-btn" disabled={profileSaving}>
            {profileSaving ? "Dang luu..." : "Luu profile"}
          </button>
        </form>
      </div>

      <div className="profile-section">
        <h3>Cai dat tai khoan</h3>
        <p className="card-note">
          Di email dang nhap. He thong se cap token moi ngay sau khi doi.
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
            {emailSaving ? "Dang cap nhat..." : "Cap nhat email"}
          </button>
        </form>
      </div>
    </section>
  );
}
