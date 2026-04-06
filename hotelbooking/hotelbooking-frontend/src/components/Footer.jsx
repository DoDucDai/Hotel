import { useNavigate } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
 const navigate = useNavigate();
 const year = new Date().getFullYear();

 return (
 <footer className="app-footer">
 <div className="footer-shell">
 <div className="footer-brand">
 <strong>Hotel Booking</strong>
 <p>Đặt phòng dễ dàng, thông tin rõ ràng, hỗ trợ nhanh 24/7.</p>
 </div>

 <div className="footer-links">
 <button type="button" onClick={() => navigate("/")}>
 Trang chủ
 </button>
 <button type="button" onClick={() => navigate("/hotels")}>
 Khách sạn
 </button>
 <button type="button" onClick={() => navigate("/host")}>
 Đăng phòng
 </button>
 <button type="button" onClick={() => navigate("/account")}>
 Profile
 </button>
 </div>

 <p className="footer-copy"> {year} Hotel Booking. All rights reserved.</p>
 </div>
 </footer>
 );
}



