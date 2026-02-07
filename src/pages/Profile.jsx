import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import { useAuth } from "../context/AuthContext"

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: "", username: "", description: "" })
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/api/user/me")
        setForm({
          name: res.data.name || "",
          username: res.data.username || "",
          description: res.data.description || "",
        })
      } catch (err) {
        // Not authenticated or failed; redirect to login
        console.error(err)
      }
    }

    fetch()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const [message, setMessage] = useState(null)

  const showMessage = (msg, type = "success") => {
    setMessage({ msg, type })
    setTimeout(() => setMessage(null), 3500)
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    try {
      const res = await api.put("/api/user/me", form)
      updateUser(res.data)
      showMessage("Profile updated", "success")
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update profile"
      showMessage(msg, "error")
    }
  }

  return (
    <div className="p-6 max-w-xl m-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Profile</h1>
        <button onClick={() => navigate("/")} className="text-sm px-3 py-1 bg-gray-200 rounded">← Back</button>
      </div>

      <form onSubmit={saveProfile} className="bg-white p-4 rounded shadow mb-6">
        {message && (
          <div className={`mb-3 p-2 rounded ${message.type === "success" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
            {message.msg}
          </div>
        )}

        <label className="block mb-2">Full Name</label>
        <input name="name" value={form.name} onChange={handleChange} className="w-full p-2 mb-3 border rounded" />

        <label className="block mb-2">Username</label>
        <input name="username" value={form.username} onChange={handleChange} className="w-full p-2 mb-3 border rounded" />

        <label className="block mb-2">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} className="w-full p-2 mb-3 border rounded" />

        <button className="px-4 py-2 bg-blue-500 text-white rounded">Save Profile</button>
      </form>

    </div>
  )
}