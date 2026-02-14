import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const DashboardHome = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostCaption, setNewPostCaption] = useState("");
  const [preview, setPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});

  // Fetch all posts
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get("/api/feed/posts");
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Create new post
  const handleCreatePost = async () => {
    if (!newPostImage) {
      alert("Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("image", newPostImage);
    formData.append("caption", newPostCaption);

    try {
      setCreating(true);
      const res = await api.post("/api/feed/post", formData);

      setPosts([res.data, ...posts]);
      setShowCreateModal(false);
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

  // Delete post
  const handleDeletePost = async (postId) => {
    if (!confirm("Delete this post?")) return;

    try {
      await api.delete(`/api/feed/post/${postId}`);
      setPosts(posts.filter((p) => p._id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post");
    }
  };

  // Like/Unlike post
  const handleLikePost = async (postId) => {
    if (!user) {
      alert("Please login to like posts");
      return;
    }

    try {
      const res = await api.post(`/api/feed/post/${postId}/like`);

      setPosts(
        posts.map((p) =>
          p._id === postId
            ? { ...p, likes: res.data.liked ? [...p.likes, user._id] : p.likes.filter((id) => id !== user._id) }
            : p
        )
      );
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  // Add comment
  const handleAddComment = async (postId) => {
    const text = commentText[postId]?.trim();
    if (!text) return;

    if (!user) {
      alert("Please login to comment");
      return;
    }

    try {
      const res = await api.post(`/api/feed/post/${postId}/comment`, { text });

      setPosts(
        posts.map((p) =>
          p._id === postId ? { ...p, comments: [...p.comments, res.data] } : p
        )
      );

      setCommentText({ ...commentText, [postId]: "" });
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment");
    }
  };

  // Format date
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

  if (loading) {
    return <div className="p-6 text-gray-600">Loading posts...</div>;
  }

  return (
    <div className="space-y-3  scroll-auto pb-14">

      <div className=" relative bg-gray-100 whitespace-nowrap p-4 rounded-sm  text-white px-4 py-3 flex gap-4">


        <input type="text"

          placeholder="What's on your mind?"
          value={newPostCaption}
          onChange={(e) => setNewPostCaption(e.target.value)}
          className="bg-white border-gray-300 border-1 outline-none pl-2 text-black w-full py-3 rounded-4xl  " />
        <label className=" text-black text-sm px-2 py-1 absolute top-5.5 right-34 rounded-4xl bg-gray-200 ">
          Upload Image
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
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
          disabled={creating}
          className=" text-black px-4 py-2 rounded-4xl bg-blue-400 hover:bg-blue-600 transition-colors"
        >
          {creating ? "Posting..." : "Add Post"}
        </button>



      </div>
      <div className=" mb-14 p-4 min-h-[100vh] rounded-4xl text-white h-[80vh] flex items-center gap-4">
      </div>


      {/* Feed Container */}
      <div className="p-4 rounded-4xl bg-white min-h-[100vh] h-[80vh] overflow-y-auto">

        {/* Create Post Section */}
        {user && (
          <div className="relative bg-gray-100 p-4 rounded-sm mb-6">
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="What's on your mind?"
                value={newPostCaption}
                onChange={(e) => setNewPostCaption(e.target.value)}
                className="bg-white border-gray-300 border-1 outline-none pl-4 text-black flex-1 py-3 rounded-4xl"
              />
              <label className=" text-black text-sm px-2 py-1 absolute top-5.5 right-34 rounded-4xl bg-gray-200 ">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
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
                disabled={creating}
                className=" text-black px-4 py-2 rounded-4xl bg-blue-400 hover:bg-blue-600 transition-colors"
              >
                {creating ? "Posting..." : "Add Post"}
              </button>
            </div>

            {/* Image Preview */}
            {preview && (
              <div className="mt-4 flex items-center gap-4">
                <img
                  src={preview}
                  alt="preview"
                  className="w-32 h-32 object-cover rounded-4xl"
                />
                <button
                  onClick={() => {
                    setNewPostImage(null);
                    setPreview(null);
                  }}
                  className="text-black px-3 py-1 rounded-4xl bg-gray-200 hover:bg-gray-300 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No posts yet. Be the first to post!</p>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="bg-gray-100 rounded-4xl overflow-hidden">
                {/* Post Header */}
                <div className="p-4 flex justify-between items-center bg-white">
                  <div>
                    <p className="font-semibold text-black">{post.userName}</p>
                    <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                  </div>
                  {user && post.userId === user._id && (
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="text-black px-3 py-1 rounded-4xl bg-gray-200 hover:bg-red-100 hover:text-red-600 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {/* Post Image */}
                <div className="bg-gray-100 p-4">
                  <img
                    src={post.image}
                    alt={post.caption}
                    className="w-full max-w-2xl h-auto object-cover rounded-4xl mx-auto"
                  />
                </div>

                {/* Post Actions */}
                <div className="p-4 bg-white">
                  <div className="flex gap-4 mb-3">
                    <button
                      onClick={() => handleLikePost(post._id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-4xl transition-colors ${user && post.likes.includes(user._id)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      <span className="text-xl">
                        {user && post.likes.includes(user._id) ? "❤️" : "🤍"}
                      </span>
                      <span className="text-sm font-medium">{post.likes.length}</span>
                    </button>

                    <button
                      onClick={() =>
                        setShowComments({
                          ...showComments,
                          [post._id]: !showComments[post._id],
                        })
                      }
                      className="flex items-center gap-2 px-4 py-2 rounded-4xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <span className="text-xl">💬</span>
                      <span className="text-sm font-medium">{post.comments.length}</span>
                    </button>
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <p className="mb-3 text-black">
                      <span className="font-semibold">{post.userName}</span>{" "}
                      {post.caption}
                    </p>
                  )}

                  {/* Comments Section */}
                  {showComments[post._id] && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-2 mb-4">
                        {post.comments.map((comment) => (
                          <div key={comment._id} className="text-sm text-black bg-gray-50 p-3 rounded-4xl">
                            <span className="font-semibold">{comment.userName}</span>{" "}
                            {comment.text}
                          </div>
                        ))}
                      </div>

                      {/* Add Comment */}
                      {user && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentText[post._id] || ""}
                            onChange={(e) =>
                              setCommentText({
                                ...commentText,
                                [post._id]: e.target.value,
                              })
                            }
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleAddComment(post._id);
                              }
                            }}
                            className="flex-1 bg-white border-gray-300 border-1 outline-none rounded-4xl px-4 py-2 text-black"
                          />
                          <button
                            onClick={() => handleAddComment(post._id)}
                            className="bg-blue-400 text-white px-6 py-2 rounded-4xl hover:bg-blue-600 transition-colors"
                          >
                            Post
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;