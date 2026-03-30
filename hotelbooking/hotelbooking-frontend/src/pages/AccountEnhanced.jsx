import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import {
 getMyAccount,
 updateMyEmail,
 updateMyProfile,
} from "../services/accountService";
import {
 cancelBooking,
 createDispute,
 getMyBookings,
 getMyDisputes,
 rescheduleBooking,
} from "../services/bookingService";
import { getHotelById } from "../services/hotelService";
import { getRoomById } from "../services/roomService";
import { getMyWishlist, removeFromWishlist } from "../services/wishlistService";
import "./Account.css";

const initialProfile = {
 name: "",
 gender: "",
 dateOfBirth: "",
 citizenId: "",
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
 style: "currency",
 currency: "VND",
 maximumFractionDigits: 0,
});

function formatDate(value) {
 if (!value) {
 return "-";
 }

 const date = new Date(value);
 if (Number.isNaN(date.getTime())) {
 return "-";
 }

 return date.toLocaleDateString("vi-VN");
}

function nightsBetween(checkInDate, checkOutDate) {
 if (!checkInDate || !checkOutDate) {
 return 0;
 }

 const start = new Date(checkInDate);
 const end = new Date(checkOutDate);

 if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
 return 0;
 }

 const diff = end.getTime() - start.getTime();
 return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

function getStatusMeta(booking) {
 switch (booking?.status) {
 case "CANCELLED":
 return { label: "Da huy", className: "cancelled" };
 case "CHECKED_IN":
 return { label: "Dang luu tru", className: "active" };
 case "CHECKED_OUT":
 return { label: "Da tra phong", className: "done" };
 case "NO_SHOW":
 return { label: "Khong ?en", className: "neutral" };
 case "CONFIRMED": {
 const checkIn = new Date(booking?.checkInDate);
 const now = new Date();
 now.setHours(0, 0, 0, 0);

 if (!Number.isNaN(checkIn.getTime()) && now < checkIn) {
 return { label: "Sap ?en", className: "upcoming" };
 }

 return { label: "Da xac nhan", className: "pending" };
 }
 default:
 return { label: "Khong ro", className: "neutral" };
 }
}

function getPaymentMeta(status) {
 if (status === "PAID") {
 return { label: "Da thanh toan", className: "paid" };
 }

 if (status === "REFUNDED") {
 return { label: "Da hoan tien", className: "refunded" };
 }

 if (status === "FAILED") {
 return { label: "That bai", className: "failed" };
 }

 return { label: "Thanh toan sau", className: "pending" };
}

function normalizeBookings(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.content)) {
 return payload.content;
 }

 return [];
}

