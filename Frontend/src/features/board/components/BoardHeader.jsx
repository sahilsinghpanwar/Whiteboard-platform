import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBoardStore } from "../store/Boardstore.js";
import { boardApi } from "../api/Board.api.js";
import {
  ChevronLeft, Share2, Download, MessageSquare,
  Sparkles, Users, FileCode, Image as ImageIcon, Check,
} from "lucide-react";
import toast from "react-hot-toast";

/* ── Presence Avatar ─────────────────────────────────────────── */
const AVATAR_COLORS = [
  "#6D5EF7","#10B981","#F59E0B","#3B82F6",
  "#EF4444","#8B5CF6","#14B8A6","#F97316",
];

function PresenceAvatar({ user }) {
  const bg = user.color || AVATAR_COLORS[(user.userId?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  return (
    <div
      className="relative w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-bold text-white shadow-sm cursor-default flex-shrink-0"
      style={{ backgroundColor: bg }}
      title={user.fullName || "Collaborator"}
    >
      {(user.fullName?.[0] || "U").toUpperCase()}
      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-[1.5px] border-white" />
    </div>
  );
}

/* ── NavBtn ──────────────────────────────────────────────────── */
function NavBtn({ active, onClick, title: tip, children }) {
  return (
    <button
      onClick={onClick}
      title={tip}
      className={`p-2 rounded-lg transition-all ${
        active
          ? "bg-[#6D5EF7] text-white shadow-sm shadow-[#6D5EF7]/30"
          : "text-zinc-400 hover:text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

/* ── Board Header ─────────────────────────────────────────────── */
export function BoardHeader({ boardId, emitCanvasSave }) {
  const navigate = useNavigate();
  const {
    board, role, activeUsers,
    toggleChat, toggleAI, toggleMembers,
    showChat, showAI, showMembers, elements,
  } = useBoardStore();

  const [title, setTitle] = useState(board?.title || "Untitled Board");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const exportRef = useRef(null);

  /* Close export dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (!title.trim() || title === board?.title) return;
    try {
      await boardApi.update(boardId, { title });
      toast.success("Board renamed");
    } catch (err) {
      toast.error(err.message || "Failed to rename board");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    toast.success("Board link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleExportJSON = () => {
    setShowExportMenu(false);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(elements, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `${board?.title || "board"}-export.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Exported as JSON");
  };

  const handleExportPNG = () => {
    setShowExportMenu(false);
    const svgEl = document.querySelector("svg");
    if (!svgEl) return toast.error("Canvas not found");
    const xml = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const blobURL = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svgEl.clientWidth || 1920;
      canvas.height = svgEl.clientHeight || 1080;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#F7F8FC";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const png = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.setAttribute("href", png);
      a.setAttribute("download", `${board?.title || "board"}.png`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Exported as PNG");
    };
    img.src = blobURL;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 px-4 bg-[#141418]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between shadow-lg select-none font-sans text-white">

      {/* Left — Back + Logo + Title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
          title="Back to Dashboard"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Brand mark */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <rect x="2" y="2" width="9" height="9" rx="2.5" fill="#6D5EF7" />
          <rect x="13" y="2" width="9" height="9" rx="2.5" fill="#6D5EF7" opacity="0.4" />
          <rect x="2" y="13" width="9" height="9" rx="2.5" fill="#6D5EF7" opacity="0.4" />
          <rect x="13" y="13" width="9" height="9" rx="2.5" fill="#6D5EF7" />
        </svg>

        <div className="w-px h-4 bg-white/10 flex-shrink-0" />

        {/* Editable board title */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
              autoFocus
              className="border border-[#6D5EF7] rounded-lg px-2 py-0.5 text-sm font-semibold text-white outline-none bg-white/10 ring-2 ring-[#6D5EF7]/20 w-44"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-semibold text-white cursor-pointer hover:bg-white/10 px-2 py-1 rounded-lg transition-colors truncate max-w-[180px]"
              title="Click to rename"
            >
              {board?.title || "Untitled Board"}
            </h1>
          )}

          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#6D5EF7]/10 text-[#6D5EF7] flex-shrink-0">
            {role || "Editor"}
          </span>
        </div>
      </div>

      {/* Center spacer */}
      <div className="flex-1" />

      {/* Right — Presence + Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Active user avatars */}
        {activeUsers.length > 0 && (
          <div className="flex items-center -space-x-2 mr-1">
            {activeUsers.slice(0, 4).map((u, i) => (
              <PresenceAvatar key={u.userId || i} user={u} />
            ))}
            {activeUsers.length > 4 && (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-[#F0F1F8] flex items-center justify-center text-[10px] font-bold text-[#4B4B6A] shadow-sm">
                +{activeUsers.length - 4}
              </div>
            )}
          </div>
        )}

        <div className="w-px h-5 bg-white/10" />

        {/* Share button */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6D5EF7] hover:bg-[#5B4CE0] text-white text-xs font-semibold rounded-lg shadow-sm shadow-[#6D5EF7]/25 transition-all"
          title="Copy share link"
        >
          {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          {linkCopied ? "Copied!" : "Share"}
        </button>

        <NavBtn active={showChat} onClick={toggleChat} title="Live Chat">
          <MessageSquare className="w-4 h-4" />
        </NavBtn>

        <NavBtn active={showAI} onClick={toggleAI} title="Gemini AI Workspace">
          <Sparkles className="w-4 h-4 text-amber-500" />
        </NavBtn>

        <NavBtn active={showMembers} onClick={toggleMembers} title="Members & Share">
          <Users className="w-4 h-4" />
        </NavBtn>

        {/* Export dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setShowExportMenu((v) => !v)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            title="Export board"
          >
            <Download className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 top-full mt-2 w-52 p-1.5 rounded-xl bg-[#1a1a22] border border-white/10 shadow-2xl"
              >
                <button
                  onClick={handleExportPNG}
                  className="w-full px-3 py-2.5 text-xs text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-2.5 transition-colors font-medium"
                >
                  <ImageIcon className="w-4 h-4 text-[#6D5EF7]" />
                  Export as PNG
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full px-3 py-2.5 text-xs text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-2.5 transition-colors font-medium"
                >
                  <FileCode className="w-4 h-4 text-[#6D5EF7]" />
                  Export as JSON
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default BoardHeader;
