import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, roleRequired }) {
 const location = useLocation();
 const token = localStorage.getItem("accessToken");
 const role = localStorage.getItem("role");

 if (!token) {
 return (
 <Navigate
 to="/login"
 replace
 state={{
 from: location.pathname,
 redirectTo: location.pathname,
 redirectState: location.state || null,
 }}
 />
 );
 }

 if (roleRequired && role !== roleRequired) {
 const fallback = role === "ADMIN" ? "/admin" : "/";
 return <Navigate to={fallback} replace />;
 }

 return children;
}

export default ProtectedRoute;