function normalizeWishlist(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

function normalizeDisputes(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
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

async function enrichBookings(bookingList) {
 const roomIds = [...new Set(bookingList.map((item) => item.roomId).filter(Boolean))];

 const roomResults = await Promise.all(
 roomIds.map(async (roomId) => {
 try {
 const res = await getRoomById(roomId);
 return [roomId, res?.data || null];
 } catch (error) {
 console.error("Cannot load room detail", roomId, error);
 return [roomId, null];
 }
 })
 );

 const roomMap = Object.fromEntries(roomResults);

 const hotelIds = [
 ...new Set(roomResults.map(([, room]) => room?.hotelId).filter(Boolean)),
 ];

 const hotelResults = await Promise.all(
 hotelIds.map(async (hotelId) => {
 try {
 const res = await getHotelById(hotelId);
 return [hotelId, res?.data || null];
 } catch (error) {
 console.error("Cannot load hotel detail", hotelId, error);
 return [hotelId, null];
 }
 })
 );

 const hotelMap = Object.fromEntries(hotelResults);

 return bookingList.map((booking) => {
 const room = roomMap[booking.roomId] || null;
 const hotel = room?.hotelId ? hotelMap[room.hotelId] || null : null;
 return {
 ...booking,
 room,
 hotel,
 };
 });
}

function getAvatarText(name) {
 const source = name?.trim() || "GU";
 const parts = source.split(/\s+/).filter(Boolean);

 if (parts.length >= 2) {
 return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
 }

 return source.slice(0, 2).toUpperCase();
}

function resolveInitialTab(locationState) {
 if (locationState?.focus === "history") {
 return "history";
 }

 if (locationState?.focus === "payments") {
 return "payments";
 }

 if (locationState?.focus === "wishlist") {
 return "wishlist";
 }

 return "profile";
}

export default function AccountEnhanced() {
 const navigate = useNavigate();
 const location = useLocation();
 const toast = useToast();

 const [activeTab, setActiveTab] = useState(resolveInitialTab(location.state));

 const [loading, setLoading] = useState(true);
 const [bookingsLoading, setBookingsLoading] = useState(true);
 const [wishlistLoading, setWishlistLoading] = useState(true);
 const [disputesLoading, setDisputesLoading] = useState(true);
 const [profileSaving, setProfileSaving] = useState(false);
 const [emailSaving, setEmailSaving] = useState(false);
 const [actionSaving, setActionSaving] = useState(false);
 const [disputeSaving, setDisputeSaving] = useState(false);

 const [profile, setProfile] = useState(initialProfile);
 const [email, setEmail] = useState("");
 const [bookings, setBookings] = useState([]);
 const [wishlistItems, setWishlistItems] = useState([]);
 const [disputes, setDisputes] = useState([]);
 const [bookingAction, setBookingAction] = useState(null);
 const [disputeDraft, setDisputeDraft] = useState({
 bookingId: "",
 subject: "",
 description: "",
 });

 const [loadError, setLoadError] = useState("");
 const [bookingsError, setBookingsError] = useState("");
 const [wishlistError, setWishlistError] = useState("");
 const [disputesError, setDisputesError] = useState("");

 const hasToken = Boolean(localStorage.getItem("accessToken"));

 useEffect(() => {
 setActiveTab(resolveInitialTab(location.state));
 }, [location.state]);

 useEffect(() => {
 if (!hasToken) {
 navigate("/login", { state: { from: location.pathname } });
 return;
 }

 let isMounted = true;

 const fetchData = async () => {
 try {
 setLoading(true);
 setBookingsLoading(true);
 setWishlistLoading(true);
 setDisputesLoading(true);

 const [accountRes, bookingsRes, wishlistRes, disputesRes] = await Promise.all([
 getMyAccount(),
 getMyBookings(),
 getMyWishlist(),
 getMyDisputes(),
 ]);

 const bookingList = normalizeBookings(bookingsRes?.data);
 const enrichedBookings = await enrichBookings(bookingList);

 if (isMounted) {
 const user = accountRes?.data || {};
 setProfile({
 name: user.name || "",
 gender: user.gender || "",
 dateOfBirth: user.dateOfBirth || "",
 citizenId: user.citizenId || "",
 });
 setEmail(user.email || "");
 setBookings(enrichedBookings);
 setWishlistItems(normalizeWishlist(wishlistRes?.data));
 setDisputes(normalizeDisputes(disputesRes?.data));
 setLoadError("");
 setBookingsError("");
 setWishlistError("");
 setDisputesError("");
 }
 } catch (error) {
 console.error("Cannot load account", error);
 if (isMounted) {
 setLoadError("Khong thO tai thong tin t i khoan. Vui long thO lai.");
 setBookingsError("Khong thO tdoi lich s? ?at phong.");
 setWishlistError("Khong thO tai wishlist.");
 setDisputesError("Khong thO tai danh sach tranh chap.");
 toast.error("Khong thO tai ?O lieu t i khoan");
 }
 } finally {
 if (isMounted) {
 setLoading(false);
 setBookingsLoading(false);
 setWishlistLoading(false);
 setDisputesLoading(false);
 }
 }
 };

 fetchData();

 return () => {
 isMounted = false;
 };
 }, [hasToken, location.pathname, navigate, toast]);

 const sortedBookings = useMemo(() => {
 return [...bookings].sort((a, b) => {
 const aValue = new Date(a.checkInDate || 0).getTime();
 const bValue = new Date(b.checkInDate || 0).getTime();
 return bValue - aValue;
 });
 }, [bookings]);

 const selectedBooking = useMemo(
 () => sortedBookings.find((booking) => booking.id === bookingAction?.bookingId) || null,
 [bookingAction?.bookingId, sortedBookings]
 );

 const sortedDisputes = useMemo(() => {
 return [...disputes].sort((a, b) => {
 const aValue = new Date(a.updatedAt || a.createdAt || 0).getTime();
 const bValue = new Date(b.updatedAt || b.createdAt || 0).getTime();
 return bValue - aValue;
 });
 }, [disputes]);

 const disputesByBookingId = useMemo(() => {
 return disputes.reduce((acc, item) => {
 if (item?.bookingId) {
 acc[item.bookingId] = item;
 }
 return acc;
 }, {});
 }, [disputes]);

 const handleProfileChange = (event) => {
 const { name, value } = event.target;
 setProfile((prev) => ({ ...prev, [name]: value }));
 };

 const handleSaveProfile = async (event) => {
 event.preventDefault();
 setProfileSaving(true);

 try {
 const res = await updateMyProfile(profile);
 const user = res?.data || {};
 setProfile({
 name: user.name || "",
 gender: user.gender || "",
 dateOfBirth: user.dateOfBirth || "",
 citizenId: user.citizenId || "",
 });
 toast.success("Da luu thong tin profile");
 } catch (error) {
 console.error("Cannot save profile", error);
 toast.error(error?.response?.data?.message || "Cap nhat profile thet bai");
 } finally {
 setProfileSaving(false);
 }
 };

 const handleSaveEmail = async (event) => {
 event.preventDefault();
 setEmailSaving(true);

 try {
 const res = await updateMyEmail(email);
 const data = res?.data || {};
 const user = data.user || {};

 if (data.accessToken) {
 localStorage.setItem("accessToken", data.accessToken);
 }

 if (data.role) {
 localStorage.setItem("role", data.role);
 }

 setEmail(user.email || email);
 setProfile((prev) => ({
 ...prev,
 name: user.name ?? prev.name,
 gender: user.gender ?? prev.gender,
 dateOfBirth: user.dateOfBirth ?? prev.dateOfBirth,
 citizenId: user.citizenId ?? prev.citizenId,
 }));

 toast.success("Da doi email thanh cong");
 } catch (error) {
 console.error("Cannot change email", error);
 toast.error(error?.response?.data?.message || "Di email thet bai");
 } finally {
 setEmailSaving(false);
 }
 };

 const refreshBookings = async () => {
 setBookingsLoading(true);

 try {
 const res = await getMyBookings();
 const enriched = await enrichBookings(normalizeBookings(res?.data));
 setBookings(enriched);
 setBookingsError("");
 } catch (error) {
 console.error("Cannot refresh booking history", error);
 setBookingsError("Khong thO tdoi lich s? ?at phong.");
 } finally {
 setBookingsLoading(false);
 }
 };

 const refreshDisputes = async () => {
 setDisputesLoading(true);

 try {
 const res = await getMyDisputes();
 setDisputes(normalizeDisputes(res?.data));
 setDisputesError("");
 } catch (error) {
 console.error("Cannot refresh disputes", error);
 setDisputesError("Khong thO tai danh sach tranh chap.");
 } finally {
 setDisputesLoading(false);
 }
 };

 const handleSubmitBookingAction = async () => {
 if (!selectedBooking || !bookingAction) {
 return;
 }

 try {
 setActionSaving(true);

 if (bookingAction.mode === "cancel") {
 await cancelBooking(selectedBooking.id, bookingAction.reason || "");
 toast.success("Da huy booking th nh cong");
 } else {
 await rescheduleBooking(selectedBooking.id, {
 checkInDate: bookingAction.checkInDate,
 checkOutDate: bookingAction.checkOutDate,
 });
 toast.success("Da doi lich booking");
 }

 setBookingAction(null);
 await refreshBookings();
 } catch (error) {
 console.error("Cannot update booking", error);
 toast.error(error?.response?.data?.error || "Khong thO cap nhat booking");
 } finally {
 setActionSaving(false);
 }
 };

 const handleRemoveWishlist = async (hotelId) => {
 try {
 await removeFromWishlist(hotelId);
 setWishlistItems((prev) => prev.filter((item) => item.hotelId !== hotelId));
 toast.success("Da bo khoi wishlist");
 } catch (error) {
 console.error("Cannot remove wishlist item", error);
 toast.error("Khong thO xoa khoi wishlist");
 }
 };

 const handleSubmitDispute = async (event) => {
 event.preventDefault();

 if (!disputeDraft.bookingId || !disputeDraft.subject.trim() || !disputeDraft.description.trim()) {
 toast.error("Vui long chon booking va nhap day du noi dung tranh chap");
 return;
 }

 try {
 setDisputeSaving(true);
 await createDispute({
 bookingId: disputeDraft.bookingId,
 subject: disputeDraft.subject.trim(),
 description: disputeDraft.description.trim(),
 });
 setDisputeDraft({
 bookingId: "",
 subject: "",
 description: "",
 });
 await refreshDisputes();
 toast.success("Da gui tranh chap th nh cong");
 } catch (error) {
 console.error("Cannot create dispute", error);
 toast.error(error?.response?.data?.error || "Khong thO gui tranh chap");
 } finally {
 setDisputeSaving(false);
 }
 };

 return (
 <main className="account-page">
 <section className="account-shell">
 <header className="account-header">
 <div>
 <p className="account-tag">Profile nguoi dung</p>
 <h1>Quan ly t i khoan cua ban</h1>
 <p className="account-subtitle">
 Mot noi duy nhat ?O cap nhat profile, theo doi booking, lich s? thanh toan,
 ho n tien, tranh chap va quan ly wishlist.
 </p>
 </div>
 <button type="button" className="back-btn" onClick={() => navigate("/")}>
 Quay v? trang chu
 </button>
 </header>

 {loading ? (
 <div className="account-state">dang tai lieu tai khoan...</div>
 ) : loadError ? (
 <div className="account-error">{loadError}</div>
 ) : (
 <>
 <section className="profile-hero">
 <div className="hero-avatar">{getAvatarText(profile.name)}</div>
 <div className="hero-info">
 <h2>{profile.name || "Nguoi dung"}</h2>
 <p>{email || "-"}</p>
 </div>
 </section>

 <section className="account-tabs account-tabs-wide">
 <button
 type="button"
 className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
 onClick={() => setActiveTab("profile")}
 >
 Profile
 </button>
 <button
 type="button"
 className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
 onClick={() => setActiveTab("history")}
 >
 Lich so booking
 </button>
 <button
 type="button"
 className={`tab-btn ${activeTab === "payments" ? "active" : ""}`}
 onClick={() => setActiveTab("payments")}
 >
 Thanh toan
 </button>
 <button
 type="button"
 className={`tab-btn ${activeTab === "wishlist" ? "active" : ""}`}
 onClick={() => setActiveTab("wishlist")}
 >
 Wishlist
 </button>
 </section>

 {activeTab === "profile" ? (
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
 <option value="">Chan gioi tinh</option>
 <option value="Nam">Nam</option>
 <option value="Nu">Nu</option>
 <option value="Khac">Khac</option>
 </select>
 </label>

 <label>
 <span>Ngy sinh</span>
 <input
 type="date"
 name="dateOfBirth
 value={profile.dateOfBirth}
 onChange={handleProfileChange}
 />
 </label>

 <label>
 <span>So can cuoc</span>
 <input
 name="citizenId
 value={profile.citizenId}
 onChange={handleProfileChange}
 placeholder="Nhap so can cuoc"
 />
 </label>

 <button type="submit" className="save-btn" disabled={profileSaving}>
 {profileSaving ? "Dang luu..." : "Lu profile"}
 </button>
 </form>
 </div>

 <div className="profile-section">
 <h3>Cai dat t i khoan</h3>
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
 {emailSaving ? "Dang cap nhet..." : "Cap nhat email"}
 </button>
 </form>
 </div>
 </section>
 ) : null}

 {activeTab === "history" ? (
 <section className="account-card account-history-card">
 <div className="history-head">
 <h2>Lich so ?at phong cua toi</h2>
 <span>{sortedBookings.length} booking</span>
 </div>

 {selectedBooking && bookingAction ? (
 <div className="booking-action-panel">
 <h3>
 {bookingAction.mode === "cancel"
 ? "Huy booking"
 : "Di lich booking"}
 </h3>
 <p>
 {selectedBooking.hotel.name || "-"} - {selectedBooking.room?.name || "-"}
 </p>

 {bookingAction.mode === "cancel" ? (
 <label className="action-field">
 <span>Ly do huy</span>
 <textarea
 value={bookingAction.reason || ""}
 onChange={(event) =>
 setBookingAction((prev) => ({
 ...prev,
 reason: event.target.value,
 }))
 }
 placeholder="Vi du: thay doi ke hoach di chuyen"
 />
 </label>
 ) : (
 <div className="action-field-row">
 <label className="action-field">
 <span>Ngy nhan phong moi</span>
 <input
 type="date"
 value={bookingAction.checkInDate || ""}
 onChange={(event) =>
 setBookingAction((prev) => ({
 ...prev,
 checkInDate: event.target.value,
 }))
 }
 />
 </label>

 <label className="action-field">
 <span>Ngy tra phong moi</span>
 <input
 type="date"
 value={bookingAction.checkOutDate || ""}
 onChange={(event) =>
 setBookingAction((prev) => ({
 ...prev,
 checkOutDate: event.target.value,
 }))
 }
 />
 </label>
 </div>
 )}

 <div className="action-buttons">
 <button
 type="button"
 className="save-btn"
 onClick={handleSubmitBookingAction}
 disabled={actionSaving}
 >
 {actionSaving ? "Dang x? ly..." : "Xac nhan"}
 </button>
 <button
 type="button"
 className="action-text-btn"
 onClick={() => setBookingAction(null)}
 >
 Huy thao tac
 </button>
 </div>
 </div>
 ) : null}

 {bookingsLoading ? (
 <div className="account-state">dang tai lieu tai khoan...</div>
 ) : bookingsError ? (
 <div className="account-state">dang tai lieu tai khoan...</div>
 ) : sortedBookings.length === 0 ? (
 <div className="account-state">dang tai lieu tai khoan...</div>
 ) : (
 <div className="history-table-wrap">
 <table className="history-table history-table-wide">
 <thead>
 <tr>
 <th>Khach san</th>
 <th>Phong</th>
 <th>Nhan phong</th>
 <th>Tra phong</th>
 <th>So dem</th>
 <th>Tong tien</th>
 <th>Ghi chu</th>
 <th>Thanh toan</th>
 <th>Trang thai</th>
 <th>Thao tac</th>
 </tr>
 </thead>
 <tbody>
 {sortedBookings.map((booking) => {
 const statusMeta = getStatusMeta(booking);
 const paymentMeta = getPaymentMeta(booking.paymentStatus);
 const totalPrice = Number(
 booking.finalPrice || booking.totalPrice || 0
 );
 const nights = nightsBetween(
 booking.checkInDate,
 booking.checkOutDate
 );
 const allowActions =
 booking.status === "CONFIRMED" &&
 statusMeta.className === "upcoming";
 const existingDispute = disputesByBookingId[booking.id];

 return (
 <tr key={booking.id || `${booking.roomId}-${booking.checkInDate}`}>
 <td>{booking.hotel.name || "-"}</td>
 <td>{booking.room?.name || booking.roomId || "-"}</td>
 <td>{formatDate(booking.checkInDate)}</td>
 <td>{formatDate(booking.checkOutDate)}</td>
 <td>{nights > 0 ? nights : "-"}</td>
 <td>
 {Number.isFinite(totalPrice)
 ? currencyFormatter.format(totalPrice)
 : "-"}
 </td>
 <td>{booking.note || "-"}</td>
 <td>
 <span className={`payment-pill ${paymentMeta.className}`}>
 {paymentMeta.label}
 </span>
 </td>
 <td>
 <span className={`booking-status ${statusMeta.className}`}>
 {statusMeta.label}
 </span>
 </td>
 <td>
 <div className="table-action-group">
 {allowActions ? (
 <>
 <button
 type="button"
 className="table-action-btn"
 onClick={() =>
 setBookingAction({
 bookingId: booking.id,
 mode: "reschedule",
 checkInDate: booking.checkInDate,
 checkOutDate: booking.checkOutDate,
 })
 }
 >
 Di lich
 </button>
 <button
 type="button"
 className="table-action-btn danger"
 onClick={() =>
 setBookingAction({
 bookingId: booking.id,
 mode: "cancel",
 reason: "",
 })
 }
 >
 Huy booking
 </button>
 </>
 ) : (
 <button
 type="button"
 className="table-action-btn"
 onClick={() =>
 booking.hotel.id
 ? navigate(`/hotels/${booking.hotel.id}`, {
 state: { hotel: booking.hotel },
 })
 : null
 }
 >
 Xem hotel
 </button>
 )}
 {existingDispute ? (
 <button
 type="button"
 className="table-action-btn"
 onClick={() => setActiveTab("payments")}
 >
 Xem tranh chap
 </button>
 ) : (
 <button
 type="button"
 className="table-action-btn"
 onClick={() => {
 setActiveTab("payments");
 setDisputeDraft({
 bookingId: booking.id,
 subject: booking.cancellationReason
 ? "Can giai quyet booking da huy"
 : "Can ho tro booking",
 description: booking.note
 ? `Chi tiat booking: ${booking.note}`
 : "",
 });
 }}
 >
 Bao cao
 </button>
 )}
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </section>
 ) : null}

 {activeTab === "payments" ? (
 <section className="account-card payments-card">
 <div className="history-head">
 <h2>Lich so thanh toan va tranh chap</h2>
 <span>{sortedBookings.length} giao dich</span>
 </div>

 <div className="payments-grid">
 <section className="payments-panel">
 <h3>Dang tien booking</h3>
 <p className="card-note">
 Theo doi payment method, thoi diem thanh toan, coupon da dung va so tien hoan lai.
 </p>

 {bookingsLoading ? (
 <div className="account-state">dang tai lieu tai khoan...</div>
 ) : bookingsError ? (
 <div className="account-state">dang tai lieu tai khoan...</div>
 ) : (
 <div className="history-table-wrap">
 <table className="history-table payments-table">
 <thead>
 <tr>
 <th>Booking</th>
 <th>Thanh toan</th>
 <th>Phuong thuc</th>
 <th>Da tra</th>
 <th>Hoan tien</th>
 <th>Coupon</th>
 <th>Cap nhat</th>
 </tr>
 </thead>
 <tbody>
 {sortedBookings.map((booking) => {
 const paymentMeta = getPaymentMeta(booking.paymentStatus);
 return (
 <tr key={`payment-${booking.id}`}>
 <td>
 <strong>{booking.hotel.name || "-"}</strong>
 <div>{booking.room?.name || "-"}</div>
 </td>
 <td>
 <span className={`payment-pill ${paymentMeta.className}`}>
 {paymentMeta.label}
 </span>
 </td>
 <td>{booking.paymentMethod || "PAY_AT_HOTEL"}</td>
 <td>
 {Number(booking.finalPrice || booking.totalPrice || 0) > 0
 ? currencyFormatter.format(
 Number(booking.finalPrice || booking.totalPrice || 0)
 )
 : "-"}
 </td>
 <td>
 {Number(booking.refundAmount || 0) > 0
 ? currencyFormatter.format(Number(booking.refundAmount || 0))
 : "-"}
 </td>
 <td>{booking.couponCode || "-"}</td>
 <td>{formatDateTime(booking.paidAt || booking.updatedAt)}</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </section>

 <section className="payments-panel">
 <h3>Gui tranh chap / bao cao</h3>
 <p className="card-note">
 Khi c? van ?O v? thanh toan, phong khong dung mo ta hoac can admin ho tro, ban c? the gui tranh chap tai day.
 </p>

 <form className="account-form" onSubmit={handleSubmitDispute}>
 <label>
 <span>Booking</span>
 <select
 value={disputeDraft.bookingId}
 onChange={(event) =>
 setDisputeDraft((prev) => ({
 ...prev,
 bookingId: event.target.value,
 }))
 }
 >
 <option value="">Chan booking can bao cao</option>
 {sortedBookings.map((booking) => (
 <option
 key={`dispute-option-${booking.id}`}
 value={booking.id}
 disabled={Boolean(disputesByBookingId[booking.id])}
 >
 {booking.hotel.name || "-"} - {formatDate(booking.checkInDate)}
 {disputesByBookingId[booking.id] ? " (da gui)" : ""}
 </option>
 ))}
 </select>
 </label>

 <label>
 <span>Chu ?O</span>
 <input
 value={disputeDraft.subject}
 onChange={(event) =>
 setDisputeDraft((prev) => ({
 ...prev,
 subject: event.target.value,
 }))
 }
 placeholder="Vi du: Hoan tien cham, phong khong dung mo ta"
 />
 </label>

 <label>
 <span>Noi dung</span>
 <textarea
 value={disputeDraft.description}
 onChange={(event) =>
 setDisputeDraft((prev) => ({
 ...prev,
 description: event.target.value,
 }))
 }
 placeholder="M? t? c? the van ?O ?O admin co the xu ly nhanh hon"
 />
 </label>

 <button type="submit" className="save-btn" disabled={disputeSaving}>
 {disputeSaving ? "Dang gui..." : "Gui tranh chap"}
 </button>
 </form>

 <div className="payments-disputes">
 <div className="history-head compact-head">
 <h3>Tranh chap cua toi</h3>
 <button type="button" className="table-action-btn" onClick={refreshDisputes}>
 Tai lai
 </button>
 </div>

 {disputesLoading ? (
 <div className="account-state">dang tai lieu tai khoan...</div>
 ) : disputesError ? (
 <div className="account-state">dang tai lieu tai khoan...</div>
 ) : sortedDisputes.length === 0 ? (
 <p className="inline-note">Ban chua gui tranh chap nao.</p>
 ) : (
 <div className="dispute-list">
 {sortedDisputes.map((dispute) => (
 <article key={dispute.id} className="dispute-card">
 <div className="dispute-head">
 <strong>{dispute.subject || "Tranh chap booking"}</strong>
 <span className={`booking-status ${String(dispute.status || "").toLowerCase()}`}>
 {dispute.status || "OPEN"}
 </span>
 </div>
 <p>{dispute.description || "-"}</p>
 <small>
 Booking: {dispute.bookingId || "-"} - Cap nhat:{" "}
 {formatDateTime(dispute.updatedAt || dispute.createdAt)}
 </small>
 {dispute.resolutionNote ? (
 <div className="resolution-note">
 Admin: {dispute.resolutionNote}
 </div>
 ) : null}
 </article>
 ))}
 </div>
 )}
 </div>
 </section>
 </div>
 </section>
 ) : null}

 {activeTab === "wishlist" ? (
 <section className="account-card">
 <div className="history-head">
 <h2>Khach san yeu thich</h2>
 <span>{wishlistItems.length} muc</span>
 </div>

 {wishlistLoading ? (
 <div className="account-state">dang tai lieu tai khoan...</div>
 ) : wishlistError ? (
 <div className="account-state">dang tai lieu tai khoan...</div>
 ) : wishlistItems.length === 0 ? (
 <div className="account-state">dang tai lieu tai khoan...</div>
 ) : (
 <div className="wishlist-grid">
 {wishlistItems.map((item) => {
 const hotel = item.hotel;
 if (!hotel) {
 return null;
 }

 return (
 <article key={item.hotelId} className="wishlist-card">
 <p className="wishlist-city">{hotel.city || "Da diem noi bat"}</p>
 <h3>{hotel.name || "Khach san"}</h3>
 <p>{hotel.address || "-"}</p>
 <small>
 {hotel.starRating || 3} sao
 {hotel.averageRating
 ? ` - rating ${Number(hotel.averageRating).toFixed(1)}`
 : ""}
 </small>
 <div className="wishlist-actions">
 <button
 type="button"
 className="table-action-btn"
 onClick={() =>
 navigate(`/hotels/${hotel.id}`, {
 state: { hotel },
 })
 }
 >
 Xem chi tiet
 </button>
 <button
 type="button"
 className="table-action-btn danger"
 onClick={() => handleRemoveWishlist(item.hotelId)}
 >
 Xoa
 </button>
 </div>
 </article>
 );
 })}
 </div>
 )}
 </section>
 ) : null}
 </>
 )}
 </section>
 </main>
 );
}


