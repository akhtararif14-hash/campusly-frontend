import './App.css'
import { Routes, Route } from 'react-router-dom'
import Profile from './pages/Profile.jsx'
import Alert from './pages/alert.jsx'
import Setting from './pages/setting.jsx'
import Navbar from './pages/Navbar.jsx'
import DashboardLayout from './components/DashboardLayout.jsx'
import SellerDashboard from './pages/seller/SellerDashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from "./pages/Login.jsx"

function App() {
  return (
    <Routes>

      <Route path="/login" element={<Login />} />

      {/* Standalone pages */}
      <Route
        path="/profile"
        element={
          <>
            <Navbar />
            <DashboardLayout />
            <Profile />
          </>
        }
      />

      <Route
        path="/setting"
        element={
          <>
            <Navbar />
            <DashboardLayout />
            <Setting />
          </>
        }
      />

      {/* Dashboard layout */}
      <Route path="/" element={<DashboardLayout />}>

        {/* existing route */}
        <Route path="alert" element={<Alert />} />

        {/* ✅ PROTECTED SELLER ROUTE */}
        <Route
          path="seller"
          element={
            <ProtectedRoute role="seller">
              <SellerDashboard />
            </ProtectedRoute>
          }
        />

      </Route>
    </Routes>
  )
}

export default App
