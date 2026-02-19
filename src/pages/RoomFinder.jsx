import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const PRESET_FACILITIES = [
  "WiFi", "AC", "Cooler", "Geyser", "Attached Bathroom",
  "Furnished", "Parking", "24/7 Water", "Security", "CCTV",
  "Washing Machine", "Kitchen", "Mess", "Gym", "Power Backup",
];

export default function RoomFinder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("room");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    maxRent: "", minRent: "", facilities: [],
  });

  // Form
  const [form, setForm] = useState({
    title: "", description: "", rent: "",
    location: "", contactName: "", contactPhone: "",
    facilities: [], customFacility: "",
    customFacilities: [], images: [],
  });
  const [previewImages, setPreviewImages] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchListings();
  }, [activeTab]);

  const fetchListings = async (customFilters = null) => {
    try {
      setLoading(true);
      const f = customFilters || filters;
      const params = new URLSearchParams({ type: activeTab });
      if (f.maxRent) params.append("maxRent", f.maxRent);
      if (f.minRent) params.append("minRent", f.minRent);
      if (f.facilities.length > 0) params.append("facilities", f.facilities.join(","));
      const res = await api.get(`/api/rooms?${params}`);
      setListings(res.data);
    } catch (err) {
      showToast("Failed to load listings", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleFacility = (facility, isForm = true) => {
    if (isForm) {
      setForm((prev) => ({
        ...prev,
        facilities: prev.facilities.includes(facility)
          ? prev.facilities.filter((f) => f !== facility)
          : [...prev.facilities, facility],
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        facilities: prev.facilities.includes(facility)
          ? prev.facilities.filter((f) => f !== facility)
          : [...prev.facilities, facility],
      }));
    }
  };

  const addCustomFacility = () => {
    if (!form.customFacility.trim()) return;
    setForm((prev) => ({
      ...prev,
      customFacilities: [...prev.customFacilities, prev.customFacility.trim()],
      customFacility: "",
    }));
  };

  const handleImageSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setPreviewImages(selected.map((f) => URL.createObjectURL(f)));
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!form.title || !form.rent || !form.location) {
      return showToast("Title, rent and location are required", "error");
    }

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("type", activeTab);
    formData.append("rent", form.rent);
    formData.append("location", form.location);
    formData.append("contactName", form.contactName);
    formData.append("contactPhone", form.contactPhone);
    form.facilities.forEach((f) => formData.append("facilities", f));
    form.customFacilities.forEach((f) => formData.append("customFacilities", f));
    files.forEach((f) => formData.append("images", f));

    try {
      setUploading(true);
      const res = await api.post("/api/rooms", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setListings([res.data, ...listings]);
      setShowPost(false);
      setForm({
        title: "", description: "", rent: "", location: "",
        contactName: "", contactPhone: "",
        facilities: [], customFacility: "", customFacilities: [], images: [],
      });
      setPreviewImages([]);
      setFiles([]);
      showToast("Posted successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to post", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await api.delete(`/api/rooms/${id}`);
      setListings((prev) => prev.filter((r) => r._id !== id));
      showToast("Deleted!");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const canPost = activeTab === "roommate" || user?.role === "admin";

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}>{toast.msg}</div>
        )}

        {/* Image Lightbox */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}>
            <img src={selectedImage} alt="preview" className="max-w-full max-h-full rounded-2xl object-contain" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")}
            className="w-10 h-10 bg-zinc-800 hover:bg-amber-500 text-white rounded-xl flex items-center justify-center transition-all font-bold text-lg flex-shrink-0">
            ‹
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Room Finder</h1>
            <p className="text-zinc-500 text-xs">Find rooms & roommates near campus</p>
          </div>
          {canPost && (
            <button onClick={() => setShowPost(!showPost)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
              + Post
            </button>
          )}
        </div>

        {/* Tab Switch */}
        <div className="flex bg-zinc-900 rounded-2xl p-1 mb-4 border border-zinc-800">
          {["room", "roommate"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab
                  ? "bg-amber-500 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}>
              {tab === "room" ? "🏠 Rooms" : "👥 Roommates"}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              showFilters || filters.facilities.length > 0 || filters.maxRent
                ? "bg-amber-500 border-amber-500 text-white"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}>
            ⚙️ Filters
            {(filters.facilities.length > 0 || filters.maxRent) && (
              <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full">
                {filters.facilities.length + (filters.maxRent ? 1 : 0)}
              </span>
            )}
          </button>
          {(filters.facilities.length > 0 || filters.maxRent || filters.minRent) && (
            <button onClick={() => {
              setFilters({ maxRent: "", minRent: "", facilities: [] });
              fetchListings({ maxRent: "", minRent: "", facilities: [] });
            }} className="px-4 py-2 rounded-xl text-sm border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white">
              Clear
            </button>
          )}
          <div className="flex-1" />
          <p className="text-zinc-500 text-sm self-center">{listings.length} listings</p>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
            <p className="text-white font-bold text-sm mb-3">Filter Listings</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-zinc-500 text-xs mb-1 block">Min Rent (₹)</label>
                <input type="number" placeholder="e.g. 2000"
                  value={filters.minRent}
                  onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-zinc-500 text-xs mb-1 block">Max Rent (₹)</label>
                <input type="number" placeholder="e.g. 8000"
                  value={filters.maxRent}
                  onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <label className="text-zinc-500 text-xs mb-2 block">Facilities</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_FACILITIES.map((f) => (
                <button key={f} onClick={() => toggleFacility(f, false)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filters.facilities.includes(f)
                      ? "bg-amber-500 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                  }`}>
                  {f}
                </button>
              ))}
            </div>

            <button onClick={() => { fetchListings(); setShowFilters(false); }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all">
              Apply Filters
            </button>
          </div>
        )}

        {/* Post Form */}
        {showPost && canPost && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
            <h2 className="text-white font-bold mb-4">
              Post {activeTab === "room" ? "a Room" : "Roommate Request"}
            </h2>
            <form onSubmit={handlePost} className="space-y-3">
              <input placeholder="Title *" required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500" />

              <textarea placeholder="Description" value={form.description} rows={2}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 resize-none" />

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₹</span>
                  <input type="number" placeholder="Rent/month *" required value={form.rent}
                    onChange={(e) => setForm({ ...form, rent: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <input placeholder="Location *" required value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Contact Name" value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Phone Number" value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              {/* Facilities */}
              <div>
                <p className="text-zinc-500 text-xs mb-2">Facilities — tap to select</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_FACILITIES.map((f) => (
                    <button key={f} type="button" onClick={() => toggleFacility(f, true)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        form.facilities.includes(f)
                          ? "bg-amber-500 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                      }`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom facilities */}
              <div>
                <p className="text-zinc-500 text-xs mb-2">Add custom facility</p>
                <div className="flex gap-2">
                  <input placeholder="e.g. Swimming Pool"
                    value={form.customFacility}
                    onChange={(e) => setForm({ ...form, customFacility: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomFacility())}
                    className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
                  <button type="button" onClick={addCustomFacility}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
                    Add
                  </button>
                </div>
                {form.customFacilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.customFacilities.map((f, i) => (
                      <span key={i} className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                        {f}
                        <button type="button" onClick={() => setForm((prev) => ({
                          ...prev,
                          customFacilities: prev.customFacilities.filter((_, j) => j !== i)
                        }))} className="text-blue-300 hover:text-white ml-1">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Images */}
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                  previewImages.length > 0 ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-700 hover:border-zinc-600"
                }`}>
                  {previewImages.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto">
                      {previewImages.map((src, i) => (
                        <img key={i} src={src} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <p className="text-zinc-500 text-sm">📷 Click to add photos</p>
                      <p className="text-zinc-600 text-xs mt-1">Up to 5 images</p>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              </label>

              <div className="flex gap-3">
                <button type="submit" disabled={uploading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50 transition-all">
                  {uploading ? "Posting..." : "Post Listing"}
                </button>
                <button type="button" onClick={() => setShowPost(false)}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Listings */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Loading...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <p className="text-4xl mb-3">{activeTab === "room" ? "🏠" : "👥"}</p>
            <p className="text-white font-bold">No {activeTab === "room" ? "Rooms" : "Roommates"} yet</p>
            <p className="text-zinc-500 text-sm mt-1">
              {canPost ? "Be the first to post!" : "Check back later"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div key={listing._id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {/* Images */}
                {listing.images?.length > 0 && (
                  <div className="flex gap-1 overflow-x-auto p-2">
                    {listing.images.map((img, i) => (
                      <img key={i} src={img} alt=""
                        onClick={() => setSelectedImage(img)}
                        className="w-32 h-24 object-cover rounded-xl flex-shrink-0 cursor-pointer hover:opacity-90 transition-all" />
                    ))}
                  </div>
                )}

                <div className="p-4">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-bold">{listing.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          listing.isAvailable
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}>
                          {listing.isAvailable ? "Available" : "Taken"}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-xs mt-0.5">📍 {listing.location}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-amber-400 font-black text-xl">₹{listing.rent.toLocaleString()}</p>
                      <p className="text-zinc-600 text-xs">/month</p>
                    </div>
                  </div>

                  {/* Description */}
                  {listing.description && (
                    <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{listing.description}</p>
                  )}

                  {/* Facilities */}
                  {listing.facilities?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {listing.facilities.map((f, i) => (
                        <span key={i} className="bg-zinc-800 text-zinc-400 text-xs px-2.5 py-1 rounded-full border border-zinc-700">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                    <div className="flex items-center gap-2">
                      {listing.postedBy?.profileImage ? (
                        <img src={listing.postedBy.profileImage} alt=""
                          className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
                          <span className="text-xs text-zinc-400 font-bold">
                            {listing.postedBy?.name?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <p className="text-zinc-500 text-xs">{listing.postedBy?.name}</p>
                    </div>

                    <div className="flex gap-2">
                      {listing.contactPhone && (
                        <a href={`tel:${listing.contactPhone}`}
                          className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-green-500/30 transition-all">
                          📞 Call
                        </a>
                      )}
                      {(user?._id === listing.postedBy?._id?.toString() || user?.role === "admin") && (
                        <button onClick={() => handleDelete(listing._id)}
                          className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-all">
                          Delete
                        </button>
                      )}
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