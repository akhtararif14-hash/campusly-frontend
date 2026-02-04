import { useOutletContext, useNavigate } from "react-router-dom"

export default function Cart() {
  const { cart, increaseQty, decreaseQty } = useOutletContext()
  const navigate = useNavigate()

  const totalPrice = cart.reduce((sum, item) => {
    const priceNumber =
      typeof item.price === "string"
        ? Number(item.price.replace("₹", ""))
        : Number(item.price)

    return sum + priceNumber * item.quantity
  }, 0)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold ml-2 mb-4">My Cart</h1>

      {cart.length === 0 && <p>Your Cart Is Empty</p>}

      {cart.map((item) => {
        const itemId = item._id || item.id  

        return (
          <div
            key={itemId}
            className="flex justify-between items-center bg-gray-200 gap-4 p-3 mb-2 h-[170px] rounded"
          >
            <div className="flex gap-4 h-[150px]">
              <img src={item.img} className="w-38 object-cover" />
              <div>
                <h2 className="font-semibold">{item.title}</h2>
                <p>₹{item.price}</p>
              </div>
            </div>

            <div className="flex h-[40px] mr-2 items-center gap-3">
              <button
                onClick={() => decreaseQty(itemId)}
                className="font-bold bg-gray-300 w-10 h-10 rounded text-xl"
              >
                -
              </button>

              <span className="font-bold">{item.quantity}</span>

              <button
                onClick={() => increaseQty(itemId)}
                className="bg-blue-600 text-white w-10 h-10 rounded text-xl"
              >
                +
              </button>
            </div>
          </div>
        )
      })}

      {cart.length > 0 && (
        <div className="mt-6 p-4 border-r text-xl font-bold flex justify-between items-center">
          <span>Total Amount</span>
          <span>₹{totalPrice}</span>

          <button
            onClick={() => navigate("/checkout")}
            className="bg-blue-600 text-white py-3 px-4 rounded text-lg"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  )
}
