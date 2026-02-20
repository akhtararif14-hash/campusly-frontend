import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// helpers
const pct = (p, t) => (t === 0 ? 0 : Math.round((p / t) * 100));
const classesNeeded = (p, t) => {
  if (pct(p, t) >= 75) return 0;
  return Math.ceil((0.75 * t - p) / 0.25);
};
const canBunk = (p, t) => Math.max(0, Math.floor(p / 0.75 - t));

const ringColor = (p) => {
  if (p >= 75) return "#22c55e";
  if (p >= 60) return "#f59e0b";
  return "#ef4444";
};
const textColor = (p) => {
  if (p >= 75) return "text-emerald-400";
  if (p >= 60) return "text-amber-400";
  return "text-red-400";
};

// ── Circular Ring ──────────────────────────────────────────────────────────
function Ring({ percent, size = 56, stroke = 5 }) {
  const color = ringColor(percent);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(percent / 100, 1) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s ease" }} />
    </svg>
  );
}

// ── Status chip for each class slot ───────────────────────────────────────
// status: null | "present" | "absent" | "bunk"
const STATUS_CONFIG = {
  present: { bg: "bg-emerald-500", border: "border-emerald-500", text: "✓", label: "Present" },
  absent:  { bg: "bg-red-500",     border: "border-red-500",     text: "✗", label: "Absent"  },
  bunk:    { bg: "bg-amber-500",   border: "border-amber-500",   text: "Z", label: "Bunk"    },
};

