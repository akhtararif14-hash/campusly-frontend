import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "Computer Science", "English", "History", "Economics",
  "Electronics", "Mechanical", "Civil", "Other"
];

function timeLeft(deadline) {
  const diff = new Date(deadline) - new Date();
  if (diff <= 0) return { text: "Expired", color: "text-red-400", urgent: true };
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return { text: `${days}d ${hrs}h left`, color: days <= 1 ? "text-amber-400" : "text-emerald-400", urgent: days <= 1 };
  return { text: `${hrs}h left`, color: "text-red-400", urgent: true };
}

const STATUS_STYLE = {
  open:      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  assigned:  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function Assignments() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]             = useState("browse"); // browse | my-posts | my-work
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [showPost, setShowPost]   = useState(false);
  const [selected, setSelected]   = useState(null); // detail modal
  const [uploading, setUploading] = useState(false);
  const [files, setFiles]         = useState([]);

  // filters
  const [filterSubject, setFilterSubject] = useState("");
  const [filterSort, setFilterSort]       = useState("newest");

  // post form
  const [form, setForm] = useState({
    title: "", description: "", subject: "", budget: "",
    deadline: "", tags: "",
  });

  // bid form
  const [bidAmount, setBidAmount]   = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [bidding, setBidding]       = useState(false);

  useEffect(() => { fetchData(); }, [tab, filterSubject, filterSort]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = "/api/assignments";
      if (tab === "my-posts") url = "/api/assignments/my-posts";
      else if (tab === "my-work") url = "/api/assignments/my-work";
      else url = `/api/assignments?status=open&sort=${filterSort}${filterSubject ? `&subject=${filterSubject}` : ""}`;
      const res = await api.get(url);
      setAssignments(res.data);
    } catch { showToast("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!form.title || !form.subject || !form.budget || !form.deadline)
      return showToast("Fill all required fields", "error");

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (k !== "tags") fd.append(k, v); });
    if (form.tags) fd.append("tags", form.tags);
    files.forEach(f => fd.append("attachments", f));

    try {
      setUploading(true);
      const res = await api.post("/api/assignments", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAssignments(p => [res.data, ...p]);
      setShowPost(false);
      setForm({ title: "", description: "", subject: "", budget: "", deadline: "", tags: "" });
      setFiles([]);
      showToast("Assignment posted!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed", "error");
    } finally { setUploading(false); }
  };

  const handleBid = async () => {
    if (!bidAmount) return showToast("Enter bid amount", "error");
    try {
      setBidding(true);
      const res = await api.post(`/api/assignments/${selected._id}/bid`, {
        amount: Number(bidAmount), message: bidMessage,
      });
      setSelected(res.data);
      setBidAmount(""); setBidMessage("");
      showToast("Bid placed!");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed", "error");
    } finally { setBidding(false); }
  };

  const handleAccept = async (assignmentId, userId) => {
    try {
      await api.post(`/api/assignments/${assignmentId}/accept/${userId}`);
      showToast("Bid accepted! Assignment assigned.");
      setSelected(null);
      fetchData();
    } catch { showToast("Failed", "error"); }
  };

  const handleComplete = async (id) => {
    try {
      await api.patch(`/api/assignments/${id}/complete`);
      showToast("Marked as completed!");
      setSelected(null);
      fetchData();
    } catch { showToast("Failed", "error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await api.delete(`/api/assignments/${id}`);
      setAssignments(p => p.filter(a => a._id !== id));
      showToast("Deleted!");
    } catch { showToast("Failed", "error"); }
  };

  const openDetail = async (a) => {
    try {
      const res = await api.get(`/api/assignments/${a._id}`);
      setSelected(res.data);
    } catch { setSelected(a); }
  };

  const myBid = selected?.bids?.find(b => b.userId?._id === user?._id || b.userId === user?._id);
  const isOwner = selected?.postedBy?._id === user?._id || selected?.postedBy === user?._id;

  if (!user) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center max-w-sm w-full">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-white mb-4">Login Required</h2>
        <button onClick={() => navigate("/login")} className="w-full bg-indigo-500 text-white py-3 rounded-xl font-bold">Login →</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-xl ${
          toast.type === "error" ? "bg-red-500" : "bg-emerald-500"
        }`}>{toast.msg}</div>
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[selected.status]}`}>
                      {selected.status}
                    </span>
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{selected.subject}</span>
                  </div>
                  <h2 className="text-white font-black text-lg">{selected.title}</h2>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white flex-shrink-0">
                  ✕
                </button>
              </div>

              <p className="text-zinc-400 text-sm mb-4">{selected.description}</p>

              {/* Tags */}
              {selected.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selected.tags.map((t, i) => (
                    <span key={i} className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full">#{t}</span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-indigo-400 font-black text-lg">₹{selected.budget}</p>
                  <p className="text-zinc-600 text-xs">Budget</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-3 text-center">
                  {(() => { const t = timeLeft(selected.deadline); return (
                    <>
                      <p className={`font-black text-sm ${t.color}`}>{t.text}</p>
                      <p className="text-zinc-600 text-xs">Deadline</p>
                    </>
                  ); })()}
                </div>
                <div className="bg-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-white font-black text-lg">{selected.bids?.length || 0}</p>
                  <p className="text-zinc-600 text-xs">Bids</p>
                </div>
              </div>

              {/* Attachments */}
              {selected.attachments?.length > 0 && (
                <div className="mb-4">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Attachments</p>
                  <div className="flex gap-2 flex-wrap">
                    {selected.attachments.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer"
                        className="bg-zinc-800 text-indigo-400 text-xs px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-all">
                        📎 File {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Posted by */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-800">
                {selected.postedBy?.profileImage ? (
                  <img src={selected.postedBy.profileImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 font-bold">
                    {selected.postedBy?.name?.charAt(0)}
                  </div>
                )}
                <p className="text-zinc-500 text-xs">Posted by <span className="text-zinc-300">{selected.postedBy?.name}</span></p>
              </div>

              {/* Bids list — visible to owner */}
              {isOwner && selected.bids?.length > 0 && (
                <div className="mb-4">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Bids ({selected.bids.length})</p>
                  <div className="space-y-2">
                    {selected.bids.map((bid, i) => (
                      <div key={i} className="bg-zinc-800 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 flex-shrink-0">
                          {bid.userId?.name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">{bid.userId?.name}</p>
                          {bid.message && <p className="text-zinc-500 text-xs truncate">{bid.message}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-indigo-400 font-black">₹{bid.amount}</p>
                          {selected.status === "open" && (
                            <button onClick={() => handleAccept(selected._id, bid.userId?._id)}
                              className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg mt-1 hover:bg-emerald-500/30 transition-all">
                              Accept
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Owner actions */}
              {isOwner && selected.status === "assigned" && (
                <button onClick={() => handleComplete(selected._id)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm mb-3 transition-all">
                  ✅ Mark as Completed
                </button>
              )}

              {/* Bid form — non-owner, open status */}
              {!isOwner && selected.status === "open" && (
                <div className="bg-zinc-800 rounded-2xl p-4">
                  <p className="text-white font-bold text-sm mb-3">
                    {myBid ? `Your bid: ₹${myBid.amount} — Update it` : "Place a Bid"}
                  </p>
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                      <input type="number" placeholder="Your price" value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  <textarea placeholder="Why should they pick you? (optional)" rows={2} value={bidMessage}
                    onChange={e => setBidMessage(e.target.value)}
                    className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none mb-3" />
                  <button onClick={handleBid} disabled={bidding}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all">
                    {bidding ? "Placing..." : myBid ? "Update Bid" : "Place Bid"}
                  </button>
                </div>
              )}

             {/* Assigned info + Message button */}
{selected.status === "assigned" && selected.assignedTo && (
  <>
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-3 mb-3">
      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
        {selected.assignedTo?.name?.charAt(0)}
      </div>
      <div className="flex-1">
        <p className="text-blue-400 text-xs font-bold">Assigned to</p>
        <p className="text-white text-sm font-semibold">{selected.assignedTo?.name}</p>
        <p className="text-blue-400 text-xs">for ₹{selected.acceptedBid}</p>
      </div>
    </div>

    {/* ✅ Message button — shows for both poster and assigned person */}
    <button
      onClick={() => {
        // If I'm the poster → message the assigned person
        // If I'm the assigned person → message the poster
        const chatWith = isOwner
          ? selected.assignedTo?._id
          : selected.postedBy?._id;
        navigate(`/Chat/${chatWith}`);
      }}
      className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm transition-all mb-3"
    >
      💬 Message {isOwner ? selected.assignedTo?.name : selected.postedBy?.name}
    </button>
  </>
)}

      {/* ── Post Modal ── */}
      {showPost && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h2 className="text-white font-black text-lg mb-4">Post Assignment</h2>
              <form onSubmit={handlePost} className="space-y-3">
                <input placeholder="Title *" required value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />

                <textarea placeholder="Describe your assignment in detail *" rows={3} required value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none" />

                <select value={form.subject} required onChange={e => setForm({...form, subject: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                  <option value="">Select Subject *</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₹</span>
                    <input type="number" placeholder="Budget *" required value={form.budget}
                      onChange={e => setForm({...form, budget: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <input type="datetime-local" required value={form.deadline}
                      onChange={e => setForm({...form, deadline: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                    <p className="text-zinc-600 text-xs mt-0.5">Deadline *</p>
                  </div>
                </div>

                <input placeholder="Tags (comma separated) e.g. urgent, calculus" value={form.tags}
                  onChange={e => setForm({...form, tags: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />

                {/* File upload */}
                <label className="block cursor-pointer">
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                    files.length > 0 ? "border-indigo-500/50 bg-indigo-500/5" : "border-zinc-700 hover:border-zinc-600"
                  }`}>
                    {files.length > 0 ? (
                      <p className="text-indigo-400 text-sm">📎 {files.length} file(s) selected</p>
                    ) : (
                      <>
                        <p className="text-zinc-500 text-sm">📎 Attach files (optional)</p>
                        <p className="text-zinc-600 text-xs mt-1">PDFs, images — up to 3 files</p>
                      </>
                    )}
                  </div>
                  <input type="file" multiple accept="image/*,.pdf" onChange={e => setFiles(Array.from(e.target.files || []))} className="hidden" />
                </label>

                <div className="flex gap-3">
                  <button type="submit" disabled={uploading}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all">
                    {uploading ? "Posting..." : "Post Assignment"}
                  </button>
                  <button type="button" onClick={() => setShowPost(false)}
                    className="px-6 py-3 bg-zinc-800 text-white rounded-xl text-sm">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/")}
            className="w-10 h-10 bg-zinc-800 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center font-bold text-lg transition-all flex-shrink-0">
            ‹
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Assignments</h1>
            <p className="text-zinc-500 text-xs">Post tasks, earn money helping others</p>
          </div>
          <button onClick={() => setShowPost(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
            + Post
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-900 rounded-2xl p-1 mb-4 border border-zinc-800">
          {[
            { key: "browse", label: "🔍 Browse" },
            { key: "my-posts", label: "📋 My Posts" },
            { key: "my-work", label: "💼 My Work" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === t.key ? "bg-indigo-500 text-white" : "text-zinc-400 hover:text-white"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters — browse only */}
        {tab === "browse" && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl px-3 py-2 text-xs flex-shrink-0 focus:outline-none focus:border-indigo-500">
              <option value="">All Subjects</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterSort} onChange={e => setFilterSort(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl px-3 py-2 text-xs flex-shrink-0 focus:outline-none focus:border-indigo-500">
              <option value="newest">Newest</option>
              <option value="budget_high">Highest Budget</option>
              <option value="budget_low">Lowest Budget</option>
              <option value="deadline">Deadline Soon</option>
            </select>
            <p className="text-zinc-600 text-xs self-center ml-auto flex-shrink-0">{assignments.length} found</p>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Loading...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-white font-bold">
              {tab === "browse" ? "No open assignments" : tab === "my-posts" ? "You haven't posted any" : "No work taken yet"}
            </p>
            <p className="text-zinc-500 text-sm mt-1">
              {tab === "browse" ? "Check back later or post one!" : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map(a => {
              const tl = timeLeft(a.deadline);
              const isMyPost = a.postedBy?._id === user._id || a.postedBy === user._id;
              return (
                <div key={a._id}
                  onClick={() => openDetail(a)}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 cursor-pointer transition-all active:scale-[0.99]">

                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[a.status]}`}>
                          {a.status}
                        </span>
                        <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{a.subject}</span>
                        {tl.urgent && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">⚡ Urgent</span>}
                      </div>
                      <p className="text-white font-bold text-sm line-clamp-2">{a.title}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-indigo-400 font-black text-lg leading-none">₹{a.budget}</p>
                      <p className="text-zinc-600 text-xs">budget</p>
                    </div>
                  </div>

                  <p className="text-zinc-500 text-xs line-clamp-2 mb-3">{a.description}</p>

                  {/* Tags */}
                  {a.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {a.tags.slice(0, 3).map((t, i) => (
                        <span key={i} className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded-full">#{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 font-bold flex-shrink-0">
                        {a.postedBy?.name?.charAt(0)}
                      </div>
                      <p className="text-zinc-600 text-xs truncate">{isMyPost ? "You" : a.postedBy?.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`text-xs font-medium ${tl.color}`}>{tl.text}</p>
                      <p className="text-zinc-600 text-xs">{a.bids?.length || 0} bids</p>
                      {isMyPost && a.status === "open" && (
                        <button onClick={e => { e.stopPropagation(); handleDelete(a._id); }}
                          className="text-zinc-700 hover:text-red-400 text-xs transition-all">🗑</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}