import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./App.css";

import DashboardLayout from "./components/DashboardLayout.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import BuySell from "./pages/BuySell.jsx";
import Profile from "./pages/Profile.jsx";
import Setting from "./pages/Setting.jsx";
import Alert from "./pages/Alert.jsx";
import Navbar from "./pages/Navbar.jsx";
import Cart from "./pages/Cart.jsx";
import SellerDashboard from "./pages/seller/SellerDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

/* ===========================
   ROUTER CONFIG
   =========================== */
const router = createBrowserRouter([
  // ✅ AUTH ROUTES (PUBLIC)
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/Signup",
    element: <Navigate to="/signup" replace />,
  },

  // ✅ MAIN DASHBOARD LAYOUT
  {
    path: "/",
    element: <DashboardLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "buy-sell", element: <BuySell /> },
      { path: "alert", element: <Alert /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "order-success", element: <OrderSuccess /> },

      // ✅ PROTECTED ROUTES
      {
        path: "profile",
        element: (
        
            <Profile />
         
        ),
      },
      {
        path: "setting",
        element: (
          <ProtectedRoute>
            <Setting />
          </ProtectedRoute>
        ),
      },
      {
        path: "seller",
        element: (
          <ProtectedRoute roles={["seller", "admin"]}>
            <SellerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // ✅ FALLBACK - CATCH ALL
  {
    path: "*",
    element: <NotFound />,
  },
]);

/* ===========================
   APP BOOTSTRAP
   =========================== */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);