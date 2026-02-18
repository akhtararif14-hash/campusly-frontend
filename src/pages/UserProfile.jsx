import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If viewing own profile, redirect to /profile
    if (currentUser && currentUser._id === userId) {
      navigate("/profile", { replace: true });
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/api/user/${userId}`),
         api.get(`/api/feed/user/${userId}/posts`),
        ]);
        setProfile(profileRes.data);
        setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, currentUser, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-600 text-lg">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-600 text-lg">User not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
      >
        ← Back
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center border-4 border-blue-200">
              <span className="text-white text-3xl font-bold">
                {profile.name?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
          )}

          {/* Info */}
          <div>
            <h1 className="text-2xl font-bold text-black">{profile.name}</h1>
            {profile.username && (
              <p className="text-gray-500 text-sm">@{profile.username}</p>
            )}
            {profile.description && (
              <p className="text-gray-700 mt-2 text-sm">{profile.description}</p>
            )}
            <p className="text-gray-400 text-xs mt-2">{posts.length} posts</p>
          </div>
        </div>
      </div>

      {/* User's Posts */}
      <h2 className="text-lg font-semibold mb-4 text-black">Posts</h2>

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-gray-500">No posts yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200">
              {/* Post Header */}
              <div className="p-4 flex items-center gap-3">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt={profile.name} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{profile.name?.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-black text-base">{profile.name}</p>
                  <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Post Image */}
              {post.image && (
                <img src={post.image} alt={post.caption || "post"} className="w-full h-auto object-cover" />
              )}

              {/* Caption */}
              {post.caption && (
                <div className="p-4">
                  <p className="text-black">
                    <span className="font-semibold">{profile.name}</span>{" "}{post.caption}
                  </p>
                </div>
              )}

              {/* Likes & Comments count */}
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