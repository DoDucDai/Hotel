import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
 FaArrowRight,
 FaCheckCircle,
 FaEnvelope,
 FaEye,
 FaEyeSlash,
 FaKey,
 FaLock,
 FaShieldAlt,
} from "react-icons/fa";
import {
 forgotPassword,
 resetPassword,
 validateResetPasswordToken,
} from "../services/authService";
import { useToast } from "../components/ToastProvider";
import "./AuthAssist.css";

function Forgot() {
 const navigate = useNavigate();
 const toast = useToast();
 const [searchParams] = useSearchParams();
 const tokenFromUrl = useMemo(() => searchParams.get("token") || "", [searchParams]);

 const [email, setEmail] = useState("");
 const [submittedEmail, setSubmittedEmail] = useState("");
 const [sending, setSending] = useState(false);

 const [resetToken, setResetToken] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 const [checkingToken, setCheckingToken] = useState(false);
 const [resetting, setResetting] = useState(false);
 const [tokenStatus, setTokenStatus] = useState("idle");
 const [tokenMessage, setTokenMessage] = useState("");

 const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
 const isCodeVerified = tokenStatus === "valid";

 useEffect(() => {
 if (!tokenFromUrl) {
 return;
 }

 setResetToken(tokenFromUrl);
 setTokenStatus("idle");
 setTokenMessage("Đã nhận mã từ link email. Bạn có thể kiểm tra mã và đặt lại mật khẩu.");
 }, [tokenFromUrl]);

 const readAuthError = (error, fallback) =>
 error?.response?.data?.error ||
 error?.response?.data?.message ||
 fallback;

 const handleSendRequest = async (event) => {
 event.preventDefault();
 setSending(true);

 try {
 const normalizedEmail = email.trim();
 const res = await forgotPassword(normalizedEmail);
 setSubmittedEmail(normalizedEmail);
 toast.success(
 res?.data?.message ||
 "Nếu email tồn tại, chúng tôi đã gửi mã đặt lại mật khẩu."
 );
 } catch (error) {
 console.error("Forgot password failed", error);
 toast.error(readAuthError(error, "Không thể gửi yêu cầu đặt lại mật khẩu"));
 } finally {
 setSending(false);
 }
 };

 const handleCheckCode = async () => {
 const token = resetToken.trim();
 if (!token) {
  toast.error("Vui lòng nhập mã OTP 6 số");
 return;
 }

 if (!/^\d{6}$/.test(token)) {
  toast.error("Mã OTP phải gồm đúng 6 chữ số");
 return;
 }

 setCheckingToken(true);
 try {
 const res = await validateResetPasswordToken(token);
 const emailFromToken = res?.data?.email || "";
 setTokenStatus("valid");
 setTokenMessage(
 emailFromToken
  ? `Mã hợp lệ cho tài khoản ${emailFromToken}.`
  : "Mã hợp lệ. Bạn có thể đặt lại mật khẩu."
 );
  toast.success("Mã đặt lại mật khẩu hợp lệ");
 } catch (error) {
 console.error("Cannot validate reset token", error);
  const message = readAuthError(error, "Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
 setTokenStatus("invalid");
 setTokenMessage(message);
 toast.error(message);
 } finally {
 setCheckingToken(false);
 }
 };

 const handleResetPassword = async (event) => {
 event.preventDefault();

 const token = resetToken.trim();
 if (!token) {
  toast.error("Vui lòng nhập mã OTP 6 số");
 return;
 }

 if (!/^\d{6}$/.test(token)) {
  toast.error("Mã OTP phải gồm đúng 6 chữ số");
 return;
 }

 if (!isCodeVerified) {
  toast.error("Vui lòng kiểm tra mã OTP trước khi đặt lại mật khẩu");
 return;
 }

 if (password.length < 6) {
  toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
 return;
 }

 if (passwordMismatch) {
  toast.error("Mật khẩu và xác nhận mật khẩu không khớp");
 return;
 }

 setResetting(true);
 try {
 const res = await resetPassword(token, password);
  toast.success(res?.data?.message || "Đặt lại mật khẩu thành công");
 navigate("/login", { replace: true });
 } catch (error) {
 console.error("Cannot reset password", error);
  toast.error(readAuthError(error, "Không thể đặt lại mật khẩu"));
 } finally {
 setResetting(false);
 }
 };

 return (
 <main className="auth-assist-page">
 <section className="auth-assist-shell">
 <article className="auth-assist-copy">
 <p className="auth-assist-tag">Recovery</p>
  <h1>Khôi phục tài khoản bằng mã reset gửi qua email.</h1>
 <p className="auth-assist-text">
  Bước 1: nhập email để nhận mã. Bước 2: nhập mã reset, mật khẩu mới và xác nhận
  mật khẩu ngay trên màn hình này.
 </p>

 <div className="auth-assist-points">
 <article>
 <FaKey />
 <div>
  <strong>Có cả link và mã reset</strong>
  <p>Bạn có thể bấm link trong mail hoặc copy mã OTP 6 số để nhập thủ công.</p>
 </div>
 </article>
 <article>
 <FaShieldAlt />
 <div>
  <strong>Mã có thời hạn ngắn</strong>
  <p>Mã đặt lại mật khẩu chỉ hiệu lực trong 30 phút kể từ lúc gửi.</p>
 </div>
 </article>
 </div>
 </article>

 <article className="auth-assist-card">
 <p className="auth-assist-card-tag">Quen mật khẩu</p>
  <h2>Gửi mã và đặt lại mật khẩu</h2>
 <p className="auth-assist-note">
 Vui lòng kiểm tra cả hộp thư chính và mục spam nếu chưa thấy email.
 </p>

 <form className="auth-assist-form" onSubmit={handleSendRequest}>
 <label className="auth-assist-field">
 <span>Email</span>
 <div className="auth-assist-input">
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

 <button type="submit" className="auth-assist-submit" disabled={sending}>
  <span>{sending ? "Đang gửi..." : "Gửi mã đặt lại mật khẩu"}</span>
 <FaArrowRight />
 </button>
 </form>

 {submittedEmail ? (
 <div className="auth-assist-feedback">
  Yêu cầu đã được gửi cho <strong>{submittedEmail}</strong> nếu tài khoản tồn tại.
  Bạn có thể copy mã OTP 6 số trong email để nhập ở bước dưới.
 </div>
 ) : null}

 <div className="auth-assist-divider" />

 <form className="auth-assist-form" onSubmit={handleResetPassword}>
 <label className="auth-assist-field">
  <span>Mã OTP 6 số</span>
 <div className="auth-assist-input">
 <FaKey />
 <input
 type="text"
  placeholder="Nhập mã OTP 6 số"
 value={resetToken}
 onChange={(event) => {
 const normalized = event.target.value.replace(/\D/g, "").slice(0, 6);
 setResetToken(normalized);
 setTokenStatus("idle");
 setTokenMessage("");
 }}
 autoComplete="one-time-code"
 inputMode="numeric"
 maxLength={6}
 pattern="[0-9]{6}"
 required
 />
 </div>
 </label>

 <button
 type="button"
 className="auth-assist-submit secondary"
 onClick={handleCheckCode}
 disabled={checkingToken}
 >
  <span>{checkingToken ? "Đang kiểm tra..." : "Kiểm tra mã"}</span>
 <FaCheckCircle />
 </button>

 {tokenMessage ? (
 <p className={`auth-assist-helper ${tokenStatus === "invalid" ? "error" : "success"}`}>
 {tokenStatus === "valid" ? <FaCheckCircle /> : null}
 {tokenMessage}
 </p>
 ) : null}

 {isCodeVerified ? (
 <>
 <label className="auth-assist-field">
  <span>Mật khẩu mới</span>
 <div className="auth-assist-input">
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
 className="auth-assist-toggle"
 onClick={() => setShowPassword((prev) => !prev)}
  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
 >
 {showPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </label>

 <label className="auth-assist-field">
  <span>Xác nhận mật khẩu mới</span>
 <div className="auth-assist-input">
 <FaLock />
 <input
 type={showConfirmPassword ? "text" : "password"}
  placeholder="Nhập lại mật khẩu mới"
 value={confirmPassword}
 onChange={(event) => setConfirmPassword(event.target.value)}
 autoComplete="new-password"
 required
 />
 <button
 type="button"
 className="auth-assist-toggle"
 onClick={() => setShowConfirmPassword((prev) => !prev)}
 aria-label={
  showConfirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"
 }
 >
 {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </label>

 <p className={`auth-assist-helper ${passwordMismatch ? "error" : ""}`}>
 {passwordMismatch
 ? "Mật khẩu và xác nhận mật khẩu chưa khớp."
  : "Mã hợp lệ. Bạn có thể đặt mật khẩu mới."}
 </p>

 <button type="submit" className="auth-assist-submit" disabled={resetting}>
  <span>{resetting ? "Đang cập nhật..." : "Xác nhận mật khẩu mới"}</span>
 <FaArrowRight />
 </button>
 </>
 ) : (
 <p className="auth-assist-helper">
  Kiểm tra mã OTP thành công để hiển thị form đặt mật khẩu mới.
 </p>
 )}
 </form>

 <div className="auth-assist-actions">
 <button type="button" className="auth-assist-link" onClick={() => navigate("/login")}>
  Quay lại đăng nhập
 </button>
 <button
 type="button"
 className="auth-assist-link subtle"
 onClick={() => navigate("/register")}
 >
  Tạo tài khoản mới
 </button>
 </div>
 </article>
 </section>
 </main>
 );
}

export default Forgot;



