import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const JMI_NEWS_RSS = "https://api.rss2json.com/v1/api.json?rss_url=https://www.jmi.ac.in/rss/news.xml";
const JMI_NOTIF_RSS = "https://api.rss2json.com/v1/api.json?rss_url=https://www.jmi.ac.in/rss/notifications.xml";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hrs < 24)   return `${hrs}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function ItemCard({ item, type }) {
  return (
    <a href={item.link} target="_blank" rel="noreferrer"
      className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-4 transition-all active:scale-[0.99] group">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
          type === "news"
            ? "bg-blue-500/20 text-blue-400"
            : "bg-amber-500/20 text-amber-400"
        }`}>
          {type === "news" ? "📰" : "🔔"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm line-clamp-2 group-hover:text-blue-300 transition-colors">
            {item.title}
          </p>
          {item.description && (
            <p className="text-zinc-500 text-xs mt-1 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: item.description.replace(/<[^>]+>/g, "") }} />
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-zinc-600 text-xs">{timeAgo(item.pubDate)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              type === "news"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-amber-500/20 text-amber-400"
            }`}>
              {type === "news" ? "News" : "Notification"}
            </span>
            <span className="text-blue-400 text-xs ml-auto group-hover:underline">Read →</span>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function JMIAlert() {
  const navigate = useNavigate();
  const [tab, setTab]         = useState("news");
  const [news, setNews]       = useState([]);
  const [notifs, setNotifs]   = useState([]);
  const [loadingNews, setLoadingNews]   = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [errorNews, setErrorNews]   = useState(false);
  const [errorNotifs, setErrorNotifs] = useState(false);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    // Fetch news
    setLoadingNews(true);
    setErrorNews(false);
    fetch(JMI_NEWS_RSS)
      .then(r => r.json())
      .then(data => {
        if (data.status === "ok") setNews(data.items || []);
        else setErrorNews(true);
      })
      .catch(() => setErrorNews(true))
      .finally(() => setLoadingNews(false));

    // Fetch notifications
    setLoadingNotifs(true);
    setErrorNotifs(false);
    fetch(JMI_NOTIF_RSS)
      .then(r => r.json())
      .then(data => {
        if (data.status === "ok") setNotifs(data.items || []);
        else setErrorNotifs(true);
      })
      .catch(() => setErrorNotifs(true))
      .finally(() => setLoadingNotifs(false));
  }, []);

  const currentItems = tab === "news" ? news : notifs;
  const isLoading    = tab === "news" ? loadingNews : loadingNotifs;
  const hasError     = tab === "news" ? errorNews : errorNotifs;
  const type         = tab === "news" ? "news" : "notif";

  const filtered = currentItems.filter(i =>
    !search || i.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/")}
            className="w-10 h-10 bg-zinc-800 hover:bg-red-500 text-white rounded-xl flex items-center justify-center font-bold text-lg transition-all flex-shrink-0">
            ‹
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">JMI Alert</h1>
            <p className="text-zinc-500 text-xs">Jamia Millia Islamia — News & Notifications</p>
          </div>
          <a href="https://www.jmi.ac.in" target="_blank" rel="noreferrer"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs px-3 py-2 rounded-xl transition-all">
            jmi.ac.in ↗
          </a>
        </div>

        {/* Hero banner */}
        <div className="rounded-3xl p-5 mb-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", border: "1px solid #312e81" }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)", transform: "translate(30%,-30%)" }} />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
              🏛️
            </div>
            <div>
              <p className="text-white font-black text-lg leading-tight">Jamia Millia Islamia</p>
              <p className="text-indigo-300 text-xs mt-0.5">Stay updated with official news & notifications</p>
              <div className="flex gap-3 mt-2">
                <span className="text-indigo-400 text-xs font-semibold">{news.length} News</span>
                <span className="text-amber-400 text-xs font-semibold">{notifs.length} Notifications</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-900 rounded-2xl p-1 mb-4 border border-zinc-800">
          <button onClick={() => { setTab("news"); setSearch(""); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              tab === "news" ? "bg-blue-500 text-white shadow-lg" : "text-zinc-400 hover:text-white"
            }`}>
            📰 Jamia News
            {!loadingNews && news.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "news" ? "bg-white/20" : "bg-zinc-700"}`}>
                {news.length}
              </span>
            )}
          </button>
          <button onClick={() => { setTab("notifs"); setSearch(""); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              tab === "notifs" ? "bg-amber-500 text-white shadow-lg" : "text-zinc-400 hover:text-white"
            }`}>
            🔔 Notifications
            {!loadingNotifs && notifs.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "notifs" ? "bg-white/20" : "bg-zinc-700"}`}>
                {notifs.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <input
          placeholder={`🔍 Search ${tab === "news" ? "news" : "notifications"}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 mb-4 transition-colors"
        />

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3 ${
              tab === "news" ? "border-blue-500" : "border-amber-500"
            }`} />
            <p className="text-zinc-500 text-sm">Fetching from JMI website...</p>
          </div>
        ) : hasError ? (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <p className="text-4xl mb-3">😔</p>
            <p className="text-white font-bold mb-1">Couldn't load from JMI</p>
            <p className="text-zinc-500 text-sm mb-4">The JMI RSS feed may be unavailable right now</p>
            <a href={tab === "news" ? "https://www.jmi.ac.in/news" : "https://www.jmi.ac.in/notifications"}
              target="_blank" rel="noreferrer"
              className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all">
              Visit JMI Website ↗
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <p className="text-4xl mb-3">{tab === "news" ? "📰" : "🔔"}</p>
            <p className="text-white font-bold">
              {search ? "No results found" : `No ${tab === "news" ? "news" : "notifications"} available`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, i) => (
              <ItemCard key={i} item={item} type={tab === "news" ? "news" : "notif"} />
            ))}
          </div>
        )}

        {/* Footer link */}
        {!isLoading && !hasError && filtered.length > 0 && (
          <div className="mt-5 text-center">
            <a href="https://www.jmi.ac.in" target="_blank" rel="noreferrer"
              className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
              All content sourced from jmi.ac.in ↗
            </a>
          </div>
        )}

      </div>
    </div>
  );
}