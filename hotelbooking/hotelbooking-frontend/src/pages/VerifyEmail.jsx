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
 const [message, setMessage] = useState("Dang xac nhan email cua ban...");
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
 setMessage("Lien ket xac nhan email khong hop le hoac thieu token.");
 return;
 }

 try {
 const res = await verifyEmail(token);
 if (!active) {
 return;
 }

 setStatus("success");
 setVerifiedEmail(res?.data?.email || "");
 setMessage(res?.data?.message || "Email da duoc xac nhan th nh cong");
 toast.success("Xac nhan email th nh cong");
 } catch (error) {
 if (!active) {
 return;
 }

 console.error("Cannot verify email", error);
 setStatus("error");
 setMessage(readAuthError(error, "Khong the xac nhan email. Link co the da het han."));
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
 <h1>Mot buoc nho de kich hoat va xac thuc dua chi email cua ban.</h1>
 <div className="auth-assist-points">
 <article>
 <FaEnvelopeOpenText />
 <div>
 <strong>Xac nhan nhanh</strong>
 <p>Cho can bam vao link trong email de ho n tat xac thuc t i khoan.</p>
 </div>
 </article>
 <article>
 <FaShieldAlt />
 <div>
 <strong>Giam nham lan</strong>
 <p>Buoc nay giup dam bao email dang ky la email ban dang thuc so so dung.</p>
 </div>
 </article>
 </div>
 </article>

 <article className="auth-assist-card">
 <p className="auth-assist-card-tag">Verification status</p>
 <h2>
 {status === "loading"
 ? "Dang x? ly"
 : status === "success"
 ? "Xac nhan th nh cong"
 : "Khong the xac nhan"}
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
 Dang nhap ngay
 </button>
 {status === "error" ? (
 <button
 type="button"
 className="auth-assist-link subtle"
 onClick={() => navigate("/register")}
 >
 Tao t i khoan moi
 </button>
 ) : null}
 </div>

 {status === "success" ? (
 <button
 type="button"
 className="auth-assist-submit"
 onClick={() => navigate("/login")}
 >
 <span>Di den dang nhap</span>
 <FaArrowRight />
 </button>
 ) : null}

 {status === "success" ? (
 <div className="auth-assist-helper success">
 <FaCheckCircle />
 <span>Email cua ban da san sang de so dung cho cac thong bao sau nay.</span>
 </div>
 ) : null}
 </article>
 </section>
 </main>
 );
}

export default VerifyEmail;

