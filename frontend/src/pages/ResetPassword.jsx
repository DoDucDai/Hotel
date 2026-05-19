import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowRight, FaCheckCircle, FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import {
 resetPassword,
 validateResetPasswordToken,
} from "../services/authService";
import { useToast } from "../components/ToastProvider";
import "./AuthAssist.css";

function ResetPassword() {
 const navigate = useNavigate();
 const toast = useToast();
 const [searchParams] = useSearchParams();
 const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 const [status, setStatus] = useState("loading");
 const [message, setMessage] = useState("Đang kiểm tra link đặt lại mật khẩu...");
 const [email, setEmail] = useState("");
 const [saving, setSaving] = useState(false);

 const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

 const readAuthError = (error, fallback) =>
 error?.response?.data?.error ||
 error?.response?.data?.message ||
 fallback;

 useEffect(() => {
 let active = true;

 const validateToken = async () => {
 if (!token) {
 setStatus("error");
 setMessage("Link đặt lại mật khẩu không hợp lệ hoặc thiếu token.");
 return;
 }

 try {
 const res = await validateResetPasswordToken(token);
 if (!active) {
 return;
 }

 setStatus("ready");
 setEmail(res?.data?.email || "");
 setMessage("Token hợp lệ. Bạn có thể tạo mật khẩu mới.");
 } catch (error) {
 if (!active) {
 return;
 }

 console.error("Cannot validate reset token", error);
 setStatus("error");
 setMessage(readAuthError(error, "Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ."));
 }
 };

 validateToken();
 return () => {
 active = false;
 };
 }, [token]);

 const handleSubmit = async (event) => {
 event.preventDefault();

 if (passwordMismatch) {
 toast.error("Mật khẩu và xác nhận mật khẩu không khớp");
 return;
 }

 setSaving(true);
 try {
 const res = await resetPassword(token, password);
 toast.success(res?.data?.message || "Đặt lại mật khẩu thành công");
 navigate("/login", { replace: true });
 } catch (error) {
 console.error("Cannot reset password", error);
 toast.error(readAuthError(error, "Không thể đặt lại mật khẩu"));
 } finally {
 setSaving(false);
 }
 };

 return (
 <main className="auth-assist-page">
 <section className="auth-assist-shell compact">
 <article className="auth-assist-card">
 <p className="auth-assist-card-tag">Reset password</p>
 <h2>Đặt lại mật khẩu</h2>
 <p className="auth-assist-note">{message}</p>

 {status === "loading" ? (
 <div className="auth-assist-feedback">Đang xác thực token...</div>
 ) : null}

 {status === "error" ? (
 <div className="auth-assist-feedback error">
 {message}
 <div className="auth-assist-actions">
 <button
 type="button"
 className="auth-assist-link"
 onClick={() => navigate("/forgot-password")}
 >
 Gửi lại yêu cầu mới
 </button>
 </div>
 </div>
 ) : null}

 {status === "ready" ? (
 <>
 {email ? (
 <div className="auth-assist-feedback">
 Đang đặt lại mật khẩu cho <strong>{email}</strong>
 </div>
 ) : null}

 <form className="auth-assist-form" onSubmit={handleSubmit}>
 <label className="auth-assist-field">
 <span>Mật khẩu mới</span>
 <div className="auth-assist-input">
 <FaLock />
 <input
 type={showPassword ? "text" : "password"}
 value={password}
 onChange={(event) => setPassword(event.target.value)}
 placeholder="Tối thiểu 6 ký tự"
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
 <span>Xác nhận mật khẩu</span>
 <div className="auth-assist-input">
 <FaLock />
 <input
 type={showConfirmPassword ? "text" : "password"}
 value={confirmPassword}
 onChange={(event) => setConfirmPassword(event.target.value)}
 placeholder="Nhập lại mật khẩu mới"
 autoComplete="new-password"
 required
 />
 <button
 type="button"
 className="auth-assist-toggle"
 onClick={() => setShowConfirmPassword((prev) => !prev)}
 aria-label={
 showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"
 }
 >
 {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </label>

 <p className={`auth-assist-helper ${passwordMismatch ? "error" : ""}`}>
 {passwordMismatch
 ? "Mật khẩu và xác nhận mật khẩu chưa khớp."
 : "Hãy đặt mật khẩu mới có ít nhất 6 ký tự."}
 </p>

 <button type="submit" className="auth-assist-submit" disabled={saving}>
 <span>{saving ? "Đang cập nhật..." : "Lưu mật khẩu mới"}</span>
 <FaArrowRight />
 </button>
 </form>
 </>
 ) : null}

 <div className="auth-assist-actions">
 <button
 type="button"
 className="auth-assist-link subtle"
 onClick={() => navigate("/login")}
 >
 Quay lại đăng nhập
 </button>
 </div>
 </article>

 <article className="auth-assist-copy muted">
 <p className="auth-assist-tag">Bảo mật</p>
 <h1>Tạo mật khẩu mới an toàn để tiếp tục sử dụng tài khoản.</h1>
 <div className="auth-assist-points">
 <article>
 <FaCheckCircle />
 <div>
 <strong>Link có thời hạn</strong>
 <p>Nếu token hết hạn, bạn chỉ cần tạo lại yêu cầu reset từ đầu.</p>
 </div>
 </article>
 <article>
 <FaLock />
 <div>
 <strong>Thông tin được bảo vệ</strong>
 <p>Mật khẩu mới sẽ được mã hóa trước khi lưu trong hệ thống.</p>
 </div>
 </article>
 </div>
 </article>
 </section>
 </main>
 );
}

export default ResetPassword;



