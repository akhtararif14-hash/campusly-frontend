import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./App.css";

import DashboardLayout from "./components/DashboardLayout.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import BuySell from "./pages/BuySell.jsx";
import Profile from "./pages/Profile.jsx";
import UserProfile from "./pages/UserProfile.jsx"; // ✅ ADD THIS LINE
import Setting from "./pages/Setting.jsx";
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
import Chat from "./pages/Chat.jsx";
import Messages from "./pages/Messages.jsx";


const router = createBrowserRouter([
  // ✅ AUTH ROUTES (PUBLIC)
  {
    path: "/login",
    element: <Login />,
  },
  {
  path: "/Chat/:userId",
  element: (
    <ProtectedRoute>
      <Chat />
    </ProtectedRoute>
  ),
},
{
  path: "/messages",
  element: (
    <ProtectedRoute>
      <Messages />
    </ProtectedRoute>
  ),
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
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "order-success", element: <OrderSuccess /> },
      { path: "user/:userId", element: <UserProfile /> }, // ✅ ADD THIS LINE

      // ✅ PROTECTED ROUTES
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);