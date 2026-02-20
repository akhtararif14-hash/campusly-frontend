import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// ✅ SET THIS TO TEST — e.g. "09:30" to simulate 9:30 AM
// Set to null for real time
const DEBUG_TIME = "12:30"; // ← change this to test, set to null for real time

function getNowMinutes() {
  if (DEBUG_TIME) {
    const [h, m] = DEBUG_TIME.split(":").map(Number);
    return h * 60 + m;
  }
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function parseTime(timeStr) {
  const str = timeStr.split("-")[0].trim();
  const [h, m] = str.split(":").map(Number);
  return h * 60 + (m || 0);
}
function parseEndTime(timeStr) {
  const parts = timeStr.split("-");
  if (parts.length < 2) return null;
  const str = parts[1].trim();
  const [h, m] = str.split(":").map(Number);
  return h * 60 + (m || 0);
}
function getProgress(slot) {
  const start = parseTime(slot.time);
  const end = parseEndTime(slot.time);
  if (!end) return 0;
  const now = getNowMinutes();
  if (now < start) return 0;
  if (now > end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}
function isCurrentSlot(slot) {
  const start = parseTime(slot.time);
  const end = parseEndTime(slot.time);
  if (!end) return false;
  const now = getNowMinutes();
  return now >= start && now <= end;
}
function isUpcoming(slot) {
  const start = parseTime(slot.time);
  const now = getNowMinutes();
  return start > now && start - now <= 30;
}
function isPast(slot) {
  const end = parseEndTime(slot.time);
  if (!end) return false;
  return getNowMinutes() > end;
}
function getTimeLeft(slot) {
  const end = parseEndTime(slot.time);
  if (!end) return "";
  const diff = end - getNowMinutes();
  if (diff <= 0) return "Ended";
  if (diff < 60) return `${diff}m left`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m left`;
}
function getNextClass(slots) {
  const now = getNowMinutes();
  return slots?.find((s) => parseTime(s.time) > now) || null;
}

export default function Timetable() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState("");
  const [now, setNow] = useState(() => {
    if (DEBUG_TIME) {
      const d = new Date();
      const [h, m] = DEBUG_TIME.split(":").map(Number);
      d.setHours(h, m, 0);
      return d;
    }
    return new Date();
  });
  const currentRef = useRef(null);

  const today = DEBUG_TIME ? "Monday" : new Date().toLocaleDateString("en-US", { weekday: "long" });

  // ✅ When debugging, treat whichever day is active as "today"
  // so LIVE / PAST / SOON badges all work correctly
  const effectiveToday = DEBUG_TIME ? (activeDay || today) : today;

  useEffect(() => {
    setActiveDay(DAYS.includes(today) ? today : "Monday");
  }, []);

  useEffect(() => {
    if (DEBUG_TIME) return; // don't tick when debugging
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (!user.branch || !user.year || !user.section) { setLoading(false); return; }
    api.get("/api/timetable/my")
      .then((res) => setTimetable(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (currentRef.current && activeDay === effectiveToday) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [timetable, activeDay]);

  const todaySchedule = timetable.find((t) => t.day === activeDay);
  const slots = todaySchedule?.slots || [];

  // ✅ Use effectiveToday so next class banner works in debug mode too
  const nextClass = activeDay === effectiveToday ? getNextClass(slots) : null;

  // Modern time formatting
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = (hours % 12 || 12).toString();

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric"
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-zinc-500 text-sm">Loading timetable...</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center max-w-sm w-full">
        <div className="text-6xl mb-5">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
        <p className="text-zinc-500 mb-8 text-sm">Please login to view your timetable</p>
        <button onClick={() => navigate("/login")}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-2xl font-semibold transition-all">
          Login →
        </button>
      </div>
    </div>
  );

  if (!user?.branch || !user?.year || !user?.section) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center max-w-sm w-full">
        <div className="text-6xl mb-5">📚</div>
        <h2 className="text-2xl font-bold text-white mb-2">Setup Profile First</h2>
        <p className="text-zinc-500 mb-8 text-sm">Add your Branch, Year and Section in profile</p>
        <button onClick={() => navigate("/profile")}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-2xl font-semibold transition-all">
          Go to Profile →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* ── Top Bar ── */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")}
            className="w-10 h-10 bg-zinc-800 hover:bg-amber-500 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0 font-bold text-lg">
            ‹
          </button>
          <div>
            <h1 className="text-xl font-black text-white leading-none tracking-tight">Timetable</h1>
            <p className="text-zinc-500 text-xs mt-0.5">{user.branch} • Year {user.year} • Sec {user.section}</p>
          </div>
          {/* Debug indicator */}
          {DEBUG_TIME && (
            <span className="ml-auto bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs px-2 py-1 rounded-lg font-bold">
              🧪 {DEBUG_TIME}
            </span>
          )}
        </div>

        {/* ── Modern Clock Card ── */}
        <div className="rounded-3xl p-6 mb-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1c1917 0%, #292524 50%, #1c1917 100%)", border: "1px solid #3f3f46" }}>

          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #f59e0b, transparent)", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #ef4444, transparent)", transform: "translate(-30%, 30%)" }} />

          <div className="relative flex items-end justify-between">
            <div>
              <div className="flex items-start gap-1">
                <span className="text-7xl font-black text-white tabular-nums leading-none" style={{ letterSpacing: "-4px" }}>
                  {hours}:{minutes}
                </span>
                <div className="flex flex-col justify-start mt-2 ml-1">
                  <span className="text-lg font-bold text-amber-400">{ampm}</span>
                </div>
              </div>
              <p className="text-zinc-400 text-sm mt-2">{dateStr}</p>
            </div>

            <div className="flex flex-col gap-1.5 items-end">
              <span className="bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full font-bold border border-amber-500/30">
                {user.branch}
              </span>
              <span className="bg-zinc-700/50 text-zinc-300 text-xs px-3 py-1 rounded-full font-medium">
                Yr {user.year} • Sec {user.section}
              </span>
            </div>
          </div>
        </div>

        {/* ── Next Class Banner ── */}
        {activeDay === effectiveToday && nextClass && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">⏰</div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-600 text-xs font-medium uppercase tracking-wider">Up Next</p>
              <p className="text-white font-bold truncate text-sm">{nextClass.subject}</p>
              <p className="text-zinc-600 text-xs">{nextClass.time} • {nextClass.room}</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl text-center">
              <p className="text-amber-400 text-lg font-black leading-none">
                {Math.max(0, parseTime(nextClass.time) - getNowMinutes())}
              </p>
              <p className="text-amber-600 text-xs">min</p>
            </div>
          </div>
        )}

        {/* ── Day Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: "none" }}>
          {DAYS.map((day) => {
            const isActive = activeDay === day;
            const isToday = day === today;
            return (
              <button key={day} onClick={() => setActiveDay(day)}
                className={`flex-shrink-0 relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-amber-500 text-white shadow-lg"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
                }`}>
                {day.slice(0, 3).toUpperCase()}
                {isToday && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full border border-zinc-950" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Schedule ── */}
        {slots.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-white font-bold text-xl">Free Day!</p>
            <p className="text-zinc-500 text-sm mt-1">No classes on {activeDay}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map((slot, i) => {
              // ✅ All use effectiveToday so debug mode works correctly
              const isCurrent = activeDay === effectiveToday && isCurrentSlot(slot);
              const upcoming  = activeDay === effectiveToday && isUpcoming(slot);
              const past      = activeDay === effectiveToday && isPast(slot);
              const progress  = isCurrent ? getProgress(slot) : 0;
              const timeLeft  = isCurrent ? getTimeLeft(slot) : "";
              const duration  = parseEndTime(slot.time) - parseTime(slot.time);
              const isLab     = slot.subject?.toLowerCase().includes("lab") || duration >= 90;

              return (
                <div key={i}
                  ref={isCurrent ? currentRef : null}
                  className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${past ? "opacity-35" : ""}`}
                  style={{
                    background: isCurrent
                      ? "linear-gradient(135deg, #1c1400 0%, #292000 100%)"
                      : isLab
                      ? "linear-gradient(135deg, #130b1f 0%, #1a0f2e 100%)"
                      : "#18181b",
                    border: isCurrent
                      ? "1px solid rgba(245,158,11,0.5)"
                      : upcoming
                      ? "1px solid rgba(234,179,8,0.3)"
                      : "1px solid #27272a",
                    boxShadow: isCurrent ? "0 0 20px rgba(245,158,11,0.08)" : "none"
                  }}>

                  {/* Left accent */}
                  <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${
                    isCurrent ? "bg-amber-500"
                    : isLab    ? "bg-violet-500"
                    : upcoming ? "bg-yellow-500"
                    : "bg-zinc-700"
                  }`} />

                  {/* Progress bar */}
                  {isCurrent && (
                    <div className="absolute bottom-0 left-0 h-0.5 transition-all duration-1000"
                      style={{ width: `${progress}%`, background: "linear-gradient(90deg, #f59e0b, #ef4444)" }} />
                  )}

                  <div className="pl-4 pr-4 py-3.5 flex items-center gap-3">
                    {/* Period badge */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black ${
                      isCurrent ? "bg-amber-500 text-white"
                      : isLab   ? "bg-violet-500/20 text-violet-400"
                      : "bg-zinc-800 text-zinc-500"
                    }`}>
                      {isCurrent ? "▶" : `P${i + 1}`}
                    </div>

                    {/* Time */}
                    <div className="flex-shrink-0 min-w-[64px]">
                      <p className={`font-bold text-sm tabular-nums ${isCurrent ? "text-amber-400" : "text-zinc-400"}`}>
                        {slot.time?.split("-")[0]}
                      </p>
                      {slot.time?.includes("-") && (
                        <p className="text-zinc-600 text-xs tabular-nums">{slot.time?.split("-")[1]}</p>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`font-bold text-sm truncate ${
                          isCurrent ? "text-white" : past ? "text-zinc-600" : "text-zinc-100"
                        }`}>
                          {slot.subject}
                        </p>
                        {isCurrent && (
                          <span className="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded-md font-bold animate-pulse flex-shrink-0">
                            LIVE
                          </span>
                        )}
                        {isLab && (
                          <span className="bg-violet-500/20 text-violet-400 text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0">
                            LAB
                          </span>
                        )}
                        {upcoming && !isCurrent && (
                          <span className="bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0">
                            SOON
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-0.5">
                        {slot.teacher && <span className="text-xs text-zinc-600 truncate">👤 {slot.teacher}</span>}
                        {slot.room    && <span className="text-xs text-zinc-600 flex-shrink-0">📍 {slot.room}</span>}
                      </div>
                    </div>

                    {/* Time left */}
                    {isCurrent && (
                      <div className="flex-shrink-0 text-right">
                        <p className="text-amber-400 text-xs font-bold">{timeLeft}</p>
                        <p className="text-zinc-600 text-xs">{progress}%</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Summary ── */}
        {activeDay === effectiveToday && slots.length > 0 && (
          <div className="mt-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-3 font-bold">Today</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Total", value: slots.length, color: "text-white" },
                { label: "Done",  value: slots.filter(s => isPast(s)).length, color: "text-emerald-400" },
                { label: "Left",  value: slots.filter(s => !isPast(s) && !isCurrentSlot(s)).length, color: "text-amber-400" },
                { label: "Labs",  value: slots.filter(s => s.subject?.toLowerCase().includes("lab") || (parseEndTime(s.time) - parseTime(s.time)) >= 90).length, color: "text-violet-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-zinc-800 rounded-xl p-3 text-center">
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
