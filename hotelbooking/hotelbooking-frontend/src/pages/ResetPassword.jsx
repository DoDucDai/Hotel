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
  const [message, setMessage] = useState("Dang kiem tra link dat lai mat khau...");
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
        setMessage("Link dat lai mat khau khong hop le hoac thieu token.");
        return;
      }

      try {
        const res = await validateResetPasswordToken(token);
        if (!active) {
          return;
        }

        setStatus("ready");
        setEmail(res?.data?.email || "");
        setMessage("Token hop le. Ban co the tao mat khau moi.");
      } catch (error) {
        if (!active) {
          return;
        }

        console.error("Cannot validate reset token", error);
        setStatus("error");
        setMessage(readAuthError(error, "Link dat lai mat khau da het han hoac khong hop le."));
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
      toast.error("Mat khau va xac nhan mat khau khong khop");
      return;
    }

    setSaving(true);
    try {
      const res = await resetPassword(token, password);
      toast.success(res?.data?.message || "Dat lai mat khau thanh cong");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Cannot reset password", error);
      toast.error(readAuthError(error, "Khong the dat lai mat khau"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="auth-assist-page">
      <section className="auth-assist-shell compact">
        <article className="auth-assist-card">
          <p className="auth-assist-card-tag">Reset password</p>
          <h2>Dat lai mat khau</h2>
          <p className="auth-assist-note">{message}</p>

          {status === "loading" ? (
            <div className="auth-assist-feedback">Dang xac thuc token...</div>
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
                  Gui lai yeu cau moi
                </button>
              </div>
            </div>
          ) : null}

          {status === "ready" ? (
            <>
              {email ? (
                <div className="auth-assist-feedback">
                  Dang dat lai mat khau cho <strong>{email}</strong>
                </div>
              ) : null}

              <form className="auth-assist-form" onSubmit={handleSubmit}>
                <label className="auth-assist-field">
                  <span>Mat khau moi</span>
                  <div className="auth-assist-input">
                    <FaLock />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Toi thieu 6 ky tu"
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
                  <span>Xac nhan mat khau</span>
                  <div className="auth-assist-input">
                    <FaLock />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Nhap lai mat khau moi"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-assist-toggle"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword ? "An mat khau xac nhan" : "Hien mat khau xac nhan"
                      }
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </label>

                <p className={`auth-assist-helper ${passwordMismatch ? "error" : ""}`}>
                  {passwordMismatch
                    ? "Mat khau va xac nhan mat khau chua khop."
                    : "Hay dat mat khau moi co it nhat 6 ky tu."}
                </p>

                <button type="submit" className="auth-assist-submit" disabled={saving}>
                  <span>{saving ? "Dang cap nhat..." : "Luu mat khau moi"}</span>
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
              Quay lai dang nhap
            </button>
          </div>
        </article>

        <article className="auth-assist-copy muted">
          <p className="auth-assist-tag">Bao mat</p>
          <h1>Tao mat khau moi an toan de tiep tuc su dung tai khoan.</h1>
          <div className="auth-assist-points">
            <article>
              <FaCheckCircle />
              <div>
                <strong>Link co thoi han</strong>
                <p>Neu token het han, ban chi can tao lai yeu cau reset tu dau.</p>
              </div>
            </article>
            <article>
              <FaLock />
              <div>
                <strong>Thong tin duoc bao ve</strong>
                <p>Mat khau moi se duoc ma hoa truoc khi luu trong he thong.</p>
              </div>
            </article>
          </div>
        </article>
      </section>
    </main>
  );
}

export default ResetPassword;
