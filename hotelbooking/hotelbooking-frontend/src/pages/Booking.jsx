import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import { getMyAccount } from "../services/accountService";
import {
 createBooking,
 createPaymentCheckout,
 getPaymentInstructions,
} from "../services/bookingService";
import { getActiveCoupons } from "../services/couponService";
import { resolveBookingContext } from "../features/booking/bookingPageUtils";
import { addDaysToDateInput, formatDateInputLocal } from "../utils/dateInput";
import {
 getPaymentAccountLabel,
 getPaymentProviderLabel,
 normalizePaymentInstructions,
} from "../utils/paymentPresentation";
import "./Booking.css";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
 style: "currency",
 currency: "VND",
 maximumFractionDigits: 0,
});

const paymentOptions = [
 {
 value: "PAY_AT_HOTEL",
 label: "Thanh toán tại khách sạn",
 note: "Booking được giữ cho bạn, thanh toán khi check-in.",
 },
 {
 value: "BANK_TRANSFER",
 label: "Chuyển khoản",
 note: "Thanh toán qua cổng thanh toán sandbox, booking cập nhật qua webhook.",
 },
 {
 value: "E_WALLET",
 label: "Ví điện tử",
 note: "Thanh toán online sandbox, kết quả trả về theo callback.",
 },
];

function getToday() {
 return formatDateInputLocal(new Date());
}

