import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useBoardStore } from "../store/Boardstore.js";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { useChat } from "@/features/chat/hooks/Usechat.js";
import { MessageSquare, Send, X, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/* ── Typing dots animation ───────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#6D5EF7] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </div>
  );
}

/* ── Chat Sidebar ─────────────────────────────────────────────── */
export function ChatSidebar() {
  const { boardId } = useParams();
  const { showChat, toggleChat } = useBoardStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const {
    messages, isLoading, typingUsers,
    sendMessage, startTyping, stopTyping, deleteMessage,
  } = useChat(boardId);

  /* Auto-scroll to latest message */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  if (!showChat) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendMessage(input);
    setInput("");
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (val.trim()) {
      startTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => stopTyping(), 2000);
    } else {
      stopTyping();
    }
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: 320 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 320 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed right-4 top-16 z-40 w-80 h-[540px] bg-white/95 backdrop-blur-xl border border-[#E5E7EB] rounded-2xl shadow-xl shadow-black/8 overflow-hidden flex flex-col font-sans select-text"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#F0F1F8] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6D5EF7] to-[#8B5CF6] flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0F0F1A] leading-none">Live Chat</h2>
            <p className="text-[10px] text-[#4B4B6A] mt-0.5">
              {typingUsers.length > 0 ? (
                <span className="text-[#6D5EF7]">{typingUsers.join(", ")} typing...</span>
              ) : (
                "Board collaboration chat"
              )}
            </p>
          </div>
        </div>
        <button
          onClick={toggleChat}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4B4B6A] hover:text-[#0F0F1A] hover:bg-[#F0F1F8] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <TypingDots />
              <p className="text-xs text-[#9CA3AF]">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#6D5EF7]/10 border border-[#6D5EF7]/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[#6D5EF7]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F0F1A]">No messages yet</p>
              <p className="text-xs text-[#9CA3AF] mt-1 max-w-[160px]">
                Start chatting with your collaborators in real-time
              </p>
            </div>
          </div>
        ) : (
          messages.map((m, index) => {
            const senderId = m.sender?._id || m.sender?.id || m.sender;
            const currentUserId = user?._id || user?.id;
            const isMe =
              String(senderId) === String(currentUserId) ||
              m.senderName === user?.fullName ||
              m.sender?.fullName === user?.fullName;

            const senderName = m.sender?.fullName || m.senderName || (isMe ? "You" : "Collaborator");
            const timeAgo = m.createdAt
              ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })
              : "just now";

            return (
              <div
                key={m._id || m.id || index}
                className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
              >
                {/* Sender + time */}
                <div className={`flex items-center gap-1.5 mb-1 px-0.5 ${isMe ? "flex-row-reverse" : ""}`}>
                  <span className="text-[11px] font-semibold text-[#4B4B6A]">{senderName}</span>
                  <span className="text-[10px] text-[#9CA3AF]">{timeAgo}</span>
                </div>

                {/* Bubble + delete */}
                <div className={`flex items-end gap-1.5 max-w-[85%] ${isMe ? "flex-row-reverse" : ""}`}>
                  {isMe && (
                    <button
                      onClick={() => deleteMessage(m._id || m.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#9CA3AF] hover:text-rose-500 transition-all rounded-lg flex-shrink-0"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                      isMe
                        ? "bg-[#6D5EF7] text-white rounded-br-sm shadow-[#6D5EF7]/15"
                        : "bg-[#F7F8FC] text-[#0F0F1A] rounded-bl-sm border border-[#E5E7EB]"
                    }`}
                  >
                    {m.content || m.text}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-start gap-2">
            <div className="px-3.5 py-2 bg-[#F7F8FC] border border-[#E5E7EB] rounded-2xl rounded-bl-sm">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-[#F0F1F8] bg-white flex items-center gap-2 flex-shrink-0"
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          className="flex-1 px-3.5 py-2 bg-[#F7F8FC] border border-[#E5E7EB] rounded-xl text-xs text-[#0F0F1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#6D5EF7] focus:ring-2 focus:ring-[#6D5EF7]/15 transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#6D5EF7] hover:bg-[#5B4CE0] disabled:opacity-40 text-white transition-all shadow-md shadow-[#6D5EF7]/25 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.aside>
  );
}

export default ChatSidebar;
