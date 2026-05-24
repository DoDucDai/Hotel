import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
 FaArrowRight,
 FaCheckCircle,
 FaEnvelope,
 FaEye,
 FaEyeSlash,
 FaLock,
 FaShieldAlt,
 FaUser,
} from "react-icons/fa";
import { register as registerUser } from "../services/authService";
import { useToast } from "../components/ToastProvider";
import { useBranding } from "../context/BrandingContext";
import "./Register.css";

function Register() {
 const navigate = useNavigate();
 const location = useLocation();
 const toast = useToast();

 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 const [loading, setLoading] = useState(false);

 const redirectTo = location.state?.redirectTo || "/";
 const redirectState = location.state?.redirectState || null;
 const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
 const passwordReady = password.length >= 6 && !passwordMismatch;
 const readAuthError = (error, fallback) =>
 error?.response?.data?.error ||
 error?.response?.data?.message ||
 fallback;

 const handleRegister = async (event) => {
 event.preventDefault();
 setLoading(true);

 try {
 if (password !== confirmPassword) {
  toast.error("Mật khẩu và xác nhận mật khẩu không khớp");
 setLoading(false);
 return;
 }

 const res = await registerUser({ name, email, password });
 toast.success(
  res?.data?.message || "Đăng ký thành công, vui lòng kiểm tra email xác nhận"
 );

 navigate("/login", {
 replace: true,
 state: {
 registeredEmail: email,
 redirectTo,
 redirectState,
 },
 });
 } catch (registerError) {
 console.error("Register failed", registerError);
 toast.error(readAuthError(registerError, "Đăng ký thất bại"));
 } finally {
 setLoading(false);
 }
 };

 return (
 <main className="register-page">
 <section className="register-shell">
 <article className="register-card register-copy">
  <p className="register-eyebrow">Tạo tài khoản mới</p>
  <h1>Bắt đầu hành trình đặt phòng và quản lý lưu trú theo cách gọn hơn.</h1>
 <p className="register-description">
  Đăng ký một tài khoản để lưu lịch sử booking, wishlist và tiếp tục các thao tác đang
  chờ mà không cần nhập lại từ đầu.
 </p>

 <div className="register-benefits">
 <article className="register-benefit">
 <span className="register-benefit-icon">
 <FaCheckCircle />
 </span>
 <div>
 <strong>Đăng ký nhanh</strong>
  <p>Giao diện đơn giản, rõ ràng và tối ưu cho cả desktop lẫn mobile.</p>
 </div>
 </article>

 <article className="register-benefit">
 <span className="register-benefit-icon">
 <FaShieldAlt />
 </span>
 <div>
  <strong>Thông tin nhất quán</strong>
  <p>Giúp bạn quay lại nhanh trang cần đến sau khi đăng ký và đăng nhập.</p>
 </div>
 </article>
 </div>
 </article>

 <article className="register-card register-form-card">
 <div className="register-top">
 <p className="register-form-tag">Create account</p>
  <h2>Đăng ký tài khoản</h2>
 <p className="register-note">
  Nhập thông tin cơ bản để bắt đầu sử dụng hệ thống. Sau khi đăng ký, hệ thống sẽ
  gửi email xác nhận cho bạn.
 </p>
 </div>

 <form className="register-form" onSubmit={handleRegister}>
 <label className="register-field">
  <span>Họ và tên</span>
 <div className="register-input-shell">
 <FaUser />
 <input
  placeholder="Nhập họ và tên"
 value={name}
 onChange={(event) => setName(event.target.value)}
 autoComplete="name"
 required
 />
 </div>
 </label>

 <label className="register-field">
 <span>Email</span>
 <div className="register-input-shell">
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

 <label className="register-field">
 <span>Mật khẩu</span>
 <div className="register-input-shell">
 <FaLock />
 <input
 type={showPassword ? "text" : "password"}
  placeholder="Tối thiểu 6 ký tự"
 value={password}
 onChange={(event) => setPassword(event.target.value)}
 autoComplete="new-password"
 required
 />
 <button
 type="button"
 className="register-visibility-btn"
 onClick={() => setShowPassword((prev) => !prev)}
  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
 >
 {showPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </label>

 <label className="register-field">
  <span>Xác nhận mật khẩu</span>
 <div className="register-input-shell">
 <FaLock />
 <input
 type={showConfirmPassword ? "text" : "password"}
  placeholder="Nhập lại mật khẩu"
 value={confirmPassword}
 onChange={(event) => setConfirmPassword(event.target.value)}
 autoComplete="new-password"
 required
 />
 <button
 type="button"
 className="register-visibility-btn"
 onClick={() => setShowConfirmPassword((prev) => !prev)}
  aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
 >
 {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </label>

 <p className={`register-helper ${passwordReady ? "success" : passwordMismatch ? "error" : ""}`}>
 {passwordMismatch
 ? "Mật khẩu và xác nhận mật khẩu chưa khớp."
 : password.length > 0
  ? "Mật khẩu đã sẵn sàng. Hãy đảm bảo từ 6 ký tự trở lên."
  : "Mật khẩu nên có ít nhất 6 ký tự để đăng ký an toàn hơn."}
 </p>

 <button type="submit" className="register-submit-btn" disabled={loading}>
  <span>{loading ? "Đang đăng ký..." : "Đăng ký tài khoản"}</span>
 <FaArrowRight />
 </button>
 </form>

 <div className="register-footer">
 <button
 type="button"
 className="register-link-btn"
 onClick={() =>
 navigate("/login", {
 state: {
 redirectTo,
 redirectState,
 },
 })
 }
 >
 Bạn đã có tài khoản? Đăng nhập
 </button>
 </div>
 </article>
 </section>
 </main>
 );
}

export default Register;



