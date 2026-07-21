import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBoardStore } from "../store/Boardstore.js";
import { boardApi } from "../api/Board.api.js";
import {
  ChevronLeft,
  Share2,
  Download,
  MessageSquare,
  Sparkles,
  Users,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileCode,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";

export function BoardHeader({ boardId, emitCanvasSave }) {
  const navigate = useNavigate();
  const {
    board,
    role,
    activeUsers,
    viewport,
    setViewport,
    toggleChat,
    toggleAI,
    toggleMembers,
    showChat,
    showAI,
    showMembers,
    elements,
  } = useBoardStore();

  const [title, setTitle] = useState(board?.title || "Untitled Board");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  const handleZoom = (delta) => {
    const newZoom = Math.min(Math.max(viewport.zoom + delta, 0.2), 3);
    setViewport({ ...viewport, zoom: Number(newZoom.toFixed(2)) });
  };

  // Export JSON
  const handleExportJSON = () => {
    setShowExportMenu(false);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(elements, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${board?.title || "board"}-export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Board exported as JSON");
  };

  // Export PNG Image
  const handleExportPNG = () => {
    setShowExportMenu(false);
    const svgElement = document.querySelector("svg");
    if (!svgElement) return toast.error("Canvas element not found");

    const xml = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svgElement.clientWidth || 1920;
      canvas.height = svgElement.clientHeight || 1080;
      const context = canvas.getContext("2d");
      context.fillStyle = "#0e0e11";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);

      const png = canvas.toDataURL("image/png");
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", png);
      downloadAnchor.setAttribute("download", `${board?.title || "board"}.png`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Board exported as PNG image");
    };
    image.src = blobURL;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 px-4 bg-[#141418]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between shadow-lg text-white font-sans">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          title="Back to Dashboard"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
              autoFocus
              className="bg-white/10 border border-indigo-500 rounded px-2 py-0.5 text-sm font-semibold text-white outline-none"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-semibold text-white cursor-pointer hover:bg-white/5 px-2 py-1 rounded transition-colors"
              title="Click to rename"
            >
              {board?.title || "Untitled Board"}
            </h1>
          )}

          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-zinc-400">
            {role || "Editor"}
          </span>
        </div>
      </div>

      {/* Center: Zoom Controls */}
      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono w-12 text-center text-zinc-300">
          {Math.round(viewport.zoom * 100)}%
        </span>

        <button
          onClick={() => handleZoom(0.1)}
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
          title="Reset Viewport"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Presence, Export, Actions */}
      <div className="flex items-center gap-3">
        {/* Active Presence Avatars */}
        <div className="flex items-center -space-x-2 overflow-hidden">
          {activeUsers.slice(0, 4).map((u, index) => (
            <div
              key={u.userId || index}
              className="w-7 h-7 rounded-full border-2 border-[#141418] flex items-center justify-center text-xs font-bold text-white uppercase shadow"
              style={{ backgroundColor: u.color || "#6366f1" }}
              title={u.fullName || "Collaborator"}
            >
              {(u.fullName?.[0] || "U").toUpperCase()}
            </div>
          ))}
          {activeUsers.length > 4 && (
            <div className="w-7 h-7 rounded-full border-2 border-[#141418] bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
              +{activeUsers.length - 4}
            </div>
          )}
        </div>

        <div className="w-[1px] h-5 bg-white/10" />

        {/* Panel Toggles */}
        <button
          onClick={toggleChat}
          className={`p-2 rounded-xl transition-all ${
            showChat ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
          title="Chat"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          onClick={toggleAI}
          className={`p-2 rounded-xl transition-all ${
            showAI ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
          title="AI Assistant"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
        </button>

        <button
          onClick={toggleMembers}
          className={`p-2 rounded-xl transition-all ${
            showMembers ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
          title="Members & Share"
        >
          <Users className="w-4 h-4" />
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1"
            title="Export Options"
          >
            <Download className="w-4 h-4" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 p-1.5 rounded-xl bg-[#18181c] border border-white/10 shadow-2xl space-y-1 animate-in fade-in zoom-in-95">
              <button
                onClick={handleExportPNG}
                className="w-full px-3 py-2 text-xs text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-2 transition-all"
              >
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                Export as PNG Image
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full px-3 py-2 text-xs text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-2 transition-all"
              >
                <FileCode className="w-4 h-4 text-purple-400" />
                Export as JSON Data
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default BoardHeader;
