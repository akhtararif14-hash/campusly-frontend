import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseTime(timeStr) {
  // Handles "09:00-09:50" or "09:00 AM" formats
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

function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
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
  const [now, setNow] = useState(new Date());
  const currentRef = useRef(null);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  useEffect(() => {
    setActiveDay(DAYS.includes(today) ? today : "Monday");
  }, []);

  // Live clock — update every 30 seconds
  useEffect(() => {
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

  // Scroll to current period
  useEffect(() => {
    if (currentRef.current && activeDay === today) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [timetable, activeDay]);

  const todaySchedule = timetable.find((t) => t.day === activeDay);
  const slots = todaySchedule?.slots || [];
  const nextClass = activeDay === today ? getNextClass(slots) : null;

  const formatClock = (d) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading timetable...</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 text-center max-w-sm w-full">
        <div className="text-6xl mb-5">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
        <p className="text-white/60 mb-8 text-sm">Please login to view your timetable</p>
        <button onClick={() => navigate("/login")}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-2xl font-semibold transition-all active:scale-95">
          Login →
        </button>
      </div>
    </div>
  );

  if (!user?.branch || !user?.year || !user?.section) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 text-center max-w-sm w-full">
        <div className="text-6xl mb-5">📚</div>
        <h2 className="text-2xl font-bold text-white mb-2">Setup Profile First</h2>
        <p className="text-white/60 mb-8 text-sm">Add your Branch, Year and Section in your profile</p>
        <button onClick={() => navigate("/profile")}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-2xl font-semibold transition-all active:scale-95">
          Go to Profile →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Timetable</h1>
            <p className="text-indigo-300 text-sm mt-1">
              {user.branch} • Year {user.year} • Sec {user.section}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-xl tabular-nums">{formatClock(now)}</p>
            <p className="text-indigo-300 text-xs">{today}</p>
          </div>
        </div>

        {/* ── Next Class Banner (today only) ── */}
        {activeDay === today && nextClass && (
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-4 mb-5 flex items-center gap-4 shadow-lg shadow-indigo-900/50">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl">⏰</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Next Class</p>
              <p className="text-white font-bold truncate">{nextClass.subject}</p>
              <p className="text-white/60 text-xs">{nextClass.time} • {nextClass.room}</p>
            </div>
            <div className="bg-white/20 px-3 py-1.5 rounded-xl">
              <p className="text-white text-xs font-bold">
                {Math.max(0, parseTime(nextClass.time) - getNowMinutes())}m
              </p>
            </div>
          </div>
        )}

        {/* ── Day Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {DAYS.map((day) => {
            const isActive = activeDay === day;
            const isToday = day === today;
            return (
              <button key={day} onClick={() => setActiveDay(day)}
                className={`flex-shrink-0 relative px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 scale-105"
                    : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                }`}>
                {day.slice(0, 3)}
                {isToday && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-slate-900" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Schedule ── */}
        {slots.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-white font-bold text-xl">No Classes!</p>
            <p className="text-white/40 text-sm mt-1">Enjoy your free day on {activeDay}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot, i) => {
              const isCurrent = activeDay === today && isCurrentSlot(slot);
              const upcoming = activeDay === today && isUpcoming(slot);
              const past = activeDay === today && isPast(slot);
              const progress = isCurrent ? getProgress(slot) : 0;
              const timeLeft = isCurrent ? getTimeLeft(slot) : "";
              const isLab = slot.subject?.toLowerCase().includes("lab") ||
                            slot.time?.includes("04") ||
                            (parseEndTime(slot.time) - parseTime(slot.time)) >= 90;

              return (
                <div key={i}
                  ref={isCurrent ? currentRef : null}
                  className={`relative rounded-2xl overflow-hidden transition-all duration-500 ${
                    isCurrent
                      ? "ring-2 ring-green-400 ring-offset-2 ring-offset-slate-900 shadow-xl shadow-green-500/20 scale-[1.02]"
                      : upcoming
                      ? "ring-1 ring-yellow-400/50"
                      : past
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  {/* Card background */}
                  <div className={`absolute inset-0 ${
                    isCurrent
                      ? "bg-gradient-to-r from-green-900/80 to-emerald-900/60"
                      : isLab
                      ? "bg-gradient-to-r from-purple-900/80 to-violet-900/60"
                      : "bg-white/8"
                  } backdrop-blur-sm`} />

                  {/* Progress bar for current period */}
                  {isCurrent && (
                    <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-1000"
                      style={{ width: `${progress}%` }} />
                  )}

                  <div className="relative p-4 flex items-center gap-4">
                    {/* Period number */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${
                      isCurrent ? "bg-green-400 text-green-900"
                      : isLab ? "bg-purple-500/40 text-purple-300"
                      : "bg-white/10 text-white/50"
                    }`}>
                      {isCurrent ? "▶" : `P${i + 1}`}
                    </div>

                    {/* Time */}
                    <div className={`flex-shrink-0 text-center min-w-[72px] ${
                      isCurrent ? "text-green-300" : "text-indigo-300"
                    }`}>
                      <p className="font-bold text-xs tabular-nums">
                        {slot.time?.split("-")[0]}
                      </p>
                      {slot.time?.includes("-") && (
                        <p className="text-xs opacity-60 tabular-nums">
                          {slot.time?.split("-")[1]}
                        </p>
                      )}
                    </div>

                    {/* Subject info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-bold truncate ${
                          isCurrent ? "text-white" : past ? "text-white/40" : "text-white/90"
                        }`}>
                          {slot.subject}
                        </p>
                        {isLab && (
                          <span className="bg-purple-500/30 text-purple-300 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            LAB
                          </span>
                        )}
                        {isCurrent && (
                          <span className="bg-green-400/20 text-green-300 text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 animate-pulse">
                            LIVE
                          </span>
                        )}
                        {upcoming && (
                          <span className="bg-yellow-400/20 text-yellow-300 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            SOON
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3 mt-1 flex-wrap">
                        {slot.teacher && (
                          <span className={`text-xs ${isCurrent ? "text-green-300/70" : "text-white/40"}`}>
                            👤 {slot.teacher}
                          </span>
                        )}
                        {slot.room && (
                          <span className={`text-xs ${isCurrent ? "text-green-300/70" : "text-white/40"}`}>
                            📍 {slot.room}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Time left / progress */}
                    <div className="flex-shrink-0 text-right">
                      {isCurrent ? (
                        <div>
                          <p className="text-green-400 text-xs font-bold">{timeLeft}</p>
                          <p className="text-green-400/60 text-xs">{progress}%</p>
                        </div>
                      ) : past && activeDay === today ? (
                        <p className="text-white/20 text-xs">Done</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Today summary ── */}
        {activeDay === today && slots.length > 0 && (
          <div className="mt-6 bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Today's Summary</p>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-white font-bold text-lg">{slots.length}</p>
                <p className="text-white/40 text-xs">Total</p>
              </div>
              <div className="text-center">
                <p className="text-green-400 font-bold text-lg">
                  {slots.filter(s => isPast(s)).length}
                </p>
                <p className="text-white/40 text-xs">Done</p>
              </div>
              <div className="text-center">
                <p className="text-yellow-400 font-bold text-lg">
                  {slots.filter(s => !isPast(s) && !isCurrentSlot(s)).length}
                </p>
                <p className="text-white/40 text-xs">Left</p>
              </div>
              <div className="text-center">
                <p className="text-purple-400 font-bold text-lg">
                  {slots.filter(s => s.subject?.toLowerCase().includes("lab")).length}
                </p>
                <p className="text-white/40 text-xs">Labs</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}