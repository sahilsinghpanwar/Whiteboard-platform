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
  emitCanvasSave,
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
    role,
  } = useBoardStore();

  const canEdit = role === "owner" || role === "editor";

  const [isPointerDown, setIsPointerDown] = useState(false);
  const [currentElement, setCurrentElement] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null); // Marquee selection box
  const [spacePressed, setSpacePressed] = useState(false);
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

  // ─── Pointer Down ────────────────────────────────────────────────────────
  const handlePointerDown = (e) => {
    if (e.button === 2) return; // Ignore right click

    const coords = getCanvasCoordinates(e);
    setIsPointerDown(true);

    // If viewer, only allow panning (HAND / Space) or selection
    if (!canEdit && activeTool !== CANVAS_TOOLS.HAND && activeTool !== CANVAS_TOOLS.SELECT) {
      if (e.button === 1 || spacePressed) {
        setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      }
      return;
    }

    // Pan Tool, Middle-Click, or Spacebar Held
    if (activeTool === CANVAS_TOOLS.HAND || e.button === 1 || spacePressed) {
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
    if (dragStart && (activeTool === CANVAS_TOOLS.HAND || e.buttons === 4 || spacePressed)) {
      setViewport({
        ...viewport,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Element Drag Move
    if (activeTool === CANVAS_TOOLS.SELECT && dragStart && selectedElementIds.length > 0 && canEdit) {
      const dx = coords.x - dragStart.x;
      const dy = coords.y - dragStart.y;
      
      selectedElementIds.forEach((id) => {
        const el = elements.find((e) => e.id === id);
        if (el) {
          upsertElement({ ...el, x: el.x + dx, y: el.y + dy });
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

  const getElementBounds = useCallback((el) => {
    if (el.type === "draw" && el.data?.points?.length > 0) {
      const xs = el.data.points.map((p) => p.x);
      const ys = el.data.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { x: minX, y: minY, width: Math.max(maxX - minX, 10), height: Math.max(maxY - minY, 10) };
    }
    return {
      x: el.x,
      y: el.y,
      width: el.width || 120,
      height: el.height || 80,
    };
  }, []);

  // ─── Pointer Up ──────────────────────────────────────────────────────────
  const handlePointerUp = () => {
    setIsPointerDown(false);

    // Select items intersecting with Marquee Selection Box
    if (selectionBox && (selectionBox.width > 3 || selectionBox.height > 3)) {
      const selectedIds = elements
        .filter((el) => {
          const bounds = getElementBounds(el);
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

      // Ensure minimum dimensions if created via single-click
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
    }
  };

  // ─── Zoom with Mouse Wheel ───────────────────────────────────────────────
  const handleWheel = (e) => {
    e.preventDefault();

    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.2), 3);
    if (newZoom === viewport.zoom) return;

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Zoom towards mouse cursor focal point
    const newX = clientX - (clientX - viewport.x) * (newZoom / viewport.zoom);
    const newY = clientY - (clientY - viewport.y) * (newZoom / viewport.zoom);

    setViewport({
      x: Number(newX.toFixed(2)),
      y: Number(newY.toFixed(2)),
      zoom: Number(newZoom.toFixed(2)),
    });
  };

  // ─── Keyboard Shortcuts (Delete, Undo, Redo) ─────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      if (!canEdit) return;

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        const prev = undo();
        if (prev && emitCanvasSave) emitCanvasSave(prev);
        return;
      }

      // Redo: Ctrl+Y / Cmd+Shift+Z / Cmd+Y
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        const next = redo();
        if (next && emitCanvasSave) emitCanvasSave(next);
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
  }, [selectedElementIds, deleteElements, emitElementDelete, undo, redo, canEdit]);

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
            <circle cx="2" cy="2" r={1.2 * viewport.zoom} fill="rgba(255, 255, 255, 0.12)" />
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
              isReadOnly={!canEdit}
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
                if (!canEdit) return;
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
              fill="rgba(109, 94, 247, 0.10)"
              stroke="#6D5EF7"
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
