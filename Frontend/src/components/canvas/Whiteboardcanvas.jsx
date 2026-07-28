import { useEffect, useRef, useCallback, useState } from "react";
import { fabric } from "fabric";
import { useBoardStore } from "../../store/boardStore";
import { useAuthStore } from "../../store/authStore";
import { nanoid } from "../../utils/nanoid";
import CursorOverlay from "./CursorOverlay";
import PropertyPanel from "./PropertyPanel/PropertyPanel";
import styles from "./WhiteboardCanvas.module.css";

// Constants
const CURSOR_EMIT_THROTTLE_MS = 50;
const HISTORY_LIMIT = 60;

// Map tool names → Fabric cursor strings
const TOOL_CURSORS = {
  select: "default",
  pen: "crosshair",
  rect: "crosshair",
  circle: "crosshair",
  line: "crosshair",
  arrow: "crosshair",
  text: "text",
  sticky: "crosshair",
  eraser: "cell",
  pan: "grab",
};

// Helpers
function fabricObjToJson(obj) {
  return {
    id: obj.id,
    type: obj.type,
    data: obj.toJSON(["id", "elementType"]),
  };
}

function applyRemoteObject(canvas, payload) {
  const { id, data } = payload;
  const existing = canvas.getObjects().find((o) => o.id === id);

  fabric.util.enlivenObjects([data], ([newObj]) => {
    if (!newObj) return;
    newObj.id = id;

    if (existing) {
      existing.set(newObj.toObject(["id", "elementType"]));
      existing.setCoords();
      canvas.renderAll();
    } else {
      canvas.add(newObj);
      canvas.renderAll();
    }
  });
}

