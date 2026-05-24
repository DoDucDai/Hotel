import { useNavigate } from "react-router-dom";
import { useBranding } from "../context/BrandingContext";
import "./Footer.css";

export default function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  const isLoggedIn = Boolean(localStorage.getItem("accessToken"));
  const role = localStorage.getItem("role");
  const accountPath = role === "ADMIN" ? "/admin?view=account" : "/account";
  const { brandName } = useBranding();

  const handleProtectedNavigate = (path, redirectTo = path) => {
    if (isLoggedIn) {
      navigate(path);
      return;
    }

    navigate("/login", {
      state: {
        from: "/",
        redirectTo,
      },
    });
  };

  return (
    <footer className="app-footer">
      <div className="footer-shell">
        <div className="footer-brand">
          <strong>{brandName}</strong>
          <p>Đặt phòng dễ dàng, thông tin rõ ràng, hỗ trợ nhanh 24/7.</p>
        </div>

        <div className="footer-links">
          <button type="button" onClick={() => navigate("/")}>
            Trang chủ
          </button>
          <button type="button" onClick={() => navigate("/hotels")}>
            Khách sạn
          </button>
          <button type="button" onClick={() => handleProtectedNavigate("/host")}>
            Đăng phòng
          </button>
          <button type="button" onClick={() => handleProtectedNavigate(accountPath, "/account")}>
            Profile
          </button>
        </div>

        <p className="footer-copy"> &copy; {year} {brandName}. All rights reserved.</p>
      </div>
    </footer>
  );
}




