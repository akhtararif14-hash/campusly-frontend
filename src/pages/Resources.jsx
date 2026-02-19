import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Resources() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("notes");
  const [activeSubject, setActiveSubject] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    title: "", description: "", type: "notes",
    branch: "", year: "", section: "all", subject: "",
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!user?.branch || !user?.year) { setLoading(false); return; }
    fetchResources();
  }, [user, activeTab]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/resources/my?type=${activeTab}`);
      setResources(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return showToast("Please select a file", "error");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("type", activeTab);
    formData.append("branch", form.branch || user.branch);
    formData.append("year", form.year || user.year);
    formData.append("section", form.section);
    formData.append("subject", form.subject);

    try {
      setUploading(true);
      const res = await api.post("/api/resources", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResources([res.data, ...resources]);
      setShowUpload(false);
      setForm({ title: "", description: "", type: "notes", branch: "", year: "", section: "all", subject: "" });
      setFile(null);
      showToast("Uploaded successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to upload", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      await api.delete(`/api/resources/${id}`);
      setResources(resources.filter((r) => r._id !== id));
      showToast("Deleted!");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const subjects = ["all", ...new Set(resources.map((r) => r.subject))];
  const filtered = activeSubject === "all"
    ? resources
    : resources.filter((r) => r.subject === activeSubject);

  if (!user?.branch || !user?.year) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8">
          <p className="text-4xl mb-4">📚</p>
          <h2 className="text-xl font-bold mb-2">Setup Your Profile First</h2>
          <p className="text-gray-600 mb-6">Add your Branch and Year in your profile to see resources.</p>
          <button onClick={() => navigate("/profile")} className="bg-blue-500 text-white px-6 py-3 rounded-full">
            Go to Profile →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Resources</h1>
          <p className="text-xs text-gray-500">{user.branch} • Year {user.year} • Section {user.section}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            + Upload
          </button>
          <button onClick={() => navigate("/")} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm">
            ← Back
          </button>
        </div>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="bg-white rounded-2xl shadow-md p-5 mb-6 border border-gray-100">
          <h2 className="font-semibold text-black mb-4">Upload Resource</h2>
          <form onSubmit={handleUpload} className="space-y-3">
            <input
              placeholder="Title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
            />
            <input
              placeholder="Subject *"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
              className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 resize-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.branch || user.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
              >
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
                <option value="EE">EE</option>
              </select>

              <select
                value={form.year || user.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <select
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>

            {/* File Upload */}
            <label className="block cursor-pointer">
              <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                file ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-300"
              }`}>
                {file ? (
                  <p className="text-blue-600 text-sm font-medium">📄 {file.name}</p>
                ) : (
                  <>
                    <p className="text-gray-500 text-sm">Click to select PDF or image</p>
                    <p className="text-gray-400 text-xs mt-1">PDF, JPG, PNG supported</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0])}
                className="hidden"
              />
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Switch */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
            activeTab === "notes" ? "bg-white shadow text-blue-600" : "text-gray-500"
          }`}
        >
          📝 Notes
        </button>
        <button
          onClick={() => setActiveTab("pyq")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
            activeTab === "pyq" ? "bg-white shadow text-blue-600" : "text-gray-500"
          }`}
        >
          📋 PYQ
        </button>
      </div>

      {/* Subject Filter */}
      {subjects.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition ${
                activeSubject === subject
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {subject === "all" ? "All Subjects" : subject}
            </button>
          ))}
        </div>
      )}

      {/* Resources List */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-4xl mb-3">{activeTab === "pyq" ? "📋" : "📝"}</p>
          <p className="text-gray-500 font-medium">
            No {activeTab === "pyq" ? "Previous Year Questions" : "Notes"} yet
          </p>
          <p className="text-gray-400 text-sm mt-1">Upload some for your branch!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((resource) => (
            <div key={resource._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    resource.type === "pyq" ? "bg-purple-50" : "bg-blue-50"
                  }`}>
                    <span className="text-lg">{resource.type === "pyq" ? "📋" : "📝"}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-black truncate">{resource.title}</p>
                    <p className="text-xs text-blue-500 font-medium">{resource.subject}</p>
                    {resource.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{resource.description}</p>
                    )}
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {resource.branch}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        Year {resource.year}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {resource.section === "all" ? "All Sections" : `Section ${resource.section}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ✅ FIXED: was missing opening < on the <a> tag */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg text-center"
                  >
                    View
                  </a>
                  {user._id === resource.uploadedBy?._id?.toString() && (
                    <button
                      onClick={() => handleDelete(resource._id)}
                      className="bg-red-50 hover:bg-red-100 text-red-500 text-xs px-3 py-1.5 rounded-lg"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}