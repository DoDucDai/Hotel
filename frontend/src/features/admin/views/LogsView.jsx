export default function LogsView({ sortedLogs, formatDateTime, shortId }) {
  return (
    <section className="admin-view-stack">
      <article className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-tag">Audit log</p>
            <h2>Theo dõi nhật ký thay đổi trong hệ thống</h2>
          </div>
          <span className="panel-badge">{sortedLogs.length} sự kiện</span>
        </div>

        {sortedLogs.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                  <th>Thực thể</th>
                  <th>Actor</th>
                  <th>Nội dung</th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>{log.action || "-"}</td>
                    <td>{(log.entityType || "-") + " " + shortId(log.entityId)}</td>
                    <td>{log.actorEmail || log.actorRole || "-"}</td>
                    <td>{log.message || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">Chưa có nhật ký hoạt động nào.</div>
        )}
      </article>
    </section>
  );
}

