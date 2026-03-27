import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope, FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import { login } from "../services/authService";
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

  const redirectTo = location.state?.redirectTo || location.state?.from || "/";
  const redirectState = location.state?.redirectState || null;

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
        toast.success("Dang nhap thanh cong");
        navigate("/admin", { replace: true });
        return;
      }

      toast.success("Dang nhap thanh cong");
      const pendingBooking = redirectTo === "/booking" ? readPendingBooking() : null;
      const nextState = redirectState || pendingBooking || undefined;

      if (nextState) {
        navigate(redirectTo, { replace: true, state: nextState });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (loginError) {
      console.error("Login failed", loginError);
      toast.error("Sai email hoac mat khau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p>Login to continue</p>

        <form onSubmit={handleLogin}>
          <div className="input-box">
            <FaEnvelope />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="input-box">
            <FaLock />
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <span onClick={() => setShowPass((prev) => !prev)}>
              {showPass ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button disabled={loading}>{loading ? "Loading..." : "Login"}</button>
        </form>

        <div className="extra">
          <span
            onClick={() =>
              navigate("/register", {
                state: {
                  redirectTo,
                  redirectState,
                },
              })
            }
          >
            Create account
          </span>
          <span>Forgot password?</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
