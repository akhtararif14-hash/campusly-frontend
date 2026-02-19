import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

// ── helpers ──────────────────────────────────────────────────────────────────
const pct = (present, total) =>
  total === 0 ? 0 : Math.round((present / total) * 100);

const classesNeeded = (present, total) => {
  // How many consecutive classes to attend to reach 75%
  // (present + x) / (total + x) >= 0.75  →  x >= (0.75*total - present) / 0.25
  if (pct(present, total) >= 75) return 0;
  return Math.ceil((0.75 * total - present) / 0.25);
};

const canBunk = (present, total) => {
  // How many classes can be skipped while staying >= 75%
  // (present) / (total + x) >= 0.75  →  x <= present/0.75 - total
  const max = Math.floor(present / 0.75 - total);
  return Math.max(0, max);
};

const statusColor = (p) => {
  if (p >= 75) return { ring: "#22c55e", bar: "#22c55e", text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
  if (p >= 60) return { ring: "#f59e0b", bar: "#f59e0b", text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
  return { ring: "#ef4444", bar: "#ef4444", text: "text-red-400", bg: "bg-red-500/10 border-red-500/20" };
};

// ── Circular ring ─────────────────────────────────────────────────────────────
function Ring({ percent, size = 80, stroke = 7, color = "#22c55e" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#27272a" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Attendance() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]); // [{ name, present, total }]
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [dangerPopup, setDangerPopup] = useState(null); // subject obj
  const [addModal, setAddModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [markModal, setMarkModal] = useState(null); // subject name
  const [markCount, setMarkCount] = useState({ present: 1, total: 1 });
  const [view, setView] = useState("cards"); // cards | table
  const [editModal, setEditModal] = useState(null); // subject for editing

  // ── Load from backend ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/attendance/summary");
      setSubjects(res.data);
    } catch {
      // fallback to localStorage if offline
      const local = JSON.parse(localStorage.getItem("attendance_subjects") || "[]");
      setSubjects(local);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchData();
  }, [user]);

  // sync localStorage
  useEffect(() => {
    if (subjects.length > 0)
      localStorage.setItem("attendance_subjects", JSON.stringify(subjects));
  }, [subjects]);

  // ── check 75% danger on load ───────────────────────────────────────────────
  useEffect(() => {
    const danger = subjects.find(
      (s) => s.total > 0 && pct(s.present, s.total) < 75
    );
    if (danger) setDangerPopup(danger);
  }, [subjects]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Add subject ────────────────────────────────────────────────────────────
  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;
    const sub = { name: newSubject.trim(), present: 0, total: 0 };
    try {
      await api.post("/api/attendance/subject", sub);
      setSubjects((p) => [...p, sub]);
    } catch {
      setSubjects((p) => [...p, sub]);
    }
    setNewSubject("");
    setAddModal(false);
    showToast("Subject added!");
  };

  // ── Mark attendance ────────────────────────────────────────────────────────
  const handleMark = async (subjectName, status) => {
    // status: "present" | "absent"
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.name !== subjectName) return s;
        return {
          ...s,
          present: status === "present" ? s.present + 1 : s.present,
          total: s.total + 1,
        };
      })
    );
    try {
      await api.post("/api/attendance/mark", {
        subject: subjectName,
        status,
        date: new Date().toISOString(),
      });
    } catch { /* already updated local */ }
    showToast(status === "present" ? "✅ Present marked!" : "❌ Absent marked!");
  };

  // ── Bulk mark modal ────────────────────────────────────────────────────────
  const handleBulkMark = async () => {
    const { present, total } = markCount;
    if (total <= 0 || present < 0 || present > total) {
      return showToast("Invalid values", "error");
    }
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.name !== markModal) return s;
        return { ...s, present: s.present + present, total: s.total + total };
      })
    );
    try {
      await api.post("/api/attendance/bulk", {
        subject: markModal, present, total,
      });
    } catch { }
    setMarkModal(null);
    setMarkCount({ present: 1, total: 1 });
    showToast("Attendance updated!");
  };

  // ── Edit subject ───────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editModal) return;
    setSubjects((prev) =>
      prev.map((s) => s.name === editModal.name ? { ...editModal } : s)
    );
    try {
      await api.put("/api/attendance/subject", editModal);
    } catch { }
    setEditModal(null);
    showToast("Updated!");
  };

  // ── Delete subject ─────────────────────────────────────────────────────────
  const handleDelete = async (name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    setSubjects((prev) => prev.filter((s) => s.name !== name));
    try {
      await api.delete(`/api/attendance/subject/${encodeURIComponent(name)}`);
    } catch { }
    showToast("Deleted!");
  };

  // ── Overall stats ──────────────────────────────────────────────────────────
  const totalPresent = subjects.reduce((a, s) => a + s.present, 0);
  const totalClasses = subjects.reduce((a, s) => a + s.total, 0);
  const overallPct = pct(totalPresent, totalClasses);
  const overallColor = statusColor(overallPct);

  // ── Auth guards ────────────────────────────────────────────────────────────
  if (!user) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center max-w-sm w-full">
        <div className="text-6xl mb-5">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
        <button onClick={() => navigate("/login")}
          className="w-full bg-violet-500 hover:bg-violet-600 text-white py-3 rounded-2xl font-semibold transition-all mt-4">
          Login →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
        }`}>{toast.msg}</div>
      )}

      {/* ── Danger Popup (< 75%) ── */}
      {dangerPopup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl shadow-red-500/10">
            {/* pulse dot */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute" />
              <div className="w-3 h-3 rounded-full bg-red-500 relative" />
              <p className="text-red-400 text-xs font-bold uppercase tracking-widest">Attendance Alert</p>
            </div>
            <p className="text-white text-2xl font-black mb-1">
              {pct(dangerPopup.present, dangerPopup.total)}% 😬
            </p>
            <p className="text-zinc-300 font-semibold mb-1">{dangerPopup.name}</p>
            <p className="text-zinc-500 text-sm mb-4">
              You need to attend{" "}
              <span className="text-red-400 font-bold">
                {classesNeeded(dangerPopup.present, dangerPopup.total)} more classes
              </span>{" "}
              in a row to reach 75%.
            </p>

            {/* mini bar */}
            <div className="bg-zinc-800 rounded-full h-2 mb-5">
              <div className="h-2 rounded-full bg-red-500 transition-all"
                style={{ width: `${pct(dangerPopup.present, dangerPopup.total)}%` }} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => {
                const next = subjects.find(
                  (s, i) => s.total > 0 && pct(s.present, s.total) < 75 &&
                    s.name !== dangerPopup.name
                );
                setDangerPopup(next || null);
              }} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-sm font-bold">
                Next ›
              </button>
              <button onClick={() => setDangerPopup(null)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-bold">
                I'll Fix It 💪
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Subject Modal ── */}
      {addModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-sm w-full">
            <h3 className="text-white font-black text-lg mb-4">Add Subject</h3>
            <input autoFocus placeholder="e.g. Data Structures" value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setAddModal(false)}
                className="flex-1 bg-zinc-800 text-white py-3 rounded-xl text-sm font-bold">Cancel</button>
              <button onClick={handleAddSubject}
                className="flex-1 bg-violet-500 hover:bg-violet-600 text-white py-3 rounded-xl text-sm font-bold">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Mark Modal ── */}
      {markModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-sm w-full">
            <h3 className="text-white font-black text-lg mb-1">Bulk Update</h3>
            <p className="text-zinc-500 text-sm mb-4">{markModal}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-zinc-500 text-xs mb-1 block">Classes Attended</label>
                <input type="number" min="0" value={markCount.present}
                  onChange={(e) => setMarkCount({ ...markCount, present: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-zinc-500 text-xs mb-1 block">Total Classes</label>
                <input type="number" min="1" value={markCount.total}
                  onChange={(e) => setMarkCount({ ...markCount, total: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMarkModal(null)}
                className="flex-1 bg-zinc-800 text-white py-3 rounded-xl text-sm font-bold">Cancel</button>
              <button onClick={handleBulkMark}
                className="flex-1 bg-violet-500 hover:bg-violet-600 text-white py-3 rounded-xl text-sm font-bold">Update</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-sm w-full">
            <h3 className="text-white font-black text-lg mb-4">Edit — {editModal.name}</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-zinc-500 text-xs mb-1 block">Present</label>
                <input type="number" min="0" value={editModal.present}
                  onChange={(e) => setEditModal({ ...editModal, present: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-zinc-500 text-xs mb-1 block">Total</label>
                <input type="number" min="0" value={editModal.total}
                  onChange={(e) => setEditModal({ ...editModal, total: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditModal(null)}
                className="flex-1 bg-zinc-800 text-white py-3 rounded-xl text-sm font-bold">Cancel</button>
              <button onClick={handleEdit}
                className="flex-1 bg-violet-500 hover:bg-violet-600 text-white py-3 rounded-xl text-sm font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 pb-28">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")}
            className="w-10 h-10 bg-zinc-800 hover:bg-violet-500 text-white rounded-xl flex items-center justify-center transition-all font-bold text-lg flex-shrink-0">
            ‹
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Attendance</h1>
            <p className="text-zinc-500 text-xs">Track your 75% target</p>
          </div>
          <button onClick={() => setView(view === "cards" ? "table" : "cards")}
            className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl flex items-center justify-center transition-all text-sm">
            {view === "cards" ? "≡" : "⊞"}
          </button>
          <button onClick={() => setAddModal(true)}
            className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
            + Add
          </button>
        </div>

        {/* ── Overall Card ── */}
        {subjects.length > 0 && (
          <div className="rounded-3xl p-5 mb-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1a1025 0%, #200d35 100%)", border: "1px solid #3b1f6a" }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #8b5cf6, transparent)", transform: "translate(30%,-30%)" }} />

            <div className="relative flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <Ring percent={overallPct} size={90} stroke={8} color={overallColor.ring} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-xl font-black ${overallColor.text}`}>{overallPct}%</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-white font-black text-lg">Overall</p>
                <p className="text-zinc-400 text-sm">{totalPresent} / {totalClasses} classes</p>
                <div className="flex gap-3 mt-2">
                  {overallPct >= 75 ? (
                    <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                      ✅ You can bunk {canBunk(totalPresent, totalClasses)} more
                    </span>
                  ) : (
                    <span className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                      ⚠️ Need {classesNeeded(totalPresent, totalClasses)} more to reach 75%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Loading...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-white font-bold text-lg">No subjects yet</p>
            <p className="text-zinc-500 text-sm mt-1 mb-5">Add your subjects to start tracking</p>
            <button onClick={() => setAddModal(true)}
              className="bg-violet-500 hover:bg-violet-600 text-white px-6 py-3 rounded-xl font-bold text-sm">
              + Add Subject
            </button>
          </div>

        ) : view === "table" ? (
          /* ── TABLE VIEW ── */
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-zinc-500 font-medium px-4 py-3">Subject</th>
                    <th className="text-center text-zinc-500 font-medium px-3 py-3">P/T</th>
                    <th className="text-center text-zinc-500 font-medium px-3 py-3">%</th>
                    <th className="text-center text-zinc-500 font-medium px-3 py-3">Need</th>
                    <th className="text-center text-zinc-500 font-medium px-3 py-3">Bunk</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s, i) => {
                    const p = pct(s.present, s.total);
                    const c = statusColor(p);
                    return (
                      <tr key={i} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-all">
                        <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                        <td className="px-3 py-3 text-center text-zinc-400">{s.present}/{s.total}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`font-black ${c.text}`}>{p}%</span>
                        </td>
                        <td className="px-3 py-3 text-center text-red-400 text-xs font-medium">
                          {p < 75 ? `+${classesNeeded(s.present, s.total)}` : "—"}
                        </td>
                        <td className="px-3 py-3 text-center text-emerald-400 text-xs font-medium">
                          {canBunk(s.present, s.total) > 0 ? canBunk(s.present, s.total) : "—"}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => handleMark(s.name, "present")}
                              className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-lg hover:bg-emerald-500/30">P</button>
                            <button onClick={() => handleMark(s.name, "absent")}
                              className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-500/30">A</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        ) : (
          /* ── CARDS VIEW ── */
          <div className="space-y-3">
            {subjects.map((s, i) => {
              const p = pct(s.present, s.total);
              const c = statusColor(p);
              const needed = classesNeeded(s.present, s.total);
              const bunk = canBunk(s.present, s.total);

              return (
                <div key={i} className={`bg-zinc-900 border ${c.bg} rounded-2xl p-4 transition-all`}
                  style={{ borderColor: p < 75 ? "rgba(239,68,68,0.2)" : p < 60 ? "rgba(245,158,11,0.2)" : "#27272a" }}>

                  <div className="flex items-center gap-4">
                    {/* Ring */}
                    <div className="relative flex-shrink-0">
                      <Ring percent={p} size={64} stroke={6} color={c.ring} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-black ${c.text}`}>{p}%</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{s.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{s.present} present / {s.total} total</p>

                      {/* Progress bar */}
                      <div className="bg-zinc-800 rounded-full h-1.5 mt-2">
                        <div className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(p, 100)}%`, background: c.ring }} />
                      </div>

                      {/* Status pill */}
                      <div className="flex gap-2 mt-2">
                        {p < 75 ? (
                          <span className="text-red-400 text-xs font-medium">
                            ⚠️ Attend {needed} more
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-xs font-medium">
                            ✅ Can bunk {bunk}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button onClick={() => handleMark(s.name, "present")}
                        className="bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95">
                        Present
                      </button>
                      <button onClick={() => handleMark(s.name, "absent")}
                        className="bg-red-500/15 hover:bg-red-500/30 text-red-400 text-xs px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95">
                        Absent
                      </button>
                    </div>
                  </div>

                  {/* Bottom actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                    <button onClick={() => { setMarkModal(s.name); setMarkCount({ present: 1, total: 1 }); }}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs py-2 rounded-lg font-medium transition-all">
                      📥 Bulk Update
                    </button>
                    <button onClick={() => setEditModal({ ...s })}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs py-2 rounded-lg font-medium transition-all">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(s.name)}
                      className="bg-zinc-800 hover:bg-red-500/20 text-zinc-600 hover:text-red-400 text-xs px-3 py-2 rounded-lg transition-all">
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Subjects summary footer ── */}
        {subjects.length > 0 && !loading && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Safe", value: subjects.filter(s => pct(s.present, s.total) >= 75).length, color: "text-emerald-400" },
              { label: "Warning", value: subjects.filter(s => { const p = pct(s.present, s.total); return p >= 60 && p < 75; }).length, color: "text-amber-400" },
              { label: "Danger", value: subjects.filter(s => pct(s.present, s.total) < 60).length, color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-zinc-600 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}