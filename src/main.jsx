import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import "./App.css"

import DashboardLayout from "./components/DashboardLayout.jsx"
import DashboardHome from "./pages/DashboardHome.jsx"
import BuySell from "./pages/BuySell.jsx"
import Profile from "./pages/Profile.jsx"
import Setting from "./pages/Setting"
import Alert from "./pages/alert.jsx"
import Navbar from "./pages/Navbar.jsx"
import Cart from "./pages/Cart.jsx"
import SellerDashboard from "./pages/seller/SellerDashboard.jsx"
import AdminDashboard from "./pages/admin/AdminDashboard.jsx"
import NotFound from "./pages/NotFound.jsx"
import Checkout from "./pages/Checkout.jsx"
import OrderSuccess from "./pages/OrderSuccess.jsx"
import Login from "./pages/Login.jsx"

import { AuthProvider } from "./context/AuthContext.jsx"
import ProtectedRoute from "./routes/ProtectedRoute.jsx"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
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

      { path: "user", element: <Navigate to="/" /> },
    ],
  },

  // Standalone pages
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <>
          <Navbar />
          <Profile />
        </>
      </ProtectedRoute>
    ),
  },
  {
    path: "/setting",
    element: (
      <ProtectedRoute>
        <>
          <Navbar />
          <Setting />
        </>
      </ProtectedRoute>
    ),
  },
  {
    path: "/alert",
    element: (
      <>
        <Navbar />
        <Alert />
      </>
    ),
  },
])

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
)
