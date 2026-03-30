import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaEnvelope, FaKey, FaShieldAlt } from "react-icons/fa";
import { forgotPassword } from "../services/authService";
import { useToast } from "../components/ToastProvider";
import "./AuthAssist.css";

function Forgot() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const readAuthError = (error, fallback) =>
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    fallback;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setSubmittedEmail(email.trim());
      toast.success(
        res?.data?.message ||
          "Neu email ton tai, chung toi da gui huong dan dat lai mat khau"
      );
    } catch (error) {
      console.error("Forgot password failed", error);
      toast.error(readAuthError(error, "Khong the gui yeu cau dat lai mat khau"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-assist-page">
      <section className="auth-assist-shell">
        <article className="auth-assist-copy">
          <p className="auth-assist-tag">Recovery</p>
          <h1>Khoi phuc tai khoan cua ban bang link dat lai mat khau qua email.</h1>
          <p className="auth-assist-text">
            Nhap email dang ky. Neu tai khoan ton tai, he thong se gui mot link reset mat khau
            an toan ve hop thu cua ban.
          </p>

          <div className="auth-assist-points">
            <article>
              <FaKey />
              <div>
                <strong>Token co thoi han</strong>
                <p>Link reset mat khau chi co hieu luc trong mot khoang thoi gian ngan.</p>
              </div>
            </article>
            <article>
              <FaShieldAlt />
              <div>
                <strong>Khong lo email</strong>
                <p>Form se tra ve thong bao chung de bao ve thong tin tai khoan.</p>
              </div>
            </article>
          </div>
        </article>

        <article className="auth-assist-card">
          <p className="auth-assist-card-tag">Quen mat khau</p>
          <h2>Gui link dat lai mat khau</h2>
          <p className="auth-assist-note">
            Vui long kiem tra ca hop thu chinh va muc spam sau khi gui yeu cau.
          </p>

          <form className="auth-assist-form" onSubmit={handleSubmit}>
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

            {submittedEmail ? (
              <div className="auth-assist-feedback">
                Yeu cau da duoc gui cho <strong>{submittedEmail}</strong> neu tai khoan ton tai.
              </div>
            ) : null}

            <button type="submit" className="auth-assist-submit" disabled={loading}>
              <span>{loading ? "Dang gui..." : "Gui link dat lai mat khau"}</span>
              <FaArrowRight />
            </button>
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
              Tao tai khoan moi
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}

export default Forgot;
