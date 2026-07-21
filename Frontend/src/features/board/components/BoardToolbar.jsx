import React, { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useBoardStore, CANVAS_TOOLS } from "../store/Boardstore.js";
import { uploadApi } from "@/features/upload/api/upload.api.js";
import {
  MousePointer,
  Hand,
  Pencil,
  Eraser,
  Square,
  Circle,
  ArrowUpRight,
  Minus,
  StickyNote,
  Type,
  Image as ImageIcon,
  Sparkles,
  Undo2,
  Redo2,
} from "lucide-react";
import toast from "react-hot-toast";

const STICKY_COLORS = [
  { name: "Yellow", bg: "#fef08a", text: "#1e293b" },
  { name: "Blue", bg: "#bae6fd", text: "#0f172a" },
  { name: "Green", bg: "#bbf7d0", text: "#064e3b" },
  { name: "Pink", bg: "#fbcfe8", text: "#831843" },
  { name: "Purple", bg: "#e9d5ff", text: "#581c87" },
  { name: "Dark", bg: "#334155", text: "#f8fafc" },
];

const STROKE_COLORS = [
  "#ffffff",
  "#94a3b8",
  "#f43f5e",
  "#3b82f6",
  "#10b981",
  "#eab308",
  "#a855f7",
];

export function BoardToolbar({
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  stickyBg,
  setStickyBg,
  emitElementUpdate,
}) {
  const { boardId } = useParams();
  const {
    activeTool,
    setActiveTool,
    activeShape,
    setActiveShape,
    toggleAI,
    showAI,
    undo,
    redo,
    historyIndex,
    history,
    upsertElement,
  } = useBoardStore();

  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleToolSelect = (tool) => {
    setActiveTool(tool);
    setShowShapeMenu(false);
    setShowColorMenu(false);
  };

  const handleShapeSelect = (shape) => {
    setActiveShape(shape);
    setActiveTool(CANVAS_TOOLS.SHAPE);
    setShowShapeMenu(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Try uploading to Cloudinary via uploadApi
      let imageUrl = "";
      try {
        const res = await uploadApi.boardImage(boardId, file);
        imageUrl = res.data.data?.url || res.data?.url;
      } catch {
        // Fallback to local DataURL if server upload is unconfigured
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(file);
        });
      }

      const imgElement = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: "image",
        x: 150,
        y: 150,
        width: 260,
        height: 200,
        data: { url: imageUrl },
      };

      upsertElement(imgElement);
      emitElementUpdate?.(imgElement);
      toast.success("Image placed on whiteboard");
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#1e1e24]/90 backdrop-blur-md border border-white/10 shadow-2xl transition-all font-sans select-none">
      {/* Undo & Redo Controls */}
      <button
        onClick={undo}
        disabled={historyIndex <= 0}
        className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      <button
        onClick={redo}
        disabled={historyIndex >= history.length - 1}
        className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-6 bg-white/10 mx-1" />

      {/* Select Tool */}
      <button
        onClick={() => handleToolSelect(CANVAS_TOOLS.SELECT)}
        className={`p-2.5 rounded-xl transition-all ${
          activeTool === CANVAS_TOOLS.SELECT
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
            : "text-zinc-400 hover:text-white hover:bg-white/5"
        }`}
        title="Select (V)"
      >
        <MousePointer className="w-5 h-5" />
      </button>

      {/* Hand / Pan Tool */}
      <button
        onClick={() => handleToolSelect(CANVAS_TOOLS.HAND)}
        className={`p-2.5 rounded-xl transition-all ${
          activeTool === CANVAS_TOOLS.HAND
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
            : "text-zinc-400 hover:text-white hover:bg-white/5"
        }`}
        title="Pan Canvas (H)"
      >
        <Hand className="w-5 h-5" />
      </button>

      <div className="w-[1px] h-6 bg-white/10 mx-1" />

      {/* Draw / Pen Tool */}
      <button
        onClick={() => handleToolSelect(CANVAS_TOOLS.DRAW)}
        className={`p-2.5 rounded-xl transition-all ${
          activeTool === CANVAS_TOOLS.DRAW
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
            : "text-zinc-400 hover:text-white hover:bg-white/5"
        }`}
        title="Freehand Draw (P)"
      >
        <Pencil className="w-5 h-5" />
      </button>

      {/* Shapes Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowShapeMenu(!showShapeMenu)}
          className={`p-2.5 rounded-xl transition-all flex items-center gap-1 ${
            activeTool === CANVAS_TOOLS.SHAPE
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
          title="Shapes"
        >
          {activeShape === "rect" && <Square className="w-5 h-5" />}
          {activeShape === "circle" && <Circle className="w-5 h-5" />}
          {activeShape === "arrow" && <ArrowUpRight className="w-5 h-5" />}
          {activeShape === "line" && <Minus className="w-5 h-5" />}
        </button>

        {showShapeMenu && (
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-1.5 rounded-xl bg-[#18181c] border border-white/10 shadow-2xl flex items-center gap-1 animate-in fade-in zoom-in-95">
            <button
              onClick={() => handleShapeSelect("rect")}
              className={`p-2 rounded-lg ${activeShape === "rect" ? "bg-indigo-600 text-white" : "text-zinc-300 hover:bg-white/10"}`}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShapeSelect("circle")}
              className={`p-2 rounded-lg ${activeShape === "circle" ? "bg-indigo-600 text-white" : "text-zinc-300 hover:bg-white/10"}`}
              title="Circle"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShapeSelect("arrow")}
              className={`p-2 rounded-lg ${activeShape === "arrow" ? "bg-indigo-600 text-white" : "text-zinc-300 hover:bg-white/10"}`}
              title="Arrow"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShapeSelect("line")}
              className={`p-2 rounded-lg ${activeShape === "line" ? "bg-indigo-600 text-white" : "text-zinc-300 hover:bg-white/10"}`}
              title="Line"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Sticky Note Tool */}
      <button
        onClick={() => handleToolSelect(CANVAS_TOOLS.STICKY)}
        className={`p-2.5 rounded-xl transition-all ${
          activeTool === CANVAS_TOOLS.STICKY
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
            : "text-zinc-400 hover:text-white hover:bg-white/5"
        }`}
        title="Sticky Note (S)"
      >
        <StickyNote className="w-5 h-5" />
      </button>

      {/* Text Tool */}
      <button
        onClick={() => handleToolSelect(CANVAS_TOOLS.TEXT)}
        className={`p-2.5 rounded-xl transition-all ${
          activeTool === CANVAS_TOOLS.TEXT
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
            : "text-zinc-400 hover:text-white hover:bg-white/5"
        }`}
        title="Text (T)"
      >
        <Type className="w-5 h-5" />
      </button>

      {/* Image Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
        title="Upload Image to Canvas"
      >
        <ImageIcon className="w-5 h-5" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Eraser Tool */}
      <button
        onClick={() => handleToolSelect(CANVAS_TOOLS.ERASER)}
        className={`p-2.5 rounded-xl transition-all ${
          activeTool === CANVAS_TOOLS.ERASER
            ? "bg-red-600 text-white shadow-md shadow-red-600/30"
            : "text-zinc-400 hover:text-white hover:bg-white/5"
        }`}
        title="Eraser (E)"
      >
        <Eraser className="w-5 h-5" />
      </button>

      <div className="w-[1px] h-6 bg-white/10 mx-1" />

      {/* Color Palette Menu */}
      <div className="relative">
        <button
          onClick={() => setShowColorMenu(!showColorMenu)}
          className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
          title="Color & Style Options"
        >
          <div
            className="w-5 h-5 rounded-full border border-white/20 shadow-inner"
            style={{ backgroundColor: activeTool === CANVAS_TOOLS.STICKY ? stickyBg : strokeColor }}
          />
        </button>

        {showColorMenu && (
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-3 rounded-2xl bg-[#18181c] border border-white/10 shadow-2xl space-y-3 min-w-[220px]">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Stroke Color</p>
              <div className="flex items-center gap-1.5">
                {STROKE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setStrokeColor(c)}
                    className={`w-6 h-6 rounded-full border border-white/10 transition-transform ${strokeColor === c ? "scale-125 ring-2 ring-indigo-500" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Sticky Note Color</p>
              <div className="grid grid-cols-6 gap-1.5">
                {STICKY_COLORS.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setStickyBg(s.bg)}
                    className={`w-6 h-6 rounded-full border border-black/10 transition-transform ${stickyBg === s.bg ? "scale-125 ring-2 ring-indigo-500" : "hover:scale-110"}`}
                    style={{ backgroundColor: s.bg }}
                    title={s.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Stroke Width</p>
              <div className="flex items-center gap-2">
                {[2, 4, 8].map((w) => (
                  <button
                    key={w}
                    onClick={() => setStrokeWidth(w)}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium border ${strokeWidth === w ? "bg-indigo-600 text-white border-indigo-500" : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10"}`}
                  >
                    {w === 2 ? "Thin" : w === 4 ? "Medium" : "Thick"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-[1px] h-6 bg-white/10 mx-1" />

      {/* AI Assistant Button */}
      <button
        onClick={toggleAI}
        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
          showAI
            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/30"
            : "bg-white/10 text-purple-300 hover:bg-white/15"
        }`}
      >
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        AI Tools
      </button>
    </div>
  );
}

export default BoardToolbar;
