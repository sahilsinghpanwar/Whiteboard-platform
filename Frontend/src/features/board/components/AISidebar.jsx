import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBoardStore } from "../store/Boardstore.js";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { aiApi } from "@/features/ai/api/Ai.api.js";
import { X, Plus, Send, Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

/* ── Constants ────────────────────────────────────────────────── */
const DOT_COLORS = ["#10B981", "#8B5CF6", "#F59E0B", "#3B82F6", "#EF4444", "#6D5EF7", "#EC4899"];
const AVATAR_BG  = ["#6D5EF7", "#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#14B8A6"];

/* ── Helpers ──────────────────────────────────────────────────── */

/** Detect if a string looks like a code / schema block */
const isCodeLike = (text) =>
  /(\n {2,}|\t|[{}();]|SELECT |CREATE |INSERT |=>)/.test(text) ||
  (text.includes("\n") && text.split("\n").some((l) => l.startsWith("  ")));

/** Format AI response into segments: text paragraphs and code blocks */
const parseResponse = (text) => {
  if (!text) return [];
  const lines = text.split("\n");
  const segments = [];
  let codeLines = [];
  let textLines = [];

  const flushText = () => {
    if (textLines.length > 0) {
      segments.push({ type: "text", content: textLines.join("\n").trim() });
      textLines = [];
    }
  };
  const flushCode = () => {
    if (codeLines.length > 0) {
      segments.push({ type: "code", content: codeLines.join("\n") });
      codeLines = [];
    }
  };

  let inCode = false;
  for (const line of lines) {
    if (line.startsWith("```") || (line.startsWith("  ") && !inCode && codeLines.length === 0 && isCodeLike(text))) {
      if (!inCode) { flushText(); inCode = true; }
      if (!line.startsWith("```")) codeLines.push(line);
    } else if (inCode && line.startsWith("```")) {
      flushCode();
      inCode = false;
    } else if (inCode) {
      codeLines.push(line);
    } else {
      textLines.push(line);
    }
  }
  flushText();
  flushCode();

  // If nothing was split into code, check the whole block
  if (segments.length === 1 && segments[0].type === "text" && isCodeLike(text)) {
    return [{ type: "code", content: text }];
  }

  return segments.length > 0 ? segments : [{ type: "text", content: text }];
};

/* ── Avatar component ─────────────────────────────────────────── */
function Avatar({ name = "U", size = 32, colorIndex = 0, src }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{
        width: size, height: size,
        backgroundColor: AVATAR_BG[colorIndex % AVATAR_BG.length],
        fontSize: size * 0.38,
      }}
    >
      {(name?.[0] || "U").toUpperCase()}
    </div>
  );
}

/* ── User message bubble ──────────────────────────────────────── */
function UserBubble({ content }) {
  return (
    <div className="flex justify-center px-1 mb-3">
      <div className="max-w-[88%] bg-[#6D5EF7] text-white text-[13px] leading-[1.55] rounded-2xl rounded-br-md px-4 py-3 shadow-sm shadow-[#6D5EF7]/20">
        {content}
      </div>
    </div>
  );
}

/* ── AI response bubble ───────────────────────────────────────── */
function AIBubble({ content, onInsert }) {
  const segments = parseResponse(content);

  return (
    <div className="mb-3 space-y-2">
      {segments.map((seg, i) =>
        seg.type === "code" ? (
          <div
            key={i}
            className="mx-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[12px] font-mono text-[#1F2937] leading-[1.7] overflow-x-auto whitespace-pre"
          >
            {seg.content}
          </div>
        ) : (
          <p key={i} className="px-1 text-[13px] text-[#1F2937] leading-[1.6]">
            {seg.content}
          </p>
        )
      )}

      {/* Insert on board button */}
      <div className="px-1 pt-1">
        <button
          onClick={() => onInsert(content)}
          className="w-full py-2.5 bg-[#6D5EF7] hover:bg-[#5B4CE0] text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm shadow-[#6D5EF7]/25 active:scale-[0.98]"
        >
          Insert on board
        </button>
      </div>
    </div>
  );
}

/* ── Thinking indicator ───────────────────────────────────────── */
function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 mb-3">
      <Loader2 className="w-3.5 h-3.5 text-[#6D5EF7] animate-spin" />
      <span className="text-[13px] text-[#6D5EF7] font-medium">AI is thinking...</span>
    </div>
  );
}

