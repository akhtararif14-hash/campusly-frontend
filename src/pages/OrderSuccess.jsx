import { Link } from "react-router-dom"

export default function OrderSuccess() {
  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">🎉 Order Successful</h1>
       <p>Your order has been placed successfully.</p>
      <Link to="/" className="text-blue-600 underline">
        Go Home
      </Link>
    </div>
  )
}
