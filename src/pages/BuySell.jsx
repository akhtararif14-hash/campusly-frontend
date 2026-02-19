import { useOutletContext, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import api from "../api/axios"

export default function BuySell() {
  const [products, setProducts] = useState([])
  const outletContext = useOutletContext() || {}
  const { addToCart, cart = [] } = outletContext
  const navigate = useNavigate()

  // 🔗 Fetch products from backend
  useEffect(() => {
    api
      .get("/api/seller/products")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setProducts(res.data)
        } else if (Array.isArray(res.data.products)) {
          setProducts(res.data.products)
        } else {
          setProducts([])
        }
      })
      .catch((err) => {
        console.error("Error fetching products", err)
      })
  }, [])

  return (
    <div className="container mx-auto pb-16">
      {/* Header */}
      <div className="p-4 h-18 rounded-sm mb-6 bg-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">Buy & Sell</h1>
        </div>

        <div className="relative">
          <img
            src="/images/cart2.svg"
            alt="cart"
            className="w-15 h-15 p-2 rounded-3xl cursor-pointer"
            onClick={() => navigate("/cart")}
          />

          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-sm w-6 h-6 flex items-center justify-center rounded-full">
              {cart.length}
            </span>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((item) => {
          const imageSrc =
            item.image || item.img || "/images/no-image.png"

          return (
            <article
              key={item._id || item.id}
              className="bg-white p-1 rounded-lg max-w-42 overflow-hidden shadow-sm shadow-gray-600"
            >
              <div className="h-40 flex relative items-center justify-center overflow-hidden bg-gray-100">
                <img
                  src={imageSrc}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300"
                />

                <p className="bg-blue-500 text-white absolute bottom-2 right-2 inline-block rounded-md text-[10px] px-2 py-1 font-semibold">
                  ₹{item.price}
                </p>
              </div>

              <div className="p-3">
                <h2 className="font-semibold text-lg truncate">
                  {item.title}
                </h2>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => addToCart(item)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Cart
                  </button>

                  <button
                    onClick={() => navigate("/cart")}
                    className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition"
                  >
                    Buy
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Empty state */}
      {products.length === 0 && (
        <p className="text-center text-gray-500 mt-10">
          No products available
        </p>
      )}
    </div>
  )
}
