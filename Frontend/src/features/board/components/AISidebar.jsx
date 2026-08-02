import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIWorkspace } from "@/features/ai/hooks/Useaiworkspace.js";
import {
  Bot, X, Send, Loader2, Copy, Check, ArrowRight, Trash2
} from "lucide-react";
import toast from "react-hot-toast";

/* Code block with 1-click Copy */
function CodeBlock({ content }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: "relative",
      backgroundColor: "#111118",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "12px 14px",
      margin: "8px 0",
      fontSize: 12,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      color: "#A5B4FC",
      lineHeight: 1.6,
      overflowX: "auto",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}>
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          padding: 5,
          borderRadius: 6,
          border: "none",
          backgroundColor: "rgba(255,255,255,0.08)",
          color: "#818CF8",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Copy code"
      >
        {copied ? <Check style={{ width: 12, height: 12, color: "#34D399" }} /> : <Copy style={{ width: 12, height: 12 }} />}
      </button>
      {content}
    </div>
  );
}

/* User Bubble */
function UserBubble({ content }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
      <div style={{
        maxWidth: "85%",
        backgroundColor: "#6D5EF7",
        color: "#ffffff",
        fontSize: 13,
        lineHeight: 1.5,
        borderRadius: "16px 16px 4px 16px",
        padding: "10px 14px",
        boxShadow: "0 2px 8px rgba(109,94,247,0.25)",
        wordBreak: "break-word",
      }}>
        {content}
      </div>
    </div>
  );
}

