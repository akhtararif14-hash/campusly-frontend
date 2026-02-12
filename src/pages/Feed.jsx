
export default function Feed() {
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

      setPosts([res.data, ...posts]); // Add new post to top
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
    return <div className="p-6">Loading posts...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Create Post
          </button>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create Post</h2>

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
              className="mb-3"
            />

            {preview && (
              <img
                src={preview}
                alt="preview"
                className="w-full h-64 object-cover rounded mb-3"
              />
            )}

            <textarea
              placeholder="Write a caption..."
              value={newPostCaption}
              onChange={(e) => setNewPostCaption(e.target.value)}
              className="border w-full p-2 rounded mb-4 h-20"
            />

            <div className="flex gap-2">
              <button
                onClick={handleCreatePost}
                disabled={creating}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Posting..." : "Post"}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPostImage(null);
                  setNewPostCaption("");
                  setPreview(null);
                }}
                className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">No posts yet. Be the first to post!</p>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow border">
              {/* Post Header */}
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{post.userName}</p>
                  <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                </div>
                {user && post.userId === user._id && (
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>

              {/* Post Image */}
              <img
                src={post.image}
                alt={post.caption}
                className="w-full max-h-96 object-cover"
              />

              {/* Post Actions */}
              <div className="p-4">
                <div className="flex gap-4 mb-2">
                  <button
                    onClick={() => handleLikePost(post._id)}
                    className={`flex items-center gap-1 ${
                      user && post.likes.includes(user._id)
                        ? "text-red-500"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="text-xl">
                      {user && post.likes.includes(user._id) ? "❤️" : "🤍"}
                    </span>
                    <span className="text-sm">{post.likes.length}</span>
                  </button>

                  <button
                    onClick={() =>
                      setShowComments({
                        ...showComments,
                        [post._id]: !showComments[post._id],
                      })
                    }
                    className="flex items-center gap-1 text-gray-700"
                  >
                    <span className="text-xl">💬</span>
                    <span className="text-sm">{post.comments.length}</span>
                  </button>
                </div>

                {/* Caption */}
                {post.caption && (
                  <p className="mb-2">
                    <span className="font-semibold">{post.userName}</span>{" "}
                    {post.caption}
                  </p>
                )}

                {/* Comments Section */}
                {showComments[post._id] && (
                  <div className="mt-3 border-t pt-3">
                    {post.comments.map((comment) => (
                      <div key={comment._id} className="mb-2 text-sm">
                        <span className="font-semibold">{comment.userName}</span>{" "}
                        {comment.text}
                      </div>
                    ))}

                    {/* Add Comment */}
                    {user && (
                      <div className="flex gap-2 mt-2">
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
                          className="flex-1 border rounded px-3 py-1"
                        />
                        <button
                          onClick={() => handleAddComment(post._id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
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
  );
}