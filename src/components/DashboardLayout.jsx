import React, { useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import Navbar from "../pages/Navbar.jsx"
import { useAuth } from "../context/AuthContext"

export default function DashboardLayout() {
  const { user } = useAuth()

  const [cart, setCart] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const [products, setProducts] = useState([])

  // 🔑 normalize id (MongoDB + local)
  const getItemId = (item) => item._id || item.id

  // ================= CART LOGIC =================

  const clearCart = () => setCart([])

  const addToCart = (product) => {
    // 🚨 SAFETY CHECK (VERY IMPORTANT)
    if (!product.sellerId) {
      console.error("Product missing sellerId:", product)
      alert("This product cannot be added to cart (sellerId missing)")
      return
    }

    setCart(prev => {
      const productId = getItemId(product)

      const existing = prev.find(
        item => getItemId(item) === productId
      )

      if (existing) {
        return prev.map(item =>
          getItemId(item) === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      // ✅ EXPLICIT CART SHAPE (FIXES 500 ERROR)
      return [
        ...prev,
        {
          _id: product._id,
          title: product.title,
          price: product.price,
          quantity: 1,
          sellerId: product.sellerId, // ✅ CRITICAL FIX
        },
      ]
    })

    setShowPopup(true)
    setTimeout(() => setShowPopup(false), 2000)
  }

  const increaseQty = (id) => {
    setCart(prev =>
      prev.map(item =>
        getItemId(item) === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    )
  }

  const decreaseQty = (id) => {
    setCart(prev =>
      prev
        .map(item =>
          getItemId(item) === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    )
  }

  // ================= SIDEBAR =================

  const sidebarLinks = [
    { name: "Home", path: "/" , imgsrc: "/images/home.png"},
    { name: "Campus Shop", path: "/buy-sell" , imgsrc: "/images/shoppingcart.png" },

    ...(user && (user.role === "seller" || user.role === "admin")
      ? [{ name: "Seller Dashboard", path: "/seller", imgsrc: "/images/shoppingcart.png" }]
      : []),

    ...(user && user.role === "admin"
      ? [{ name: "Admin Dashboard", path: "/admin" }]
      : []),
  ]

  // ================= UI =================

  return (
    <div className="overflow-hidden h-screen">
      <Navbar />

      {showPopup && (
        <div className="fixed bottom-5 right-5 bg-white text-black px-6 py-3 rounded-xl shadow-lg z-50">
          ✅ Added to cart
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className="flex flex-col p-2 sm:w-56 w-12 text-md space-y-2 pb-28 border-r border-gray-200 overflow-y-auto h-screen">
          {sidebarLinks.map(item => (
            <NavLink
            img={item.imgsrc}
              key={item.name }
              to={item.path}
              className={({ isActive }) =>
                `p-2 rounded-lg text-black  ${isActive ? "bg-blue-200 font-bold" : ""
                }`
              }
            >
             <div className="flex gap-1"><img className="w-[23px] " src={item.imgsrc} alt="img" /><p className=" sm:block hidden"> {item.name}</p></div>
            </NavLink>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-1 sm:p-2 md:p-4 bg-white overflow-y-auto h-screen space-y-10 pb-40">
          <Outlet
            context={{
              cart,
              addToCart,
              increaseQty,
              decreaseQty,
              products,
              setProducts,
              clearCart,
            }}
          />
        </div>
      </div>
    </div>
  )
}
