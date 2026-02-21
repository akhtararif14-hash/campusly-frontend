import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Navbar from "../pages/Navbar.jsx";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      return [];
    }
  });

  const [showPopup, setShowPopup] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {}
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

  // ── All sidebar links ──────────────────────────────────────────────────────
  // requiresAuth: true  → show to everyone, but clicking redirects to login if not logged in
  // requiresAuth: false → fully public
  const allLinks = [
    { name: "Home",           path: "/",            imgsrc: "/images/home.svg",        requiresAuth: false },
    { name: "Campus Shop",    path: "/buy-sell",     imgsrc: "/images/cart.svg",        requiresAuth: false },
    { name: "Timetable",      path: "/timetable",    imgsrc: "/images/timetable.svg",   requiresAuth: true  },
    { name: "PYQS & Notes",   path: "/resources",    imgsrc: "/images/book.svg",        requiresAuth: false },
    { name: "Room",           path: "/rooms",        imgsrc: "/images/room.svg",        requiresAuth: false },
    { name: "Attendance",     path: "/attendance",   imgsrc: "/images/attendance.svg",  requiresAuth: true  },
    { name: "Assignments",    path: "/assignments",  imgsrc: "/images/assignments.svg", requiresAuth: true  },
    { name: "Lost & Found",   path: "/lostfound",    imgsrc: "/images/lost.png",        requiresAuth: true  },
    { name: "Feedback",       path: "/feedback",     imgsrc: "/images/feedback.svg",    requiresAuth: true  },

    // seller & admin
    ...(user && (user.role === "seller" || user.role === "admin")
      ? [{ name: "Seller Dashboard", path: "/seller", imgsrc: "/images/cart3.svg", requiresAuth: true }]
      : []),

    // admin only
    ...(user && user.role === "admin"
      ? [
          { name: "Admin Dashboard", path: "/admin",          imgsrc: "/images/cart3.svg",   requiresAuth: true },
          { name: "Feedback Inbox",  path: "/admin/feedback", imgsrc: "/images/feedback.svg", requiresAuth: true },
        ]
      : []),
  ];

  const handleNavClick = (e, link) => {
    if (link.requiresAuth && !user) {
      e.preventDefault();
      navigate("/login");
    }
  };

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
        <div className="flex flex-col p-2 sm:w-56 w-12 text-md space-y-2 pb-28 bg-gray-100 overflow-y-auto h-screen">
          {allLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={(e) => handleNavClick(e, link)}
              className={({ isActive }) =>
                `p-2 rounded-sm text-black relative ${isActive ? "bg-blue-200 font-bold" : ""}`
              }
            >
              <div className="flex gap-1 items-center">
                <div className="relative flex-shrink-0">
                  <img className="w-[23px]" src={link.imgsrc} alt="icon" />
                  {/* 🔒 lock badge for auth-required links when not logged in */}
                  {link.requiresAuth && !user && (
                    <span className="absolute -top-1 -right-1 text-[8px] bg-gray-400 text-white rounded-full w-3 h-3 flex items-center justify-center leading-none">
                      🔒
                    </span>
                  )}
                </div>
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