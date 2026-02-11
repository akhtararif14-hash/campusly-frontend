import { useOutletContext, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useEffect } from "react"
import api from "../api/axios"

export default function Checkout() {
  const outletContext = useOutletContext() || {}
  const { cart = [], clearCart } = outletContext

  const navigate = useNavigate()
  const { user } = useAuth()

  // 🔐 Not logged in - redirect to login with return path
  useEffect(() => {
    if (!user) {
      // Save the current path so we can return after login
      localStorage.setItem('returnPath', '/checkout');
    }
  }, [user]);

  // 🔐 Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">
            🔒 Login Required
          </h2>
          <p className="text-yellow-700 mb-4">
            Please sign in to complete your purchase. Your cart items will be saved!
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition"
            >
              Sign Up
            </button>
          </div>
        </div>
        <button
          onClick={() => navigate('/buy-sell')}
          className="text-gray-600 hover:text-gray-800 underline"
        >
          ← Continue Shopping
        </button>
      </div>
    )
  }

  // 🛒 Empty cart
  if (cart.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 mb-4">Your cart is empty</p>
        <button
          onClick={() => navigate('/buy-sell')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Start Shopping
        </button>
      </div>
    )
  }

  const totalPrice = cart.reduce((sum, item) => {
    const priceNumber = Number(item.price)
    return sum + priceNumber * item.quantity
  }, 0)

  const placeOrder = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        alert("Login required")
        return
      }

      // 🚨 SAFETY CHECK (CRITICAL)
      for (let item of cart) {
        if (!item.sellerId || item.sellerId === "undefined") {
          console.error("Invalid cart item:", item)
          alert("Cart contains invalid product. Please add again.")
          return
        }
      }

      await api.post(
        "/api/orders",
        {
          items: cart.map(item => ({
            title: item.title,
            price: Number(item.price),
            quantity: item.quantity,
            sellerId: item.sellerId, // ✅ guaranteed valid now
          })),
          totalAmount: totalPrice,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      clearCart()
      // Clear the return path after successful order
      localStorage.removeItem('returnPath');
      navigate("/order-success")
    } catch (err) {
      console.error("ORDER ERROR:", err.response?.data || err.message)
      alert("Failed to place order")
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      {cart.map(item => (
        <div key={item._id} className="flex justify-between mb-2">
          <span>
            {item.title} × {item.quantity}
          </span>
          <span>
            ₹{Number(item.price) * item.quantity}
          </span>
        </div>
      ))}

      <hr className="my-4" />

      <div className="flex justify-between font-bold text-xl">
        <span>Total</span>
        <span>₹{totalPrice}</span>
      </div>

      <button
        onClick={placeOrder}
        className="mt-6 bg-blue-600 text-white py-3 w-full rounded text-lg hover:bg-blue-700 transition"
      >
        Place Order
      </button>
    </div>
  )
}