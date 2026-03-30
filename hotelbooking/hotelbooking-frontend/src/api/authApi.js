import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
 return (
 <BrowserRouter>
 <Routes>
 <Route path="/login" element={<Login />} />

 {/* USER */}
 <Route
 path="/"
 element={
 <ProtectedRoute>
 <Home />
 </ProtectedRoute>
 }
 />

 {/* ADMIN */}
 <Route
 path="/admin"
 element={
 <ProtectedRoute roleRequired="ADMIN">
 <AdminDashboard />
 </ProtectedRoute>
 }
 />
 </Routes>
 </BrowserRouter>
 );
}

export default App;