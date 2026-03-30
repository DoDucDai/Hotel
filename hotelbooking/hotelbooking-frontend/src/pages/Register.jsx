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
 toast.error("Mat khau va xac nhan mat khau khong khop");
 setLoading(false);
 return;
 }

 const res = await registerUser({ name, email, password });
 toast.success(
 res?.data?.message || "Dang ky th nh cong, vui long kiem tra email xac nhan"
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
 toast.error(readAuthError(registerError, "Dang ky thet bai"));
 } finally {
 setLoading(false);
 }
 };

 return (
 <main className="register-page">
 <section className="register-shell">
 <article className="register-card register-copy">
 <p className="register-eyebrow">Tao t i khoan moi</p>
 <h1>Bat dau hanh trinh dat phong va quan ly luu tru theo cach gon hon.</h1>
 <p className="register-description">
 Dang ky mot t i khoan de luu lich so booking, wishlist va tiep tuc cac thao tac dang
 cho ma khong can nhap lai tu dau.
 </p>

 <div className="register-benefits">
 <article className="register-benefit">
 <span className="register-benefit-icon">
 <FaCheckCircle />
 </span>
 <div>
 <strong>Dang ky nhanh</strong>
 <p>Giao dien don gian, ro rang va toi uu cho ca desktop lan mobile.</p>
 </div>
 </article>

 <article className="register-benefit">
 <span className="register-benefit-icon">
 <FaShieldAlt />
 </span>
 <div>
 <strong>Thong tin nhat quan</strong>
 <p>Giup ban quay lai nhanh trang can den sau khi dang ky va dang nhap.</p>
 </div>
 </article>
 </div>
 </article>

 <article className="register-card register-form-card">
 <div className="register-top">
 <p className="register-form-tag">Create account</p>
 <h2>Dang ky t i khoan</h2>
 <p className="register-note">
 Nhap thong tin co ban de bat dau so dung he thong. Sau khi dang ky, he thong se
 gui email xac nhan cho ban.
 </p>
 </div>

 <form className="register-form" onSubmit={handleRegister}>
 <label className="register-field">
 <span>Ho va ten</span>
 <div className="register-input-shell">
 <FaUser />
 <input
 placeholder="Nhap ho va ten"
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
 <span>Mat khau</span>
 <div className="register-input-shell">
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
 className="register-visibility-btn"
 onClick={() => setShowPassword((prev) => !prev)}
 aria-label={showPassword ? "An mat khau" : "Hien mat khau"}
 >
 {showPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </label>

 <label className="register-field">
 <span>Xac nhan mat khau</span>
 <div className="register-input-shell">
 <FaLock />
 <input
 type={showConfirmPassword ? "text" : "password"}
 placeholder="Nhap lai mat khau"
 value={confirmPassword}
 onChange={(event) => setConfirmPassword(event.target.value)}
 autoComplete="new-password"
 required
 />
 <button
 type="button"
 className="register-visibility-btn"
 onClick={() => setShowConfirmPassword((prev) => !prev)}
 aria-label={showConfirmPassword ? "An mat khau xac nhan" : "Hien mat khau xac nhan"}
 >
 {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </label>

 <p className={`register-helper ${passwordReady ? "success" : passwordMismatch ? "error" : ""}`}>
 {passwordMismatch
 ? "Mat khau va xac nhan mat khau chua khop."
 : password.length > 0
 ? "Mat khau da san sang. Hay dam bao tu 6 ky tu tro len."
 : "Mat khau nen co it nhat 6 ky tu de dang ky an denh hon."}
 </p>

 <button type="submit" className="register-submit-btn" disabled={loading}>
 <span>{loading ? "Dang dang ky..." : "Dang ky t i khoan"}</span>
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
 Ban da co t i khoan? Dang nhap
 </button>
 </div>
 </article>
 </section>
 </main>
 );
}

export default Register;

