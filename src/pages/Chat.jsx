import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { socket } from "../socket";
import api from "../api/axios";

export default function Chat() {
  const { userId: receiverId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [receiver, setReceiver] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // Connect socket and go online
  useEffect(() => {
    if (!user) return;
    socket.connect();
    socket.emit("user_online", user._id);

    socket.on("receive_message", (msg) => {
      if (
        msg.senderId === receiverId ||
        msg.receiverId === receiverId
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("message_sent", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user_typing", ({ senderId }) => {
      if (senderId === receiverId) setIsTyping(true);
    });

    socket.on("user_stop_typing", ({ senderId }) => {
      if (senderId === receiverId) setIsTyping(false);
    });

    socket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("receive_message");
      socket.off("message_sent");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("online_users");
      socket.disconnect();
    };
  }, [user, receiverId]);

  // Load messages and receiver info
  useEffect(() => {
    if (!receiverId) return;

    const load = async () => {
      try {
        const [msgsRes, usersRes] = await Promise.all([
          api.get(`/api/chat/messages/${receiverId}`),
          api.get("/api/chat/users"),
        ]);
        setMessages(msgsRes.data);
        const found = usersRes.data.find((u) => u._id === receiverId);
        setReceiver(found);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [receiverId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;
    socket.emit("send_message", {
      senderId: user._id,
      receiverId,
      text: text.trim(),
    });
    setText("");
    socket.emit("stop_typing", { senderId: user._id, receiverId });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    socket.emit("typing", { senderId: user._id, receiverId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { senderId: user._id, receiverId });
    }, 1000);
  };

  const isOnline = onlineUsers.includes(receiverId);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white shadow-sm">
        <button onClick={() => navigate("/messages")} className="text-gray-500 hover:text-black">
          ←
        </button>
        {receiver?.profileImage ? (
          <img src={receiver.profileImage} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {receiver?.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-black">{receiver?.name}</p>
          <p className={`text-xs ${isOnline ? "text-green-500" : "text-gray-400"}`}>
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, i) => {
          const isMine = msg.senderId === user._id || msg.senderId?._id === user._id;
          return (
            <div key={msg._id || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow-sm ${
                  isMine
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-white text-black rounded-bl-none border"
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${isMine ? "text-blue-100" : "text-gray-400"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border px-4 py-2 rounded-2xl rounded-bl-none text-sm text-gray-400 shadow-sm">
              typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white flex gap-2">
        <input
          value={text}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-40"
        >
          ➤
        </button>
      </div>
    </div>
  );
}