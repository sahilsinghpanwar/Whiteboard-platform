import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBoardStore } from "../store/Boardstore.js";
import { boardApi } from "../api/Board.api.js";
import {
  ChevronLeft, Share2, Download, MessageSquare,
  Bot, Users, FileCode, Image as ImageIcon, Check, X,
} from "lucide-react";
import toast from "react-hot-toast";

/* Presence Avatar */
const AVATAR_COLORS = [
  "#6D5EF7", "#10B981", "#F59E0B", "#3B82F6",
  "#EF4444", "#8B5CF6", "#14B8A6", "#F97316",
];

function PresenceAvatar({ user }) {
  const bg = user.color || AVATAR_COLORS[(user.userId?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  return (
    <div
      className="relative w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-md cursor-default flex-shrink-0 transition-transform hover:scale-105"
      style={{ backgroundColor: bg }}
      title={user.fullName || "Collaborator"}
    >
      {(user.fullName?.[0] || "U").toUpperCase()}
      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
    </div>
  );
}

/* Top Nav Button */
function NavBtn({ active, onClick, title: tip, children }) {
  return (
    <button
      onClick={onClick}
      title={tip}
      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 relative group ${
        active
          ? "bg-[#6D5EF7] text-white shadow-md shadow-[#6D5EF7]/25"
          : "text-[#4B4B6A] hover:text-[#0F0F1A] hover:bg-[#F3F4F6] active:scale-95"
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

/* Board Header */
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const exportRef = useRef(null);

  useEffect(() => {
    if (board?.title) setTitle(board.title);
  }, [board?.title]);

  // Click outside listener for export dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (!title.trim() || title === board?.title) return;
    try {
      await boardApi.updateTitle(boardId, title.trim());
      toast.success("Board renamed");
    } catch {
      toast.error("Failed to rename board");
      setTitle(board?.title || "Untitled Board");
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success("Board link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Export JSON
  const handleExportJSON = () => {
    setShowExportMenu(false);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(elements, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `${board?.title || "board"}-backup.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Exported as JSON");
  };

  // Export PNG (SVG canvas to image)
  const handleExportPNG = () => {
    setShowExportMenu(false);
    const svgEl = document.querySelector("svg");
    if (!svgEl) return toast.error("Canvas element not found");

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const blobURL = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svgEl.clientWidth || 1920;
      canvas.height = svgEl.clientHeight || 1080;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#F7F8FC";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(blobURL);

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
    <header className="fixed top-0 left-0 right-0 z-40 h-16 px-2.5 sm:px-6 bg-[#ffffff]/90 backdrop-blur-xl border-b border-[#E8E9F0] flex items-center justify-between shadow-sm select-none font-sans text-[#0F0F1A]">

      {/* Left Section — Back + Brand Mark + Editable Title & Role */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-[#4B4B6A] hover:text-[#0F0F1A] hover:bg-[#F3F4F6] transition-all flex-shrink-0 active:scale-95"
          title="Back to Dashboard"
        >
          <ChevronLeft className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2]" />
        </button>

        {/* Brand Mark */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 hidden sm:block">
          <rect x="2" y="2" width="9" height="9" rx="2.5" fill="#6D5EF7" />
          <rect x="13" y="2" width="9" height="9" rx="2.5" fill="#6D5EF7" opacity="0.4" />
          <rect x="2" y="13" width="9" height="9" rx="2.5" fill="#6D5EF7" opacity="0.4" />
          <rect x="13" y="13" width="9" height="9" rx="2.5" fill="#6D5EF7" />
        </svg>

        <div className="w-px h-5 bg-[#E8E9F0] flex-shrink-0 hidden sm:block" />

        {/* Editable Board Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {isEditingTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
              autoFocus
              className="border border-[#6D5EF7] rounded-xl px-2.5 py-1 text-xs sm:text-sm font-semibold text-[#0F0F1A] outline-none bg-white ring-2 ring-[#6D5EF7]/30 w-32 sm:w-52"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-xs sm:text-sm font-bold text-[#0F0F1A] cursor-pointer hover:bg-[#F3F4F6] px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl transition-colors truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[200px] md:max-w-[260px]"
              title="Click to rename board"
            >
              {title}
            </h1>
          )}

          {/* Role Badge */}
          <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EDE9FE]/80 border border-[#C4B5FD]/70 text-[#6D5EF7] shadow-sm flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6D5EF7] animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              {role || "Editor"}
            </span>
          </div>
        </div>
      </div>

      {/* Center Section — Collaborator Active Avatars */}
      {(() => {
        const uniqueActiveUsers = Array.from(
          new Map(activeUsers.map((u) => [String(u.userId || u._id || u.id), u])).values()
        );
        const count = uniqueActiveUsers.length || 1;

        return (
          <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E8E9F0] shadow-sm shadow-black/5">
            <div className="flex items-center -space-x-2">
              {uniqueActiveUsers.slice(0, 4).map((u, i) => (
                <PresenceAvatar key={u.userId || u._id || i} user={u} />
              ))}
            </div>
            {uniqueActiveUsers.length > 4 && (
              <span className="text-[10px] font-bold text-[#6D5EF7] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                +{uniqueActiveUsers.length - 4}
              </span>
            )}
            <div className="flex items-center gap-1.5 ml-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-[#0F0F1A]">
                {count === 1 ? "1 Online" : `${count} Online`}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Right Action Icons Group in Unified Glass Card */}
      <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-white border border-[#E8E9F0] shadow-sm shadow-black/5">
        {/* Share Button */}
        <button
          onClick={() => setShowShareModal(true)}
          style={{
            height: "36px",
            padding: "0 12px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #6D5EF7 0%, #5B4CE0 100%)",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(109, 94, 247, 0.35)",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            letterSpacing: "0.01em",
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(109, 94, 247, 0.48)";
            e.currentTarget.style.background = "linear-gradient(135deg, #7C6EF8 0%, #6D5EF7 100%)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(109, 94, 247, 0.35)";
            e.currentTarget.style.background = "linear-gradient(135deg, #6D5EF7 0%, #5B4CE0 100%)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.97)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
        >
          <Share2 style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
          <span className="hidden sm:inline">Share</span>
        </button>

        <div className="w-px h-5 bg-[#E8E9F0]" />

        {/* Live Chat */}
        <NavBtn active={showChat} onClick={toggleChat} title="Live Chat">
          <MessageSquare className="w-4.5 h-4.5 stroke-[1.8]" />
        </NavBtn>

        {/* AI Assistant */}
        <NavBtn active={showAI} onClick={toggleAI} title="AI Assistant">
          <Bot className="w-4.5 h-4.5 stroke-[1.8] text-[#6D5EF7]" />
        </NavBtn>

        {/* Members Panel */}
        <NavBtn active={showMembers} onClick={toggleMembers} title="Board Members">
          <Users className="w-4.5 h-4.5 stroke-[1.8]" />
        </NavBtn>

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <NavBtn active={showExportMenu} onClick={() => setShowExportMenu((v) => !v)} title="Export Board">
            <Download className="w-4.5 h-4.5 stroke-[1.8]" />
          </NavBtn>

          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-3 w-64 p-2 rounded-2xl bg-[#ffffff] border border-[#E8E9F0] shadow-2xl z-50 space-y-1 select-none"
              >
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9898B3] border-b border-[#F0F1F5] mb-1 flex items-center justify-between">
                  <span>Export Options</span>
                  <span className="text-[9px] font-normal text-[#4B4B6A]">2 formats</span>
                </div>

                {/* PNG Option */}
                <button
                  onClick={handleExportPNG}
                  className="w-full p-2.5 rounded-xl flex items-center gap-3 hover:bg-[#F3F4F6] active:scale-[0.98] transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] border border-[#C4B5FD] flex items-center justify-center text-[#6D5EF7] group-hover:bg-[#6D5EF7] group-hover:text-white transition-colors flex-shrink-0">
                    <ImageIcon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F0F1A] transition-colors">Export as PNG</p>
                    <p className="text-[10px] text-[#6B7280] transition-colors">High-resolution image format</p>
                  </div>
                </button>

                {/* JSON Option */}
                <button
                  onClick={handleExportJSON}
                  className="w-full p-2.5 rounded-xl flex items-center gap-3 hover:bg-[#F3F4F6] active:scale-[0.98] transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
                    <FileCode className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F0F1A] transition-colors">Export as JSON</p>
                    <p className="text-[10px] text-[#6B7280] transition-colors">Full board data & element backup</p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: "100%",
                maxWidth: "460px",
                backgroundColor: "#ffffff",
                border: "1px solid #E8E9F0",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.18)",
                color: "#0F0F1A",
                position: "relative",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: "#0F0F1A" }}>Share Board</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  style={{
                    width: "28px", height: "28px", borderRadius: "8px", border: "none",
                    backgroundColor: "#F3F4F6", color: "#6B7280", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#E5E7EB"; e.currentTarget.style.color = "#111827"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F3F4F6"; e.currentTarget.style.color = "#6B7280"; }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>

              <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 20px 0", lineHeight: 1.5 }}>
                Anyone with this link can view or collaborate on this board.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", width: "100%" }}>
                <input
                  readOnly
                  value={window.location.href}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    fontSize: "12px",
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    color: "#0F0F1A",
                    outline: "none",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={handleCopyShareLink}
                  style={{
                    flexShrink: 0,
                    height: "38px",
                    padding: "0 16px",
                    borderRadius: "12px",
                    background: copiedLink ? "#10B981" : "linear-gradient(135deg, #6D5EF7 0%, #5B4CE0 100%)",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(109,94,247,0.25)",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {copiedLink ? <Check style={{ width: 14, height: 14 }} /> : <Share2 style={{ width: 14, height: 14 }} />}
                  <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowShareModal(false)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#4B4B6A",
                    backgroundColor: "#F3F4F6",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#E5E7EB"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F3F4F6"; }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default BoardHeader;