// Component
export default function WhiteboardCanvas({ emitDraw, emitMove, emitDelete, emitCursor, remoteCursors }) {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const drawingRef = useRef(null); // { obj, startX, startY }
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });
  const cursorThrottle = useRef(null);
  const historyRef = useRef({ stack: [], index: -1, locked: false });

  const { activeTool, strokeColor, fillColor, strokeWidth, fontSize, setActiveTool } = useBoardStore();
  const { user } = useAuthStore();

  const [selectedObj, setSelectedObj] = useState(null);
  const [zoom, setZoom] = useState(1);

  // Canvas init 
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#0f0f13",
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
    });

    fabricRef.current = canvas;

    // Resize handler
    const onResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      canvas.renderAll();
    };
    window.addEventListener("resize", onResize);

    // Keyboard shortcuts
    const onKeyDown = (e) => handleKeyDown(e, canvas);
    window.addEventListener("keydown", onKeyDown);

    // Push first empty snapshot
    pushHistory(canvas);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      canvas.dispose();
    };
  }, []); // eslint-disable-line

  // Tool switching
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Reset modes
    canvas.isDrawingMode = false;
    canvas.selection = activeTool === "select";
    canvas.defaultCursor = TOOL_CURSORS[activeTool] || "default";
    canvas.hoverCursor = activeTool === "select" ? "move" : TOOL_CURSORS[activeTool];

    canvas.getObjects().forEach((obj) => {
      obj.selectable = activeTool === "select" || activeTool === "eraser";
      obj.evented = activeTool === "select" || activeTool === "eraser";
    });

    if (activeTool === "pen") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = strokeColor;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.decimate = 4;
    }

    canvas.renderAll();
  }, [activeTool, strokeColor, strokeWidth]);

  // Sync brush color/width while in pen mode
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !canvas.freeDrawingBrush) return;
    canvas.freeDrawingBrush.color = strokeColor;
    canvas.freeDrawingBrush.width = strokeWidth;
  }, [strokeColor, strokeWidth]);

  // Mouse events
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Mouse Down
    const onMouseDown = (opt) => {
      const { e, pointer } = opt;
      const p = canvas.getPointer(e);

      if (activeTool === "pan") {
        isPanning.current = true;
        lastPan.current = { x: e.clientX, y: e.clientY };
        canvas.defaultCursor = "grabbing";
        return;
      }

      if (activeTool === "eraser") {
        const target = canvas.findTarget(e);
        if (target) deleteObject(canvas, target);
        return;
      }

      if (activeTool === "text") {
        addTextbox(canvas, p);
        return;
      }

      if (activeTool === "sticky") {
        addStickyNote(canvas, p);
        return;
      }

      // Shape tools
      if (["rect", "circle", "line", "arrow"].includes(activeTool)) {
        canvas.selection = false;
        const obj = createShapeStart(activeTool, p);
        if (obj) {
          canvas.add(obj);
          drawingRef.current = { obj, startX: p.x, startY: p.y };
        }
      }
    };

    // Mouse Move
    const onMouseMove = (opt) => {
      const { e, pointer } = opt;
      const p = canvas.getPointer(e);

      // Throttled cursor emit
      if (!cursorThrottle.current) {
        cursorThrottle.current = setTimeout(() => {
          cursorThrottle.current = null;
          emitCursor?.({ x: p.x, y: p.y, userId: user?._id, name: user?.name, color: user?.avatarColor });
        }, CURSOR_EMIT_THROTTLE_MS);
      }

      // Pan
      if (isPanning.current && activeTool === "pan") {
        const dx = e.clientX - lastPan.current.x;
        const dy = e.clientY - lastPan.current.y;
        const vpt = canvas.viewportTransform.slice();
        vpt[4] += dx;
        vpt[5] += dy;
        canvas.setViewportTransform(vpt);
        lastPan.current = { x: e.clientX, y: e.clientY };
        canvas.requestRenderAll();
        return;
      }

      // Shape resize while drawing
      if (drawingRef.current) {
        const { obj, startX, startY } = drawingRef.current;
        resizeShape(obj, startX, startY, p.x, p.y, activeTool);
        canvas.requestRenderAll();
      }
    };

    // Mouse Up
    const onMouseUp = (opt) => {
      if (isPanning.current) {
        isPanning.current = false;
        canvas.defaultCursor = "grab";
        return;
      }

      if (drawingRef.current) {
        const { obj } = drawingRef.current;
        drawingRef.current = null;
        canvas.selection = true;

        // Discard tiny shapes (accidental clicks)
        if (obj.width < 5 && obj.height < 5 && obj.type !== "line") {
          canvas.remove(obj);
          return;
        }

        obj.setCoords();
        finalizeObject(obj);
        pushHistory(canvas);
        emitDraw?.(fabricObjToJson(obj));
      }
    };

    // Path Created (pen tool)
    const onPathCreated = ({ path }) => {
      path.id = nanoid();
      path.elementType = "pen";
      finalizeObject(path);
      pushHistory(canvas);
      emitDraw?.(fabricObjToJson(path));
    };

    // Object Modified (move/resize)
    const onObjectModified = (opt) => {
      const obj = opt.target;
      if (!obj || historyRef.current.locked) return;
      obj.setCoords();
      pushHistory(canvas);
      emitMove?.(fabricObjToJson(obj));
    };

    // Selection
    const onSelectionCreated = (opt) => setSelectedObj(opt.selected?.[0] || null);
    const onSelectionUpdated = (opt) => setSelectedObj(opt.selected?.[0] || null);
    const onSelectionCleared = () => setSelectedObj(null);

    // Bind all events
    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
    canvas.on("mouse:up", onMouseUp);
    canvas.on("path:created", onPathCreated);
    canvas.on("object:modified", onObjectModified);
    canvas.on("selection:created", onSelectionCreated);
    canvas.on("selection:updated", onSelectionUpdated);
    canvas.on("selection:cleared", onSelectionCleared);

    // Mouse wheel zoom
    canvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY;
      let z = canvas.getZoom();
      z *= 0.999 ** delta;
      z = Math.min(Math.max(z, 0.1), 5);
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, z);
      setZoom(z);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    return () => {
      canvas.off("mouse:down", onMouseDown);
      canvas.off("mouse:move", onMouseMove);
      canvas.off("mouse:up", onMouseUp);
      canvas.off("path:created", onPathCreated);
      canvas.off("object:modified", onObjectModified);
      canvas.off("selection:created", onSelectionCreated);
      canvas.off("selection:updated", onSelectionUpdated);
      canvas.off("selection:cleared", onSelectionCleared);
      canvas.off("mouse:wheel");
    };
  }, [activeTool, strokeColor, fillColor, strokeWidth, fontSize, emitDraw, emitMove, emitCursor, user]);

  // Remote events handler (called from useBoard)
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Expose apply functions on the canvas so BoardPage / useBoard can call them
    canvas.__applyRemoteDraw = (payload) => {
      applyRemoteObject(canvas, payload);
    };

    canvas.__applyRemoteMove = (payload) => {
      const obj = canvas.getObjects().find((o) => o.id === payload.id);
      if (!obj) return applyRemoteObject(canvas, payload);
      historyRef.current.locked = true;
      obj.set(payload.data);
      obj.setCoords();
      canvas.renderAll();
      historyRef.current.locked = false;
    };

    canvas.__applyRemoteDelete = (id) => {
      const obj = canvas.getObjects().find((o) => o.id === id);
      if (obj) {
        canvas.remove(obj);
        canvas.renderAll();
      }
    };

    canvas.__loadElements = (elements) => {
      canvas.clear();
      canvas.backgroundColor = "#0f0f13";
      if (!elements?.length) { canvas.renderAll(); return; }

      const dataArr = elements.map((el) => ({ ...el.data, id: el.id }));
      fabric.util.enlivenObjects(dataArr, (objects) => {
        objects.forEach((obj, i) => {
          obj.id = elements[i].id;
        });
        canvas.add(...objects);
        canvas.renderAll();
        pushHistory(canvas);
      });
    };

    canvas.__exportPNG = () => canvas.toDataURL({ format: "png", multiplier: 2 });
    canvas.__exportSVG = () => canvas.toSVG();
    canvas.__clearCanvas = () => {
      canvas.clear();
      canvas.backgroundColor = "#0f0f13";
      canvas.renderAll();
      pushHistory(canvas);
    };
  }, []);

  // Shape creation helpers
  function createShapeStart(tool, p) {
    const common = {
      id: nanoid(),
      left: p.x,
      top: p.y,
      stroke: strokeColor,
      strokeWidth,
      fill: fillColor === "transparent" ? "transparent" : fillColor,
      strokeUniform: true,
      originX: "left",
      originY: "top",
    };

    switch (tool) {
      case "rect":
        return new fabric.Rect({ ...common, width: 0, height: 0, rx: 4, ry: 4, elementType: "rect" });

      case "circle":
        return new fabric.Ellipse({ ...common, rx: 0, ry: 0, elementType: "circle" });

      case "line":
        return new fabric.Line([p.x, p.y, p.x, p.y], {
          id: nanoid(),
          stroke: strokeColor,
          strokeWidth,
          strokeLineCap: "round",
          elementType: "line",
          selectable: false,
        });

      case "arrow": {
        const line = new fabric.Line([p.x, p.y, p.x, p.y], {
          id: nanoid(),
          stroke: strokeColor,
          strokeWidth,
          strokeLineCap: "round",
          elementType: "arrow",
          selectable: false,
        });
        return line;
      }

      default:
        return null;
    }
  }

  function resizeShape(obj, x0, y0, x1, y1, tool) {
    const w = x1 - x0;
    const h = y1 - y0;

    switch (tool) {
      case "rect":
        obj.set({
          left: Math.min(x0, x1),
          top: Math.min(y0, y1),
          width: Math.abs(w),
          height: Math.abs(h),
        });
        break;

      case "circle":
        obj.set({
          left: Math.min(x0, x1),
          top: Math.min(y0, y1),
          rx: Math.abs(w) / 2,
          ry: Math.abs(h) / 2,
        });
        break;

      case "line":
      case "arrow":
        obj.set({ x2: x1, y2: y1 });
        obj.setCoords();
        break;

      default:
        break;
    }
  }

  function finalizeObject(obj) {
    obj.selectable = true;
    obj.evented = true;
    obj.hasControls = true;
    obj.hasBorders = true;
    obj.lockScalingFlip = true;
    obj.setCoords();
  }

  //  Add Textbox
  function addTextbox(canvas, p) {
    const text = new fabric.Textbox("Type here...", {
      id: nanoid(),
      elementType: "text",
      left: p.x,
      top: p.y,
      width: 200,
      fontSize,
      fill: strokeColor,
      fontFamily: "Inter, sans-serif",
      editable: true,
      selectable: true,
      evented: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    text.selectAll();
    canvas.renderAll();

    text.on("editing:exited", () => {
      if (text.text.trim() === "" || text.text === "Type here...") {
        canvas.remove(text);
        return;
      }
      pushHistory(canvas);
      emitDraw?.(fabricObjToJson(text));
    });

    setActiveTool("select");
  }

  // Add Sticky Note
  function addStickyNote(canvas, p) {
    const COLORS = ["#fef08a", "#86efac", "#93c5fd", "#f9a8d4", "#fca5a5"];
    const bgColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    const rect = new fabric.Rect({
      width: 180,
      height: 160,
      fill: bgColor,
      rx: 8,
      ry: 8,
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.2)", blur: 8, offsetX: 2, offsetY: 4 }),
    });

    const text = new fabric.Textbox("Note...", {
      width: 160,
      top: 12,
      left: 10,
      fontSize: 14,
      fill: "#1a1a2e",
      fontFamily: "Inter, sans-serif",
      editable: true,
    });

    const group = new fabric.Group([rect, text], {
      id: nanoid(),
      elementType: "sticky",
      left: p.x,
      top: p.y,
      selectable: true,
      evented: true,
      subTargetCheck: true,
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    pushHistory(canvas);
    emitDraw?.(fabricObjToJson(group));
    setActiveTool("select");
  }

  // Delete
  function deleteObject(canvas, obj) {
    const id = obj.id;
    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.renderAll();
    pushHistory(canvas);
    emitDelete?.(id);
    setSelectedObj(null);
  }

  // Keyboard shortcuts
  function handleKeyDown(e, canvas) {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    const isEditing = active?.isEditing;

    if (isEditing) return; // Let fabric handle text input

    // Delete / Backspace
    if ((e.key === "Delete" || e.key === "Backspace") && active) {
      e.preventDefault();
      if (active.type === "activeSelection") {
        active.getObjects().forEach((obj) => {
          canvas.remove(obj);
          emitDelete?.(obj.id);
        });
        canvas.discardActiveObject();
      } else {
        deleteObject(canvas, active);
      }
      canvas.renderAll();
      return;
    }

    // Undo
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undoHistory(canvas);
      return;
    }

    // Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      e.preventDefault();
      redoHistory(canvas);
      return;
    }

    // Select All
    if ((e.ctrlKey || e.metaKey) && e.key === "a") {
      e.preventDefault();
      canvas.discardActiveObject();
      const sel = new fabric.ActiveSelection(canvas.getObjects(), { canvas });
      canvas.setActiveObject(sel);
      canvas.renderAll();
      return;
    }

    // Escape → select tool
    if (e.key === "Escape") {
      canvas.discardActiveObject();
      canvas.renderAll();
      setActiveTool("select");
    }

    // Tool shortcuts
    const shortcuts = { v: "select", p: "pen", r: "rect", c: "circle", l: "line", t: "text", h: "pan", e: "eraser" };
    if (!e.ctrlKey && !e.metaKey && shortcuts[e.key]) {
      setActiveTool(shortcuts[e.key]);
    }
  }

  // History (undo / redo)
  function pushHistory(canvas) {
    if (historyRef.current.locked) return;
    const json = canvas.toJSON(["id", "elementType"]);
    const { stack, index } = historyRef.current;

    // Cut forward stack
    const newStack = stack.slice(0, index + 1);
    newStack.push(json);
    if (newStack.length > HISTORY_LIMIT) newStack.shift();

    historyRef.current = { stack: newStack, index: newStack.length - 1, locked: false };
  }

  function undoHistory(canvas) {
    const { stack, index } = historyRef.current;
    if (index <= 0) return;
    const newIndex = index - 1;
    historyRef.current.locked = true;
    canvas.loadFromJSON(stack[newIndex], () => {
      canvas.renderAll();
      historyRef.current = { stack, index: newIndex, locked: false };
    });
  }

  function redoHistory(canvas) {
    const { stack, index } = historyRef.current;
    if (index >= stack.length - 1) return;
    const newIndex = index + 1;
    historyRef.current.locked = true;
    canvas.loadFromJSON(stack[newIndex], () => {
      canvas.renderAll();
      historyRef.current = { stack, index: newIndex, locked: false };
    });
  }

  // Property panel change handler 
  const handlePropertyChange = useCallback((prop, value) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    obj.set(prop, value);
    obj.setCoords();
    canvas.renderAll();
    emitMove?.(fabricObjToJson(obj));
  }, [emitMove]);

  // Render
  return (
    <div className={styles.canvasWrapper}>
      {/* The actual Fabric canvas */}
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* Remote cursors overlay */}
      <CursorOverlay cursors={remoteCursors} canvasRef={canvasRef} />

      {/* Property panel — shown only when something is selected */}
      {selectedObj && (
        <PropertyPanel
          object={selectedObj}
          onChange={handlePropertyChange}
          onDelete={() => deleteObject(fabricRef.current, selectedObj)}
        />
      )}

      {/* Zoom indicator */}
      <div className={styles.zoomBadge}>{Math.round(zoom * 100)}%</div>
    </div>
  );
}