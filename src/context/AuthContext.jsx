import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  /* ===========================
     🔁 RESTORE SESSION ON LOAD
     =========================== */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setReady(true);
      return;
    }

    api
      .get("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        // token invalid / expired
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  /* ===========================
     🔐 LOGIN
     =========================== */
  const login = ({ token, user }) => {
    localStorage.setItem("token", token);
    setUser(user);
  };

  /* ===========================
     🚪 LOGOUT
     =========================== */
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  /* ===========================
     🔁 UPDATE USER (ROLE, NAME)
     =========================== */
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
