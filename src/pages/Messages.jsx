import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("chats"); // "chats" | "new"

  useEffect(() => {
    const load = async () => {
      try {
        const [convRes, usersRes] = await Promise.all([
          api.get("/api/chat/conversations"),
          api.get("/api/chat/users"),
        ]);
        setConversations(convRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <button onClick={() => navigate("/")} className="text-gray-500">← Back</button>
        <h1 className="text-xl font-bold">Messages</h1>
        <div />
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setTab("chats")}
          className={`flex-1 py-3 text-sm font-medium ${tab === "chats" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
        >
          Chats
        </button>
        <button
          onClick={() => setTab("new")}
          className={`flex-1 py-3 text-sm font-medium ${tab === "new" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
        >
          New Chat
        </button>
      </div>

      {tab === "chats" ? (
        <div>
          {conversations.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">💬</p>
              <p>No conversations yet</p>
              <button onClick={() => setTab("new")} className="mt-3 text-blue-500 text-sm">Start one →</button>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.conversationId}
                onClick={() => navigate(`/chat/${conv.other._id}`)}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b"
              >
                {conv.other.profileImage ? (
                  <img src={conv.other.profileImage} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {conv.other.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-black">{conv.other.name}</p>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          <div className="p-3 border-b">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {filtered.map((u) => (
            <div
              key={u._id}
              onClick={() => navigate(`/chat/${u._id}`)}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b"
            >
              {u.profileImage ? (
                <img src={u.profileImage} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {u.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-black">{u.name}</p>
                {u.username && <p className="text-xs text-gray-500">@{u.username}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}