import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import SessionTimeoutManager from "./components/SessionTimeoutManager";
import Account from "./pages/Account";
import AdminDashboard from "./pages/AdminDashboard";
import Booking from "./pages/Booking";
import Forgot from "./pages/Forgot";
import Home from "./pages/Home";
import HotelDetail from "./pages/HotelDetail";
import Hotels from "./pages/Hotels";
import HostRooms from "./pages/HostRooms";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import ProtectedRoute from "./routes/ProtectedRoute";

function GuestRoute({ children }) {
 const token = localStorage.getItem("accessToken");
 const role = localStorage.getItem("role");

 if (token) {
 return <Navigate to={role === "ADMIN" ? "/admin" : "/"} replace />;
 }

 return children;
}

function App() {
 const location = useLocation();
 const authStandalonePaths = [
 "/login",
 "/register",
 "/forgot-password",
 "/reset-password",
 "/verify-email",
 ];

 const hideNavbar =
 authStandalonePaths.includes(location.pathname) ||
 location.pathname === "/admin";
 const hideFooter =
 authStandalonePaths.includes(location.pathname) ||
 location.pathname === "/admin";

 return (
 <>
 <SessionTimeoutManager />
 {!hideNavbar && <Navbar />}

 <Routes>
 <Route path="/" element={<Home />} />

 <Route
 path="/login"
 element={
 <GuestRoute>
 <Login />
 </GuestRoute>
 }
 />
 <Route
 path="/register"
 element={
 <GuestRoute>
 <Register />
 </GuestRoute>
 }
 />
 <Route path="/forgot-password" element={<Forgot />} />
 <Route path="/reset-password" element={<ResetPassword />} />
 <Route path="/verify-email" element={<VerifyEmail />} />

 <Route path="/hotels" element={<Hotels />} />
 <Route path="/hotels/:id" element={<HotelDetail />} />
 <Route
 path="/booking"
 element={
 <ProtectedRoute>
 <Booking />
 </ProtectedRoute>
 }
 />
 <Route
 path="/account"
 element={
 <ProtectedRoute>
 <Account />
 </ProtectedRoute>
 }
 />
 <Route
 path="/host"
 element={
 <ProtectedRoute>
 <HostRooms />
 </ProtectedRoute>
 }
 />

 <Route
 path="/admin"
 element={
 <ProtectedRoute roleRequired="ADMIN">
 <AdminDashboard />
 </ProtectedRoute>
 }
 />

 <Route path="*" element={<Navigate to="/" replace />} />
 </Routes>

 {!hideFooter && <Footer />}
 </>
 );
}

export default App;
