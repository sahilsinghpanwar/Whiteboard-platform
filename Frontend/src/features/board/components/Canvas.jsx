import React, { useState, useRef, useCallback, useEffect } from "react";
import { useBoardStore, CANVAS_TOOLS } from "../store/Boardstore.js";
import CanvasElement from "./CanvasElement.jsx";

export function Canvas({
  strokeColor = "#ffffff",
  strokeWidth = 2,
  stickyBg = "#fef08a",
  emitElementUpdate,
  emitElementDelete,
  emitCursorMove,
}) {
  const {
    elements,
    selectedElementIds,
    setSelectedElementIds,
    activeTool,
    activeShape,
    viewport,
    setViewport,
    upsertElement,
    deleteElements,
    undo,
    redo,
    cursors,
  } = useBoardStore();

  const [isPointerDown, setIsPointerDown] = useState(false);
  const [currentElement, setCurrentElement] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null); // Marquee selection box
  const svgRef = useRef(null);

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

  // ─── Pointer Down ────────────────────────────────────────────────────────
  const handlePointerDown = (e) => {
    if (e.button === 2) return; // Ignore right click

    const coords = getCanvasCoordinates(e);
    setIsPointerDown(true);

    // Pan Tool or Middle-Click
    if (activeTool === CANVAS_TOOLS.HAND || e.button === 1) {
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      return;
    }

    // Select Tool - Background click starts marquee selection box
    if (activeTool === CANVAS_TOOLS.SELECT) {
      if (e.target === svgRef.current || e.target.tagName === "svg" || e.target.id === "grid-bg") {
        setSelectedElementIds([]);
        setSelectionBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
        setDragStart(coords);
      }
      return;
    }

    // Eraser Tool
    if (activeTool === CANVAS_TOOLS.ERASER) {
      return;
    }

    // New Element ID
    const elementId = `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Freehand Drawing Tool
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

    // Shapes Tool
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

    // Sticky Note Tool
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
      return;
    }

    // Text Box Tool
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
      return;
    }
  };

  // ─── Pointer Move ────────────────────────────────────────────────────────
  const handlePointerMove = (e) => {
    const coords = getCanvasCoordinates(e);

    // Emit live cursor coordinates
    emitCursorMove?.(coords.x, coords.y);

    if (!isPointerDown) return;

    // Pan Canvas
    if (dragStart && (activeTool === CANVAS_TOOLS.HAND || e.buttons === 4)) {
      setViewport({
        ...viewport,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
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

    // Freehand Drawing Update
    if (activeTool === CANVAS_TOOLS.DRAW && currentElement) {
      const updatedElement = {
        ...currentElement,
        data: {
          ...currentElement.data,
          points: [...currentElement.data.points, { x: coords.x, y: coords.y }],
        },
      };
      setCurrentElement(updatedElement);
      return;
    }

    // Shape Drag Sizing Update
    if (activeTool === CANVAS_TOOLS.SHAPE && currentElement && dragStart) {
      const width = coords.x - dragStart.x;
      const height = coords.y - dragStart.y;

      const updatedElement = {
        ...currentElement,
        x: width < 0 ? coords.x : dragStart.x,
        y: height < 0 ? coords.y : dragStart.y,
        width: Math.abs(width),
        height: Math.abs(height),
      };
      setCurrentElement(updatedElement);
      return;
    }
  };

  // ─── Pointer Up ──────────────────────────────────────────────────────────
  const handlePointerUp = () => {
    setIsPointerDown(false);

    // Select items enclosed in Marquee Selection Box
    if (selectionBox && selectionBox.width > 5) {
      const enclosedIds = elements
        .filter((el) => {
          const elW = el.width || 100;
          const elH = el.height || 100;
          return (
            el.x >= selectionBox.x &&
            el.y >= selectionBox.y &&
            el.x + elW <= selectionBox.x + selectionBox.width &&
            el.y + elH <= selectionBox.y + selectionBox.height
          );
        })
        .map((el) => el.id);

      setSelectedElementIds(enclosedIds);
    }

    setSelectionBox(null);
    setDragStart(null);

    if (currentElement) {
      upsertElement(currentElement);
      emitElementUpdate?.(currentElement);
      setSelectedElementIds([currentElement.id]);
      setCurrentElement(null);
    }
  };

  // ─── Zoom with Mouse Wheel ───────────────────────────────────────────────
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
    const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.2), 3);
    setViewport({ ...viewport, zoom: Number(newZoom.toFixed(2)) });
  };

  // ─── Keyboard Shortcuts (Delete, Undo, Redo) ─────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y / Cmd+Shift+Z / Cmd+Y
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete selected elements
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementIds.length > 0) {
        deleteElements(selectedElementIds);
        emitElementDelete?.(selectedElementIds);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementIds, deleteElements, emitElementDelete, undo, redo]);

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-[#0e0e11] select-none cursor-crosshair font-sans"
      onWheel={handleWheel}
    >
      <svg
        ref={svgRef}
        className="w-full h-full absolute inset-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Infinite Dot Grid Pattern */}
        <defs>
          <pattern
            id="dot-grid"
            width={30 * viewport.zoom}
            height={30 * viewport.zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${viewport.x}, ${viewport.y})`}
          >
            <circle cx="2" cy="2" r={1.2 * viewport.zoom} fill="rgba(255, 255, 255, 0.15)" />
          </pattern>
        </defs>

        <rect id="grid-bg" width="100%" height="100%" fill="url(#dot-grid)" />

        {/* Canvas World Viewport Transform */}
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* Render All Canvas Elements */}
          {elements.map((el) => (
            <CanvasElement
              key={el.id}
              element={el}
              isSelected={selectedElementIds.includes(el.id)}
              onSelect={(id, isShift) => {
                if (isShift) {
                  setSelectedElementIds(
                    selectedElementIds.includes(id)
                      ? selectedElementIds.filter((i) => i !== id)
                      : [...selectedElementIds, id]
                  );
                } else {
                  setSelectedElementIds([id]);
                }
              }}
              onUpdate={(updatedEl) => {
                upsertElement(updatedEl);
                emitElementUpdate?.(updatedEl);
              }}
            />
          ))}

          {/* Marquee Selection Box Overlay */}
          {selectionBox && (
            <rect
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
              fill="rgba(99, 102, 241, 0.15)"
              stroke="#6366f1"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              rx="4"
            />
          )}

          {/* Active Creating Element Preview */}
          {currentElement && (
            <CanvasElement
              element={currentElement}
              isSelected={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
          )}

          {/* Multi-User Real-time Cursors */}
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
