import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const CATEGORIES = [
  "Electronics", "Books", "Wallet", "Keys", "ID Card",
  "Bag", "Bottle", "Clothes", "Jewellery", "Documents", "Other"
];

const LOCATIONS = [
  "Library", "Canteen", "Classroom", "Lab", "Hostel",
  "Ground", "Parking", "Washroom", "Bus Stop", "Other"
];

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  return `${days}d ago`;
}

export default function LostFound() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]           = useState("lost");   // lost | found | my-posts
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);
  const [showPost, setShowPost] = useState(false);
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles]       = useState([]);
  const [previews, setPreviews] = useState([]);

  // filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [search, setSearch]                 = useState("");

  // form
  const [form, setForm] = useState({
    type: "lost", title: "", description: "",
    category: "", location: "", date: "",
    contactInfo: "", reward: "",
  });

  useEffect(() => { fetchItems(); }, [tab, filterCategory, filterLocation]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      let url = "/api/lostfound";
      const params = new URLSearchParams();
      if (tab === "my-posts") params.append("mine", "true");
      else params.append("type", tab);
      if (filterCategory) params.append("category", filterCategory);
      if (filterLocation) params.append("location", filterLocation);
      const res = await api.get(`${url}?${params}`);
      setItems(res.data);
    } catch { showToast("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.location)
      return showToast("Fill all required fields", "error");

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    files.forEach(f => fd.append("images", f));

    try {
      setUploading(true);
      const res = await api.post("/api/lostfound", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setItems(p => [res.data, ...p]);
      setShowPost(false);
      setForm({ type: "lost", title: "", description: "", category: "", location: "", date: "", contactInfo: "", reward: "" });
      setFiles([]); setPreviews([]);
      showToast(form.type === "lost" ? "Lost item posted!" : "Found item posted!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed", "error");
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/api/lostfound/${id}`);
      setItems(p => p.filter(i => i._id !== id));
      setSelected(null);
      showToast("Deleted!");
    } catch { showToast("Failed", "error"); }
  };

  const markResolved = async (id) => {
    try {
      await api.patch(`/api/lostfound/${id}/resolve`);
      setItems(p => p.map(i => i._id === id ? { ...i, resolved: true } : i));
      setSelected(s => s ? { ...s, resolved: true } : s);
      showToast("Marked as resolved! 🎉");
    } catch { showToast("Failed", "error"); }
  };

  const handleImageSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
  };

  const filtered = items.filter(i =>
    !search ||
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.description?.toLowerCase().includes(search.toLowerCase())
  );

  const isOwner = (item) =>
    item.postedBy?._id === user?._id || item.postedBy === user?._id;

  if (!user) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center max-w-sm w-full">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-white mb-4">Login Required</h2>
        <button onClick={() => navigate("/login")} className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold">Login →</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-xl ${
          toast.type === "error" ? "bg-red-500" : "bg-emerald-500"
        }`}>{toast.msg}</div>
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                      selected.type === "lost"
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    }`}>
                      {selected.type === "lost" ? "😢 LOST" : "✅ FOUND"}
                    </span>
                    {selected.resolved && (
                      <span className="bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
                        ✓ Resolved
                      </span>
                    )}
                    {selected.reward && (
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
                        🎁 ₹{selected.reward} Reward
                      </span>
                    )}
                  </div>
                  <h2 className="text-white font-black text-xl">{selected.title}</h2>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white flex-shrink-0">✕</button>
              </div>

              {/* Images */}
              {selected.images?.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {selected.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="w-32 h-28 object-cover rounded-xl flex-shrink-0" />
                  ))}
                </div>
              )}

              {selected.description && (
                <p className="text-zinc-400 text-sm mb-4">{selected.description}</p>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-zinc-800 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs mb-1">Category</p>
                  <p className="text-white text-sm font-semibold">{selected.category}</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs mb-1">Location</p>
                  <p className="text-white text-sm font-semibold">📍 {selected.location}</p>
                </div>
                {selected.date && (
                  <div className="bg-zinc-800 rounded-xl p-3">
                    <p className="text-zinc-500 text-xs mb-1">
                      {selected.type === "lost" ? "Lost on" : "Found on"}
                    </p>
                    <p className="text-white text-sm font-semibold">
                      {new Date(selected.date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div className="bg-zinc-800 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs mb-1">Posted</p>
                  <p className="text-white text-sm font-semibold">{timeAgo(selected.createdAt)}</p>
                </div>
              </div>

              {/* Contact info */}
              {selected.contactInfo && (
                <div className="bg-zinc-800 rounded-xl p-3 mb-4">
                  <p className="text-zinc-500 text-xs mb-1">Contact</p>
                  <p className="text-white text-sm">{selected.contactInfo}</p>
                </div>
              )}

              {/* Posted by */}
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-zinc-800">
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                  {selected.postedBy?.name?.charAt(0)}
                </div>
                <p className="text-zinc-500 text-xs">
                  Posted by <span className="text-zinc-300 font-semibold">{selected.postedBy?.name}</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {/* Message button — for non-owners */}
                {!isOwner(selected) && (
                  <button
                    onClick={() => navigate(`/Chat/${selected.postedBy?._id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-bold text-sm transition-all">
                    💬 Message {selected.postedBy?.name}
                  </button>
                )}

                {/* Owner actions */}
                {isOwner(selected) && !selected.resolved && (
                  <button onClick={() => markResolved(selected._id)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm transition-all">
                    ✅ Mark as Resolved
                  </button>
                )}
                {isOwner(selected) && (
                  <button onClick={() => handleDelete(selected._id)}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 rounded-xl font-bold text-sm transition-all">
                    🗑 Delete Post
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Post Modal ── */}
      {showPost && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h2 className="text-white font-black text-lg mb-4">Post Item</h2>

              {/* Lost / Found toggle */}
              <div className="flex bg-zinc-800 rounded-xl p-1 mb-4">
                {["lost", "found"].map(t => (
                  <button key={t} onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      form.type === t
                        ? t === "lost"
                          ? "bg-red-500 text-white"
                          : "bg-emerald-500 text-white"
                        : "text-zinc-400"
                    }`}>
                    {t === "lost" ? "😢 I Lost Something" : "✅ I Found Something"}
                  </button>
                ))}
              </div>

              <form onSubmit={handlePost} className="space-y-3">
                <input placeholder="Item name *" required value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500" />

                <textarea placeholder="Description — color, brand, any identifying details..." rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 resize-none" />

                <div className="grid grid-cols-2 gap-3">
                  <select required value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500">
                    <option value="">Category *</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select required value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500">
                    <option value="">Location *</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input type="date" value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500" />
                    <p className="text-zinc-600 text-xs mt-0.5">
                      {form.type === "lost" ? "Date lost" : "Date found"}
                    </p>
                  </div>
                  {form.type === "lost" && (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₹</span>
                      <input type="number" placeholder="Reward (optional)" value={form.reward}
                        onChange={e => setForm({ ...form, reward: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:border-rose-500" />
                    </div>
                  )}
                </div>

                <input placeholder="Contact info (phone/email)" value={form.contactInfo}
                  onChange={e => setForm({ ...form, contactInfo: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500" />

                {/* Image upload */}
                <label className="block cursor-pointer">
                  <div className={`border-2 border-dashed rounded-xl p-4 transition-all ${
                    previews.length > 0 ? "border-rose-500/50 bg-rose-500/5" : "border-zinc-700 hover:border-zinc-600"
                  }`}>
                    {previews.length > 0 ? (
                      <div className="flex gap-2 overflow-x-auto">
                        {previews.map((src, i) => (
                          <img key={i} src={src} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                        ))}
                      </div>
                    ) : (
                      <>
                        <p className="text-zinc-500 text-sm text-center">📷 Add photos (optional)</p>
                        <p className="text-zinc-600 text-xs text-center mt-1">Helps people identify the item</p>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                </label>

                <div className="flex gap-3">
                  <button type="submit" disabled={uploading}
                    className={`flex-1 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all ${
                      form.type === "lost" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
                    }`}>
                    {uploading ? "Posting..." : `Post ${form.type === "lost" ? "Lost" : "Found"} Item`}
                  </button>
                  <button type="button" onClick={() => { setShowPost(false); setFiles([]); setPreviews([]); }}
                    className="px-6 py-3 bg-zinc-800 text-white rounded-xl text-sm">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/")}
            className="w-10 h-10 bg-zinc-800 hover:bg-rose-500 text-white rounded-xl flex items-center justify-center font-bold text-lg transition-all flex-shrink-0">
            ‹
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Lost & Found</h1>
            <p className="text-zinc-500 text-xs">Help reunite people with their stuff</p>
          </div>
          <button onClick={() => setShowPost(true)}
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
            + Post
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-900 rounded-2xl p-1 mb-4 border border-zinc-800">
          {[
            { key: "lost",     label: "😢 Lost",     color: "bg-red-500" },
            { key: "found",    label: "✅ Found",    color: "bg-emerald-500" },
            { key: "my-posts", label: "📋 My Posts", color: "bg-zinc-600" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === t.key ? `${t.color} text-white` : "text-zinc-400 hover:text-white"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="space-y-2 mb-4">
          <input placeholder="🔍 Search items..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500" />
          <div className="flex gap-2">
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500">
              <option value="">All Locations</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {(filterCategory || filterLocation || search) && (
              <button onClick={() => { setFilterCategory(""); setFilterLocation(""); setSearch(""); }}
                className="bg-zinc-800 text-zinc-400 hover:text-white px-3 py-2 rounded-xl text-xs transition-all">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        {tab !== "my-posts" && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-red-400 font-black text-xl">{items.filter(i => i.type === "lost" && !i.resolved).length}</p>
              <p className="text-red-400/70 text-xs">Still Lost</p>
            </div>
            <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-emerald-400 font-black text-xl">{items.filter(i => i.type === "found" && !i.resolved).length}</p>
              <p className="text-emerald-400/70 text-xs">Found Items</p>
            </div>
            <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-center">
              <p className="text-white font-black text-xl">{items.filter(i => i.resolved).length}</p>
              <p className="text-zinc-500 text-xs">Reunited</p>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <p className="text-5xl mb-3">{tab === "lost" ? "😢" : tab === "found" ? "✅" : "📋"}</p>
            <p className="text-white font-bold">
              {tab === "lost" ? "No lost items posted" : tab === "found" ? "No found items posted" : "You haven't posted anything"}
            </p>
            <p className="text-zinc-500 text-sm mt-1">Be the first to post!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map(item => (
              <div key={item._id}
                onClick={() => setSelected(item)}
                className={`bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.99] hover:border-zinc-700 ${
                  item.resolved ? "opacity-50 border border-zinc-800" : "border border-zinc-800"
                }`}>

                <div className="flex gap-0">
                  {/* Image */}
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt=""
                      className="w-24 h-full object-cover flex-shrink-0 min-h-[96px]" />
                  ) : (
                    <div className={`w-20 flex-shrink-0 flex items-center justify-center text-3xl ${
                      item.type === "lost" ? "bg-red-950/50" : "bg-emerald-950/50"
                    }`}>
                      {item.category === "Electronics" ? "📱"
                        : item.category === "Books" ? "📚"
                        : item.category === "Wallet" ? "👛"
                        : item.category === "Keys" ? "🔑"
                        : item.category === "ID Card" ? "🪪"
                        : item.category === "Bag" ? "🎒"
                        : item.category === "Bottle" ? "🍶"
                        : "📦"}
                    </div>
                  )}

                  <div className="flex-1 p-3 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                        item.type === "lost"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}>
                        {item.type === "lost" ? "LOST" : "FOUND"}
                      </span>
                      {item.reward && (
                        <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                          🎁 ₹{item.reward}
                        </span>
                      )}
                      {item.resolved && (
                        <span className="bg-zinc-600/20 text-zinc-400 text-xs px-2 py-0.5 rounded-full">✓ Resolved</span>
                      )}
                    </div>

                    <p className="text-white font-bold text-sm line-clamp-1">{item.title}</p>
                    <p className="text-zinc-500 text-xs line-clamp-1 mt-0.5">{item.description}</p>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-zinc-600 text-xs">📍 {item.location}</span>
                      <span className="text-zinc-600 text-xs">{item.category}</span>
                      <span className="text-zinc-700 text-xs ml-auto">{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}