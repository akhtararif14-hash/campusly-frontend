import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import { useAuth } from "../context/AuthContext"

export default function Setting() {
  const { user, updateUser, logout } = useAuth()
  const [isSeller, setIsSeller] = useState(user?.role === "seller")
  const [pw, setPw] = useState({ oldPassword: "", newPassword: "", confirm: "" })
  const [loadingRole, setLoadingRole] = useState(false)
  const [loadingPw, setLoadingPw] = useState(false)
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    setIsSeller(user.role === "seller")
  }, [user])

  const handlePw = (e) => setPw({ ...pw, [e.target.name]: e.target.value })

  const showMessage = (msg, type = "success") => {
    setMessage({ msg, type })
    setTimeout(() => setMessage(null), 4000)
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (pw.newPassword !== pw.confirm) return showMessage("New password and confirm do not match", "error")

    try {
      setLoadingPw(true)
      await api.put("/api/user/me/password", {
        oldPassword: pw.oldPassword,
        newPassword: pw.newPassword,
      })
      showMessage("Password updated. Please login again.", "success")
      setTimeout(() => {
        logout()
        navigate("/login")
      }, 900)
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to change password"
      showMessage(msg, "error")
    } finally {
      setLoadingPw(false)
    }
  }

  const toggleSellerRole = async () => {
    if (!confirm("Are you sure you want to change seller status?")) return

    try {
      setLoadingRole(true)
      const newRole = isSeller ? "user" : "seller"
      const res = await api.put("/api/user/me/role", { role: newRole })
      // backend now returns { token, user }
      if (res.data?.token) localStorage.setItem("token", res.data.token)
      const updatedUser = res.data?.user || res.data
      updateUser(updatedUser)
      setIsSeller(updatedUser.role === "seller")
      showMessage(`Role updated to ${updatedUser.role}`, "success")
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update role"
      showMessage(msg, "error")
    } finally {
      setLoadingRole(false)
    }
  }

  return (
    <div className="p-6 max-w-xl m-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button onClick={() => navigate("/")} className="text-sm px-3 py-1 bg-gray-200 rounded">Back</button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === "success" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
          {message.msg}
        </div>
      )}

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-3">Seller status</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isSeller} onChange={toggleSellerRole} disabled={loadingRole} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:bg-blue-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
            <div>
              <div className="text-sm">Current: <strong>{isSeller ? "Seller" : "User"}</strong></div>
              <div className="text-xs text-gray-500">Toggle to switch your account type</div>
            </div>
          </div>
          <button onClick={toggleSellerRole} className="px-3 py-1 bg-gray-100 rounded border" disabled={loadingRole}>{loadingRole ? 'Updating...' : (isSeller ? 'Switch to User' : 'Switch to Seller')}</button>
        </div>
      </div>

      <form onSubmit={changePassword} className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Change Password</h2>
        <label className="block mb-2">Old Password</label>
        <input name="oldPassword" value={pw.oldPassword} onChange={handlePw} type="password" className="w-full p-2 mb-3 border rounded" />

        <label className="block mb-2">New Password</label>
        <input name="newPassword" value={pw.newPassword} onChange={handlePw} type="password" className="w-full p-2 mb-3 border rounded" />

        <label className="block mb-2">Confirm New Password</label>
        <input name="confirm" value={pw.confirm} onChange={handlePw} type="password" className="w-full p-2 mb-3 border rounded" />

        <button className="px-4 py-2 bg-red-500 text-white rounded" disabled={loadingPw}>{loadingPw ? 'Saving...' : 'Change Password'}</button>
      </form>
    </div>
  )
}