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

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 w-full py-2 rounded transition flex items-center justify-center gap-2"
        disabled={loading}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
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