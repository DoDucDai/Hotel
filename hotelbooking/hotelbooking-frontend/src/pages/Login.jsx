import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
 FaArrowRight,
 FaBed,
 FaCheckCircle,
 FaEnvelope,
 FaEye,
 FaEyeSlash,
 FaLock,
 FaShieldAlt,
 FaSuitcase,
} from "react-icons/fa";
import { login, resendVerificationEmail } from "../services/authService";
import { useToast } from "../components/ToastProvider";
import "./Login.css";

function readPendingBooking() {
 try {
 const raw = sessionStorage.getItem("pendingBooking");
 if (!raw) {
 return null;
 }

 const parsed = JSON.parse(raw);
 return parsed || null;
 } catch (error) {
 console.error("Cannot parse pending booking", error);
 return null;
 }
}

function Login() {
 const navigate = useNavigate();
 const location = useLocation();
 const toast = useToast();

 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [showPass, setShowPass] = useState(false);
 const [loading, setLoading] = useState(false);
 const [resendLoading, setResendLoading] = useState(false);

 const redirectTo = location.state?.redirectTo || location.state?.from || "/";
 const redirectState = location.state?.redirectState || null;
 const returnToBooking = redirectTo === "/booking";
 const registeredEmail = location.state?.registeredEmail || "";
 const [resendEmail, setResendEmail] = useState(registeredEmail);
 const verificationTargetEmail = (registeredEmail || resendEmail).trim();

 const readAuthError = (error, fallback) =>
 error?.response?.data?.error ||
 error?.response?.data?.message ||
 fallback;

 const handleLogin = async (event) => {
 event.preventDefault();
 setLoading(true);

 try {
 const res = await login({ email, password });
 const { accessToken, refreshToken, role } = res.data;

 localStorage.setItem("accessToken", accessToken);
 localStorage.setItem("refreshToken", refreshToken);
 localStorage.setItem("role", role);

 if (role === "ADMIN") {
 toast.success("Đăng nhập thành công");
 navigate("/admin", { replace: true });
 return;
 }

 toast.success("Đăng nhập thành công");
 const pendingBooking = redirectTo === "/booking" ? readPendingBooking() : null;
 const nextState = redirectState || pendingBooking || undefined;

 if (nextState) {
 navigate(redirectTo, { replace: true, state: nextState });
 } else {
 navigate(redirectTo, { replace: true });
 }
 } catch (loginError) {
 console.error("Login failed", loginError);
 const errorMessage = readAuthError(loginError, "Sai email hoac mật khẩu");
 const normalizedError = String(errorMessage || "").toLowerCase();
 if (normalizedError.includes("xac nhan") || normalizedError.includes("verify")) {
 setResendEmail((email || "").trim());
 }
 toast.error(errorMessage);
 } finally {
 setLoading(false);
 }
 };

 const handleResendVerification = async () => {
 const targetEmail = (resendEmail || email).trim();
 if (!targetEmail) {
  toast.info("Nhập email đăng ký để gửi lại email xác nhận");
 return;
 }

 setResendLoading(true);
 try {
 const res = await resendVerificationEmail(targetEmail);
  toast.success(res?.data?.message || "Đã gửi lại email xác nhận");
 setResendEmail(targetEmail);
 } catch (error) {
 console.error("Cannot resend verification email", error);
  toast.error(readAuthError(error, "Không thể gửi lại email xác nhận"));
 } finally {
 setResendLoading(false);
 }
 };

 return (
 <main className="login-page">
 <section className="login-shell">
 <article className="login-hero">
 <div className="login-brand">Hotel Booking</div>
 <div className="login-hero-copy">
  <p className="login-eyebrow">Đăng nhập để tiếp tục</p>
  <h1>Sẵn sàng quay lại với kỳ nghỉ tiếp theo?</h1>
 <p className="login-description">
  Quản lý booking, lưu wishlist và tiếp tục đặt phòng đang dở ngay sau khi đăng nhập.
 </p>
 </div>

 <div className="login-hero-grid">
 <article className="login-stat-card">
 <span className="login-stat-icon">
 <FaBed />
 </span>
  <strong>Phong phú</strong>
  <p>Tìm khách sạn, phòng và ưu đãi nhanh hơn trong một dashboard gọn gàng.</p>
 </article>

 <article className="login-stat-card">
 <span className="login-stat-icon">
 <FaSuitcase />
 </span>
  <strong>Booking liền mạch</strong>
  <p>Đăng nhập xong là quay lại đúng bước đang đặt phòng nếu bạn đang thao tác dở.</p>
 </article>

 <article className="login-stat-card">
 <span className="login-stat-icon">
 <FaShieldAlt />
 </span>
  <strong>An toàn và rõ ràng</strong>
  <p>Lưu token đăng nhập và điều hướng đúng role cho admin, user và host.</p>
 </article>
 </div>
 </article>

 <article className="login-card">
 <div className="login-card-top">
 <p className="login-form-tag">Welcome back</p>
  <h2>Đăng nhập tài khoản</h2>
 <p className="login-form-note">
 {returnToBooking
  ? "Đăng nhập xong bạn sẽ được đưa trở lại bước đặt phòng đang thực hiện."
  : "Nhập email và mật khẩu để tiếp tục vào hệ thống."}
 </p>
 </div>

 {verificationTargetEmail ? (
 <div className="login-verification-box">
 <div className="login-verification-head">
 <FaCheckCircle />
  <strong>Kiểm tra email xác nhận</strong>
 </div>
 <p>
  Tài khoản của bạn đang chờ xác nhận email cho <strong>{verificationTargetEmail}</strong>. Nếu
   chưa thấy thư, bạn có thể gửi lại email xác nhận ngay tại đây.
 </p>
 <div className="login-inline-actions">
 <button
 type="button"
 className="login-inline-btn"
 onClick={handleResendVerification}
 disabled={resendLoading}
 >
  {resendLoading ? "Đang gửi..." : "Gửi lại email xác nhận"}
 </button>
 </div>
 </div>
 ) : null}

 <form className="login-form" onSubmit={handleLogin}>
 <label className="login-field">
 <span>Email</span>
 <div className="login-input-shell">
 <FaEnvelope />
 <input
 type="email"
 placeholder="name@email.com"
 value={email}
 onChange={(event) => setEmail(event.target.value)}
 autoComplete="email"
 required
 />
 </div>
 </label>

 <label className="login-field">
 <span>Mật khẩu</span>
 <div className="login-input-shell">
 <FaLock />
 <input
 type={showPass ? "text" : "password"}
 placeholder="Nhập mật khẩu"
 value={password}
 onChange={(event) => setPassword(event.target.value)}
 autoComplete="current-password"
 required
 />
 <button
 type="button"
 className="login-visibility-btn"
 onClick={() => setShowPass((prev) => !prev)}
  aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
 >
 {showPass ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </label>

 <button type="submit" className="login-submit-btn" disabled={loading}>
  <span>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
 <FaArrowRight />
 </button>
 </form>

 <div className="login-footer">
 <div className="login-link-row">
 <button
 type="button"
 className="login-link-btn"
 onClick={() =>
 navigate("/register", {
 state: {
 redirectTo,
 redirectState,
 },
 })
 }
 >
 Tạo tài khoản mới
 </button>
 <button
 type="button"
 className="login-link-btn subtle"
 onClick={() => navigate("/forgot-password")}
 >
 Quen mật khẩu?
 </button>
 </div>
 <span className="login-muted-link">
 Hệ thống đã hỗ trợ gửi email xác nhận và đặt lại mật khẩu bằng link token.
 </span>
 </div>
 </article>
 </section>
 </main>
 );
}

export default Login;



