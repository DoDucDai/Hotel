import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUnreadNotificationCount } from "../services/notificationService";
import "./Navbar.css";

function getAvatarText(role) {
 return role === "ADMIN" ? "AD" : "US";
}

export default function Navbar() {
 const navigate = useNavigate();
 const location = useLocation();
 const profileRef = useRef(null);

 const [open, setOpen] = useState(false);
 const [scrolled, setScrolled] = useState(false);
 const [profileOpen, setProfileOpen] = useState(false);
 const [unreadNotifications, setUnreadNotifications] = useState(0);

 const isLoggedIn = Boolean(localStorage.getItem("accessToken"));
 const role = localStorage.getItem("role");
 const accountPath = role === "ADMIN" ? "/admin?view=account" : "/account";

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

 useEffect(() => {
 let isMounted = true;

 const fetchUnreadCount = async () => {
 if (!isLoggedIn) {
 setUnreadNotifications(0);
 return;
 }

 try {
 const res = await getUnreadNotificationCount();
 if (isMounted) {
 setUnreadNotifications(Number(res?.data?.unread || 0));
 }
 } catch {
 if (isMounted) {
 setUnreadNotifications(0);
 }
 }
 };

 fetchUnreadCount();

 return () => {
 isMounted = false;
 };
 }, [isLoggedIn, location.pathname]);

 useEffect(() => {
 const onDocClick = (event) => {
 if (profileRef.current && !profileRef.current.contains(event.target)) {
 setProfileOpen(false);
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

 const handleLogout = () => {
 localStorage.removeItem("accessToken");
 localStorage.removeItem("refreshToken");
 localStorage.removeItem("role");
 navigate("/");
 };

 return (
 <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
 <div className="navbar-shell">
 <button className="navbar-logo" type="button" onClick={() => navigate("/")}>
 <span className="logo-mark" aria-hidden="true" />
 <span className="logo-text">
 <strong>HOTEL BOOKING</strong>
 <small>Find your perfect stay</small>
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
 <div className="nav-profile" ref={profileRef}>
 <button
 type="button"
 className="nav-profile-trigger"
 onClick={() => setProfileOpen((value) => !value)}
 >
 <span className="nav-profile-avatar">{getAvatarText(role)}</span>
 <span className="nav-profile-meta">
 <strong>{role === "ADMIN" ? "Admin" : "Tài khoản cá nhân"}</strong>
 <small>{role === "ADMIN" ? "Quản trị hệ thống" : "Người dùng"}</small>
 </span>
 <span className={`nav-profile-caret ${profileOpen ? "open" : ""}`}>v</span>
 {unreadNotifications > 0 && (
 <span className="nav-notify-badge">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>
 )}
 </button>

 {profileOpen && (
 <div className="nav-profile-menu">
 <button type="button" onClick={() => navigate("/notifications")}>
 Thông báo {unreadNotifications > 0 ? `(${unreadNotifications})` : ""}
 </button>
 <button type="button" onClick={openProfile}>
 {role === "ADMIN" ? "Hồ sơ quản trị" : "Hồ sơ của tôi"}
 </button>
 <button type="button" onClick={() => navigate("/host")}>
 Đăng phòng
 </button>
 {role !== "ADMIN" && (
 <button
 type="button"
 onClick={() => navigate("/account", { state: { focus: "wishlist" } })}
 >
 Yêu thích
 </button>
 )}
 {role !== "ADMIN" && (
 <button
 type="button"
 onClick={() =>
 navigate("/account", {
 state: { focus: "history" },
 })
 }
 >
 Lịch sử booking
 </button>
 )}
 <button type="button" className="danger" onClick={handleLogout}>
 Đăng xuất
 </button>
 </div>
 )}
 </div>
 )}

 <button type="button" className="action-btn action-primary" onClick={handleBooking}>
 Đặt phòng ngay
 </button>
 </div>

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
 );
}