/* AI Response Bubble */
function AIBubble({ msg, onInsert }) {
  const { content, summary, isError } = msg;

  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const codeContent = part.slice(3, -3).replace(/^[a-zA-Z]+\n/, "").trim();
        return <CodeBlock key={index} content={codeContent} />;
      }
      return (
        <p key={index} style={{
          fontSize: 13,
          lineHeight: 1.55,
          color: isError ? "#991B1B" : "#0F0F1A",
          margin: "4px 0",
          whiteSpace: "pre-wrap",
        }}>
          {part}
        </p>
      );
    });
  };

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        backgroundColor: "#EDE9FE",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 2,
      }}>
        <Bot style={{ width: 16, height: 16, color: "#6D5EF7" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          backgroundColor: isError ? "#FEF2F2" : "#F9FAFB",
          border: isError ? "1px solid #FCA5A5" : "1px solid #F0F1F5",
          borderRadius: "4px 16px 16px 16px",
          padding: "12px 14px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          {renderFormattedText(content)}

          {summary && (
            <div style={{
              marginTop: 8,
              padding: "6px 10px",
              backgroundColor: "#ffffff",
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              fontSize: 11,
              fontWeight: 600,
              color: "#4B5563",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span>📌 {summary}</span>
            </div>
          )}
        </div>

        {onInsert && content && !isError && (
          <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
            <button
              onClick={() => onInsert(content)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#EDE9FE",
                color: "#6D5EF7",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#DDD6FE"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#EDE9FE"; }}
            >
              Insert on board <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* Main AI Sidebar Component */
export function AISidebar({ emitElementUpdate, emitElementDelete, emitCanvasSave }) {
  const {
    showAI,
    toggleAI,
    messages,
    input,
    setInput,
    isProcessing,
    streamingStep,
    selectedElementIds,
    handleSendPrompt,
    handleClearChat,
    handleInsertOnBoard,
  } = useAIWorkspace({ emitElementUpdate, emitElementDelete, emitCanvasSave });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!showAI) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, showAI]);

  if (!showAI) return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const card = {
    position: "fixed", right: isMobile ? 0 : 16, top: 64, zIndex: 40,
    width: isMobile ? "100vw" : 350, maxWidth: "100vw", height: isMobile ? "calc(100vh - 64px)" : "calc(100vh - 80px)", maxHeight: isMobile ? "none" : 650,
    backgroundColor: "#ffffff",
    borderRadius: isMobile ? 0 : 20,
    border: isMobile ? "none" : "1px solid #E8E9F0",
    boxShadow: "0 12px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
    display: "flex", flexDirection: "column",
    fontFamily: "Inter, system-ui, sans-serif",
    overflow: "hidden",
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: 350 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 350 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={card}
    >
      {/* Header */}
      <div style={{
        padding: "14px 18px",
        borderBottom: "1px solid #F0F1F5",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            backgroundColor: "#EDE9FE",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Bot style={{ width: 18, height: 18, color: "#6D5EF7" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0F0F1A", margin: 0 }}>
                AI Assistant
              </h2>
              {selectedElementIds.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#6D5EF7", backgroundColor: "#EDE9FE", padding: "1px 6px", borderRadius: 999 }}>
                  {selectedElementIds.length} selected
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, marginTop: 1 }}>
              Board architect & collaborator
            </p>
          </div>
        </div>

        {/* Header Action Icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={handleClearChat}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: "none", backgroundColor: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#9CA3AF",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F3F4F6"; e.currentTarget.style.color = "#374151"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
            title="Clear Chat"
          >
            <Trash2 style={{ width: 15, height: 15 }} />
          </button>
          <button
            onClick={toggleAI}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: "none", backgroundColor: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#9CA3AF",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F3F4F6"; e.currentTarget.style.color = "#374151"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
            title="Close"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {/* Streaming / Processing Step Banner */}
      {streamingStep && (
        <div style={{
          padding: "8px 16px",
          backgroundColor: "#EDE9FE",
          borderBottom: "1px solid #C4B5FD",
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 12, fontWeight: 700, color: "#6D5EF7",
          flexShrink: 0,
        }}>
          <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
          <span>{streamingStep}</span>
        </div>
      )}

      {/* Messages List */}
      <div style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: "16px 16px 6px",
        display: "flex", flexDirection: "column",
      }}>
        {messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, padding: "20px 0", textAlign: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              backgroundColor: "#EDE9FE",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 4px",
            }}>
              <Bot style={{ width: 22, height: 22, color: "#6D5EF7" }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#0F0F1A", margin: 0 }}>AI Assistant</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6, margin: "6px 0 0", maxWidth: 240, lineHeight: 1.5 }}>
                Type any prompt below to create diagrams, edit notes, generate code, or analyze your whiteboard.
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {msg.role === "user" ? (
                  <UserBubble content={msg.content} />
                ) : (
                  <AIBubble msg={msg} onInsert={handleInsertOnBoard} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        <div ref={messagesEndRef} style={{ height: 4 }} />
      </div>

      {/* Input Footer */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSendPrompt(); }}
        style={{
          padding: "14px 18px",
          borderTop: "1px solid #F0F1F5",
          backgroundColor: "#ffffff",
          display: "flex", alignItems: "center", gap: 8,
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask AI Assistant or type canvas instructions…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isProcessing}
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
          disabled={!input.trim() || isProcessing}
          style={{
            width: 38, height: 38,
            borderRadius: 12,
            backgroundColor: input.trim() && !isProcessing ? "#6D5EF7" : "#E5E7EB",
            color: input.trim() && !isProcessing ? "#ffffff" : "#9CA3AF",
            border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: input.trim() && !isProcessing ? "pointer" : "not-allowed",
            flexShrink: 0,
            transition: "all 0.2s",
            boxShadow: input.trim() && !isProcessing ? "0 2px 8px rgba(109,94,247,0.25)" : "none",
          }}
          onMouseEnter={(e) => { if (input.trim() && !isProcessing) e.currentTarget.style.backgroundColor = "#5B4CE0"; }}
          onMouseLeave={(e) => { if (input.trim() && !isProcessing) e.currentTarget.style.backgroundColor = "#6D5EF7"; }}
        >
          {isProcessing ? (
            <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
          ) : (
            <Send style={{ width: 14, height: 14 }} />
          )}
        </button>
      </form>
    </motion.aside>
  );
}

export default AISidebar;
