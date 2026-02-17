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

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showMessage('Please upload JPG, PNG, GIF, or WEBP image', 'error');
      e.target.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showMessage(`Image too large. Max 5MB`, 'error');
      e.target.value = '';
      return;
    }

    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadProfileImage = async () => {
    if (!profileImage) {
      showMessage('Please select an image first', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', profileImage);

    try {
      setUploading(true);
      const res = await api.put('/api/user/me/profile-image', formData);
      updateUser(res.data);
      setImagePreview(res.data.profileImage);
      setProfileImage(null);
      showMessage('Profile picture updated!', 'success');
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to upload', 'error');
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
     const res = await api.put('/api/user/me/profile-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
      updateUser(res.data);
      showMessage("Profile updated!", "success");
    } catch (err) {
      showMessage(err?.response?.data?.message || "Failed to update", "error");
    }
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

      {/* Profile Picture */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
        
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div>
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-blue-200" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                <span className="text-4xl">👤</span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <label className="block cursor-pointer">
              <div className="bg-gray-100 hover:bg-gray-200 border-2 border-dashed rounded-lg p-4 text-center">
                <span className="text-2xl block mb-2">📷</span>
                <span className="text-sm text-gray-600">Click to select profile picture</span>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF • Max 5MB</p>
              </div>
              <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>

            {profileImage && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={uploadProfileImage}
                  disabled={uploading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => {
                    setProfileImage(null);
                    setImagePreview(user?.profileImage || null);
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input name="username" value={form.username} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="4" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400" />
          </div>

          <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}