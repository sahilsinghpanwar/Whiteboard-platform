import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useChat } from "@/hooks/useChat";
import Avatar from "@/components/ui/Avatar";
import styles from "./ChatPanel.module.css";

const ChatMessage = ({ message, isOwn, onDelete }) => (
  <div className={`${styles.message} ${isOwn ? styles.own : ""}`}>
    {!isOwn && (
      <Avatar user={message.sender} size="xs" className={styles.msgAvatar} />
    )}
    <div className={styles.msgContent}>
      {!isOwn && (
        <span className={styles.msgAuthor}>{message.sender?.fullName}</span>
      )}
      <div className={styles.msgBubble}>
        <p className={styles.msgText}>{message.content}</p>
        {isOwn && (
          <button
            className={styles.deleteBtn}
            onClick={() => onDelete(message._id)}
            aria-label="Delete message"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      <span className={styles.msgTime}>
        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
      </span>
    </div>
  </div>
);

const ChatPanel = ({ boardId }) => {
  const { messages, isLoading, sendMessage, deleteMessage, currentUserId } =
    useChat(boardId);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <motion.div
      className={styles.panel}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>Chat</h3>
        <span className={styles.count}>{messages.length}</span>
      </div>

      <div className={styles.messages}>
        {isLoading ? (
          <div className={styles.loading}>Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className={styles.empty}>
            <p>No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg._id}
              message={msg}
              isOwn={msg.sender?._id === currentUserId}
              onDelete={deleteMessage}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form className={styles.inputRow} onSubmit={handleSend}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message…"
          maxLength={2000}
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
    </motion.div>
  );
};

export default ChatPanel;