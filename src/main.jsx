import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./App.css";
import Resources from "./pages/Resources";
import DashboardLayout from "./components/DashboardLayout.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import BuySell from "./pages/BuySell.jsx";
import Profile from "./pages/Profile.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import Cart from "./pages/Cart.jsx";
import SellerDashboard from "./pages/seller/SellerDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Setting from "./pages/Setting.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Chat from "./pages/Chat.jsx";
import Messages from "./pages/Messages.jsx";
import Timetable from "./pages/Timetable";
import RoomFinder from "./pages/RoomFinder";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Attendance from "./pages/Attendance";
import Assignments from "./pages/Assignments";
import LostFound from "./pages/LostFound";
import Feedback from "./pages/Feedback";

const router = createBrowserRouter([
  // ── PUBLIC AUTH ──
  { path: "/login",  element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/Signup", element: <Navigate to="/signup" replace /> },

  // ── STANDALONE PAGES (have their own back button, outside dashboard) ──
  { path: "/timetable",   element: <Timetable /> },
  { path: "/rooms",       element: <RoomFinder /> },
  { path: "/resources",   element: <Resources /> },
  { path: "/attendance",  element: <Attendance /> },
  { path: "/assignments", element: <Assignments /> },
  { path: "/lostfound",   element: <LostFound /> },
  // ❌ REMOVED: { path: "/feedback", element: <Feedback /> }
  // ❌ REMOVED: { path: "/admin/feedback", ... }
  // Both feedback routes now live inside dashboard children below

  // ── CHAT (protected, standalone) ──
  { path: "/Chat/:userId", element: <ProtectedRoute><Chat /></ProtectedRoute> },
  { path: "/messages",     element: <ProtectedRoute><Messages /></ProtectedRoute> },

  // ── DASHBOARD LAYOUT ──
  {
    path: "/",
    element: <DashboardLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true,           element: <DashboardHome /> },
      { path: "buy-sell",      element: <BuySell /> },
      { path: "cart",          element: <Cart /> },
      { path: "checkout",      element: <Checkout /> },
      { path: "order-success", element: <OrderSuccess /> },
      { path: "user/:userId",  element: <UserProfile /> },

      // ── protected ──
      { path: "profile", element: <ProtectedRoute><Profile /></ProtectedRoute> },
      { path: "setting", element: <ProtectedRoute><Setting /></ProtectedRoute> },

      // ✅ feedback — inside dashboard, requires login, shows with sidebar
      { path: "feedback", element: <ProtectedRoute><Feedback /></ProtectedRoute> },

      // ── role based ──
      { path: "seller", element: <ProtectedRoute roles={["seller", "admin"]}><SellerDashboard /></ProtectedRoute> },
      { path: "admin",  element: <ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute> },
    ],
  },

  // ── FALLBACK ──
  { path: "*", element: <NotFound /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <SpeedInsights />
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);