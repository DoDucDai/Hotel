import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import { getMyAccount } from "../services/accountService";
import { createBooking, createPaymentCheckout } from "../services/bookingService";
import { getActiveCoupons } from "../services/couponService";
import { resolveBookingContext } from "../features/booking/bookingPageUtils";
import "./Booking.css";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
 style: "currency",
 currency: "VND",
 maximumFractionDigits: 0,
});

const paymentOptions = [
 {
 value: "PAY_AT_HOTEL",
 label: "Thanh toan tai khach san",
 note: "Booking duoc giu cho ban, thanh toan khi check-in.",
 },
 {
 value: "BANK_TRANSFER",
 label: "Chuyen khoan",
 note: "Thanh toan qua cong thanh toan sandbox, booking cap nhat qua webhook.",
 },
 {
 value: "E_WALLET",
 label: "Vi dien tu",
 note: "Thanh toan online sandbox, ket qua tra ve theo callback.",
 },
];

function getToday() {
 return new Date().toISOString().slice(0, 10);
}

function getTomorrow() {
 const date = new Date();
 date.setDate(date.getDate() + 1);
 return date.toISOString().slice(0, 10);
}

function daysBetween(checkIn, checkOut) {
 const start = new Date(checkIn);
 const end = new Date(checkOut);
 const diff = end.getTime() - start.getTime();
 return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function readPendingBooking() {
 try {
 const raw = sessionStorage.getItem("pendingBooking");
 if (!raw) {
 return null;
 }
 return JSON.parse(raw);
 } catch (error) {
 console.error("Cannot parse pending booking", error);
 return null;
 }
}

function clearPendingBooking() {
 sessionStorage.removeItem("pendingBooking");
}

function normalizeCoupons(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

function couponStillValid(coupon) {
 if (!coupon?.expiresAt) {
 return true;
 }

 return new Date(coupon.expiresAt) >= new Date(getToday());
}

function calculateDiscount(amount, coupon) {
 if (!coupon || !amount || !couponStillValid(coupon)) {
 return 0;
 }

 if (amount < Number(coupon.minOrderAmount || 0)) {
 return 0;
 }

 if (coupon.discountType === "FIXED") {
 return Math.max(Math.min(Number(coupon.discountValue || 0), amount), 0);
 }

 return Math.max(
 Math.min(amount * (Number(coupon.discountValue || 0) / 100), amount),
 0
 );
}

function Booking() {
 const navigate = useNavigate();
 const location = useLocation();
 const toast = useToast();
 const redirectTimerRef = useRef(null);

 const pendingBooking = useMemo(() => readPendingBooking(), []);
 const bookingContext = useMemo(
 () => resolveBookingContext(location.state, pendingBooking),
 [location.state, pendingBooking]
 );
 const selectedHotel = bookingContext.hotel;
 const selectedRoom = bookingContext.room;
 const searchCriteria = bookingContext.searchCriteria;

 const [account, setAccount] = useState(null);
 const [loadingAccount, setLoadingAccount] = useState(true);
 const [submitting, setSubmitting] = useState(false);
 const [redirecting, setRedirecting] = useState(false);
 const [couponsLoading, setCouponsLoading] = useState(true);
 const [coupons, setCoupons] = useState([]);

 const [checkInDate, setCheckInDate] = useState(searchCriteria.checkIn || getToday());
 const [checkOutDate, setCheckOutDate] = useState(searchCriteria.checkOut || getTomorrow());
 const [guests, setGuests] = useState(String(searchCriteria.guests || selectedRoom?.capacity || 1));
 const [note, setNote] = useState("");
 const [couponCode, setCouponCode] = useState("");
 const [paymentMethod, setPaymentMethod] = useState("PAY_AT_HOTEL");

 const [pageError, setPageError] = useState("");

 const hasToken = Boolean(localStorage.getItem("accessToken"));

 useEffect(() => {
 return () => {
 if (redirectTimerRef.current) {
 clearTimeout(redirectTimerRef.current);
 }
 };
 }, []);

 useEffect(() => {
 if (!hasToken) {
 navigate("/login", {
 replace: true,
 state: {
 from: location.pathname,
 redirectTo: "/booking",
 redirectState: bookingContext.raw || null,
 },
 });
 return;
 }

 const fetchData = async () => {
 try {
 setLoadingAccount(true);
 setCouponsLoading(true);

 const [accountRes, couponsRes] = await Promise.all([
 getMyAccount(),
 getActiveCoupons(),
 ]);

 setAccount(accountRes?.data || null);
 setCoupons(normalizeCoupons(couponsRes?.data));
 } catch (fetchError) {
 console.error("Cannot load booking dependencies", fetchError);
 setPageError("Khong the tai de lieu booking. Vui long the lai.");
 toast.error("Khong the tai de lieu booking");
 } finally {
 setLoadingAccount(false);
 setCouponsLoading(false);
 }
 };

 fetchData();
 }, [bookingContext, hasToken, location.pathname, navigate, toast]);

 const nightCount = useMemo(() => {
 if (!checkInDate || !checkOutDate) {
 return 0;
 }
 return Math.max(daysBetween(checkInDate, checkOutDate), 0);
 }, [checkInDate, checkOutDate]);

 const estimatedOriginalPrice = useMemo(() => {
 const roomPrice = Number(selectedRoom?.price || 0);
 if (!roomPrice || !nightCount) {
 return 0;
 }
 return roomPrice * nightCount;
 }, [nightCount, selectedRoom?.price]);

 const normalizedCouponCode = couponCode.trim().toUpperCase();

 const selectedCoupon = useMemo(() => {
 if (!normalizedCouponCode) {
 return null;
 }

 return coupons.find(
 (coupon) => (coupon.code || "").toUpperCase() === normalizedCouponCode
 );
 }, [coupons, normalizedCouponCode]);

 const discountAmount = useMemo(
 () => calculateDiscount(estimatedOriginalPrice, selectedCoupon),
 [estimatedOriginalPrice, selectedCoupon]
 );

 const estimatedFinalPrice = Math.max(estimatedOriginalPrice - discountAmount, 0);

 const selectedPayment = useMemo(
 () => paymentOptions.find((item) => item.value === paymentMethod) || paymentOptions[0],
 [paymentMethod]
 );

 const couponHint = useMemo(() => {
 if (!normalizedCouponCode) {
 return "";
 }

 if (!selectedCoupon) {
 return "Ma giam gia nay khong co trong danh sach dang hoat dong.";
 }

 if (!couponStillValid(selectedCoupon)) {
 return "Ma giam gia nay da het han.";
 }

 if (estimatedOriginalPrice < Number(selectedCoupon.minOrderAmount || 0)) {
 return `Can dat toi thieu ${currencyFormatter.format(
 Number(selectedCoupon.minOrderAmount || 0)
 )} de dung ma nay.`;
 }

 return `Ap dung th nh cong: ${selectedCoupon.description || selectedCoupon.code}`;
 }, [estimatedOriginalPrice, normalizedCouponCode, selectedCoupon]);

 const handleSubmit = async (event) => {
 event.preventDefault();
 setPageError("");

 if (!selectedRoom?.id) {
 toast.error("Ban can chan phong truoc khi dat");
 return;
 }

 if (!checkInDate || !checkOutDate) {
 toast.error("Vui long chan day ngay nhan va ngay tra");
 return;
 }

 if (new Date(checkOutDate) <= new Date(checkInDate)) {
 toast.error("Ng y tra phai sau ngay nhan");
 return;
 }

 try {
 setSubmitting(true);

 const payload = {
 roomId: selectedRoom.id,
 checkInDate,
 checkOutDate,
 guestCount: Number(guests || 1),
 note: note.trim(),
 paymentMethod,
 couponCode: normalizedCouponCode || null,
 };

 const bookingRes = await createBooking(payload);
 const createdBooking = bookingRes?.data;
 clearPendingBooking();
 if (!createdBooking?.id) {
 throw new Error("Booking response is invalid");
 }

 if (paymentMethod === "PAY_AT_HOTEL") {
 setRedirecting(true);
 toast.success("Dt phong th nh cong. Booking da duoc tao.");

 if (redirectTimerRef.current) {
 clearTimeout(redirectTimerRef.current);
 }

 redirectTimerRef.current = setTimeout(() => {
 navigate("/account", { replace: true, state: { focus: "history" } });
 }, 1600);
 return;
 }

 const checkoutRes = await createPaymentCheckout(createdBooking.id);
 const checkoutUrl = checkoutRes?.data?.checkoutUrl;
 if (!checkoutUrl) {
 throw new Error("Khong tao duoc link thanh toan");
 }
 toast.success("Dang chuyen den cong thanh toan sandbox...");
 window.location.assign(checkoutUrl);
 } catch (submitError) {
 console.error("Cannot create booking", submitError);
 const message =
 submitError?.response?.data?.error ||
 submitError?.response?.data?.message ||
 submitError?.response?.data ||
 "Dt phong thet bai. Vui long the lai.";
 setPageError(message);
 toast.error(
 typeof message === "string" ? message : "Dt phong thet bai. Vui long the lai."
 );
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <main className="booking-page">
 <section className="booking-shell">
 <header className="booking-header">
 <div>
 <p className="booking-tag">Xac nhan dat phong</p>
 <h1>Thong tin dat phong cua ban</h1>
 <p>
 Chan lich luu tru, them ma giam gia va quyet dinh cach thanh toan truoc khi
 ho n tat booking.
 </p>
 </div>

 <button type="button" className="back-hotels-btn" onClick={() => navigate("/hotels")}>
 V? trang hotels
 </button>
 </header>

 <div className="booking-grid">
 <section className="booking-card">
 <h2>Chi tiat dat phong</h2>

 {!selectedRoom ? (
 <div className="booking-state">
 Cha co phong duoc chan. Vui long vao trang chi tiet khach san de chan phong.
 <button type="button" onClick={() => navigate("/hotels")}>
 Chan phong ngay
 </button>
 </div>
 ) : (
 <form className="booking-form" onSubmit={handleSubmit}>
 <label>
 <span>Khach san</span>
 <input value={selectedHotel?.name || "-"} readOnly />
 </label>

 <label>
 <span>Loai phong</span>
 <input value={selectedRoom?.name || "-"} readOnly />
 </label>

 <div className="field-row">
 <label>
 <span>Ng y nhan phong</span>
 <input
 type="date"
 value={checkInDate}
 min={getToday()}
 onChange={(event) => setCheckInDate(event.target.value)}
 required
 />
 </label>

 <label>
 <span>Ng y tra phong</span>
 <input
 type="date"
 value={checkOutDate}
 min={checkInDate || getTomorrow()}
 onChange={(event) => setCheckOutDate(event.target.value)}
 required
 />
 </label>
 </div>

 <div className="field-row">
 <label>
 <span>So nguoi</span>
 <input
 type="number"
 min="1"
 value={guests}
 onChange={(event) => setGuests(event.target.value)}
 />
 </label>

 <label>
 <span>So dem</span>
 <input value={nightCount > 0 ? `${nightCount} dem` : "-"} readOnly />
 </label>
 </div>

 <label>
 <span>Phuong thuc thanh toan</span>
 <select
 value={paymentMethod}
 onChange={(event) => setPaymentMethod(event.target.value)}
 >
 {paymentOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>

 <p className="payment-hint">{selectedPayment.note}</p>

 <label>
 <span>Ma giam gia</span>
 <input
 value={couponCode}
 onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
 placeholder="Nhap ma nhu WELCOME10"
 />
 </label>

 <div className="coupon-pills">
 {couponsLoading ? (
 <span className="coupon-pill muted">Dang toi coupon...</span>
 ) : coupons.length ? (
 coupons.map((coupon) => (
 <button
 key={coupon.id || coupon.code}
 type="button"
 className={`coupon-pill ${
 normalizedCouponCode === (coupon.code || "").toUpperCase()
 ? "active"
 : ""
 }`}
 onClick={() =>
 setCouponCode((current) =>
 current.trim().toUpperCase() === (coupon.code || "").toUpperCase()
 ? ""
 : coupon.code || ""
 )
 }
 >
 {coupon.code}
 </button>
 ))
 ) : (
 <span className="coupon-pill muted">Cha co coupon dang hoat dong</span>
 )}
 </div>

 {couponHint ? (
 <p
 className={`form-message ${
 selectedCoupon && discountAmount > 0 ? "success" : "error"
 }`}
 >
 {couponHint}
 </p>
 ) : null}

 <label>
 <span>Ghi chu</span>
 <textarea
 value={note}
 onChange={(event) => setNote(event.target.value)}
 placeholder="Yeu cau dac biet (neu co)"
 />
 </label>

 {pageError && <p className="form-message error">{pageError}</p>}

 <button type="submit" disabled={submitting || loadingAccount || redirecting}>
 {submitting ? "Dang dat phong..." : "Xac nhan dat phong"}
 </button>

 {redirecting && (
 <button
 type="button"
 className="back-home-btn"
 onClick={() =>
 navigate("/account", { replace: true, state: { focus: "history" } })
 }
 >
 Xem lich so booking ngay
 </button>
 )}
 </form>
 )}
 </section>

 <aside className="booking-summary">
 <article className="summary-card">
 <h3>Tom tat</h3>
 <ul>
 <li>
 <span>Khach hang</span>
 <strong>{account?.name || "-"}</strong>
 </li>
 <li>
 <span>Email</span>
 <strong>{account?.email || "-"}</strong>
 </li>
 <li>
 <span>Khach san</span>
 <strong>{selectedHotel?.name || "-"}</strong>
 </li>
 <li>
 <span>Phong</span>
 <strong>{selectedRoom?.name || "-"}</strong>
 </li>
 <li>
 <span>Gia / dem</span>
 <strong>
 {selectedRoom?.price
 ? currencyFormatter.format(selectedRoom.price)
 : "Dang cap nhet"}
 </strong>
 </li>
 <li>
 <span>Thanh toan</span>
 <strong>{selectedPayment.label}</strong>
 </li>
 <li>
 <span>Tam tinh</span>
 <strong>
 {estimatedOriginalPrice
 ? currencyFormatter.format(estimatedOriginalPrice)
 : "-"}
 </strong>
 </li>
 <li>
 <span>Giam gia</span>
 <strong>
 {discountAmount ? `- ${currencyFormatter.format(discountAmount)}` : "-"}
 </strong>
 </li>
 <li className="summary-total">
 <span>Tong thanh toan</span>
 <strong>
 {estimatedFinalPrice
 ? currencyFormatter.format(estimatedFinalPrice)
 : currencyFormatter.format(0)}
 </strong>
 </li>
 </ul>
 </article>
 </aside>
 </div>
 </section>
 </main>
 );
}

export default Booking;

