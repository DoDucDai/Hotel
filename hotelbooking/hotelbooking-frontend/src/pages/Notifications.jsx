import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import "./Notifications.css";

function normalizeNotifications(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("vi-VN");
}

export default function Notifications() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  const role = localStorage.getItem("role");
  const backPath = role === "ADMIN" ? "/admin" : "/account";

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getMyNotifications();
      setNotifications(normalizeNotifications(res?.data));
    } catch (loadError) {
      console.error("Cannot load notifications", loadError);
      setError("Không thể tải danh sách thông báo. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    if (!notificationId) {
      return;
    }

    setMarkingId(notificationId);
    try {
      const res = await markNotificationAsRead(notificationId);
      const updated = res?.data;
      setNotifications((prev) =>
        prev.map((item) => (item.id === updated?.id ? { ...item, ...updated } : item))
      );
    } catch (markError) {
      console.error("Cannot mark notification as read", markError);
      toast.error("Không thể cập nhật thông báo");
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAll = async () => {
    if (!unreadCount) {
      return;
    }

    setMarkingAll(true);
    try {
      const res = await markAllNotificationsAsRead();
      const updated = Number(res?.data?.updated || 0);
      setNotifications((prev) =>
        prev.map((item) => (item.read ? item : { ...item, read: true, readAt: item.readAt || new Date() }))
      );
      toast.success(updated > 0 ? `Đã đánh dấu ${updated} thông báo đã đọc` : "Không có thông báo mới");
    } catch (markError) {
      console.error("Cannot mark all notifications as read", markError);
      toast.error("Không thể đánh dấu đã đọc tất cả");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <main className="notifications-page">
      <section className="notifications-shell">
        <header className="notifications-header">
          <div>
            <p className="notifications-tag">Notification center</p>
            <h1>Thông báo của bạn</h1>
            <p>Theo dõi cập nhật booking, payment, tranh chấp và thông tin quan trọng khác.</p>
          </div>
          <div className="notifications-actions">
            <button type="button" className="btn-outline" onClick={() => navigate(backPath)}>
              Quay lại
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleMarkAll}
              disabled={markingAll || unreadCount === 0}
            >
              {markingAll ? "Đang cập nhật..." : `Đánh dấu đã đọc (${unreadCount})`}
            </button>
          </div>
        </header>

        {loading ? (
          <div className="notifications-state">Đang tải thông báo...</div>
        ) : error ? (
          <div className="notifications-state error">
            <p>{error}</p>
            <button type="button" className="btn-primary" onClick={loadNotifications}>
              Thử tải lại
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-state">Bạn chưa có thông báo nào.</div>
        ) : (
          <div className="notifications-list">
            {notifications.map((item) => (
              <article key={item.id} className={`notification-card ${item.read ? "read" : "unread"}`}>
                <div className="notification-head">
                  <div>
                    <p className="notification-type">{item.type || "SYSTEM"}</p>
                    <h2>{item.title || "Thông báo"}</h2>
                  </div>
                  {!item.read ? <span className="dot" aria-label="unread" /> : null}
                </div>
                <p className="notification-message">{item.message || "-"}</p>
                <div className="notification-meta">
                  <span>Tạo lúc: {formatDateTime(item.createdAt)}</span>
                  <span>{item.read ? `Đã đọc: ${formatDateTime(item.readAt)}` : "Chưa đọc"}</span>
                </div>
                {!item.read ? (
                  <button
                    type="button"
                    className="btn-outline small"
                    disabled={markingId === item.id}
                    onClick={() => handleMarkAsRead(item.id)}
                  >
                    {markingId === item.id ? "Đang cập nhật..." : "Đánh dấu đã đọc"}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}


