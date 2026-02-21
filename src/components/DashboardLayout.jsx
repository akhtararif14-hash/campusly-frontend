import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Navbar from "../pages/Navbar.jsx";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const { user } = useAuth();

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      return [];
    }
  });
  
  const [showPopup, setShowPopup] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [cart]);

  const getItemId = (item) => item._id || item.id;

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  const addToCart = (product) => {
    if (!product.sellerId) {
      console.error("Product missing sellerId:", product);
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

      return [
        ...prev,
        {
          _id: product._id,
          title: product.title,
          price: product.price,
          image: product.image,
          quantity: 1,
          sellerId: product.sellerId,
        },
      ];
    });

    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        getItemId(item) === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          getItemId(item) === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // ✅ Links shown to everyone (no login required)
  const publicLinks = [
    { name: "Home",        path: "/",           imgsrc: "/images/home.svg" },
    { name: "Campus Shop", path: "/buy-sell",   imgsrc: "/images/cart.svg" },
    { name: "Timetable",   path: "/timetable",  imgsrc: "/images/timetable.svg" },
    { name: "PYQS & Notes",path: "/resources",  imgsrc: "/images/book.svg" },
    { name: "Room",        path: "/rooms",      imgsrc: "/images/room.svg" },
  ];

  // ✅ Links shown only when logged in
  const privateLinks = user ? [
    { name: "Attendance",  path: "/attendance",  imgsrc: "/images/attendance.svg" },
    { name: "Assignments", path: "/assignments", imgsrc: "/images/assignments.svg" },
    { name: "Lost & Found",path: "/lost-found",  imgsrc: "/images/lost.png" },
    { name: "Feedback",    path: "/feedback",    imgsrc: "/images/feedback.svg" }, // ✅ only logged in users
  ] : [];

  // ✅ Role-based links
  const roleLinks = [
    ...(user && (user.role === "seller" || user.role === "admin")
      ? [{ name: "Seller Dashboard", path: "/seller", imgsrc: "/images/cart3.svg" }]
      : []),
    ...(user && user.role === "admin"
      ? [
          { name: "Admin Dashboard", path: "/admin",           imgsrc: "/images/cart3.svg" },
          { name: "Feedback Inbox",  path: "/admin/feedback",  imgsrc: "/images/feedback.svg" },
        ]
      : []),
  ];

  const sidebarLinks = [...publicLinks, ...privateLinks, ...roleLinks];

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
          {sidebarLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `p-2 rounded-sm text-black ${isActive ? "bg-blue-200 font-bold" : ""}`
              }
            >
              <div className="flex gap-1 items-center">
                <img className="w-[23px]" src={item.imgsrc} alt="icon" />
                <p className="sm:block hidden">{item.name}</p>
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