import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowRight, FaCheckCircle, FaEnvelopeOpenText, FaShieldAlt } from "react-icons/fa";
import { verifyEmail } from "../services/authService";
import { useToast } from "../components/ToastProvider";
import "./AuthAssist.css";

function VerifyEmail() {
 const navigate = useNavigate();
 const toast = useToast();
 const [searchParams] = useSearchParams();
 const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

 const [status, setStatus] = useState("loading");
 const [message, setMessage] = useState("Đang xác nhận email của bạn...");
 const [verifiedEmail, setVerifiedEmail] = useState("");

 const readAuthError = (error, fallback) =>
 error?.response?.data?.error ||
 error?.response?.data?.message ||
 fallback;

 useEffect(() => {
 let active = true;

 const submitVerification = async () => {
 if (!token) {
 setStatus("error");
 setMessage("Liên kết xác nhận email không hợp lệ hoặc thiếu token.");
 return;
 }

 try {
 const res = await verifyEmail(token);
 if (!active) {
 return;
 }

 setStatus("success");
 setVerifiedEmail(res?.data?.email || "");
 setMessage(res?.data?.message || "Email đã được xác nhận thành công");
 toast.success("Xác nhận email thành công");
 } catch (error) {
 if (!active) {
 return;
 }

 console.error("Cannot verify email", error);
 setStatus("error");
 setMessage(readAuthError(error, "Không thể xác nhận email. Link có thể đã hết hạn."));
 }
 };

 submitVerification();
 return () => {
 active = false;
 };
 }, [token, toast]);

 return (
 <main className="auth-assist-page">
 <section className="auth-assist-shell compact">
 <article className="auth-assist-copy">
 <p className="auth-assist-tag">Email verification</p>
 <h1>Một bước nhỏ để kích hoạt và xác thực địa chỉ email của bạn.</h1>
 <div className="auth-assist-points">
 <article>
 <FaEnvelopeOpenText />
 <div>
 <strong>Xác nhận nhanh</strong>
 <p>Chỉ cần bấm vào link trong email để hoàn tất xác thực tài khoản.</p>
 </div>
 </article>
 <article>
 <FaShieldAlt />
 <div>
 <strong>Giảm nhầm lẫn</strong>
 <p>Bước này giúp đảm bảo email đăng ký là email bạn đang thực sự sử dụng.</p>
 </div>
 </article>
 </div>
 </article>

 <article className="auth-assist-card">
 <p className="auth-assist-card-tag">Verification status</p>
 <h2>
 {status === "loading"
 ? "Đang xử lý"
 : status === "success"
 ? "Xác nhận thành công"
 : "Không thể xác nhận"}
 </h2>
 <div className={`auth-assist-feedback ${status === "error" ? "error" : ""}`}>
 {message}
 {verifiedEmail ? (
 <div>
 <strong>{verifiedEmail}</strong>
 </div>
 ) : null}
 </div>

 <div className="auth-assist-actions">
 <button type="button" className="auth-assist-link" onClick={() => navigate("/login")}>
 Đăng nhập ngay
 </button>
 {status === "error" ? (
 <button
 type="button"
 className="auth-assist-link subtle"
 onClick={() => navigate("/register")}
 >
 Tạo tài khoản mới
 </button>
 ) : null}
 </div>

 {status === "success" ? (
 <button
 type="button"
 className="auth-assist-submit"
 onClick={() => navigate("/login")}
 >
 <span>Đi đến đăng nhập</span>
 <FaArrowRight />
 </button>
 ) : null}

 {status === "success" ? (
 <div className="auth-assist-helper success">
 <FaCheckCircle />
 <span>Email của bạn đã sẵn sàng để sử dụng cho các thông báo sau này.</span>
 </div>
 ) : null}
 </article>
 </section>
 </main>
 );
}

export default VerifyEmail;



