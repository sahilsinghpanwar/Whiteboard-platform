import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useBoardStore } from "../store/Boardstore.js";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { useChat } from "@/features/chat/hooks/Usechat.js";
import { MessageSquare, Send, X, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ChatSidebar() {
  const { boardId } = useParams();
  const { showChat, toggleChat } = useBoardStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const {
    messages,
    isLoading,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    deleteMessage,
  } = useChat(boardId);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!showChat) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  return (
    <aside className="fixed right-4 top-20 z-40 w-80 h-[520px] bg-[#18181c]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white animate-in slide-in-from-right-5 duration-200 font-sans">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-indigo-900/40">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Board Chat</h2>
        </div>
        <button
          onClick={toggleChat}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message Stream */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-xs text-zinc-500">
            Loading chat history...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageSquare className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400 font-medium">No messages yet</p>
            <p className="text-[11px] text-zinc-500 mt-1">Start collaborating with your team!</p>
          </div>
        ) : (
          messages.map((m, index) => {
            const isMe = m.sender?._id === user?._id || m.sender === user?._id || m.sender?.fullName === user?.fullName;
            const senderName = m.sender?.fullName || m.senderName || (isMe ? "You" : "Collaborator");
            const timeAgo = m.createdAt ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true }) : "just now";

            return (
              <div
                key={m._id || m.id || index}
                className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] text-zinc-400 font-medium">{senderName}</span>
                  <span className="text-[9px] text-zinc-500">{timeAgo}</span>
                </div>

                <div className="flex items-center gap-1">
                  {isMe && (
                    <button
                      onClick={() => deleteMessage(m._id || m.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div
                    className={`px-3 py-2 rounded-2xl text-xs max-w-[220px] leading-relaxed break-words ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20"
                        : "bg-white/10 text-zinc-200 rounded-bl-none border border-white/5"
                    }`}
                  >
                    {m.content || m.text}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Real-time Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="text-[11px] italic text-indigo-300 animate-pulse px-1">
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/30 flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          className="flex-1 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
}

export default ChatSidebar;
