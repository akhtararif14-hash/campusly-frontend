import axios from "axios"

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Attach token automatically if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // 🚫 IMPORTANT:
  // Do NOT force Content-Type here.
  // Axios will set:
  // - application/json for normal requests
  // - multipart/form-data for FormData automatically

  return config
})

export default api