export default function Attendance() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [timetable, setTimetable] = useState([]);   // raw from /api/timetable/my
  const [records, setRecords]     = useState({});   // { "SubjectName": { present, total } }
  const [todayLog, setTodayLog]   = useState({});   // { "SubjectName_slotIndex": "present"|"absent"|"bunk" }
  const [activeDay, setActiveDay] = useState("");
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [dangerSubject, setDangerSubject] = useState(null);
  const [dangerDismissed, setDangerDismissed] = useState(false);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  // ── load timetable + attendance summary ───────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (!user.branch || !user.year || !user.section) { setLoading(false); return; }

    setActiveDay(DAYS.includes(today) ? today : "Monday");

    const load = async () => {
      try {
        const [ttRes, attRes] = await Promise.all([
          api.get("/api/timetable/my"),
          api.get("/api/attendance/summary"),
        ]);
        setTimetable(ttRes.data);

        // build records map { subjectName: { present, total } }
        const map = {};
        (attRes.data || []).forEach((s) => { map[s.name] = { present: s.present, total: s.total }; });
        setRecords(map);

        // load today's log from localStorage
        const key = `att_log_${user._id}_${new Date().toDateString()}`;
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        setTodayLog(saved);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // ── check danger after records change ─────────────────────────────────────
  useEffect(() => {
    if (dangerDismissed) return;
    const danger = Object.entries(records).find(
      ([, v]) => v.total > 0 && pct(v.present, v.total) < 75
    );
    if (danger) setDangerSubject({ name: danger[0], ...danger[1] });
    else setDangerSubject(null);
  }, [records, dangerDismissed]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ── mark a slot ───────────────────────────────────────────────────────────
  const handleMark = useCallback(async (subject, slotKey, newStatus) => {
    const oldStatus = todayLog[slotKey];

    // cycle: null → present → absent → bunk → null
    let next = newStatus;
    if (oldStatus === newStatus) next = null; // toggle off

    // update todayLog
    const newLog = { ...todayLog, [slotKey]: next };
    if (!next) delete newLog[slotKey];
    setTodayLog(newLog);

    // persist log
    const key = `att_log_${user._id}_${new Date().toDateString()}`;
    localStorage.setItem(key, JSON.stringify(newLog));

    // update records
    setRecords((prev) => {
      const cur = prev[subject] || { present: 0, total: 0 };
      let { present, total } = cur;

      // undo old
      if (oldStatus === "present") { present--; total--; }
      else if (oldStatus === "absent") { total--; }
      // bunk: no change to counts

      // apply new
      if (next === "present") { present++; total++; }
      else if (next === "absent") { total++; }
      // bunk: no change

      return { ...prev, [subject]: { present: Math.max(0, present), total: Math.max(0, total) } };
    });

    // sync to backend (fire and forget)
    try {
      if (next && next !== "bunk") {
        await api.post("/api/attendance/mark", { subject, status: next, slotKey, date: new Date().toISOString() });
      } else if (!next && oldStatus && oldStatus !== "bunk") {
        await api.post("/api/attendance/unmark", { subject, slotKey, oldStatus, date: new Date().toISOString() });
      }
    } catch { /* offline — already updated local */ }

    if (next === "present") showToast(`✅ Present — ${subject}`);
    else if (next === "absent") showToast(`❌ Absent — ${subject}`, "error");
    else if (next === "bunk") showToast(`💤 Bunk noted — no change`, "warn");
  }, [todayLog, user]);

  // ── derived data ──────────────────────────────────────────────────────────
  const daySchedule = timetable.find((t) => t.day === activeDay);
  const slots = (daySchedule?.slots || []).filter(
    (s) => s.subject && s.subject.toLowerCase() !== "break"
  );

  // unique subjects across all days for summary
  const allSubjects = [...new Set(
    timetable.flatMap((d) => d.slots || [])
      .map((s) => s.subject)
      .filter((s) => s && s.toLowerCase() !== "break")
  )];

  const totalPresent = Object.values(records).reduce((a, v) => a + v.present, 0);
  const totalClasses = Object.values(records).reduce((a, v) => a + v.total, 0);
  const overallPct   = pct(totalPresent, totalClasses);

  // ── guards ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center max-w-sm w-full">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-white mb-4">Login Required</h2>
        <button onClick={() => navigate("/login")} className="w-full bg-violet-500 text-white py-3 rounded-xl font-bold">Login →</button>
      </div>
    </div>
  );

  if (!user.branch || !user.year || !user.section) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center max-w-sm w-full">
        <div className="text-5xl mb-4">📚</div>
        <h2 className="text-xl font-bold text-white mb-2">Setup Profile First</h2>
        <p className="text-zinc-500 text-sm mb-5">Add Branch, Year & Section to track attendance</p>
        <button onClick={() => navigate("/profile")} className="w-full bg-violet-500 text-white py-3 rounded-xl font-bold">Go to Profile →</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold transition-all ${
          toast.type === "error" ? "bg-red-500" : toast.type === "warn" ? "bg-amber-500" : "bg-emerald-500"
        }`}>{toast.msg}</div>
      )}

      {/* ── 75% Danger Popup ── */}
      {dangerSubject && !dangerDismissed && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <p className="text-red-400 text-xs font-bold uppercase tracking-widest">Attendance Alert</p>
            </div>
            <p className="text-4xl font-black text-white mb-1">{pct(dangerSubject.present, dangerSubject.total)}%</p>
            <p className="text-zinc-300 font-bold mb-1">{dangerSubject.name}</p>
            <p className="text-zinc-500 text-sm mb-4">
              Attend <span className="text-red-400 font-bold">{classesNeeded(dangerSubject.present, dangerSubject.total)} more consecutive classes</span> to reach 75%
            </p>
            <div className="bg-zinc-800 rounded-full h-2 mb-5 overflow-hidden">
              <div className="h-2 bg-red-500 rounded-full transition-all"
                style={{ width: `${pct(dangerSubject.present, dangerSubject.total)}%` }} />
            </div>
            <div className="bg-zinc-800 rounded-xl p-3 mb-4 text-center">
              <p className="text-zinc-400 text-xs">75% line at</p>
              <p className="text-white font-black">{Math.ceil(dangerSubject.total * 0.75)} / {dangerSubject.total}</p>
            </div>
            <button onClick={() => { setDangerDismissed(true); setDangerSubject(null); }}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-sm transition-all">
              I'll fix it 💪
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/")}
            className="w-10 h-10 bg-zinc-800 hover:bg-violet-500 text-white rounded-xl flex items-center justify-center font-bold text-lg transition-all flex-shrink-0">
            ‹
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Attendance</h1>
            <p className="text-zinc-500 text-xs">{user.branch} • Yr {user.year} • Sec {user.section}</p>
          </div>
        </div>

        {/* ── Overall bar ── */}
        {totalClasses > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5 flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <Ring percent={overallPct} size={60} stroke={6} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xs font-black ${textColor(overallPct)}`}>{overallPct}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Overall Attendance</p>
              <p className="text-zinc-500 text-xs">{totalPresent} / {totalClasses} classes</p>
              <p className={`text-xs mt-1 font-semibold ${overallPct >= 75 ? "text-emerald-400" : "text-red-400"}`}>
                {overallPct >= 75
                  ? `✅ Can bunk ${canBunk(totalPresent, totalClasses)} more`
                  : `⚠️ Need ${classesNeeded(totalPresent, totalClasses)} more to reach 75%`}
              </p>
            </div>
          </div>
        )}

        {/* ── Day tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: "none" }}>
          {DAYS.map((day) => {
            const isToday = day === today;
            const isActive = activeDay === day;
            return (
              <button key={day} onClick={() => setActiveDay(day)}
                className={`flex-shrink-0 relative px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-violet-500 text-white"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                }`}>
                {day.slice(0, 3).toUpperCase()}
                {isToday && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-400 rounded-full border border-zinc-950" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Slot Grid ── */}
        {slots.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-white font-bold">No classes on {activeDay}</p>
          </div>
        ) : (
          <>
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-3 font-semibold">
              {activeDay} — Tap to mark attendance
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {slots.map((slot, i) => {
                const slotKey = `${slot.subject}_${i}`;
                const status = todayLog[slotKey] || null;
                const cfg = status ? STATUS_CONFIG[status] : null;
                const rec = records[slot.subject] || { present: 0, total: 0 };
                const p = pct(rec.present, rec.total);

                return (
                  <div key={slotKey}
                    className={`bg-zinc-900 border rounded-2xl p-4 transition-all ${
                      status === "present" ? "border-emerald-500/50 bg-emerald-950/30"
                      : status === "absent" ? "border-red-500/50 bg-red-950/30"
                      : status === "bunk" ? "border-amber-500/50 bg-amber-950/20"
                      : "border-zinc-800"
                    }`}>

                    {/* Subject name + time */}
                    <p className="text-white font-bold text-sm leading-tight mb-0.5 line-clamp-2">{slot.subject}</p>
                    <p className="text-zinc-600 text-xs mb-3">{slot.time}</p>

                    {/* Attendance % mini bar */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full transition-all"
                          style={{ width: `${p}%`, background: ringColor(p) }} />
                      </div>
                      <span className={`text-xs font-bold ${textColor(p)}`}>{p}%</span>
                    </div>

                    {/* 3 action buttons */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {["present", "absent", "bunk"].map((s) => {
                        const active = status === s;
                        const colors = {
                          present: active ? "bg-emerald-500 text-white border-emerald-500" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-emerald-500 hover:text-emerald-400",
                          absent:  active ? "bg-red-500 text-white border-red-500"         : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-red-500 hover:text-red-400",
                          bunk:    active ? "bg-amber-500 text-white border-amber-500"     : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-amber-500 hover:text-amber-400",
                        }[s];
                        const icons = { present: "✓", absent: "✗", bunk: "Z" };
                        return (
                          <button key={s}
                            onClick={() => handleMark(slot.subject, slotKey, s)}
                            className={`border rounded-lg py-1.5 text-xs font-black transition-all active:scale-95 ${colors}`}>
                            {icons[s]}
                          </button>
                        );
                      })}
                    </div>
                    {status && (
                      <p className={`text-center text-xs font-semibold mt-1.5 ${
                        status === "present" ? "text-emerald-400"
                        : status === "absent" ? "text-red-400"
                        : "text-amber-400"
                      }`}>
                        {STATUS_CONFIG[status].label}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Subject Summary ── */}
        {allSubjects.length > 0 && (
          <>
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-3 font-semibold">Subject Summary</p>
            <div className="space-y-2">
              {allSubjects.map((name) => {
                const rec = records[name] || { present: 0, total: 0 };
                const p = pct(rec.present, rec.total);
                const needed = classesNeeded(rec.present, rec.total);
                const bunk = canBunk(rec.present, rec.total);

                return (
                  <div key={name} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Ring percent={p} size={44} stroke={4} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-xs font-black ${textColor(p)}`} style={{ fontSize: "9px" }}>{p}%</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{name}</p>
                      <p className="text-zinc-600 text-xs">{rec.present}/{rec.total} attended</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {p < 75 ? (
                        <p className="text-red-400 text-xs font-bold">+{needed} needed</p>
                      ) : (
                        <p className="text-emerald-400 text-xs font-bold">{bunk} bunk left</p>
                      )}
                      <p className={`text-xs font-black mt-0.5 ${textColor(p)}`}>{p}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </div>
  );
}