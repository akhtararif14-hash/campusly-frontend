import { useOutletContext, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"

export default function Checkout() {
  const outletContext = useOutletContext() || {}
  const { cart = [], clearCart } = outletContext

  const navigate = useNavigate()
  const { user } = useAuth()

  // 🔐 Not logged in
  if (!user) {
    return <p className="p-6 text-red-600">Please login to place an order</p>
  }

  // 🛒 Empty cart
  if (cart.length === 0) {
    return <p className="p-6">Your cart is empty</p>
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
        className="mt-6 bg-blue-600 text-white py-3 w-full rounded text-lg"
      >
        Place Order
      </button>
    </div>
  )
}
