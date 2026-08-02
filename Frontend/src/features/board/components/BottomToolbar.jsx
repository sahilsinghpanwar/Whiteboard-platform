import React from "react";
import { motion } from "framer-motion";
import { useBoardStore, CANVAS_TOOLS } from "../store/Boardstore.js";
import {
  Undo2, Redo2, ZoomOut, ZoomIn, RotateCcw,
  Maximize, Hand,
} from "lucide-react";

/* Control Button */
function CtrlBtn({ onClick, disabled, title: tip, active, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tip}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-30 ${
        active
          ? "bg-[#6D5EF7] text-white shadow-sm shadow-[#6D5EF7]/25"
          : "text-[#4B4B6A] hover:text-[#0F0F1A] hover:bg-[#F3F4F6] disabled:hover:bg-transparent"
      }`}
    >
      {children}
    </button>
  );
}

const Sep = () => <div className="w-px h-5 bg-[#E8E9F0]" />;

/* Bottom Toolbar */
export function BottomToolbar({ emitCanvasSave }) {
  const {
    undo, redo, historyIndex, history,
    viewport, setViewport,
    activeTool, setActiveTool,
    role,
  } = useBoardStore();

  const canEdit = role === "owner" || role === "editor";

  const handleZoom = (delta) => {
    const newZoom = Math.min(Math.max(viewport.zoom + delta, 0.2), 3);
    setViewport({ ...viewport, zoom: Number(newZoom.toFixed(2)) });
  };

  const handleFitScreen = () => setViewport({ x: 0, y: 0, zoom: 1 });

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 }}
      className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-[#ffffff]/95 backdrop-blur-xl border border-[#E8E9F0] shadow-xl shadow-black/5 select-none font-sans max-w-[95vw] overflow-x-auto custom-scrollbar"
    >
      {/* Undo */}
      <CtrlBtn
        onClick={() => { const prev = undo(); if (prev && emitCanvasSave) emitCanvasSave(prev); }}
        disabled={!canEdit || historyIndex <= 0}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-3.5 h-3.5" />
      </CtrlBtn>

      {/* Redo */}
      <CtrlBtn
        onClick={() => { const next = redo(); if (next && emitCanvasSave) emitCanvasSave(next); }}
        disabled={!canEdit || historyIndex >= history.length - 1}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-3.5 h-3.5" />
      </CtrlBtn>

      <Sep />

      {/* Zoom out */}
      <CtrlBtn onClick={() => handleZoom(-0.1)} title="Zoom Out">
        <ZoomOut className="w-3.5 h-3.5" />
      </CtrlBtn>

      {/* Zoom percentage */}
      <button
        onClick={handleFitScreen}
        title="Reset zoom (100%)"
        className="px-2 h-8 min-w-[44px] text-xs font-mono font-semibold text-[#374151] hover:text-[#0F0F1A] hover:bg-[#F3F4F6] rounded-lg transition-colors"
      >
        {Math.round(viewport.zoom * 100)}%
      </button>

      {/* Zoom in */}
      <CtrlBtn onClick={() => handleZoom(0.1)} title="Zoom In">
        <ZoomIn className="w-3.5 h-3.5" />
      </CtrlBtn>

      <Sep />

      {/* Hand / Pan */}
      <CtrlBtn
        active={activeTool === CANVAS_TOOLS.HAND}
        onClick={() => setActiveTool(activeTool === CANVAS_TOOLS.HAND ? CANVAS_TOOLS.SELECT : CANVAS_TOOLS.HAND)}
        title="Pan Canvas (H)"
      >
        <Hand className="w-3.5 h-3.5" />
      </CtrlBtn>

      <Sep />

      {/* Fit screen */}
      <CtrlBtn onClick={handleFitScreen} title="Fit to screen">
        <RotateCcw className="w-3.5 h-3.5" />
      </CtrlBtn>

      {/* Fullscreen */}
      <CtrlBtn onClick={handleFullscreen} title="Toggle Fullscreen">
        <Maximize className="w-3.5 h-3.5" />
      </CtrlBtn>
    </motion.div>
  );
}

export default BottomToolbar;