/* ── Collaborators section ────────────────────────────────────── */
function CollaboratorsPanel({ activeUsers, board, currentUser }) {
  const [showAll, setShowAll] = useState(false);

  // Merge activeUsers (live) with board.members (static)
  const liveIds = new Set(activeUsers.map((u) => u.userId));
  const staticMembers = (board?.members || [])
    .filter((m) => !liveIds.has(m.user?._id || m.user?.id))
    .map((m, i) => ({
      userId: m.user?._id || m.user?.id || `member_${i}`,
      fullName: m.user?.fullName || m.email || "Member",
      avatar: m.user?.avatar || null,
      color: DOT_COLORS[(i + 2) % DOT_COLORS.length],
      isLive: false,
    }));

  const allUsers = [
    ...activeUsers.map((u, i) => ({ ...u, isLive: true, color: DOT_COLORS[i % DOT_COLORS.length] })),
    ...staticMembers,
  ];

  const visible = showAll ? allUsers : allUsers.slice(0, 4);
  const hiddenCount = allUsers.length - 4;

  return (
    <div className="bg-white rounded-2xl border border-[#E8E9F0] shadow-sm overflow-hidden">
      <div className="px-4 py-3.5 border-b border-[#F0F1F5]">
        <h3 className="text-[15px] font-bold text-[#0F0F1A]">Collaborators</h3>
      </div>

      <div className="px-4 py-2">
        {allUsers.length === 0 ? (
          <p className="py-3 text-[13px] text-[#9CA3AF] text-center">No collaborators yet</p>
        ) : (
          <>
            {visible.map((u, i) => {
              const isYou =
                u.userId === (currentUser?._id || currentUser?.id) ||
                u.fullName === currentUser?.fullName;

              return (
                <div
                  key={u.userId || i}
                  className="flex items-center gap-3 py-2.5"
                >
                  {/* Avatar */}
                  <Avatar
                    name={u.fullName}
                    size={36}
                    colorIndex={i}
                    src={u.avatar || null}
                  />

                  {/* Name */}
                  <span className="flex-1 text-[13px] font-semibold text-[#0F0F1A] truncate">
                    {u.fullName}
                    {isYou && (
                      <span className="ml-1 text-[12px] font-normal text-[#6B7280]">(You)</span>
                    )}
                  </span>

                  {/* Online dot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: u.color || DOT_COLORS[i % DOT_COLORS.length] }}
                  />
                </div>
              );
            })}

            {/* +N more row */}
            {!showAll && hiddenCount > 0 && (
              <div className="flex items-center gap-3 py-2.5">
                <div className="w-9 h-9 rounded-full bg-[#F0F1F8] border-2 border-white flex items-center justify-center text-[12px] font-bold text-[#4B4B6A] shadow-sm flex-shrink-0">
                  +{hiddenCount}
                </div>
                <span className="flex-1 text-[13px] text-[#6B7280]">
                  {hiddenCount} more
                </span>
                <button
                  onClick={() => setShowAll(true)}
                  className="text-[13px] font-semibold text-[#6D5EF7] hover:text-[#5B4CE0] transition-colors"
                >
                  View all
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main AI Sidebar ──────────────────────────────────────────── */
export function AISidebar({ emitElementUpdate }) {
  const { boardId } = useParams();
  const { showAI, toggleAI, upsertElement, elements, activeUsers, board, role } = useBoardStore();
  const { user: currentUser } = useAuthStore();

  const canEdit = role === "owner" || role === "editor";

  const [messages, setMessages] = useState([]);   // { role: "user"|"ai", content: string }
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  if (!showAI) return null;

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  /* ── Send message handler ─────────────────────────────────── */
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsThinking(true);

    try {
      let responseText = "";

      const lower = text.toLowerCase();

      if (lower.includes("diagram") || lower.includes("flow") || lower.includes("chart") || lower.includes("architecture")) {
        // Diagram generation
        const res = await aiApi.generateDiagram(boardId, text);
        const { nodes = [], edges = [] } = res.data.data || {};
        const nodePosMap = {};

        nodes.forEach((node, index) => {
          const nodeId = node.id || `node_${Date.now()}_${index}`;
          const posX = node.x > 0 ? node.x : 100 + (index % 3) * 220;
          const posY = node.y > 0 ? node.y : 120 + Math.floor(index / 3) * 150;
          nodePosMap[nodeId] = { x: posX, y: posY, width: 160, height: 80 };
          const shapeEl = {
            id: nodeId, type: "rect",
            x: posX, y: posY, width: 160, height: 80,
            data: { text: node.label || node.title || `Step ${index + 1}`, strokeColor: "#6D5EF7", fillColor: "#EDE9FE", borderRadius: 8 },
          };
          upsertElement(shapeEl);
          emitElementUpdate?.(shapeEl);
        });

        edges.forEach((edge, index) => {
          const source = nodePosMap[edge.from];
          const target = nodePosMap[edge.to];
          if (source && target) {
            const arrowEl = {
              id: `edge_${Date.now()}_${index}`, type: "arrow",
              x: source.x + source.width, y: source.y + source.height / 2,
              width: target.x - (source.x + source.width),
              height: target.y - (source.y + source.height / 2),
              data: { strokeColor: "#6D5EF7", strokeWidth: 2 },
            };
            upsertElement(arrowEl);
            emitElementUpdate?.(arrowEl);
          }
        });

        responseText = `Flowchart generated with ${nodes.length} nodes and ${edges.length} connections. Check your canvas!`;

      } else if (lower.includes("summarize") || lower.includes("summary") || lower.includes("overview")) {
        if (elements.length === 0) {
          responseText = "Your board is empty. Add some elements first, then ask me to summarize!";
        } else {
          const res = await aiApi.summarize(boardId);
          const data = res.data.data || {};
          const parts = [];
          if (data.title) parts.push(data.title);
          if (data.overview) parts.push(data.overview);
          if (data.keyPoints?.length > 0) {
            parts.push("Key Points:\n" + data.keyPoints.map((p) => `• ${p}`).join("\n"));
          }
          if (data.nextSteps?.length > 0) {
            parts.push("Next Steps:\n" + data.nextSteps.map((s) => `→ ${s}`).join("\n"));
          }
          responseText = parts.join("\n\n");
        }

      } else {
        // General brainstorm / ask anything
        const res = await aiApi.brainstorm(boardId, text);
        const ideas = res.data.data?.ideas || res.data.data || [];

        if (Array.isArray(ideas) && ideas.length > 0) {
          const COLORS = ["#fef08a", "#bae6fd", "#bbf7d0", "#fbcfe8", "#e9d5ff"];
          ideas.forEach((idea, index) => {
            const sticky = {
              id: `ai_sticky_${Date.now()}_${index}`,
              type: "sticky",
              x: 100 + (index % 3) * 190,
              y: 100 + Math.floor(index / 3) * 190,
              width: 160, height: 160,
              data: {
                text: typeof idea === "string" ? idea : `${idea.title || ""}\n${idea.description || ""}`.trim(),
                bgColor: idea.color || COLORS[index % COLORS.length],
                textColor: "#1e293b",
              },
            };
            upsertElement(sticky);
            emitElementUpdate?.(sticky);
          });

          responseText =
            "Here are the ideas I generated:\n\n" +
            ideas
              .map((idea, i) =>
                `${i + 1}. ${typeof idea === "string" ? idea : (idea.title || `Idea ${i + 1}`)}`
              )
              .join("\n");
        } else {
          responseText = "I've processed your request! The results have been placed on the canvas.";
        }
      }

      setMessages((prev) => [...prev, { role: "ai", content: responseText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Sorry, I couldn't process that. Please try again.", isError: true },
      ]);
      toast.error("AI request failed");
    } finally {
      setIsThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  /* ── Insert AI message content onto canvas ─────────────────── */
  const handleInsertOnBoard = (content) => {
    if (!canEdit) {
      toast.error("You have view-only access to this board");
      return;
    }
    const sticky = {
      id: `ai_insert_${Date.now()}`,
      type: "sticky",
      x: 180 + Math.random() * 60,
      y: 180 + Math.random() * 60,
      width: 240, height: 200,
      data: { text: content.slice(0, 500), bgColor: "#e9d5ff", textColor: "#1e293b" },
    };
    upsertElement(sticky);
    emitElementUpdate?.(sticky);
    toast.success("Inserted on board!");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 320 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 320 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed right-4 top-16 z-40 w-[320px] flex flex-col gap-3 max-h-[calc(100vh-80px)]"
    >
      {/* ── AI Assistant Card ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E9F0] shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 260px)", minHeight: "320px" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F1F5] flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-extrabold text-[#6D5EF7]">AI</span>
            <span className="text-[15px] font-extrabold text-[#0F0F1A]">Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMessages([])}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#0F0F1A] hover:bg-[#F3F4F6] transition-colors"
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={toggleAI}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#0F0F1A] hover:bg-[#F3F4F6] transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
              <div className="w-10 h-10 rounded-xl bg-[#6D5EF7]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#6D5EF7]" />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-semibold text-[#0F0F1A]">Ask me anything</p>
                <p className="text-[12px] text-[#9CA3AF] mt-1 max-w-[200px]">
                  Brainstorm ideas, generate diagrams, or summarize your board
                </p>
              </div>
              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                {["Generate schema", "Create a diagram", "Summarize board"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#4B4B6A] hover:bg-[#EDE9FE] hover:text-[#6D5EF7] border border-[#E5E7EB] hover:border-[#6D5EF7]/30 transition-all font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
              >
                {msg.role === "user" ? (
                  <UserBubble content={msg.content} />
                ) : (
                  <AIBubble content={msg.content} onInsert={handleInsertOnBoard} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isThinking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ThinkingIndicator />
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-[#F0F1F5] px-3 py-2.5 flex items-center gap-2 bg-white">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 text-[13px] text-[#0F0F1A] placeholder-[#9CA3AF] bg-transparent outline-none"
            disabled={isThinking}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6D5EF7] hover:bg-[#EDE9FE] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Send"
          >
            {isThinking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              /* Paper plane icon */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Collaborators Card ──────────────────────────────── */}
      <CollaboratorsPanel
        activeUsers={activeUsers}
        board={board}
        currentUser={currentUser}
      />
    </motion.div>
  );
}

export default AISidebar;
