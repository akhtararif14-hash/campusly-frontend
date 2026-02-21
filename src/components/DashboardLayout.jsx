import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Navbar from "../pages/Navbar.jsx";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ Fixed — handles "undefined" string and null safely
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      if (!savedCart || savedCart === "undefined" || savedCart === "null") return [];
      return JSON.parse(savedCart);
    } catch (error) {
      localStorage.removeItem("cart"); // clear the bad value
      return [];
    }
  });

  const [showPopup, setShowPopup] = useState(false);
  const [products, setProducts] = useState([]);
  const [authMsg, setAuthMsg] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) { }
  }, [cart]);

  const getItemId = (item) => item._id || item.id;

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  const addToCart = (product) => {
    if (!product.sellerId) {
      alert("This product cannot be added to cart");
      return;
    }
    setCart((prev) => {
      const productId = getItemId(product);
      const existing = prev.find((item) => getItemId(item) === productId);
      if (existing) {
        return prev.map((item) =>
          getItemId(item) === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        _id: product._id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity: 1,
        sellerId: product.sellerId,
      }];
    });
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        getItemId(item) === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          getItemId(item) === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const showAuthToast = (msg) => {
    setAuthMsg(msg);
    setTimeout(() => setAuthMsg(null), 3000);
  };

  const allLinks = [
    { name: "Home", path: "/", imgsrc: "/images/home.svg", authType: null },
    { name: "Campus Shop", path: "/buy-sell", imgsrc: "/images/cart.svg", authType: null },
    { name: "Timetable", path: "/timetable", imgsrc: "/images/timetable.svg", authType: "profile" },
    { name: "PYQS & Notes", path: "/resources", imgsrc: "/images/book.svg", authType: "profile" }, // ✅ profile required
    { name: "Room", path: "/rooms", imgsrc: "/images/room.svg", authType: null },
    { name: "Attendance", path: "/attendance", imgsrc: "/images/attendance.svg", authType: "profile" },
    { name: "Assignments", path: "/assignments", imgsrc: "/images/assignments.svg", authType: "profile" },
    { name: "Lost & Found", path: "/lostfound", imgsrc: "/images/cart.svg", authType: null }, // ✅ open, post requires login (handled inside page)
    { name: "Feedback", path: "/feedback", imgsrc: "/images/home.svg", authType: "login" },

    ...(user && (user.role === "seller" || user.role === "admin")
      ? [{ name: "Seller Dashboard", path: "/seller", imgsrc: "/images/cart3.svg", authType: null }]
      : []),

    ...(user && user.role === "admin"
      ? [
        { name: "Admin Dashboard", path: "/admin", imgsrc: "/images/cart3.svg", authType: null },
        { name: "Feedback Inbox", path: "/admin/feedback", imgsrc: "/images/feedback.svg", authType: null },
      ]
      : []),
  ];

  const handleNavClick = (e, link) => {
    if (!link.authType) return; // public, allow through

    if (!user) {
      e.preventDefault();
      if (link.authType === "profile") {
        showAuthToast("⚙️ Please setup your profile first — add Branch, Year & Section");
      } else {
        showAuthToast("🔐 Please login first to access this feature");
      }
      return;
    }

    // logged in but profile incomplete
    if (link.authType === "profile" && (!user.branch || !user.year || !user.section)) {
      e.preventDefault();
      showAuthToast("⚙️ Please setup your profile first — add Branch, Year & Section");
    }
  };

  return (
    <div className="overflow-hidden h-screen">
      <Navbar />

      {/* Cart added popup */}
      {showPopup && (
        <div className="fixed bottom-5 right-5 bg-white text-black px-6 py-3 rounded-xl shadow-lg z-50">
          ✅ Added to cart
        </div>
      )}

      {/* Auth message toast */}
      {authMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl border border-zinc-700 max-w-xs text-center">
          {authMsg}
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className="flex flex-col p-2 sm:w-56 w-12 text-md space-y-2 pb-28 bg-gray-100 overflow-y-auto h-screen">
          {allLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={(e) => handleNavClick(e, link)}
              className={({ isActive }) =>
                `p-2 rounded-sm text-black ${isActive ? "bg-blue-200 font-bold" : ""}`
              }
            >
              <div className="flex gap-1 items-center">
                <img className="w-[23px]" src={link.imgsrc} alt="icon" />
                <p className="sm:block hidden">{link.name}</p>
              </div>
            </NavLink>
          ))}
        </div>

        {/* Content */}
        <div className="flex-col w-full hide-scrollbar m-1 mb-8 sm:p-2 md:p-4 bg-white overflow-y-auto h-screen space-y-10 pb-40">
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
  );
}