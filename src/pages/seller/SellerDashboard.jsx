import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import axios from "axios";

export default function SellerDashboard() {
  const { products = [], setProducts } = useOutletContext();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const API = import.meta.env.VITE_API_URL;

  const showMessage = (msg, type = "error") => {
    setMessage({ msg, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // 🔒 AUTH GUARD
  if (!user || user.role !== "seller") {
    return <p className="p-6">Please login as seller</p>;
  }

  const token = localStorage.getItem("token");
  const sellerId = user._id;

  // ================= DELETE PRODUCT =================
  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`${API}/api/seller/product/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProducts((prev) => prev.filter((p) => p._id !== productId));
      showMessage("Product deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showMessage("Failed to delete product");
    }
  };

  // ================= LOAD PRODUCTS =================
  useEffect(() => {
    if (!token) return;

    api
      .get("/api/seller/products", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProducts(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error(err);
        setProducts([]);
      });
  }, [token, setProducts]);

  // ================= LOAD ORDERS =================
  useEffect(() => {
    if (!token) return;

    api
      .get("/api/seller/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error(err));
  }, [token]);

  // ================= ADD PRODUCT =================
  const handleAddProduct = async () => {
    if (!title || !price || !image) {
      showMessage("Title, price and image are required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("price", price);
    formData.append("image", image);

    try {
      setLoading(true);

      const res = await api.post("/api/seller/product", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res?.data?._id) {
        setProducts((prev) => [...prev, res.data]);
      }

      setTitle("");
      setPrice("");
      setImage(null);
      setPreview(null);

      showMessage("Product added successfully", "success");
    } catch (err) {
      console.error("ADD PRODUCT ERROR ❌", err);
      showMessage(err.response?.data?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  // ================= FILTER MY PRODUCTS =================
  const myProducts = Array.isArray(products)
    ? products.filter(
        (p) => p?.sellerId && String(p.sellerId) === String(sellerId)
      )
    : [];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Seller Dashboard</h1>

      {/* ADD PRODUCT */}
      <div className="border p-4 rounded mb-6 bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Add Product</h2>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setImage(file);
              setPreview(URL.createObjectURL(file));
            }
          }}
        />

        {preview && (
          <img
            src={preview}
            alt="preview"
            className="w-32 h-32 object-cover mt-2 border rounded"
          />
        )}

        {message && (
          <div
            className={`mt-3 p-2 rounded ${
              message.type === "success"
                ? "bg-blue-100 text-blue-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.msg}
          </div>
        )}

        <input
          className="border p-2 block mt-3 w-full"
          placeholder="Product title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="border p-2 block mt-3 w-full"
          placeholder="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <button
          onClick={handleAddProduct}
          className="bg-blue-600 text-white px-4 py-2 mt-4 rounded"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Product"}
        </button>
      </div>

      {/* MY PRODUCTS */}
      <h2 className="text-xl font-semibold mb-3">My Products</h2>

      {myProducts.length === 0 && <p>No products yet</p>}

      {myProducts.map((product) => (
        <div
          key={product._id}
          className="border p-3 mb-3 flex gap-4 items-center"
        >
          {product.image && (
            <img
              src={`${API}${product.image}`}
              className="w-20 h-20 object-cover rounded"
              alt={product.title}
            />
          )}

          <div className="flex-1">
            <p className="font-bold">{product.title}</p>
            <p>₹{product.price}</p>
          </div>

          <button
            onClick={() => handleDeleteProduct(product._id)}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
