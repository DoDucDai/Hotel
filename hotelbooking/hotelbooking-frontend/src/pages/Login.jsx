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
 toast.success("Dang nhap th nh cong");
 navigate("/admin", { replace: true });
 return;
 }

 toast.success("Dang nhap th nh cong");
 const pendingBooking = redirectTo === "/booking" ? readPendingBooking() : null;
 const nextState = redirectState || pendingBooking || undefined;

 if (nextState) {
 navigate(redirectTo, { replace: true, state: nextState });
 } else {
 navigate(redirectTo, { replace: true });
 }
 } catch (loginError) {
 console.error("Login failed", loginError);
 toast.error(readAuthError(loginError, "Sai email hoac mat khau"));
 } finally {
 setLoading(false);
 }
 };

 const handleResendVerification = async () => {
 const targetEmail = (resendEmail || email).trim();
 if (!targetEmail) {
 toast.info("Nhap email dang ky de gui lai email xac nhan");
 return;
 }

 setResendLoading(true);
 try {
 const res = await resendVerificationEmail(targetEmail);
 toast.success(res?.data?.message || "Da gui lai email xac nhan");
 setResendEmail(targetEmail);
 } catch (error) {
 console.error("Cannot resend verification email", error);
 toast.error(readAuthError(error, "Khong the gui lai email xac nhan"));
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
 <p className="login-eyebrow">Dang nhap de tiep tuc</p>
 <h1>San sang quay lai voi ky nghi tiep theo?</h1>
 <p className="login-description">
 Quan ly booking, luu wishlist va tiep tuc dat phong dang do ngay sau khi dang nhap.
 </p>
 </div>

 <div className="login-hero-grid">
 <article className="login-stat-card">
 <span className="login-stat-icon">
 <FaBed />
 </span>
 <strong>Phong phu</strong>
 <p>Tim khach san, phong va uu dai nhanh hon trong mot dashboard gon gang.</p>
 </article>

 <article className="login-stat-card">
 <span className="login-stat-icon">
 <FaSuitcase />
 </span>
 <strong>Booking lien mach</strong>
 <p>Dang nhap xong la quay lai dung buoc dang dat phong neu ban dang thao tac do.</p>
 </article>

 <article className="login-stat-card">
 <span className="login-stat-icon">
 <FaShieldAlt />
 </span>
 <strong>An toan va ro rang</strong>
 <p>Lu token dang nhap va dieu huong dung role cho admin, user va host.</p>
 </article>
 </div>
 </article>

 <article className="login-card">
 <div className="login-card-top">
 <p className="login-form-tag">Welcome back</p>
 <h2>Dang nhap t i khoan</h2>
 <p className="login-form-note">
 {returnToBooking
 ? "Dang nhap xong ban se duoc dua tro lai buoc dat phong dang thuc hien."
 : "Nhap email va mat khau de tiep tuc vao he thong."}
 </p>
 </div>

 {registeredEmail ? (
 <div className="login-verification-box">
 <div className="login-verification-head">
 <FaCheckCircle />
 <strong>Kiem tra email xac nhan</strong>
 </div>
 <p>
 T i khoan moi cua ban da duoc tao cho <strong>{registeredEmail}</strong>. Neu
 chua thay the, ban c? the gui lai email xac nhan ngay tai day.
 </p>
 <div className="login-inline-actions">
 <button
 type="button"
 className="login-inline-btn"
 onClick={handleResendVerification}
 disabled={resendLoading}
 >
 {resendLoading ? "Dang gui..." : "Gui lai email xac nhan"}
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
 <span>Mat khau</span>
 <div className="login-input-shell">
 <FaLock />
 <input
 type={showPass ? "text" : "password"}
 placeholder="Nhap mat khau"
 value={password}
 onChange={(event) => setPassword(event.target.value)}
 autoComplete="current-password"
 required
 />
 <button
 type="button"
 className="login-visibility-btn"
 onClick={() => setShowPass((prev) => !prev)}
 aria-label={showPass ? "An mat khau" : "Hien mat khau"}
 >
 {showPass ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </label>

 <button type="submit" className="login-submit-btn" disabled={loading}>
 <span>{loading ? "Dang dang nhap..." : "Dang nhap"}</span>
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
 Tao t i khoan moi
 </button>
 <button
 type="button"
 className="login-link-btn subtle"
 onClick={() => navigate("/forgot-password")}
 >
 Quen mat khau?
 </button>
 </div>
 <span className="login-muted-link">
 He thong da ho tro gui email xac nhan va dat lai mat khau bang link token.
 </span>
 </div>
 </article>
 </section>
 </main>
 );
}

export default Login;

