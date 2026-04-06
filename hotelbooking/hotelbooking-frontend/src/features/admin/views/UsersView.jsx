export default function UsersView({
  users,
  userSummary,
  shortId,
  userForm,
  editingUserId,
  userSaving,
  userDeletingId,
  userMessage,
  adminUserRoleOptions,
  handleUserFieldChange,
  handleUserSubmit,
  resetUserForm,
  handleUserEdit,
  handleUserDeleteRequest,
}) {
  return (
    <section className="admin-view-stack">
      <article className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-tag">Tất cả người dùng</p>
            <h2>Phân loại role và quản lý tài khoản</h2>
          </div>
          <span className="panel-badge">{users.length} users</span>
        </div>

        <div className="admin-summary-grid">
          <div className="type-card">
            <h3>Admin</h3>
            <p>{userSummary.admins} tài khoản quản trị</p>
          </div>
          <div className="type-card">
            <h3>User</h3>
            <p>{userSummary.usersNormal} tài khoản khách hàng/host</p>
          </div>
          <div className="type-card">
            <h3>Tổng số</h3>
            <p>{userSummary.total} người dùng trên hệ thống</p>
          </div>
        </div>

        <form className="admin-user-form" onSubmit={handleUserSubmit}>
          <div className="admin-user-form-grid">
            <label className="admin-filter-field">
              <span>Họ tên</span>
              <input
                name="name"
                value={userForm.name}
                onChange={handleUserFieldChange}
                placeholder="Nhập họ tên"
                required
              />
            </label>

            <label className="admin-filter-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={userForm.email}
                onChange={handleUserFieldChange}
                placeholder="name@email.com"
                required
              />
            </label>

            <label className="admin-filter-field">
              <span>Role</span>
              <select name="role" value={userForm.role} onChange={handleUserFieldChange}>
                {adminUserRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-filter-field">
              <span>Mật khẩu {editingUserId ? "(bỏ trống nếu không đổi)" : ""}</span>
              <input
                type="password"
                name="password"
                value={userForm.password}
                onChange={handleUserFieldChange}
                placeholder={editingUserId ? "Nhập để đổi mật khẩu" : "Tối thiểu 6 ký tự"}
                required={!editingUserId}
              />
            </label>

            <label className="admin-filter-field">
              <span>Giới tính</span>
              <input
                name="gender"
                value={userForm.gender}
                onChange={handleUserFieldChange}
                placeholder="Nam/Nữ/Khác"
              />
            </label>

            <label className="admin-filter-field">
              <span>Ngày sinh</span>
              <input
                type="date"
                name="dateOfBirth"
                value={userForm.dateOfBirth}
                onChange={handleUserFieldChange}
              />
            </label>

            <label className="admin-filter-field">
              <span>CCCD</span>
              <input
                name="citizenId"
                value={userForm.citizenId}
                onChange={handleUserFieldChange}
                placeholder="Số căn cước công dân"
              />
            </label>
          </div>

          {userMessage ? (
            <p className={`admin-inline-message ${userMessage.type === "error" ? "error" : "success"}`}>
              {userMessage.text}
            </p>
          ) : null}

          <div className="admin-card-actions">
            <button type="submit" className="btn-action btn-primary" disabled={userSaving}>
              {userSaving
                ? "Đang lưu..."
                : editingUserId
                  ? "Cập nhật user"
                  : "Tạo user mới"}
            </button>
            <button type="button" className="btn-action btn-secondary" onClick={resetUserForm}>
              Đặt lại form
            </button>
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Role</th>
                <th>Giới tính</th>
                <th>Ngày sinh</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{shortId(user.id)}</td>
                  <td>{user.name || "-"}</td>
                  <td>{user.email || "-"}</td>
                  <td>{user.role || "-"}</td>
                  <td>{user.gender || "-"}</td>
                  <td>{user.dateOfBirth || "-"}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-mini-btn"
                        onClick={() => handleUserEdit(user)}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="admin-mini-btn danger"
                        onClick={() => handleUserDeleteRequest(user)}
                        disabled={userDeletingId === user.id}
                      >
                        {userDeletingId === user.id ? "Đang xóa..." : "Xóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}


