import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  // Not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Role mismatch
  if (role && user.role !== role) {
    return <Navigate to="/login" />;
  }

  // Allowed
  return children;
}
