import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBoardStore, CANVAS_TOOLS } from "../store/Boardstore.js";
import CanvasElement from "./CanvasElement.jsx";
import { Trash2, Copy, Type, Palette, Move, Bot, Sparkles } from "lucide-react";
import { captureCanvasAsBase64 } from "../utils/canvasExport.js";
import { useAIWorkspace } from "@/features/ai/hooks/Useaiworkspace.js";
import toast from "react-hot-toast";

const PALETTE_COLORS = [
  "#6D5EF7", "#EF4444", "#10B981", "#F59E0B", "#3B82F6",
  "#EC4899", "#fef08a", "#bae6fd", "#bbf7d0", "#e9d5ff",
];

export function Canvas({
  strokeColor = "#ffffff",
  strokeWidth = 2,
  stickyBg = "#fef08a",
  emitElementUpdate,
  emitElementDelete,
  emitCursorMove,
  emitCanvasSave,
}) {
  const {
    elements,
    selectedElementIds,
    setSelectedElementIds,
    activeTool,
    setActiveTool,
    activeShape,
    viewport,
    setViewport,
    upsertElement,
    deleteElements,
    undo,
    redo,
    cursors,
    role,
    toggleAI,
  } = useBoardStore();

  const canEdit = role === "owner" || role === "editor";
  const { handleVisionPrompt, showAI } = useAIWorkspace({ emitElementUpdate, emitElementDelete, emitCanvasSave });

  const [isPointerDown, setIsPointerDown] = useState(false);
  const [currentElement, setCurrentElement] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [resizingState, setResizingState] = useState(null); // { id, handle, initialPos }
  const [spacePressed, setSpacePressed] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const svgRef = useRef(null);

  // Spacebar Panning Listener
  useEffect(() => {
    const handleSpace = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      if (e.code === "Space") {
        setSpacePressed(e.type === "keydown");
      }
    };
    window.addEventListener("keydown", handleSpace);
    window.addEventListener("keyup", handleSpace);
    return () => {
      window.removeEventListener("keydown", handleSpace);
      window.removeEventListener("keyup", handleSpace);
    };
  }, []);

  // Convert client screen coordinates to SVG Canvas world space
  const getCanvasCoordinates = useCallback(
    (e) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      const worldX = (screenX - viewport.x) / viewport.zoom;
      const worldY = (screenY - viewport.y) / viewport.zoom;

      return { x: worldX, y: worldY };
    },
    [viewport]
  );

  // ─── Pointer Down on Canvas Background ──────────────────────────────────
  const handlePointerDown = (e) => {
    if (e.button === 2) return;

    const coords = getCanvasCoordinates(e);
    setIsPointerDown(true);

    if (!canEdit && activeTool !== CANVAS_TOOLS.HAND && activeTool !== CANVAS_TOOLS.SELECT) {
      if (e.button === 1 || spacePressed) {
        setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      }
      return;
    }

    if (activeTool === CANVAS_TOOLS.HAND || e.button === 1 || spacePressed) {
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      return;
    }

    // Select Tool - Background click resets selection or starts marquee
    if (activeTool === CANVAS_TOOLS.SELECT) {
      if (e.target === svgRef.current || e.target.tagName === "svg" || e.target.id === "grid-bg") {
        setSelectedElementIds([]);
        setSelectionBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
        setDragStart(coords);
      }
      return;
    }

    // Eraser Tool
    if (activeTool === CANVAS_TOOLS.ERASER) return;

    const elementId = `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    if (activeTool === CANVAS_TOOLS.DRAW) {
      const newDrawElement = {
        id: elementId,
        type: "draw",
        x: coords.x,
        y: coords.y,
        data: {
          points: [{ x: coords.x, y: coords.y }],
          strokeColor,
          strokeWidth,
        },
      };
      setCurrentElement(newDrawElement);
      return;
    }

    if (activeTool === CANVAS_TOOLS.SHAPE) {
      const newShapeElement = {
        id: elementId,
        type: activeShape,
        x: coords.x,
        y: coords.y,
        width: 1,
        height: 1,
        data: {
          strokeColor,
          strokeWidth,
          fillColor: "transparent",
        },
      };
      setCurrentElement(newShapeElement);
      setDragStart(coords);
      return;
    }

    if (activeTool === CANVAS_TOOLS.STICKY) {
      const newStickyElement = {
        id: elementId,
        type: "sticky",
        x: coords.x - 80,
        y: coords.y - 80,
        width: 160,
        height: 160,
        data: {
          text: "",
          bgColor: stickyBg,
          textColor: "#1e293b",
        },
      };
      upsertElement(newStickyElement);
      setSelectedElementIds([newStickyElement.id]);
      emitElementUpdate?.(newStickyElement);
      setActiveTool(CANVAS_TOOLS.SELECT);
      return;
    }

    if (activeTool === CANVAS_TOOLS.TEXT) {
      const newTextElement = {
        id: elementId,
        type: "text",
        x: coords.x,
        y: coords.y,
        width: 180,
        height: 50,
        data: {
          text: "",
          strokeColor,
          fontSize: 18,
        },
      };
      upsertElement(newTextElement);
      setSelectedElementIds([newTextElement.id]);
      emitElementUpdate?.(newTextElement);
      setActiveTool(CANVAS_TOOLS.SELECT);
      return;
    }
  };

  // Pointer Move (Dragging & Resizing)
  const handlePointerMove = (e) => {
    const coords = getCanvasCoordinates(e);
    emitCursorMove?.(coords.x, coords.y);

    if (!isPointerDown) return;

    // Pan Canvas
    if (dragStart && (activeTool === CANVAS_TOOLS.HAND || e.buttons === 4 || spacePressed)) {
      setViewport({
        ...viewport,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Corner Resizing
    if (resizingState && canEdit) {
      const { id, handle, initialPos } = resizingState;
      const el = elements.find((item) => item.id === id);
      if (el) {
        let newX = el.x;
        let newY = el.y;
        let newWidth = el.width || 100;
        let newHeight = el.height || 100;

        const dx = coords.x - initialPos.x;
        const dy = coords.y - initialPos.y;

        if (handle.includes("e")) newWidth = Math.max(initialPos.width + dx, 30);
        if (handle.includes("s")) newHeight = Math.max(initialPos.height + dy, 30);
        if (handle.includes("w")) {
          const w = Math.max(initialPos.width - dx, 30);
          newX = initialPos.x + (initialPos.width - w);
          newWidth = w;
        }
        if (handle.includes("n")) {
          const h = Math.max(initialPos.height - dy, 30);
          newY = initialPos.y + (initialPos.height - h);
          newHeight = h;
        }

        const resized = { ...el, x: newX, y: newY, width: newWidth, height: newHeight };
        upsertElement(resized);
        emitElementUpdate?.(resized);
      }
      return;
    }

    // Element Drag Move
    if (activeTool === CANVAS_TOOLS.SELECT && dragStart && selectedElementIds.length > 0 && canEdit) {
      const dx = coords.x - dragStart.x;
      const dy = coords.y - dragStart.y;

      selectedElementIds.forEach((id) => {
        const el = elements.find((item) => item.id === id);
        if (el) {
          const updated = { ...el, x: el.x + dx, y: el.y + dy };
          upsertElement(updated);
          emitElementUpdate?.(updated);
        }
      });
      setDragStart(coords);
      return;
    }

    // Marquee Selection Box Update
    if (activeTool === CANVAS_TOOLS.SELECT && dragStart && selectionBox) {
      const width = coords.x - dragStart.x;
      const height = coords.y - dragStart.y;
      setSelectionBox({
        x: width < 0 ? coords.x : dragStart.x,
        y: height < 0 ? coords.y : dragStart.y,
        width: Math.abs(width),
        height: Math.abs(height),
      });
      return;
    }

    // Creating Draw Element
    if (currentElement && currentElement.type === "draw") {
      const updatedDraw = {
        ...currentElement,
        data: {
          ...currentElement.data,
          points: [...currentElement.data.points, { x: coords.x, y: coords.y }],
        },
      };
      setCurrentElement(updatedDraw);
      return;
    }

    // Creating Shape / Line / Arrow Element
    if (currentElement && dragStart) {
      const width = coords.x - dragStart.x;
      const height = coords.y - dragStart.y;

      let updatedShape;
      if (currentElement.type === "arrow" || currentElement.type === "line") {
        // Preserves vector direction for lines and arrows
        updatedShape = {
          ...currentElement,
          x: dragStart.x,
          y: dragStart.y,
          width,
          height,
        };
      } else {
        updatedShape = {
          ...currentElement,
          x: width < 0 ? coords.x : dragStart.x,
          y: height < 0 ? coords.y : dragStart.y,
          width: Math.abs(width),
          height: Math.abs(height),
        };
      }
      setCurrentElement(updatedShape);
      return;
    }
  };

  // Pointer Up
  const handlePointerUp = () => {
    setIsPointerDown(false);
    setResizingState(null);

    if (selectionBox) {
      const selectedIds = elements
        .filter((el) => {
          const bounds = {
            x: el.x,
            y: el.y,
            width: el.width || 50,
            height: el.height || 50,
          };
          return (
            bounds.x < selectionBox.x + selectionBox.width &&
            bounds.x + bounds.width > selectionBox.x &&
            bounds.y < selectionBox.y + selectionBox.height &&
            bounds.y + bounds.height > selectionBox.y
          );
        })
        .map((el) => el.id);

      setSelectedElementIds(selectedIds);
    }

    setSelectionBox(null);
    setDragStart(null);

    if (currentElement) {
      if (!canEdit) {
        setCurrentElement(null);
        return;
      }
      let finalElement = { ...currentElement };

      if (finalElement.type === "rect" && (finalElement.width < 10 || finalElement.height < 10)) {
        finalElement.width = 140;
        finalElement.height = 90;
      } else if (finalElement.type === "circle" && (finalElement.width < 10 || finalElement.height < 10)) {
        finalElement.width = 110;
        finalElement.height = 110;
      } else if (
        (finalElement.type === "line" || finalElement.type === "arrow") &&
        Math.abs(finalElement.width) < 10 &&
        Math.abs(finalElement.height) < 10
      ) {
        finalElement.width = 130;
        finalElement.height = 0;
      }

      upsertElement(finalElement);
      emitElementUpdate?.(finalElement);
      setSelectedElementIds([finalElement.id]);
      setCurrentElement(null);
      setActiveTool(CANVAS_TOOLS.SELECT);
    }
  };

  // Element Direct Click, Drag & Erase Handler 
  const handleElementSelect = (id, isShift, pointerEvent) => {
    // Check if Eraser tool is active
    if (activeTool === CANVAS_TOOLS.ERASER) {
      if (canEdit) {
        deleteElements([id]);
        emitElementDelete?.([id]);
        setSelectedElementIds([]);
        toast.success("Element erased");
      }
      return;
    }

    const coords = getCanvasCoordinates(pointerEvent);
    setIsPointerDown(true);
    setDragStart(coords);

    if (isShift) {
      setSelectedElementIds(
        selectedElementIds.includes(id)
          ? selectedElementIds.filter((i) => i !== id)
          : [...selectedElementIds, id]
      );
    } else {
      setSelectedElementIds([id]);
    }
  };

  const handleResizeStart = (id, handle, pointerEvent) => {
    const coords = getCanvasCoordinates(pointerEvent);
    const el = elements.find((item) => item.id === id);
    if (el) {
      setIsPointerDown(true);
      setResizingState({
        id,
        handle,
        initialPos: { x: coords.x, y: coords.y, width: el.width || 160, height: el.height || 160, elX: el.x, elY: el.y },
      });
    }
  };

  // Customization Toolbar Handlers
  const handleChangeColor = (color) => {
    if (!canEdit || selectedElementIds.length === 0) return;
    selectedElementIds.forEach((id) => {
      const el = elements.find((item) => item.id === id);
      if (el) {
        const updated = {
          ...el,
          data: {
            ...el.data,
            strokeColor: color,
            fillColor: el.type === "sticky" ? color : el.data?.fillColor || color,
            bgColor: color,
          },
        };
        upsertElement(updated);
        emitElementUpdate?.(updated);
      }
    });
    setShowColorPicker(false);
    toast.success("Color updated");
  };

  const handleDuplicate = () => {
    if (!canEdit || selectedElementIds.length === 0) return;
    const newIds = [];
    selectedElementIds.forEach((id) => {
      const el = elements.find((item) => item.id === id);
      if (el) {
        const dupId = `el_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const dup = { ...el, id: dupId, x: el.x + 30, y: el.y + 30 };
        upsertElement(dup);
        emitElementUpdate?.(dup);
        newIds.push(dupId);
      }
    });
    setSelectedElementIds(newIds);
    toast.success(`Duplicated ${newIds.length} item(s)`);
  };

  const handleDeleteSelected = () => {
    if (!canEdit || selectedElementIds.length === 0) return;
    deleteElements(selectedElementIds);
    emitElementDelete?.(selectedElementIds);
    setSelectedElementIds([]);
    toast.success("Deleted selected item(s)");
  };

  // Zoom with Mouse Wheel
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.2), 3);
    if (newZoom === viewport.zoom) return;

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const newX = clientX - (clientX - viewport.x) * (newZoom / viewport.zoom);
    const newY = clientY - (clientY - viewport.y) * (newZoom / viewport.zoom);

    setViewport({
      x: Number(newX.toFixed(2)),
      y: Number(newY.toFixed(2)),
      zoom: Number(newZoom.toFixed(2)),
    });
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      if (!canEdit) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        const prev = undo();
        if (prev && emitCanvasSave) emitCanvasSave(prev);
        return;
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        const next = redo();
        if (next && emitCanvasSave) emitCanvasSave(next);
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementIds.length > 0) {
        deleteElements(selectedElementIds);
        emitElementDelete?.(selectedElementIds);
        setSelectedElementIds([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementIds, deleteElements, emitElementDelete, undo, redo, canEdit]);

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-[#F7F8FC] select-none cursor-crosshair font-sans"
      onWheel={handleWheel}
    >
      {/* Floating Selection Customization Bar */}
      <AnimatePresence>
        {selectedElementIds.length > 0 && canEdit && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#ffffff] border border-[#E8E9F0] shadow-xl shadow-black/10 select-none font-sans"
          >
            <span className="text-xs font-bold text-[#0F0F1A] px-2 py-1 bg-[#F3F4F6] rounded-lg">
              {selectedElementIds.length} {selectedElementIds.length === 1 ? "item" : "items"} selected
            </span>

            <div className="w-px h-4 bg-[#E5E7EB]" />

            {/* Color Swatch Picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker((v) => !v)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors"
                title="Customize color"
              >
                <Palette className="w-3.5 h-3.5 text-[#6D5EF7]" />
                Color
              </button>

              {showColorPicker && (
                <div className="absolute top-full left-0 mt-2 p-2 rounded-xl bg-[#ffffff] border border-[#E8E9F0] shadow-xl grid grid-cols-5 gap-1.5 z-50 min-w-[140px]">
                  {PALETTE_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleChangeColor(c)}
                      className="w-6 h-6 rounded-full border border-black/10 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Duplicate */}
            <button
              onClick={handleDuplicate}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors"
              title="Duplicate (Ctrl+D)"
            >
              <Copy className="w-3.5 h-3.5 text-[#3B82F6]" />
              Duplicate
            </button>

            {/* Delete */}
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-[#EF4444] hover:bg-[#FEE2E2] transition-colors"
              title="Delete (Del)"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
              Delete
            </button>

            <div className="w-px h-4 bg-[#E5E7EB]" />

            {/* AI Edit shortcut */}
            <button
              onClick={toggleAI}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#6D5EF7] bg-[#EDE9FE] hover:bg-[#C4B5FD] transition-colors"
              title="AI Edit"
            >
              <Bot className="w-3.5 h-3.5 text-[#6D5EF7]" />
              AI Edit
            </button>

            {/* Polish Sketch */}
            <button
              onClick={async () => {
                if (!svgRef.current) return;
                const base64Image = await captureCanvasAsBase64(svgRef.current);
                if (!showAI) toggleAI();
                const prompt = window.prompt("What should AI polish this sketch into?", "Polish this sketch into a login form");
                if (prompt) {
                  toast.loading("Processing sketch...", { id: "vision_toast" });
                  await handleVisionPrompt(prompt, base64Image);
                  toast.dismiss("vision_toast");
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#BE185D] bg-[#FCE7F3] hover:bg-[#FBCFE8] transition-colors"
              title="Polish Canvas Sketch"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#BE185D]" />
              Polish Sketch
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <svg
        ref={svgRef}
        className="w-full h-full absolute inset-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          <pattern
            id="dot-grid"
            width={30 * viewport.zoom}
            height={30 * viewport.zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${viewport.x}, ${viewport.y})`}
          >
            <circle cx="2" cy="2" r={1.2 * viewport.zoom} fill="rgba(15, 15, 26, 0.12)" />
          </pattern>
        </defs>

        <rect id="grid-bg" width="100%" height="100%" fill="url(#dot-grid)" />

        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {elements.map((el) => (
            <CanvasElement
              key={el.id}
              element={el}
              isSelected={selectedElementIds.includes(el.id)}
              isReadOnly={!canEdit}
              onSelect={handleElementSelect}
              onResizeStart={handleResizeStart}
              onUpdate={(updatedEl) => {
                if (!canEdit) return;
                upsertElement(updatedEl);
                emitElementUpdate?.(updatedEl);
              }}
            />
          ))}

          {selectionBox && (
            <rect
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
              fill="rgba(109, 94, 247, 0.10)"
              stroke="#6D5EF7"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              rx="4"
            />
          )}

          {currentElement && (
            <CanvasElement
              element={currentElement}
              isSelected={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
          )}

          {Object.entries(cursors).map(([userId, cursor]) => (
            <g key={userId} transform={`translate(${cursor.x}, ${cursor.y})`} className="pointer-events-none transition-transform duration-75">
              <path
                d="M 0 0 L 12 18 L 8 11 L 18 8 Z"
                fill={cursor.color || "#3b82f6"}
                stroke="#000000"
                strokeWidth="1"
              />
              <rect
                x="12"
                y="12"
                width={Math.max((cursor.fullName?.length || 4) * 8, 40)}
                height="20"
                rx="4"
                fill={cursor.color || "#3b82f6"}
              />
              <text x="16" y="26" fill="#ffffff" fontSize="11" fontWeight="600" fontFamily="sans-serif">
                {cursor.fullName || "User"}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default Canvas;
