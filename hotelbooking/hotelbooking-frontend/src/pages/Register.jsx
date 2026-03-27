import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.redirectTo || "/";
  const redirectState = location.state?.redirectState || null;

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        toast.error("Mat khau va xac nhan mat khau khong khop");
        setLoading(false);
        return;
      }

      await registerUser({ name, email, password });
      toast.success("Dang ky thanh cong, vui long dang nhap");

      navigate("/login", {
        replace: true,
        state: {
          redirectTo,
          redirectState,
        },
      });
    } catch (registerError) {
      console.error("Register failed", registerError);
      toast.error(registerError?.response?.data?.message || "Dang ky that bai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <div className="register-left">
          <div className="hero">
            <img src="/logo192.png" alt="hero" style={{ width: 160 }} />
            <h3>HON 50.000 CHU TRO</h3>
            <p>Tin tuong va su dung dich vu cua chung toi</p>
          </div>
        </div>

        <div className="register-right">
          <h2>Dang Ky Tai Khoan Moi</h2>

          <form onSubmit={handleRegister}>
            <input
              placeholder="Ho va Ten"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Mat khau"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Xac nhan mat khau"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            <button disabled={loading}>{loading ? "Dang dang ky..." : "Dang ky"}</button>
          </form>

          <div className="register-extra">
            <span
              onClick={() =>
                navigate("/login", {
                  state: {
                    redirectTo,
                    redirectState,
                  },
                })
              }
            >
              Ban da co tai khoan? Dang nhap
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
