export default function UsersView({ users, userSummary, shortId }) {
  return (
    <section className="admin-view-stack">
      <article className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-tag">Tat ca nguoi dung</p>
            <h2>Phan loai role va theo doi tai khoan</h2>
          </div>
          <span className="panel-badge">{users.length} users</span>
        </div>

        <div className="admin-summary-grid">
          <div className="type-card">
            <h3>Admin</h3>
            <p>{userSummary.admins} tai khoan quan tri</p>
          </div>
          <div className="type-card">
            <h3>User</h3>
            <p>{userSummary.usersNormal} tai khoan khach hang/host</p>
          </div>
          <div className="type-card">
            <h3>Tong so</h3>
            <p>{userSummary.total} nguoi dung tren he thong</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ho ten</th>
                <th>Email</th>
                <th>Role</th>
                <th>Gioi tinh</th>
                <th>Ngay sinh</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
