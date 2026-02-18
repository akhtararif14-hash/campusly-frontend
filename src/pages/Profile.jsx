import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: "", username: "", description: "" });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
        });
        if (res.data.profileImage) {
          setImagePreview(res.data.profileImage);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
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

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
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
      showMessage("Profile picture updated!", "success");
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to upload", "error");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      // upload image if changed
      if (profileImage) {
        await uploadProfileImage();
      }
      const res = await api.put("/api/user/me", form);
      updateUser(res.data);
      showMessage("Profile updated!", "success");
      setIsEditing(false);
    } catch (err) {
      showMessage(err?.response?.data?.message || "Failed to update", "error");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setProfileImage(null);
    setImagePreview(user?.profileImage || null);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <button onClick={() => navigate("/")} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg">
          ← Back
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {message.msg}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-md">
        {/* Profile Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center border-4 border-blue-200">
                  <span className="text-white text-3xl font-bold">
                    {form.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              )}

              {/* Camera icon overlay when editing */}
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer shadow-md">
                  <span className="text-sm">📷</span>
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>

            {/* Name & username */}
            <div>
              <h2 className="text-xl font-bold text-black">{form.name || "Your Name"}</h2>
              {form.username && <p className="text-gray-500 text-sm">@{form.username}</p>}
              {form.description && !isEditing && (
                <p className="text-gray-600 text-sm mt-1">{form.description}</p>
              )}
            </div>
          </div>

          {/* Edit button */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* Edit Form — only shown when editing */}
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
    </div>
  );
}