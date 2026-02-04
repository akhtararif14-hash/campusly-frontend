import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      })

      login(res.data)

      // Role-based redirect
      const role = res?.data?.user?.role
      if (role === "admin") return navigate("/admin")
      if (role === "seller") return navigate("/seller")
      navigate("/")
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Login failed"
      alert(msg)
    }
  }

  return (
    <div className="mt-26 ">
      <h1 className=" font-semibold text-center text-3xl mb-2 bg-white w-96 m-auto p-2 shadow-sm rounded-md shadow-black">Login</h1>
    <form className="flex bg-white justify-center align-middle  flex-col w-96  h-auto p-5 rounded-md shadow-sm shadow-black  gap-4 m-auto" onSubmit={handleSubmit}>
    

      <input value={email} name="email" className=" bg-gray-200 h-12 mt-3  rounded-sm pl-2 border-l-3 focus:outline-none border-black" placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input value={password} name="password" className=" bg-gray-200 h-12 mt-3 rounded-sm  pl-2 focus:outline-none border-l-3 border-black" type="password" placeholder="Password"
        onChange={e => setPassword(e.target.value)} />
      <button className=" mt-4  p-2 bg-blue-500 text-white rounded-full active:bg-blue-600">Login</button>
    </form>
    </div>
  )
}
