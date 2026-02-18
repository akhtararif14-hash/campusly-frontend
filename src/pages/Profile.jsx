import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: "", username: "", description: "", branch: "", year: "", section: "" });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/user/me");
        setForm({
          name: res.data.name || "",
          username: res.data.username || "",
          description: res.data.description || "",
          branch: res.data.branch || "",
          year: res.data.year || "",
          section: res.data.section || "",
        });
        if (res.data.profileImage) setImagePreview(res.data.profileImage);

        if (res.data._id) {
          try {
            const postsRes = await api.get(`/api/feed/user/${res.data._id}/posts`);
            setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
          } catch {
            setPosts([]);
          } finally {
            setPostsLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setPostsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const showMessage = (msg, type = "success") => {
    setMessage({ msg, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showMessage("Please upload JPG, PNG, GIF, or WEBP image", "error");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage("Image too large. Max 5MB", "error");
      e.target.value = "";
      return;
    }
    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadProfileImage = async () => {
    if (!profileImage) return;
    const formData = new FormData();
    formData.append("profileImage", profileImage);
    try {
      setUploading(true);
      const res = await api.put("/api/user/me/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser(res.data);
      setImagePreview(res.data.profileImage);
      setProfileImage(null);
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to upload", "error");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (e) => {
  e.preventDefault();
  try {
    if (profileImage) await uploadProfileImage();
    const res = await api.put("/api/user/me", form);
    console.log("✅ Save response:", res.data); // ← add this
    console.log("✅ Branch in response:", res.data.branch); // ← add this
    updateUser(res.data);
    showMessage("Profile updated!", "success");
    setIsEditing(false);
  } catch (err) {
    showMessage(err?.response?.data?.message || "Failed to update", "error");
  }
};


  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/api/feed/post/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      showMessage("Post deleted!", "success");
    } catch {
      showMessage("Failed to delete post", "error");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setProfileImage(null);
    setImagePreview(user?.profileImage || null);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <button onClick={() => navigate("/")} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg">
          ← Back
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.msg}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-blue-200" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center border-4 border-blue-200">
                  <span className="text-white text-3xl font-bold">{form.name?.charAt(0).toUpperCase() || "?"}</span>
                </div>
              )}
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer shadow-md">
                  <span className="text-sm">📷</span>
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>

            {/* Name & Info */}
            <div>
              <h2 className="text-xl font-bold text-black">{form.name || "Your Name"}</h2>
              {form.username && <p className="text-gray-500 text-sm">@{form.username}</p>}
              {form.description && !isEditing && <p className="text-gray-600 text-sm mt-1">{form.description}</p>}
              {/* Show branch/year/section when not editing */}
              {!isEditing && form.branch && (
                <p className="text-blue-500 text-xs mt-1">
                  {form.branch} • Year {form.year} • Section {form.section}
                </p>
              )}
              <p className="text-gray-400 text-xs mt-1">{posts.length} posts</p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={saveProfile} className="space-y-4 border-t pt-5">
            {profileImage && (
              <p className="text-xs text-blue-600">✅ New photo selected — will upload on save</p>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Branch</label>
              <select
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select Branch</option>
                <option value="CSE">Computer Science (CSE)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="ME">Mechanical (ME)</option>
                <option value="CE">Civil (CE)</option>
                <option value="EE">Electrical (EE)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <select
                name="year"
                value={form.year}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <select
                name="section"
                value={form.section}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select Section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {uploading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* My Posts */}
      <h2 className="text-lg font-semibold mb-4 text-black">My Posts</h2>

      {postsLoading ? (
        <div className="text-center py-10 text-gray-500">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-gray-500">You haven't posted anything yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <img src={imagePreview} alt={form.name} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{form.name?.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-black text-base">{form.name}</p>
                    <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePost(post._id)}
                  className="text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded hover:bg-red-50"
                >
                  🗑️ Delete
                </button>
              </div>

              {post.image && (
                <img src={post.image} alt={post.caption || "post"} className="w-full h-auto object-cover" />
              )}

              {post.caption && (
                <div className="p-4">
                  <p className="text-black whitespace-pre-wrap">
                    <span className="font-semibold">{form.name}</span>{" "}{post.caption}
                  </p>
                </div>
              )}

              <div className="px-4 pb-4 flex gap-4 text-sm text-gray-500">
                <span>❤️ {(post.likes || []).length}</span>
                <span>💬 {(post.comments || []).length}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}