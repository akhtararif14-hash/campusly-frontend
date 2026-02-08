import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";

import Profile from "./pages/Profile.jsx";
import Alert from "./pages/Alert.jsx";
import Setting from "./pages/Setting.jsx";
import SellerDashboard from "./pages/seller/SellerDashboard.jsx";

import DashboardLayout from "./components/DashboardLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

function App() {
  return (
    <Routes>
      {/* ================= AUTH ROUTES ================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/oauth-success" element={<OAuthSuccess />} />

      {/* 🔒 AUTO-FIX CAPITAL URL */}
      <Route path="/Signup" element={<Navigate to="/signup" replace />} />

      {/* ================= DASHBOARD LAYOUT ================= */}
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Alert />} />
        <Route path="alert" element={<Alert />} />

        <Route path="profile" element={<Profile />} />
        <Route path="setting" element={<Setting />} />

        {/* ✅ PROTECTED SELLER ROUTE */}
        <Route
          path="seller"
          element={
             <ProtectedRoute roles={["seller", "admin"]}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
