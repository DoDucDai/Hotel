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
 <p>Dat phong de dang, thong tin ro rang, ho tro nhanh 24/7.</p>
 </div>

 <div className="footer-links">
 <button type="button" onClick={() => navigate("/")}>
 Trang chu
 </button>
 <button type="button" onClick={() => navigate("/hotels")}>
 Khach san
 </button>
 <button type="button" onClick={() => navigate("/host")}>
 Dang phong
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

