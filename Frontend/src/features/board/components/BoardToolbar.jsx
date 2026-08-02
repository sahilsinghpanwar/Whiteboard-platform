import React, { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useBoardStore, CANVAS_TOOLS } from "../store/Boardstore.js";
import { uploadApi } from "@/features/upload/api/upload.api.js";
import {
  MousePointer, Hand, Pencil, Eraser, Square, Circle,
  ArrowUpRight, Minus, StickyNote, Type, Image as ImageIcon,
  Bot, Diamond, Triangle, Frame, Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

/*  Color constants  */
const STICKY_COLORS = [
  { name: "Yellow", bg: "#fef08a", text: "#1e293b" },
  { name: "Blue",   bg: "#bae6fd", text: "#0f172a" },
  { name: "Green",  bg: "#bbf7d0", text: "#064e3b" },
  { name: "Pink",   bg: "#fbcfe8", text: "#831843" },
  { name: "Purple", bg: "#e9d5ff", text: "#581c87" },
  { name: "Dark",   bg: "#334155", text: "#f8fafc" },
];

const STROKE_COLORS = [
  "#0F0F1A", "#6D5EF7", "#EF4444", "#3B82F6",
  "#10B981", "#F59E0B", "#EC4899",
];

/* Tool button  */
function ToolBtn({ active, onClick, title: tip, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      title={tip}
      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 relative group ${
        active
          ? "bg-[#6D5EF7] text-white shadow-md shadow-[#6D5EF7]/25"
          : `text-[#4B4B6A] hover:text-[#0F0F1A] hover:bg-[#F3F4F6] ${className}`
      }`}
    >
      {children}
      {/* Tooltip */}
      <span className="pointer-events-none absolute left-full ml-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#0F0F1A] text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
        {tip}
      </span>
    </button>
  );
}

/*  Divider  */
const Divider = () => <div className="w-6 h-px bg-[#E8E9F0] my-0.5" />;

/* Board Toolbar  */
export function BoardToolbar({
  strokeColor, setStrokeColor,
  strokeWidth, setStrokeWidth,
  stickyBg, setStickyBg,
  emitElementUpdate, emitElementDelete, emitCanvasSave,
}) {
  const { boardId } = useParams();
  const {
    activeTool, setActiveTool,
    activeShape, setActiveShape,
    toggleAI, showAI,
    upsertElement, deleteElements, selectedElementIds, elements,
    role,
  } = useBoardStore();

  const canEdit = role === "owner" || role === "editor";

  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleStrokeColorChange = (color) => {
    if (!canEdit) return;
    setStrokeColor(color);
    if (selectedElementIds.length > 0) {
      selectedElementIds.forEach((id) => {
        const el = elements.find((e) => e.id === id);
        if (el) {
          const updated = { ...el, data: { ...el.data, strokeColor: color } };
          upsertElement(updated);
          emitElementUpdate?.(updated);
        }
      });
    }
  };

  const handleStickyBgChange = (bg) => {
    if (!canEdit) return;
    setStickyBg(bg);
    if (selectedElementIds.length > 0) {
      selectedElementIds.forEach((id) => {
        const el = elements.find((e) => e.id === id);
        if (el && el.type === "sticky") {
          const updated = { ...el, data: { ...el.data, bgColor: bg } };
          upsertElement(updated);
          emitElementUpdate?.(updated);
        }
      });
    }
  };

  const handleStrokeWidthChange = (width) => {
    if (!canEdit) return;
    setStrokeWidth(width);
    if (selectedElementIds.length > 0) {
      selectedElementIds.forEach((id) => {
        const el = elements.find((e) => e.id === id);
        if (el) {
          const updated = { ...el, data: { ...el.data, strokeWidth: width } };
          upsertElement(updated);
          emitElementUpdate?.(updated);
        }
      });
    }
  };

  const handleToolSelect = (tool) => {
    if (!canEdit && tool !== CANVAS_TOOLS.SELECT && tool !== CANVAS_TOOLS.HAND) {
      toast.error("You have view-only access to this board");
      return;
    }
    setActiveTool(tool);
    setShowShapeMenu(false);
    setShowColorMenu(false);
  };

  const handleShapeSelect = (shape) => {
    if (!canEdit) {
      toast.error("You have view-only access to this board");
      return;
    }
    setActiveShape(shape);
    setActiveTool(CANVAS_TOOLS.SHAPE);
    setShowShapeMenu(false);
  };

  const handleCreateFrame = () => {
    if (!canEdit) return toast.error("You have view-only access to this board");
    const frameId = `frame_${Date.now()}`;
    const frameEl = {
      id: frameId,
      type: "frame",
      x: 140,
      y: 140,
      width: 320,
      height: 240,
      data: { text: "Section Frame" },
    };
    upsertElement(frameEl);
    emitElementUpdate?.(frameEl);
    toast.success("Frame container created");
  };

  const handleClearAllCanvas = () => {
    if (!canEdit) return;
    if (elements.length === 0) return toast.error("Canvas is already empty");
    if (window.confirm("Are you sure you want to clear all canvas elements?")) {
      const allIds = elements.map((e) => e.id);
      deleteElements(allIds);
      emitElementDelete?.(allIds);
      toast.success("Canvas cleared");
    }
  };

  const handleImageUpload = async (e) => {
    if (!canEdit) {
      toast.error("You have view-only access to this board");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      let imageUrl = "";
      try {
        const res = await uploadApi.boardImage(boardId, file);
        imageUrl = res.data.data?.url || res.data?.url;
      } catch {
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
      }
      const imgElement = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: "image", x: 150, y: 150, width: 260, height: 200,
        data: { url: imageUrl },
      };
      upsertElement(imgElement);
      emitElementUpdate?.(imgElement);
      toast.success("Image placed on whiteboard");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* Shape icon helper */
  const shapeIcon = {
    rect: <Square className="w-4 h-4" />,
    circle: <Circle className="w-4 h-4" />,
    diamond: <Diamond className="w-4 h-4" />,
    triangle: <Triangle className="w-4 h-4" />,
    arrow: <ArrowUpRight className="w-4 h-4" />,
    line: <Minus className="w-4 h-4" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-0.5 sm:gap-1 p-1 sm:p-2 max-h-[85vh] overflow-y-auto custom-scrollbar rounded-2xl bg-[#ffffff]/95 backdrop-blur-xl border border-[#E8E9F0] shadow-xl shadow-black/5 select-none font-sans"
    >
      {!canEdit && (
        <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full mb-1">
          View Only
        </span>
      )}

      {/* Select */}
      <ToolBtn active={activeTool === CANVAS_TOOLS.SELECT} onClick={() => handleToolSelect(CANVAS_TOOLS.SELECT)} title="Select (V)">
        <MousePointer className="w-4 h-4" />
      </ToolBtn>

      {/* Hand (Pan) */}
      <ToolBtn active={activeTool === CANVAS_TOOLS.HAND} onClick={() => handleToolSelect(CANVAS_TOOLS.HAND)} title="Pan Canvas (H)">
        <Hand className="w-4 h-4" />
      </ToolBtn>

      {canEdit && (
        <>
          <Divider />

          {/* Draw */}
          <ToolBtn active={activeTool === CANVAS_TOOLS.DRAW} onClick={() => handleToolSelect(CANVAS_TOOLS.DRAW)} title="Freehand Draw (P)">
            <Pencil className="w-4 h-4" />
          </ToolBtn>

          {/* Shapes dropdown */}
          <div className="relative">
            <ToolBtn
              active={activeTool === CANVAS_TOOLS.SHAPE}
              onClick={() => setShowShapeMenu((v) => !v)}
              title="Shapes & Flowcharts"
            >
              {shapeIcon[activeShape] || <Square className="w-4 h-4" />}
            </ToolBtn>

            {showShapeMenu && (
              <motion.div
                initial={{ opacity: 0, x: 8, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.13 }}
                className="absolute left-full ml-3 top-0 p-1.5 rounded-xl bg-[#ffffff] border border-[#E8E9F0] shadow-xl flex flex-col gap-1 min-w-[140px]"
              >
                {[
                  { key: "rect",     icon: <Square className="w-4 h-4" />,       label: "Rectangle" },
                  { key: "circle",   icon: <Circle className="w-4 h-4" />,       label: "Circle / Ellipse" },
                  { key: "diamond",  icon: <Diamond className="w-4 h-4" />,      label: "Decision Diamond" },
                  { key: "triangle", icon: <Triangle className="w-4 h-4" />,     label: "Triangle" },
                  { key: "arrow",    icon: <ArrowUpRight className="w-4 h-4" />, label: "Connector Arrow" },
                  { key: "line",     icon: <Minus className="w-4 h-4" />,        label: "Straight Line" },
                ].map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => handleShapeSelect(key)}
                    className={`w-full px-2.5 py-1.5 flex items-center gap-2.5 rounded-lg text-xs font-medium transition-colors ${
                      activeShape === key ? "bg-[#6D5EF7] text-white" : "text-[#4B4B6A] hover:text-[#0F0F1A] hover:bg-[#F3F4F6]"
                    }`}
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Frame Tool */}
          <ToolBtn active={false} onClick={handleCreateFrame} title="Section Frame (F)">
            <Frame className="w-4 h-4" />
          </ToolBtn>

          {/* Sticky note */}
          <ToolBtn active={activeTool === CANVAS_TOOLS.STICKY} onClick={() => handleToolSelect(CANVAS_TOOLS.STICKY)} title="Sticky Note (S)">
            <StickyNote className="w-4 h-4" />
          </ToolBtn>

          {/* Text */}
          <ToolBtn active={activeTool === CANVAS_TOOLS.TEXT} onClick={() => handleToolSelect(CANVAS_TOOLS.TEXT)} title="Text Box (T)">
            <Type className="w-4 h-4" />
          </ToolBtn>

          {/* Image upload */}
          <ToolBtn
            active={false}
            onClick={() => fileInputRef.current?.click()}
            title="Upload Image (I)"
            className={isUploading ? "opacity-50 pointer-events-none" : ""}
          >
            <ImageIcon className="w-4 h-4" />
          </ToolBtn>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

          {/* Eraser */}
          <ToolBtn
            active={activeTool === CANVAS_TOOLS.ERASER}
            onClick={() => handleToolSelect(CANVAS_TOOLS.ERASER)}
            title="Eraser (E)"
            className={activeTool === CANVAS_TOOLS.ERASER ? "!bg-rose-500 !text-white !shadow-rose-500/30" : ""}
          >
            <Eraser className="w-4 h-4" />
          </ToolBtn>

          <Divider />
        </>
      )}

      {/* Color picker */}
      <div className="relative">
        <button
          onClick={() => setShowColorMenu((v) => !v)}
          title="Colors & Stroke"
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all text-[#4B4B6A] hover:text-[#0F0F1A] hover:bg-[#F3F4F6] group relative"
        >
          <div
            className="w-5 h-5 rounded-full border border-black/10 shadow-inner"
            style={{ backgroundColor: activeTool === CANVAS_TOOLS.STICKY ? stickyBg : strokeColor }}
          />
          {/* Tooltip */}
          <span className="pointer-events-none absolute left-full ml-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#0F0F1A] text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
            Colors & Style
          </span>
        </button>

        {showColorMenu && (
          <motion.div
            initial={{ opacity: 0, x: 8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.13 }}
            className="absolute left-full ml-3 top-0 p-3 rounded-2xl bg-[#ffffff] border border-[#E8E9F0] shadow-xl min-w-[200px] space-y-3"
          >
            {/* Stroke color */}
            <div>
              <p className="text-[10px] font-bold text-[#9898B3] uppercase tracking-wider mb-2">Stroke Color</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {STROKE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleStrokeColorChange(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      strokeColor === c ? "scale-125 border-[#6D5EF7] shadow-md" : "border-[#E5E7EB] hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Sticky color */}
            <div>
              <p className="text-[10px] font-bold text-[#9898B3] uppercase tracking-wider mb-2">Sticky Color</p>
              <div className="grid grid-cols-6 gap-1.5">
                {STICKY_COLORS.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => handleStickyBgChange(s.bg)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      stickyBg === s.bg ? "scale-125 border-[#6D5EF7] shadow-md" : "border-[#E5E7EB] hover:scale-110"
                    }`}
                    style={{ backgroundColor: s.bg }}
                    title={s.name}
                  />
                ))}
              </div>
            </div>

            {/* Stroke width */}
            <div>
              <p className="text-[10px] font-bold text-[#9898B3] uppercase tracking-wider mb-2">Stroke Width</p>
              <div className="flex items-center gap-1.5">
                {[2, 4, 8].map((w) => (
                  <button
                    key={w}
                    onClick={() => handleStrokeWidthChange(w)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      strokeWidth === w
                        ? "bg-[#6D5EF7] text-white border-[#6D5EF7]"
                        : "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB] hover:bg-[#E5E7EB]"
                    }`}
                  >
                    {w === 2 ? "Thin" : w === 4 ? "Mid" : "Bold"}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <Divider />

      {/* Clear Canvas Action */}
      {canEdit && (
        <ToolBtn onClick={handleClearAllCanvas} title="Clear Canvas Elements" className="hover:!text-rose-600">
          <Trash2 className="w-4 h-4 text-[#4B4B6A] hover:text-rose-600" />
        </ToolBtn>
      )}

      {/* AI shortcut */}
      <button
        onClick={toggleAI}
        title="AI Assistant"
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all relative group ${
          showAI
            ? "bg-[#6D5EF7] text-white shadow-md shadow-[#6D5EF7]/25"
            : "text-[#6D5EF7] hover:text-[#5B4CE0] hover:bg-[#EDE9FE]"
        }`}
      >
        <Bot className="w-4.5 h-4.5" />
        <span className="pointer-events-none absolute left-full ml-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#0F0F1A] text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
          AI Assistant
        </span>
      </button>
    </motion.div>
  );
}

export default BoardToolbar;