function getTomorrow() {
 return addDaysToDateInput(getToday(), 1);
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

function settledValue(result, fallback) {
 if (result?.status === "fulfilled") {
 return result.value;
 }

 return fallback;
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
 const [paymentInstructions, setPaymentInstructions] = useState({});

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

 const [accountResult, couponsResult, instructionsResult] = await Promise.allSettled([
 getMyAccount(),
 getActiveCoupons(),
 getPaymentInstructions(),
 ]);

 const accountRes = settledValue(accountResult, null);
 if (!accountRes) {
 throw new Error("Cannot load account");
 }

 setAccount(accountRes?.data || null);
 setCoupons(normalizeCoupons(settledValue(couponsResult, null)?.data));
 setPaymentInstructions(
 normalizePaymentInstructions(settledValue(instructionsResult, null)?.data)
 );
 } catch (fetchError) {
 console.error("Cannot load booking dependencies", fetchError);
 setPageError("Không thể tải dữ liệu booking. Vui lòng thử lại.");
 toast.error("Không thể tải dữ liệu booking");
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

 const selectedInstruction = useMemo(() => {
 if (paymentMethod === "BANK_TRANSFER") {
 return paymentInstructions.bankTransfer || null;
 }

 if (paymentMethod === "E_WALLET") {
 return paymentInstructions.eWallet || null;
 }

 return null;
 }, [paymentInstructions, paymentMethod]);

 const couponHint = useMemo(() => {
 if (!normalizedCouponCode) {
 return "";
 }

 if (!selectedCoupon) {
 return "Mã giảm giá này không có trong danh sách đang hoạt động.";
 }

 if (!couponStillValid(selectedCoupon)) {
 return "Mã giảm giá này đã hết hạn.";
 }

 if (estimatedOriginalPrice < Number(selectedCoupon.minOrderAmount || 0)) {
 return `Cần đặt tối thiểu ${currencyFormatter.format(
 Number(selectedCoupon.minOrderAmount || 0)
 )} để dùng mã này.`;
 }

 return `Áp dụng thành công: ${selectedCoupon.description || selectedCoupon.code}`;
 }, [estimatedOriginalPrice, normalizedCouponCode, selectedCoupon]);

 const handleSubmit = async (event) => {
 event.preventDefault();
 setPageError("");

 if (!selectedRoom?.id) {
 toast.error("Bạn cần chọn phòng trước khi đặt");
 return;
 }

 if (!checkInDate || !checkOutDate) {
 toast.error("Vui lòng chọn đầy đủ ngày nhận và ngày trả");
 return;
 }

 if (new Date(checkOutDate) <= new Date(checkInDate)) {
 toast.error("Ngày trả phải sau ngày nhận");
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
 toast.success("Đặt phòng thành công. Booking đã được tạo.");

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
 throw new Error("Không tạo được link thanh toán");
 }
 toast.success("Đang chuyển đến cổng thanh toán sandbox...");
 window.location.assign(checkoutUrl);
 } catch (submitError) {
 console.error("Cannot create booking", submitError);
 const message =
 submitError?.response?.data?.error ||
 submitError?.response?.data?.message ||
 submitError?.response?.data ||
 "Đặt phòng thất bại. Vui lòng thử lại.";
 setPageError(message);
 toast.error(
 typeof message === "string" ? message : "Đặt phòng thất bại. Vui lòng thử lại."
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
 <p className="booking-tag">Xác nhận đặt phòng</p>
 <h1>Thông tin đặt phòng của bạn</h1>
 <p>
 Chọn lịch lưu trú, thêm mã giảm giá và quyết định cách thanh toán trước khi
 hoàn tất booking.
 </p>
 </div>

 <button type="button" className="back-hotels-btn" onClick={() => navigate("/hotels")}>
 Về trang hotels
 </button>
 </header>

 <div className="booking-grid">
 <section className="booking-card">
 <h2>Chi tiết đặt phòng</h2>

 {!selectedRoom ? (
 <div className="booking-state">
 Chưa có phòng được chọn. Vui lòng vào trang chi tiết khách sạn để chọn phòng.
 <button type="button" onClick={() => navigate("/hotels")}>
 Chọn phòng ngay
 </button>
 </div>
 ) : (
 <form className="booking-form" onSubmit={handleSubmit}>
 <label>
 <span>Khách sạn</span>
 <input value={selectedHotel?.name || "-"} readOnly />
 </label>

 <label>
 <span>Loại phòng</span>
 <input value={selectedRoom?.name || "-"} readOnly />
 </label>

 <div className="field-row">
 <label>
 <span>Ngày nhận phòng</span>
 <input
 type="date"
 value={checkInDate}
 min={getToday()}
 onChange={(event) => setCheckInDate(event.target.value)}
 required
 />
 </label>

 <label>
 <span>Ngày trả phòng</span>
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
 <span>Số người</span>
 <input
 type="number"
 min="1"
 value={guests}
 onChange={(event) => setGuests(event.target.value)}
 />
 </label>

 <label>
 <span>Số đêm</span>
 <input value={nightCount > 0 ? `${nightCount} đêm` : "-"} readOnly />
 </label>
 </div>

 <label>
 <span>Phương thức thanh toán</span>
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

 {selectedInstruction ? (
 <section className="payment-reference-card">
 <div className="payment-reference-head">
 <div>
 <strong>{selectedInstruction.label || selectedPayment.label}</strong>
 <span>{selectedInstruction.providerName || "-"}</span>
 </div>
 <span className="payment-reference-chip">
 {paymentMethod === "E_WALLET" ? "MoMo" : "STK"}
 </span>
 </div>

 <div className="payment-reference-grid">
 <div className="payment-reference-item">
 <span>{getPaymentProviderLabel(paymentMethod)}</span>
 <strong>{selectedInstruction.providerName || "-"}</strong>
 </div>
 <div className="payment-reference-item">
 <span>{getPaymentAccountLabel(paymentMethod)}</span>
 <strong>{selectedInstruction.accountNumber || "-"}</strong>
 </div>
 <div className="payment-reference-item">
 <span>Người nhận</span>
 <strong>{selectedInstruction.accountName || "-"}</strong>
 </div>
 <div className="payment-reference-item">
 <span>Nội dung chuyển khoản</span>
 <strong>{selectedInstruction.transferContent || "BOOKING-<BOOKING_ID>"}</strong>
 </div>
 </div>

 <p className="payment-reference-note">
 {selectedInstruction.note ||
 "Hệ thống sẽ mở sandbox checkout sau khi tạo booking để bạn xác nhận thanh toán."}
 </p>
 </section>
 ) : null}

 <label>
 <span>Mã giảm giá</span>
 <input
 value={couponCode}
 onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
 placeholder="Nhập mã như WELCOME10"
 />
 </label>

 <div className="coupon-pills">
 {couponsLoading ? (
 <span className="coupon-pill muted">Đang tải coupon...</span>
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
 <span className="coupon-pill muted">Chưa có coupon đang hoạt động</span>
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
 <span>Ghi chú</span>
 <textarea
 value={note}
 onChange={(event) => setNote(event.target.value)}
 placeholder="Yêu cầu đặc biệt (nếu có)"
 />
 </label>

 {pageError && <p className="form-message error">{pageError}</p>}

 <button type="submit" disabled={submitting || loadingAccount || redirecting}>
 {submitting ? "Đang đặt phòng..." : "Xác nhận đặt phòng"}
 </button>

 {redirecting && (
 <button
 type="button"
 className="back-home-btn"
 onClick={() =>
 navigate("/account", { replace: true, state: { focus: "history" } })
 }
 >
 Xem lịch sử booking ngay
 </button>
 )}
 </form>
 )}
 </section>

 <aside className="booking-summary">
 <article className="summary-card">
 <h3>Tóm tắt</h3>
 <ul>
 <li>
 <span>Khách hàng</span>
 <strong>{account?.name || "-"}</strong>
 </li>
 <li>
 <span>Email</span>
 <strong>{account?.email || "-"}</strong>
 </li>
 <li>
 <span>Khách sạn</span>
 <strong>{selectedHotel?.name || "-"}</strong>
 </li>
 <li>
 <span>Phòng</span>
 <strong>{selectedRoom?.name || "-"}</strong>
 </li>
 <li>
 <span>Giá / đêm</span>
 <strong>
 {selectedRoom?.price
 ? currencyFormatter.format(selectedRoom.price)
 : "Đang cập nhật"}
 </strong>
 </li>
 <li>
 <span>Thanh toán</span>
 <strong>{selectedPayment.label}</strong>
 </li>
 <li>
 <span>Tạm tính</span>
 <strong>
 {estimatedOriginalPrice
 ? currencyFormatter.format(estimatedOriginalPrice)
 : "-"}
 </strong>
 </li>
 <li>
 <span>Giảm giá</span>
 <strong>
 {discountAmount ? `- ${currencyFormatter.format(discountAmount)}` : "-"}
 </strong>
 </li>
 <li className="summary-total">
 <span>Tổng thanh toán</span>
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
