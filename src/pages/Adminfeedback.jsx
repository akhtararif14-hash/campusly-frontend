import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const TYPE_STYLE = {
  bug:        { label: "🐛 Bug",        color: "bg-red-500/20 text-red-400 border-red-500/30" },
  feature:    { label: "✨ Feature",    color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  suggestion: { label: "💡 Suggestion", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  other:      { label: "📝 Other",      color: "bg-zinc-700/50 text-zinc-400 border-zinc-700" },
};

const STATUS_STYLE = {
  new:         "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "in-review": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  resolved:    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  dismissed:   "bg-zinc-700/50 text-zinc-500 border-zinc-700",
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  return `${days}d ago`;
}

export default function AdminFeedback() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [filterType, setFilterType]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [toast, setToast]         = useState(null);

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/"); return; }
    fetchFeedback();
  }, [user, filterType, filterStatus]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType)   params.append("type", filterType);
      if (filterStatus) params.append("status", filterStatus);
      const res = await api.get(`/api/feedback/admin?${params}`);
      setFeedbacks(res.data);
    } catch { showToast("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/feedback/${id}/status`, { status });
      setFeedbacks(p => p.map(f => f._id === id ? { ...f, status } : f));
      if (selected?._id === id) setSelected(s => ({ ...s, status }));
      showToast("Status updated!");
    } catch { showToast("Failed", "error"); }
  };

  const deleteFeedback = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await api.delete(`/api/feedback/${id}`);
      setFeedbacks(p => p.filter(f => f._id !== id));
      setSelected(null);
      showToast("Deleted!");
    } catch { showToast("Failed", "error"); }
  };

  const counts = {
    total:   feedbacks.length,
    new:     feedbacks.filter(f => f.status === "new").length,
    bugs:    feedbacks.filter(f => f.type === "bug").length,
    features:feedbacks.filter(f => f.type === "feature").length,
  };

  if (user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-zinc-950">

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-xl ${
          toast.type === "error" ? "bg-red-500" : "bg-emerald-500"
        }`}>{toast.msg}</div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_STYLE[selected.type]?.color}`}>
                    {TYPE_STYLE[selected.type]?.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white flex-shrink-0">✕</button>
              </div>

              <h2 className="text-white font-black text-lg mb-2">{selected.title}</h2>
              <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{selected.description}</p>

              {/* User info */}
              <div className="bg-zinc-800 rounded-xl p-3 flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                  {selected.userId?.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">{selected.userId?.name}</p>
                  <p className="text-zinc-500 text-xs">{selected.userId?.email}</p>
                </div>
                <p className="text-zinc-600 text-xs">{timeAgo(selected.createdAt)}</p>
              </div>

              {/* Status update */}
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2 font-semibold">Update Status</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {["new", "in-review", "resolved", "dismissed"].map(s => (
                  <button key={s} onClick={() => updateStatus(selected._id, s)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      selected.status === s
                        ? STATUS_STYLE[s] + " scale-95"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                    }`}>
                    {s === "new" ? "🔵 New"
                      : s === "in-review" ? "🟡 In Review"
                      : s === "resolved" ? "🟢 Resolved"
                      : "⚫ Dismiss"}
                  </button>
                ))}
              </div>

              <button onClick={() => deleteFeedback(selected._id)}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 rounded-xl font-bold text-sm transition-all">
                🗑 Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/admin")}
            className="w-10 h-10 bg-zinc-800 hover:bg-violet-500 text-white rounded-xl flex items-center justify-center font-bold text-lg transition-all flex-shrink-0">
            ‹
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Feedback Inbox</h1>
            <p className="text-zinc-500 text-xs">Admin only — user reports & suggestions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label: "Total",    value: counts.total,    color: "text-white" },
            { label: "New",      value: counts.new,      color: "text-blue-400" },
            { label: "Bugs",     value: counts.bugs,     color: "text-red-400" },
            { label: "Features", value: counts.features, color: "text-violet-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-zinc-600 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-violet-500">
            <option value="">All Types</option>
            <option value="bug">🐛 Bugs</option>
            <option value="feature">✨ Features</option>
            <option value="suggestion">💡 Suggestions</option>
            <option value="other">📝 Other</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-violet-500">
            <option value="">All Status</option>
            <option value="new">🔵 New</option>
            <option value="in-review">🟡 In Review</option>
            <option value="resolved">🟢 Resolved</option>
            <option value="dismissed">⚫ Dismissed</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-white font-bold">No feedback yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {feedbacks.map(f => (
              <div key={f._id} onClick={() => setSelected(f)}
                className={`bg-zinc-900 border rounded-2xl p-4 cursor-pointer hover:border-zinc-700 transition-all ${
                  f.status === "new" ? "border-blue-500/30" : "border-zinc-800"
                }`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_STYLE[f.type]?.color}`}>
                        {TYPE_STYLE[f.type]?.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[f.status]}`}>
                        {f.status}
                      </span>
                    </div>
                    <p className="text-white font-bold text-sm line-clamp-1">{f.title}</p>
                    <p className="text-zinc-500 text-xs line-clamp-2 mt-0.5">{f.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-zinc-600 text-xs">👤 {f.userId?.name}</p>
                      <p className="text-zinc-700 text-xs">{timeAgo(f.createdAt)}</p>
                    </div>
                  </div>
                  {f.status === "new" && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}