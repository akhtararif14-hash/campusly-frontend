import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostCaption, setNewPostCaption] = useState("");
  const [preview, setPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get("/api/feed/posts");
        setPosts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("❌ Error fetching posts:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleProfileClick = (post) => {
    const postUserId = post.userId?._id || post.userId;
    if (!postUserId) return;
    if (user && postUserId.toString() === user._id.toString()) {
      navigate("/profile");
    } else {
      navigate(`/user/${postUserId}`);
    }
  };

  const handleCreatePost = async () => {
    const hasCaption = newPostCaption.trim() !== "";
    const hasImage = !!newPostImage;
    if (!hasCaption && !hasImage) {
      alert("Please write something or select a photo");
      return;
    }
    const formData = new FormData();
    if (hasImage) formData.append("image", newPostImage);
    if (hasCaption) formData.append("caption", newPostCaption);
    try {
      setCreating(true);
      const res = await api.post("/api/feed/post", formData);
      setPosts([res.data, ...posts]);
      setNewPostImage(null);
      setNewPostCaption("");
      setPreview(null);
    } catch (err) {
      console.error("Error creating post:", err);
      alert(err.response?.data?.message || "Failed to create post");
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/api/feed/post/${postId}`);
      setPosts(posts.filter((p) => p._id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post");
    }
  };

  const handleLikePost = async (postId) => {
    if (!user) { alert("Please login to like posts"); return; }
    try {
      const res = await api.post(`/api/feed/post/${postId}/like`);
      setPosts(
        posts.map((p) =>
          p._id === postId
            ? {
                ...p,
                likes: res.data.liked
                  ? [...(p.likes || []), user._id]
                  : (p.likes || []).filter((id) => id !== user._id),
              }
            : p
        )
      );
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    if (!user) { alert("Please login to comment"); return; }
    try {
      const res = await api.post(`/api/feed/post/${postId}/comment`, { text });
      setPosts(
        posts.map((p) =>
          p._id === postId
            ? { ...p, comments: [...(p.comments || []), res.data] }
            : p
        )
      );
      setCommentText({ ...commentText, [postId]: "" });
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment");
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return postDate.toLocaleDateString();
  };

  // ✅ FIXED: checks all possible locations for profileImage
  const getPostProfileImage = (post) => {
    // If userId is a populated object with profileImage
    if (typeof post.userId === "object" && post.userId?.profileImage) {
      return post.userId.profileImage;
    }
    // If it's the current user's post, use their profileImage from context
    const postUserId = post.userId?._id || post.userId;
    if (user && postUserId?.toString() === user._id?.toString() && user.profileImage) {
      return user.profileImage;
    }
    return null;
  };

  // ✅ FIXED: checks all possible locations for name
  const getPostName = (post) => {
    if (typeof post.userId === "object" && post.userId?.name) {
      return post.userId.name;
    }
    return post.userName || "Unknown";
  };

  const renderAvatar = (post, sizeClass = "w-10 h-10") => {
    const profileImage = getPostProfileImage(post);
    const name = getPostName(post);

    if (profileImage) {
      return (
        <img
          src={profileImage}
          alt={name}
          className={`${sizeClass} rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity`}
        />
      );
    }

    return (
      <div className={`${sizeClass} rounded-full bg-blue-500 flex items-center justify-center border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity`}>
        <span className="text-white font-semibold text-sm">
          {(name || "?").charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-600 text-lg">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-14">
      {/* Create Post */}
      {user && (
        <div className="bg-gray-100 p-4 rounded-2xl shadow-sm">
          <div className="flex gap-3 items-start">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 flex-shrink-0 mt-1"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-semibold text-sm">
                  {user.name?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
            )}

            <div className="flex-1 flex flex-col gap-2">
              {/* ✅ CHANGED: input → textarea, removed onKeyPress */}
              <textarea
                placeholder="What's on your mind?"
                value={newPostCaption}
                onChange={(e) => setNewPostCaption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) handleCreatePost();
                }}
                rows={2}
                className="w-full bg-white border border-gray-300 outline-none px-4 py-3 rounded-2xl text-black focus:ring-2 focus:ring-blue-400 resize-none"
              />

              <div className="flex gap-2 justify-end">
                <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-black text-sm px-4 py-2 rounded-full transition-colors">
                  📷 Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewPostImage(file);
                        setPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleCreatePost}
                  disabled={creating || (!newPostCaption.trim() && !newPostImage)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {creating ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>

          {preview && (
            <div className="mt-4 flex items-center gap-4 p-3 bg-white rounded-xl">
              <img src={preview} alt="preview" className="w-24 h-24 object-cover rounded-lg" />
              <button
                onClick={() => { setNewPostImage(null); setPreview(null); }}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                ✕ Remove
              </button>
            </div>
          )}
        </div>
      )}

      {!user && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-center">
          <p className="text-blue-800">Please login to create posts and interact</p>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <p className="text-gray-500 text-lg mb-2">No posts yet</p>
            <p className="text-gray-400 text-sm">Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200">

              {/* Post Header */}
              <div className="p-4 flex justify-between items-center">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => handleProfileClick(post)}
                >
                  {renderAvatar(post, "w-10 h-10")}
                  <div>
                    <p className="font-semibold text-black text-base leading-tight hover:underline">
                      {getPostName(post)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                  </div>
                </div>

                {user && (post.userId?._id || post.userId)?.toString() === user._id?.toString() && (
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>

              {/* Post Image */}
              {post.image && (
                <img
                  src={post.image}
                  alt={post.caption || "Post image"}
                  className="w-full h-auto object-cover"
                />
              )}

              {/* Caption + Actions */}
              <div className="p-4">
                {post.caption && (
                  <p className="mb-3 text-black whitespace-pre-wrap">
                    <span className="font-semibold">{getPostName(post)}</span>{" "}{post.caption}
                  </p>
                )}

                <div className="flex gap-4 mb-3">
                  <button
                    onClick={() => handleLikePost(post._id)}
                    disabled={!user}
                    className={`flex items-center gap-2 transition-colors ${
                      user && (post.likes || []).includes(user._id)
                        ? "text-red-500"
                        : "text-gray-700 hover:text-red-500"
                    } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span className="text-2xl">
                      {user && (post.likes || []).includes(user._id) ? "❤️" : "🤍"}
                    </span>
                    <span className="text-sm font-medium">{(post.likes || []).length}</span>
                  </button>

                  <button
                    onClick={() => setShowComments({ ...showComments, [post._id]: !showComments[post._id] })}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-500 transition-colors"
                  >
                    <span className="text-2xl">💬</span>
                    <span className="text-sm font-medium">{(post.comments || []).length}</span>
                  </button>
                </div>

                {showComments[post._id] && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {post.comments && post.comments.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        {post.comments.map((comment) => (
                          <div key={comment._id} className="text-sm text-black">
                            <span className="font-semibold">{comment.userName}</span>{" "}{comment.text}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mb-4">No comments yet</p>
                    )}

                    {user ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentText[post._id] || ""}
                          onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                          onKeyPress={(e) => { if (e.key === "Enter") handleAddComment(post._id); }}
                          className="flex-1 bg-gray-50 border border-gray-300 outline-none rounded-full px-4 py-2 text-black focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                          onClick={() => handleAddComment(post._id)}
                          className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center">Login to comment</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardHome;