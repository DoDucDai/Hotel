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
 setTokenMessage("Da nhan ma tu link email. Ban c? the kiem tra ma va dat lai mat khau.");
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
 "Neu email ton toi, chung toi da gui m? dat lai mat khau."
 );
 } catch (error) {
 console.error("Forgot password failed", error);
 toast.error(readAuthError(error, "Khong the gui yeu cau dat lai mat khau"));
 } finally {
 setSending(false);
 }
 };

 const handleCheckCode = async () => {
 const token = resetToken.trim();
 if (!token) {
 toast.error("Vui long nhap ma OTP 6 so");
 return;
 }

 if (!/^\d{6}$/.test(token)) {
 toast.error("M? OTP phai gam Dong 6 chi so");
 return;
 }

 setCheckingToken(true);
 try {
 const res = await validateResetPasswordToken(token);
 const emailFromToken = res?.data?.email || "";
 setTokenStatus("valid");
 setTokenMessage(
 emailFromToken
 ? `Ma hop le cho t i khoan ${emailFromToken}.`
 : "Ma hop le. Ban c? the dat lai mat khau."
 );
 toast.success("Ma dat lai mat khau hop le");
 } catch (error) {
 console.error("Cannot validate reset token", error);
 const message = readAuthError(error, "Ma dat lai mat khau khong hop le hoac da het han.");
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
 toast.error("Vui long nhap ma OTP 6 so");
 return;
 }

 if (!/^\d{6}$/.test(token)) {
 toast.error("M? OTP phai gam Dong 6 chi so");
 return;
 }

 if (!isCodeVerified) {
 toast.error("Vui long kiem tra ma OTP truoc khi dat lai mat khau");
 return;
 }

 if (password.length < 6) {
 toast.error("Mat khau moi phai co it nhat 6 ky tu");
 return;
 }

 if (passwordMismatch) {
 toast.error("Mat khau va xac nhan mat khau khong khop");
 return;
 }

 setResetting(true);
 try {
 const res = await resetPassword(token, password);
 toast.success(res?.data?.message || "Dat lai mat khau th nh cong");
 navigate("/login", { replace: true });
 } catch (error) {
 console.error("Cannot reset password", error);
 toast.error(readAuthError(error, "Khong the dat lai mat khau"));
 } finally {
 setResetting(false);
 }
 };

 return (
 <main className="auth-assist-page">
 <section className="auth-assist-shell">
 <article className="auth-assist-copy">
 <p className="auth-assist-tag">Recovery</p>
 <h1>Khoi phuc t i khoan bang ma reset gui qua email.</h1>
 <p className="auth-assist-text">
 Buoc 1: nhap email de nhan ma. Buoc 2: nhap ma reset, mat khau moi va xac nhan
 mat khau ngay tren man hinh nay.
 </p>

 <div className="auth-assist-points">
 <article>
 <FaKey />
 <div>
 <strong>Co ca link va ma reset</strong>
 <p>Ban c? the bam link trong mail hoac copy ma OTP 6 so de nhap the cong.</p>
 </div>
 </article>
 <article>
 <FaShieldAlt />
 <div>
 <strong>Ma co thoi han ngan</strong>
 <p>Ma dat lai mat khau chi hieu luc trong 30 phut ke tu luc gui.</p>
 </div>
 </article>
 </div>
 </article>

 <article className="auth-assist-card">
 <p className="auth-assist-card-tag">Quen mat khau</p>
 <h2>Gui ma va dat lai mat khau</h2>
 <p className="auth-assist-note">
 Vui long kiem tra ca hop the chinh va muc spam neu chua thay email.
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
 <span>{sending ? "Dang gui..." : "Gui m? dat lai mat khau"}</span>
 <FaArrowRight />
 </button>
 </form>

 {submittedEmail ? (
 <div className="auth-assist-feedback">
 Yeu cau da duoc gui cho <strong>{submittedEmail}</strong> neu t i khoan ton toi.
 Ban c? the copy ma OTP 6 so trong email de nhap o buoc duoi.
 </div>
 ) : null}

 <div className="auth-assist-divider" />

 <form className="auth-assist-form" onSubmit={handleResetPassword}>
 <label className="auth-assist-field">
 <span>Ma OTP 6 so</span>
 <div className="auth-assist-input">
 <FaKey />
 <input
 type="text"
 placeholder="Nhap ma OTP 6 so"
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
 <span>{checkingToken ? "Dang kiem tra..." : "Kiem tra ma"}</span>
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
 <span>Mat khau moi</span>
 <div className="auth-assist-input">
 <FaLock />
 <input
 type={showPassword ? "text" : "password"}
 placeholder="Toi thieu 6 ky tu"
 value={password}
 onChange={(event) => setPassword(event.target.value)}
 autoComplete="new-password"
 required
 />
 <button
 type="button"
 className="auth-assist-toggle"
 onClick={() => setShowPassword((prev) => !prev)}
 aria-label={showPassword ? "An mat khau" : "Hien mat khau"}
 >
 {showPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </label>

 <label className="auth-assist-field">
 <span>Xac nhan mat khau moi</span>
 <div className="auth-assist-input">
 <FaLock />
 <input
 type={showConfirmPassword ? "text" : "password"}
 placeholder="Nhap lai mat khau moi"
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
 showConfirmPassword ? "An xac nhan mat khau" : "Hien xac nhan mat khau"
 }
 >
 {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </label>

 <p className={`auth-assist-helper ${passwordMismatch ? "error" : ""}`}>
 {passwordMismatch
 ? "Mat khau va xac nhan mat khau chua khop."
 : "Ma hop le. Ban c? the dat mat khau moi."}
 </p>

 <button type="submit" className="auth-assist-submit" disabled={resetting}>
 <span>{resetting ? "Dang cap nhet..." : "Xac nhan mat khau moi"}</span>
 <FaArrowRight />
 </button>
 </>
 ) : (
 <p className="auth-assist-helper">
 Kiem tra ma OTP th nh cong de hien the form dat mat khau moi.
 </p>
 )}
 </form>

 <div className="auth-assist-actions">
 <button type="button" className="auth-assist-link" onClick={() => navigate("/login")}>
 Quay lai dang nhap
 </button>
 <button
 type="button"
 className="auth-assist-link subtle"
 onClick={() => navigate("/register")}
 >
 Tao t i khoan moi
 </button>
 </div>
 </article>
 </section>
 </main>
 );
}

export default Forgot;

