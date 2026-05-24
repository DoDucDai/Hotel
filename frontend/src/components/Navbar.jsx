import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaBell, FaEnvelope, FaSignOutAlt, FaUser, FaBuilding, FaHeart, FaHistory } from "react-icons/fa";
import {
  getUnreadNotificationCount,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService";
import { getMyAccount } from "../services/accountService";
import { resendVerificationEmail } from "../services/authService";
import { useToast } from "../components/ToastProvider";
import { useBranding } from "../context/BrandingContext";
import BrandLogo from "./BrandLogo";
import "./Navbar.css";


export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const toast = useToast();
  const { brandName, brandSlogan, brandLogoStyle } = useBranding();


  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const isLoggedIn = Boolean(localStorage.getItem("accessToken"));
  const role = localStorage.getItem("role");
  const accountPath = role === "ADMIN" ? "/admin?view=account" : "/account";

  const [emailVerified, setEmailVerified] = useState(() => {
    return localStorage.getItem("emailVerified") === "true";
  });

  const navItems = useMemo(
    () => [
      { label: "Trang chủ", path: "/" },
      { label: "Khách sạn", path: "/hotels" },
    ],
    []
  );

  useEffect(() => {
    const closeTimer = window.setTimeout(() => {
      setOpen(false);
      setProfileOpen(false);
      setNotifOpen(false);
    }, 0);

    return () => window.clearTimeout(closeTimer);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch count and basic info on mount / page change
  useEffect(() => {
    let isMounted = true;
    if (!isLoggedIn) {
      setUnreadNotifications(0);
      setEmailVerified(true);
      setUserName("");
      setUserEmail("");
      return;
    }

    const fetchProfileAndNotifications = async () => {
      try {
        getUnreadNotificationCount()
          .then((res) => {
            if (isMounted) {
              setUnreadNotifications(Number(res?.data?.unread || 0));
            }
          })
          .catch(() => {});

        getMyAccount()
          .then((res) => {
            if (isMounted && res?.data) {
              const verified = res.data.emailVerified;
              setEmailVerified(Boolean(verified));
              localStorage.setItem("emailVerified", String(verified));
              if (res.data.name) {
                setUserName(res.data.name.trim());
              }
              if (res.data.email) {
                setUserEmail(res.data.email.trim());
              }
            }
          })
          .catch(() => {});
      } catch (err) {
        console.error("Error in navbar fetching", err);
      }
    };

    fetchProfileAndNotifications();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, location.pathname]);

  // Click outside to close menus
  useEffect(() => {
    const onDocClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const isActivePath = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const goTo = (path) => {
    navigate(path);
  };

  const handleBooking = () => {
    if (!isLoggedIn) {
      navigate("/login", {
        state: {
          from: location.pathname,
          redirectTo: "/hotels",
        },
      });
      return;
    }
    navigate("/hotels");
  };

  const openProfile = () => {
    if (!isLoggedIn) {
      navigate("/login", {
        state: {
          from: location.pathname,
          redirectTo: "/account",
        },
      });
      return;
    }
    navigate(accountPath);
  };

  const avatarText = useMemo(() => {
    if (userName) {
      const parts = userName.split(" ");
      return parts[parts.length - 1].substring(0, 2).toUpperCase();
    }
    return role === "ADMIN" ? "AD" : "US";
  }, [userName, role]);

  const handleResend = async () => {
    if (!userEmail) {
      toast.error("Không tìm thấy email tài khoản.");
      return;
    }
    setResendLoading(true);
    try {
      await resendVerificationEmail(userEmail);
      toast.success("Đã gửi lại email xác nhận. Vui lòng kiểm tra hộp thư của bạn.");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Không thể gửi lại email xác nhận.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("emailVerified");
    navigate("/");
  };

  const toggleNotifDropdown = async () => {
    const nextState = !notifOpen;
    setNotifOpen(nextState);
    if (nextState) {
      setProfileOpen(false);
      setNotifLoading(true);
      try {
        const res = await getMyNotifications();
        // Load latest 5 notifications
        const list = Array.isArray(res?.data) ? res.data : [];
        setNotifications(list.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setNotifLoading(false);
      }
    }
  };

  const handleMarkAsRead = async (id, event) => {
    event.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
      );
      setUnreadNotifications((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      setUnreadNotifications(0);
      toast.success("Đã đánh dấu đọc tất cả thông báo");
    } catch (err) {
      console.error(err);
    }
  };

  const formatNotifDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <style>{`
        /* Dynamic premium styles for Notification Hub */
        .nav-bell-btn {
          background: #F1F5F9;
          border: 1px solid var(--color-border);
          color: var(--color-text-soft);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }
        .nav-bell-btn:hover {
          background: #E2E8F0;
          color: var(--color-primary);
          border-color: #CBD5E1;
          transform: scale(1.05);
        }
        .nav-bell-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #EF4444;
          color: #fff;
          font-size: 0.7rem;
          font-weight: bold;
          border-radius: 10px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
          animation: pulseRed 2s infinite;
        }
        
        .nav-notif-dropdown {
          position: absolute;
          top: 50px;
          right: 0;
          width: 320px;
          background: #ffffff;
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-xl);
          border-radius: 16px;
          z-index: 1000;
          overflow: hidden;
          animation: slideDownNav 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .notif-dropdown-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          border-bottom: 1px solid var(--color-border);
          background: #F8F9FA;
        }
        .notif-dropdown-head h4 {
          margin: 0;
          font-size: 0.95rem;
          color: var(--color-secondary);
        }
        .notif-mark-all-read {
          background: none;
          border: none;
          color: var(--color-primary);
          font-size: 0.75rem;
          cursor: pointer;
          font-weight: 600;
        }
        .notif-mark-all-read:hover {
          text-decoration: underline;
        }
        .notif-dropdown-body {
          max-height: 320px;
          overflow-y: auto;
        }
        .notif-item {
          display: flex;
          flex-direction: column;
          padding: 12px 16px;
          border-bottom: 1px solid #F1F5F9;
          transition: background 0.2s ease;
          cursor: pointer;
          position: relative;
        }
        .notif-item:hover {
          background: #F8F9FA;
        }
        .notif-item.unread {
          background: rgba(17, 112, 228, 0.03);
        }
        .notif-item.unread::before {
          content: '';
          position: absolute;
          left: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-primary);
          box-shadow: 0 0 6px var(--color-primary);
        }
        .notif-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .notif-tag {
          font-size: 0.7rem;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .notif-tag.booking { background: rgba(17, 112, 228, 0.1); color: var(--color-primary); }
        .notif-tag.payment { background: rgba(16, 185, 129, 0.1); color: #059669; }
        .notif-tag.approval { background: rgba(245, 158, 11, 0.1); color: #D97706; }
        .notif-tag.system { background: rgba(139, 92, 246, 0.1); color: #7C3AED; }
        
        .notif-item-time {
          font-size: 0.7rem;
          color: var(--color-text-muted);
        }
        .notif-item-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 2px 0;
        }
        .notif-item-desc {
          font-size: 0.8rem;
          color: var(--color-text-soft);
          margin: 0;
          line-height: 1.3;
        }
        .notif-dropdown-foot {
          padding: 10px;
          text-align: center;
          border-top: 1px solid var(--color-border);
          background: #F8F9FA;
        }
        .notif-view-all-btn {
          background: none;
          border: none;
          color: var(--color-text-soft);
          font-size: 0.8rem;
          cursor: pointer;
          transition: color 0.2s ease;
          width: 100%;
          font-weight: 500;
        }
        .notif-view-all-btn:hover {
          color: var(--color-primary);
        }
        
        @keyframes pulseRed {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes slideDownNav {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {isLoggedIn && !emailVerified && (
        <div className="email-warning-banner">
          <span>📧 Tài khoản chưa xác thực email. Vui lòng kiểm tra hộp thư của bạn.</span>
          <button onClick={handleResend} disabled={resendLoading}>
            {resendLoading ? "Đang gửi..." : "Gửi lại email xác nhận"}
          </button>
        </div>
      )}

      <header className={`navbar scrolled ${isLoggedIn && !emailVerified ? "has-banner" : ""}`}>
        <div className="navbar-shell">
          <button className="navbar-logo" type="button" onClick={() => navigate("/")}>
            <BrandLogo logoStyle={brandLogoStyle} className="logo-mark" />
            <span className="logo-text">
              <strong>{brandName}</strong>
              <small>{brandSlogan}</small>
            </span>
          </button>


          <nav className="navbar-menu" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`nav-link ${isActivePath(item.path) ? "active" : ""}`}
                onClick={() => goTo(item.path)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="navbar-actions">
            {!isLoggedIn ? (
              <>
                <button
                  type="button"
                  className="auth-btn-login"
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </button>
              </>
            ) : (
              <>
                <div className="nav-notifications-hub" ref={notifRef} style={{ position: "relative", marginRight: "8px" }}>
                  <button
                    type="button"
                    className="nav-bell-btn"
                    onClick={toggleNotifDropdown}
                    aria-label="Thông báo"
                  >
                    <FaBell />
                    {unreadNotifications > 0 && (
                      <span className="nav-bell-badge">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="nav-notif-dropdown">
                      <div className="notif-dropdown-head">
                        <h4>Thông báo mới</h4>
                        {unreadNotifications > 0 && (
                          <button
                            type="button"
                            className="notif-mark-all-read"
                            onClick={handleMarkAllRead}
                          >
                            Đọc tất cả
                          </button>
                        )}
                      </div>
                      
                      <div className="notif-dropdown-body">
                        {notifLoading ? (
                          <div style={{ padding: "30px", textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-soft)" }}>
                            Đang tải thông báo...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div style={{ padding: "30px", textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-soft)" }}>
                            Bạn không có thông báo nào.
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const isUnread = !notif.read;
                            const typeLower = String(notif.type || "system").toLowerCase();
                            
                            let tagClass = "system";
                            if (typeLower.includes("booking")) tagClass = "booking";
                            if (typeLower.includes("payment")) tagClass = "payment";

                            return (
                              <article
                                key={notif.id}
                                className={`notif-item ${isUnread ? "unread" : ""}`}
                                onClick={(e) => {
                                  if (isUnread) handleMarkAsRead(notif.id, e);
                                  navigate("/notifications");
                                }}
                              >
                                <div className="notif-item-header">
                                  <span className={`notif-tag ${tagClass}`}>
                                    {notif.type || "Hệ thống"}
                                  </span>
                                  <span className="notif-item-time">
                                    {formatNotifDate(notif.createdAt)}
                                  </span>
                                </div>
                                <h5 className="notif-item-title">{notif.title}</h5>
                                <p className="notif-item-desc">{notif.message}</p>
                              </article>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="nav-profile" ref={profileRef}>
                  <button
                    type="button"
                    className="nav-profile-trigger"
                    onClick={() => setProfileOpen((value) => !value)}
                  >
                    <span className="nav-profile-avatar">{avatarText}</span>
                    <span className="nav-profile-meta">
                      <strong>{userName || (role === "ADMIN" ? "Admin" : "Đỗ Đức Đ.")}</strong>
                      <small>{role === "ADMIN" ? "Quản trị hệ thống" : "Người dùng"}</small>
                    </span>
                  </button>

                  {profileOpen && (
                    <div className="nav-profile-menu">
                      <button type="button" onClick={() => navigate("/notifications")}>
                        <FaBell style={{ marginRight: "8px" }} /> Thông báo {unreadNotifications > 0 ? `(${unreadNotifications})` : ""}
                      </button>
                      <button type="button" onClick={openProfile}>
                        <FaUser style={{ marginRight: "8px" }} /> {role === "ADMIN" ? "Hồ sơ quản trị" : "Hồ sơ của tôi"}
                      </button>
                      <button type="button" className="danger" onClick={handleLogout}>
                        <FaSignOutAlt style={{ marginRight: "8px" }} /> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            <button
              type="button"
              className="mobile-btn"
              aria-label={open ? "Đóng menu" : "Mở menu"}
              aria-expanded={open}
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        <div className={`mobile-menu ${open ? "open" : ""}`}>
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`mobile-link ${isActivePath(item.path) ? "active" : ""}`}
              onClick={() => goTo(item.path)}
            >
              {item.label}
            </button>
          ))}

          <div className="mobile-actions">
            {!isLoggedIn ? (
              <>
                <button
                  type="button"
                  className="action-btn action-ghost"
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className="action-btn action-soft"
                  onClick={() => navigate("/register")}
                >
                  Đăng ký
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="action-btn action-soft"
                  onClick={() => navigate("/notifications")}
                >
                  Thông báo {unreadNotifications > 0 ? `(${unreadNotifications})` : ""}
                </button>
                <button type="button" className="action-btn action-soft" onClick={openProfile}>
                  {role === "ADMIN" ? "Hồ sơ quản trị" : "Hồ sơ"}
                </button>
                <button type="button" className="action-btn action-soft" onClick={() => navigate("/host")}>
                  Đăng phòng
                </button>
                {role !== "ADMIN" && (
                  <button
                    type="button"
                    className="action-btn action-soft"
                    onClick={() => navigate("/account", { state: { focus: "wishlist" } })}
                  >
                    Yêu thích
                  </button>
                )}
                {role !== "ADMIN" && (
                  <button
                    type="button"
                    className="action-btn action-soft"
                    onClick={() => navigate("/account", { state: { focus: "history" } })}
                  >
                    Lịch sử booking
                  </button>
                )}
                <button type="button" className="action-btn action-ghost" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            )}

            <button type="button" className="action-btn action-primary" onClick={handleBooking}>
              Đặt phòng ngay
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
