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

    if (token) {
      // save token
      localStorage.setItem("token", token);

      // OPTIONAL: fetch user from backend if needed later
      login({
        token,
        user: null, // backend can be queried later
      });

      navigate("/", { replace: true });
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

  // ✅ GOOGLE LOGIN
  const handleGoogleLogin = () => {
    window.location.href =
      import.meta.env.VITE_API_URL + "/api/auth/google";
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-sm m-auto">
      <h2 className="text-xl font-bold mb-4">Login</h2>

      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <input
        className="border p-2 w-full mb-3"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        className="border p-2 w-full mb-3"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        type="submit"
        className="bg-blue-600 text-white w-full py-2 rounded"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      {/* ✅ GOOGLE LOGIN BUTTON */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="bg-red-500 text-white w-full py-2 rounded mt-3"
      >
        Continue with Google
      </button>

      <p className="text-center mt-4 text-sm">
        Don’t have an account?{" "}
        <span
          className="text-blue-600 cursor-pointer"
          onClick={() => navigate("/signup")}
        >
          Sign up
        </span>
      </p>
    </form>
  );
}
