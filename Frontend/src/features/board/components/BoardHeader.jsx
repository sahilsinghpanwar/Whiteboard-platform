import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBoardStore } from "../store/Boardstore.js";
import { boardApi } from "../api/Board.api.js";
import {
  ChevronLeft, Share2, Download, MessageSquare,
  Bot, Users, FileCode, Image as ImageIcon, Check,
} from "lucide-react";
import toast from "react-hot-toast";

/* ── Presence Avatar ─────────────────────────────────────────── */
const AVATAR_COLORS = [
  "#6D5EF7", "#10B981", "#F59E0B", "#3B82F6",
  "#EF4444", "#8B5CF6", "#14B8A6", "#F97316",
];

function PresenceAvatar({ user }) {
  const bg = user.color || AVATAR_COLORS[(user.userId?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  return (
    <div
      className="relative w-8 h-8 rounded-full border-2 border-[#141418] flex items-center justify-center text-xs font-bold text-white shadow-md cursor-default flex-shrink-0 transition-transform hover:scale-105"
      style={{ backgroundColor: bg }}
      title={user.fullName || "Collaborator"}
    >
      {(user.fullName?.[0] || "U").toUpperCase()}
      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#141418]" />
    </div>
  );
}

/* ── Top Nav Button ──────────────────────────────────────────── */
function NavBtn({ active, onClick, title: tip, children }) {
  return (
    <button
      onClick={onClick}
      title={tip}
      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 relative group ${
        active
          ? "bg-[#6D5EF7] text-white shadow-md shadow-[#6D5EF7]/30"
          : "text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95"
      }`}
    >
      {children}
      {/* Tooltip */}
      <span className="pointer-events-none absolute top-full mt-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0F0F1A] text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-xl border border-white/10 z-50">
        {tip}
      </span>
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

  /* Sync board title on store load */
  useEffect(() => {
    if (board?.title) setTitle(board.title);
  }, [board?.title]);

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
    <header className="fixed top-0 left-0 right-0 z-40 h-16 px-6 bg-[#141418]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between shadow-xl select-none font-sans text-white">

      {/* Left Section — Back + Brand Mark + Editable Title & Role */}
      <div className="flex items-center gap-4.5 min-w-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 active:scale-95"
          title="Back to Dashboard"
        >
          <ChevronLeft className="w-5.5 h-5.5 stroke-[2.2]" />
        </button>

        {/* Brand Mark */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <rect x="2" y="2" width="9" height="9" rx="2.5" fill="#6D5EF7" />
          <rect x="13" y="2" width="9" height="9" rx="2.5" fill="#6D5EF7" opacity="0.4" />
          <rect x="2" y="13" width="9" height="9" rx="2.5" fill="#6D5EF7" opacity="0.4" />
          <rect x="13" y="13" width="9" height="9" rx="2.5" fill="#6D5EF7" />
        </svg>

        <div className="w-px h-5 bg-white/10 flex-shrink-0" />

        {/* Editable Board Title */}
        <div className="flex items-center gap-3 min-w-0">
          {isEditingTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
              autoFocus
              className="border border-[#6D5EF7] rounded-xl px-3 py-1 text-sm font-semibold text-white outline-none bg-white/10 ring-2 ring-[#6D5EF7]/30 w-52"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-semibold text-white cursor-pointer hover:bg-white/10 px-2.5 py-1.5 rounded-xl transition-colors truncate max-w-[220px]"
              title="Click to rename board"
            >
              {board?.title || "Untitled Board"}
            </h1>
          )}

          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#6D5EF7]/15 text-[#818CF8] border border-[#6D5EF7]/20 flex-shrink-0">
            {role || "Editor"}
          </span>
        </div>
      </div>

      {/* Center Spacer for Breathable Whitespace */}
      <div className="flex-1 min-w-[20px]" />

      {/* Right Section — Presence Avatars + Action Icons Toolbar */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Active User Presence Avatars */}
        {activeUsers.length > 0 && (
          <div className="flex items-center -space-x-2.5 mr-1">
            {activeUsers.slice(0, 4).map((u, i) => (
              <PresenceAvatar key={u.userId || i} user={u} />
            ))}
            {activeUsers.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-[#141418] bg-[#22222E] flex items-center justify-center text-[10px] font-bold text-zinc-300 shadow-md">
                +{activeUsers.length - 4}
              </div>
            )}
          </div>
        )}

        <div className="w-px h-6 bg-white/10" />

        {/* Share Button */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2 bg-[#6D5EF7] hover:bg-[#5B4CE0] text-white text-xs font-bold rounded-xl shadow-md shadow-[#6D5EF7]/25 transition-all active:scale-95"
          title="Copy share link"
        >
          {linkCopied ? <Check className="w-4.5 h-4.5" /> : <Share2 className="w-4.5 h-4.5" />}
          {linkCopied ? "Copied!" : "Share"}
        </button>

        {/* Live Chat */}
        <NavBtn active={showChat} onClick={toggleChat} title="Live Chat">
          <MessageSquare className="w-5.5 h-5.5 stroke-[1.8]" />
        </NavBtn>

        {/* Gemini AI Workspace */}
        <NavBtn active={showAI} onClick={toggleAI} title="Gemini AI Workspace">
          <Bot className="w-5.5 h-5.5 text-[#6D5EF7] stroke-[1.8]" />
        </NavBtn>

        {/* Members & Share */}
        <NavBtn active={showMembers} onClick={toggleMembers} title="Members & Permissions">
          <Users className="w-5.5 h-5.5 stroke-[1.8]" />
        </NavBtn>

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <NavBtn active={showExportMenu} onClick={() => setShowExportMenu((v) => !v)} title="Export Board">
            <Download className="w-5.5 h-5.5 stroke-[1.8]" />
          </NavBtn>

          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-3 w-64 p-2 rounded-2xl bg-[#181820]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/40 z-50 space-y-1 select-none"
              >
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 border-b border-white/5 mb-1 flex items-center justify-between">
                  <span>Export Options</span>
                  <span className="text-[9px] font-normal text-zinc-500">2 formats</span>
                </div>

                {/* PNG Option */}
                <button
                  onClick={handleExportPNG}
                  className="w-full p-2.5 rounded-xl flex items-center gap-3 hover:bg-white/10 active:scale-[0.98] transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#6D5EF7]/15 border border-[#6D5EF7]/30 flex items-center justify-center text-[#818CF8] group-hover:bg-[#6D5EF7] group-hover:text-white transition-colors flex-shrink-0">
                    <ImageIcon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-white transition-colors">Export as PNG</p>
                    <p className="text-[10px] text-zinc-400 group-hover:text-zinc-300 transition-colors">High-resolution image format</p>
                  </div>
                </button>

                {/* JSON Option */}
                <button
                  onClick={handleExportJSON}
                  className="w-full p-2.5 rounded-xl flex items-center gap-3 hover:bg-white/10 active:scale-[0.98] transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors flex-shrink-0">
                    <FileCode className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-white transition-colors">Export as JSON</p>
                    <p className="text-[10px] text-zinc-400 group-hover:text-zinc-300 transition-colors">Full board data & element backup</p>
                  </div>
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
