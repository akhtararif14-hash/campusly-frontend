import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // ✅ HANDLE GOOGLE REDIRECT TOKEN
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const errorParam = params.get("error");

    // Handle OAuth errors
    if (errorParam) {
      setError("Google authentication failed. Please try again.");
      // Clean URL
      window.history.replaceState({}, document.title, "/login");
      return;
    }

    if (token) {
      // Save token
      localStorage.setItem("token", token);

      // Fetch user details from backend
      const fetchUser = async () => {
        try {
          const res = await api.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          login({
            token,
            user: res.data.user,
          });

          navigate("/", { replace: true });
        } catch (err) {
          console.error("Failed to fetch user:", err);
          // Fallback: just login with token
          login({ token, user: null });
          navigate("/", { replace: true });
        }
      };

      fetchUser();
    }
  }, [login, navigate]);

  // ✅ REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      login({
        token: res.data.token,
        user: res.data.user,
      });

      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ GOOGLE LOGIN - HARDCODED FOR TESTING
  const handleGoogleLogin = () => {
    console.log("🔵 Google login button clicked");
    
    // ✅ Hardcode temporarily to test
    window.location.href = "https://campusly-backend-production.up.railway.app/api/auth/google";
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-sm mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {error}
        </div>
      )}

      <input
        className="border border-gray-300 p-2 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />

      <input
        type="password"
        className="border border-gray-300 p-2 w-full mb-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      {/* DIVIDER */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* ✅ GOOGLE LOGIN BUTTON */}
      {/* DEBUG BUTTON */}
<button
  type="button"
  onClick={() => {
    const url = "https://campusly-backend-production.up.railway.app/api/auth/google";
    console.log("🔵 Clicking Google button");
    console.log("🔵 URL:", url);
    console.log("🔵 VITE_API_URL:", import.meta.env.VITE_API_URL);
    alert(`Redirecting to: ${url}`);
    window.location.href = url;
  }}
  className="bg-red-500 text-white w-full py-2 rounded"
>
  DEBUG: Google Login
</button>

      <p className="text-center mt-6 text-sm text-gray-600">
        Don't have an account?{" "}
        <span
          className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
          onClick={() => navigate("/signup")}
        >
          Sign up
        </span>
      </p>
    </form>
  );
}