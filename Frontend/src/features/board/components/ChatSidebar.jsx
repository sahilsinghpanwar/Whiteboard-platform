import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBoardStore } from "../store/Boardstore.js";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { useChat } from "@/features/chat/hooks/Usechat.js";
import { MessageSquare, Send, X, Trash2, Wifi } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/* ── Avatar colors ────────────────────────────────────────────── */
const PALETTE = [
  "#6D5EF7", "#10B981", "#F59E0B", "#3B82F6",
  "#EF4444", "#8B5CF6", "#14B8A6", "#F97316",
  "#EC4899", "#06B6D4",
];
function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

/* ── Micro Avatar ───────────────────────────────────────────────── */
function MiniAvatar({ name }) {
  return (
    <div
      style={{
        width: 28, height: 28, borderRadius: "50%",
        backgroundColor: avatarColor(name),
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: "#fff",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
      }}
    >
      {initials(name)}
    </div>
  );
}

/* ── Typing dots ────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{
            width: 5, height: 5, borderRadius: "50%",
            backgroundColor: "#6D5EF7", display: "block",
          }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, padding: "20px 0", textAlign: "center" }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        backgroundColor: "#EDE9FE",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 4px",
      }}>
        <MessageSquare style={{ width: 20, height: 20, color: "#6D5EF7" }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#0F0F1A", margin: 0 }}>No messages yet</p>
      <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, maxWidth: 200 }}>
        Start chatting with your collaborators in real-time
      </p>
    </div>
  );
}

/* ── Main ChatSidebar ─────────────────────────────────────────── */
export function ChatSidebar() {
  const { boardId } = useParams();
  const { showChat, toggleChat } = useBoardStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const {
    messages, isLoading, typingUsers,
    sendMessage, startTyping, stopTyping, deleteMessage,
  } = useChat(boardId);

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
    stopTyping();
    inputRef.current?.focus();
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) handleSend(e);
  };

  /* inline style object — 100% identical pattern as MembersSidebar */
  const card = {
    position: "fixed", right: 16, top: 64, zIndex: 40,
    width: 320, maxHeight: "calc(100vh - 80px)",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    border: "1px solid #E8E9F0",
    boxShadow: "0 12px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
    display: "flex", flexDirection: "column",
    fontFamily: "Inter, system-ui, sans-serif",
    overflow: "hidden",
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: 340 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 340 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={card}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #F0F1F5",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0F0F1A", margin: 0 }}>
            Live Chat
          </h2>
          {/* Live pill */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 700, color: "#059669",
            backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0",
            padding: "2px 8px", borderRadius: 999,
          }}>
            <Wifi style={{ width: 10, height: 10 }} />
            Live
          </span>
        </div>

        {/* Close Button */}
        <button
          onClick={toggleChat}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: "none", backgroundColor: "transparent",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#9CA3AF",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F3F4F6"; e.currentTarget.style.color = "#374151"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Typing indicator banner if any */}
      {typingUsers.length > 0 && (
        <div style={{ padding: "6px 20px", backgroundColor: "#EDE9FE", borderBottom: "1px solid #C4B5FD", fontSize: 11, fontWeight: 600, color: "#6D5EF7" }}>
          {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing…
        </div>
      )}

      {/* ── Messages List ────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {isLoading ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <EmptyState />
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

            const prevMsg = messages[index - 1];
            const prevSenderId = prevMsg?.sender?._id || prevMsg?.sender?.id || prevMsg?.sender;
            const isSameAuthorAsPrev = prevSenderId && String(prevSenderId) === String(senderId);
            const showMeta = !isSameAuthorAsPrev;

            return (
              <div
                key={m._id || m.id || index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                  marginTop: showMeta && index > 0 ? 8 : 2,
                }}
              >
                {/* Author + time */}
                {showMeta && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
                    flexDirection: isMe ? "row-reverse" : "row",
                    paddingLeft: isMe ? 0 : 34,
                  }}>
                    {!isMe && <MiniAvatar name={senderName} />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0F0F1A" }}>{senderName}</span>
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>{timeAgo}</span>
                  </div>
                )}

                {/* Bubble row */}
                <div
                  className="chat-msg-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    maxWidth: "85%",
                    flexDirection: isMe ? "row-reverse" : "row",
                    paddingLeft: !isMe && !showMeta ? 34 : 0,
                  }}
                >
                  {/* Delete button (own messages) */}
                  {isMe && (
                    <button
                      onClick={() => deleteMessage(m._id || m.id)}
                      title="Delete message"
                      style={{
                        opacity: 0, padding: 4, borderRadius: 6, border: "none",
                        backgroundColor: "transparent", color: "#9CA3AF",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        transition: "all 0.15s", flexShrink: 0,
                      }}
                      className="chat-delete-btn"
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.backgroundColor = "#FEE2E2"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  )}

                  {/* Bubble */}
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    fontSize: 13,
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                    backgroundColor: isMe ? "#6D5EF7" : "#F3F4F6",
                    color: isMe ? "#ffffff" : "#0F0F1A",
                    border: isMe ? "none" : "1px solid #E5E7EB",
                    boxShadow: isMe ? "0 2px 8px rgba(109,94,247,0.25)" : "none",
                  }}>
                    {m.content || m.text}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator bubble */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}
            >
              <div style={{
                padding: "8px 12px",
                borderRadius: "16px 16px 16px 4px",
                backgroundColor: "#F3F4F6",
                border: "1px solid #E5E7EB",
              }}>
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} style={{ height: 4 }} />
      </div>

      {/* ── Input Footer ─────────────────────────────────────── */}
      <form
        onSubmit={handleSend}
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #F0F1F5",
          backgroundColor: "#ffffff",
          display: "flex", alignItems: "center", gap: 8,
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          maxLength={2000}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            backgroundColor: "#F9FAFB",
            color: "#0F0F1A",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#6D5EF7";
            e.target.style.backgroundColor = "#ffffff";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E5E7EB";
            e.target.style.backgroundColor = "#F9FAFB";
          }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          style={{
            width: 38, height: 38,
            borderRadius: 12,
            backgroundColor: input.trim() ? "#6D5EF7" : "#E5E7EB",
            color: input.trim() ? "#ffffff" : "#9CA3AF",
            border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: input.trim() ? "pointer" : "not-allowed",
            flexShrink: 0,
            transition: "all 0.2s",
            boxShadow: input.trim() ? "0 2px 8px rgba(109,94,247,0.25)" : "none",
          }}
          onMouseEnter={(e) => { if (input.trim()) e.currentTarget.style.backgroundColor = "#5B4CE0"; }}
          onMouseLeave={(e) => { if (input.trim()) e.currentTarget.style.backgroundColor = "#6D5EF7"; }}
        >
          <Send style={{ width: 14, height: 14 }} />
        </button>
      </form>

      {/* Global hover-reveal for delete buttons */}
      <style>{`
        .chat-msg-row:hover .chat-delete-btn {
          opacity: 1 !important;
        }
      `}</style>
    </motion.aside>
  );
}

export default ChatSidebar;
