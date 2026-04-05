export default function LogsView({ sortedLogs, formatDateTime, shortId }) {
  return (
    <section className="admin-view-stack">
      <article className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-tag">Audit log</p>
            <h2>Theo doi nhat ky thay doi trong he thong</h2>
          </div>
          <span className="panel-badge">{sortedLogs.length} so kien</span>
        </div>

        {sortedLogs.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Thoi gian</th>
                  <th>Hanh dong</th>
                  <th>Thuc the</th>
                  <th>Actor</th>
                  <th>Noi dung</th>
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
          <div className="admin-empty-state">Chua co nhat ky hoat dong nao.</div>
        )}
      </article>
    </section>
  );
}
