import { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer, Rect, Ellipse, Line, Text, Group, Image as KImage, Transformer } from "react-konva";
import useImage from "use-image";
import { uid } from "@/lib/helpers";

/**
 * Image component helper for Konva canvas
 */
const ImageElement = ({ el, ...rest }) => {
  const [img] = useImage(el.data?.src, "anonymous");
  return <KImage image={img} {...rest} />;
};

/**
 * Point proximity check for eraser tool
 */
const pointNearShape = (el, px, py, threshold = 12) => {
  if (el.type === "pen" || el.type === "line" || el.type === "arrow") {
    const pts = el.data?.points || [];
    const offsetX = el.x || 0;
    const offsetY = el.y || 0;
    for (let i = 0; i < pts.length - 2; i += 2) {
      const x1 = pts[i] + offsetX, y1 = pts[i + 1] + offsetY;
      const x2 = pts[i + 2] + offsetX, y2 = pts[i + 3] + offsetY;
      const dx = x2 - x1, dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) {
        if (Math.hypot(px - x1, py - y1) < threshold) return true;
        continue;
      }
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
      const nearX = x1 + t * dx, nearY = y1 + t * dy;
      if (Math.hypot(px - nearX, py - nearY) < threshold) return true;
    }
    return false;
  }

  // Bounding box check for standard shapes
  const left = el.x;
  const top = el.y;
  const right = el.x + (el.width || 0);
  const bottom = el.y + (el.height || 0);
  return (
    px >= left - threshold &&
    px <= right + threshold &&
    py >= top - threshold &&
    py <= bottom + threshold
  );
};

export default function Canvas({
  elements = [],
  onElementUpsert,
  onElementsDelete,
  onCursorMove,
  activeTool = "select",
  color = "#111111",
  strokeWidth = 2,
  canEdit = true,
  selectedIds = [],
  setSelectedIds,
  width,
  height,
}) {
  const stageRef = useRef(null);
  const trRef = useRef(null);
  const layerRef = useRef(null);

  const [drawing, setDrawing] = useState(null);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [editingText, setEditingText] = useState(null);
  const eraserActiveRef = useRef(false);

  // Sync Transformer nodes with current selection
  useEffect(() => {
    if (!trRef.current || !layerRef.current) return;
    const nodes = selectedIds
      .map((id) => layerRef.current.findOne(`#${id}`))
      .filter(Boolean);
    trRef.current.nodes(nodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedIds, elements]);

  // Keyboard shortcut: Delete / Backspace
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!canEdit || editingText) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        onElementsDelete(selectedIds);
        setSelectedIds([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, canEdit, onElementsDelete, setSelectedIds, editingText]);

  // Convert canvas screen pointer to stage coordinates
  const getStagePointer = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const p = stage.getPointerPosition();
    if (!p) return { x: 0, y: 0 };
    return {
      x: (p.x - stagePos.x) / scale,
      y: (p.y - stagePos.y) / scale,
    };
  }, [stagePos, scale]);

  // Handle shape change / update
  const handleShapeChange = useCallback(
    (el, changes) => {
      onElementUpsert({ ...el, ...changes });
    },
    [onElementUpsert]
  );

  // Handle shape selection
  const handleShapeSelect = (id, e) => {
    if (activeTool !== "select") return;
    e.cancelBubble = true;
    const additive = e.evt.shiftKey || e.evt.metaKey;
    if (additive) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  // Mouse Down / Touch Start
  const handleMouseDown = (e) => {
    if (!canEdit && activeTool !== "select") return;

    // Eraser Tool
    if (activeTool === "eraser") {
      eraserActiveRef.current = true;
      const pos = getStagePointer();
      const hit = elements.filter((el) => pointNearShape(el, pos.x, pos.y));
      if (hit.length > 0) onElementsDelete(hit.map((el) => el.id));
      return;
    }

    // Select Tool - Clear selection if clicking empty canvas
    const clickedEmpty = e.target === e.target.getStage();
    if (activeTool === "select") {
      if (clickedEmpty) setSelectedIds([]);
      return;
    }

    const pos = getStagePointer();
    const id = uid();

    if (activeTool === "pen") {
      setDrawing({
        id,
        type: "pen",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        data: { points: [pos.x, pos.y], stroke: color, strokeWidth },
      });
    } else if (activeTool === "line" || activeTool === "arrow") {
      setDrawing({
        id,
        type: activeTool,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        data: { points: [pos.x, pos.y, pos.x, pos.y], stroke: color, strokeWidth },
      });
    } else if (activeTool === "rect" || activeTool === "ellipse") {
      setDrawing({
        id,
        type: activeTool,
        x: pos.x,
        y: pos.y,
        width: 1,
        height: 1,
        data: { fill: "transparent", stroke: color, strokeWidth },
      });
    } else if (activeTool === "text") {
      const el = {
        id,
        type: "text",
        x: pos.x,
        y: pos.y,
        width: 200,
        height: 30,
        data: { text: "Double-click to edit", fill: color, fontSize: 20 },
      };
      onElementUpsert(el);
      setSelectedIds([id]);
    } else if (activeTool === "sticky") {
      const el = {
        id,
        type: "sticky",
        x: pos.x - 90,
        y: pos.y - 60,
        width: 180,
        height: 140,
        data: { fill: "#FEF08A", text: "Sticky note", fontSize: 16 },
      };
      onElementUpsert(el);
      setSelectedIds([id]);
    }
  };

  // Mouse Move / Touch Move
  const handleMouseMove = () => {
    const pos = getStagePointer();
    onCursorMove?.(pos);

    if (activeTool === "eraser" && eraserActiveRef.current && canEdit) {
      const hit = elements.filter((el) => pointNearShape(el, pos.x, pos.y));
      if (hit.length > 0) onElementsDelete(hit.map((el) => el.id));
      return;
    }

    if (!drawing) return;

    if (drawing.type === "pen") {
      setDrawing((d) => ({
        ...d,
        data: { ...d.data, points: [...d.data.points, pos.x, pos.y] },
      }));
    } else if (drawing.type === "line" || drawing.type === "arrow") {
      const pts = drawing.data.points;
      setDrawing((d) => ({
        ...d,
        data: { ...d.data, points: [pts[0], pts[1], pos.x, pos.y] },
      }));
    } else if (drawing.type === "rect" || drawing.type === "ellipse") {
      setDrawing((d) => ({
        ...d,
        width: pos.x - d.x,
        height: pos.y - d.y,
      }));
    }
  };

  // Mouse Up / Touch End
  const handleMouseUp = () => {
    eraserActiveRef.current = false;
    if (!drawing) return;

    let el = { ...drawing };

    if (el.type === "rect" || el.type === "ellipse") {
      let finalX = el.x;
      let finalY = el.y;
      let finalW = el.width;
      let finalH = el.height;

      if (finalW < 0) {
        finalX += finalW;
        finalW = Math.abs(finalW);
      }
      if (finalH < 0) {
        finalY += finalH;
        finalH = Math.abs(finalH);
      }

      if (finalW < 4 || finalH < 4) {
        setDrawing(null);
        return;
      }

      el = { ...el, x: finalX, y: finalY, width: finalW, height: finalH };
    }

    onElementUpsert(el);
    setDrawing(null);
  };

  // Wheel Zoom & Pan
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.05;
    const dir = e.evt.deltaY > 0 ? 1 / scaleBy : scaleBy;
    const newScale = Math.max(0.2, Math.min(4, oldScale * dir));

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    setScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Text Overlay Editing
  const openTextEditor = (el) => {
    if (!canEdit || (el.type !== "text" && el.type !== "sticky")) return;
    const stage = stageRef.current;
    if (!stage) return;
    const box = stage.container().getBoundingClientRect();
    const x = box.left + el.x * scale + stagePos.x;
    const y = box.top + el.y * scale + stagePos.y;
    setEditingText({
      id: el.id,
      x,
      y,
      w: el.width * scale,
      h: el.height * scale,
      value: el.data?.text || "",
      type: el.type,
    });
  };

  const commitTextEditor = () => {
    if (!editingText) return;
    const el = elements.find((x) => x.id === editingText.id);
    if (el) onElementUpsert({ ...el, data: { ...el.data, text: editingText.value } });
    setEditingText(null);
  };

  // Render Individual Shape
  const renderShapeElement = (el) => {
    const isDraggable = canEdit && activeTool === "select" && el.id !== drawing?.id;

    // Common props for standard shapes
    const commonProps = {
      id: el.id,
      key: el.id,
      x: el.x,
      y: el.y,
      rotation: el.rotation || 0,
      draggable: isDraggable,
      onClick: (e) => handleShapeSelect(el.id, e),
      onTap: (e) => handleShapeSelect(el.id, e),
      onDblClick: () => openTextEditor(el),
      onDblTap: () => openTextEditor(el),
      onDragEnd: (e) => {
        handleShapeChange(el, { x: e.target.x(), y: e.target.y() });
      },
      onTransformEnd: (e) => {
        const node = e.target;
        const sx = node.scaleX();
        const sy = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        handleShapeChange(el, {
          x: node.x(),
          y: node.y(),
          width: Math.max(5, Math.abs((el.width || 100) * sx)),
          height: Math.max(5, Math.abs((el.height || 100) * sy)),
          rotation: node.rotation(),
        });
      },
    };

    switch (el.type) {
      case "rect":
        return (
          <Rect
            {...commonProps}
            width={el.width}
            height={el.height}
            fill={el.data?.fill || "transparent"}
            stroke={el.data?.stroke || "#111"}
            strokeWidth={el.data?.strokeWidth || 2}
            cornerRadius={el.data?.cornerRadius || 6}
          />
        );

      case "ellipse": {
        const radiusX = Math.max(1, Math.abs((el.width || 50) / 2));
        const radiusY = Math.max(1, Math.abs((el.height || 50) / 2));
        const centerX = el.x + radiusX;
        const centerY = el.y + radiusY;

        return (
          <Ellipse
            id={el.id}
            key={el.id}
            x={centerX}
            y={centerY}
            radiusX={radiusX}
            radiusY={radiusY}
            rotation={el.rotation || 0}
            fill={el.data?.fill || "transparent"}
            stroke={el.data?.stroke || "#111"}
            strokeWidth={el.data?.strokeWidth || 2}
            draggable={isDraggable}
            onClick={(e) => handleShapeSelect(el.id, e)}
            onTap={(e) => handleShapeSelect(el.id, e)}
            onDragEnd={(e) => {
              const cx = e.target.x();
              const cy = e.target.y();
              handleShapeChange(el, {
                x: cx - radiusX,
                y: cy - radiusY,
              });
            }}
            onTransformEnd={(e) => {
              const node = e.target;
              const sx = node.scaleX();
              const sy = node.scaleY();
              node.scaleX(1);
              node.scaleY(1);
              const newW = Math.max(5, Math.abs((el.width || 50) * sx));
              const newH = Math.max(5, Math.abs((el.height || 50) * sy));
              const newCx = node.x();
              const newCy = node.y();
              handleShapeChange(el, {
                x: newCx - newW / 2,
                y: newCy - newH / 2,
                width: newW,
                height: newH,
                rotation: node.rotation(),
              });
            }}
          />
        );
      }

      case "line":
      case "arrow":
      case "pen":
        return (
          <Line
            {...commonProps}
            points={el.data?.points || []}
            stroke={el.data?.stroke || "#111"}
            strokeWidth={el.data?.strokeWidth || 2}
            lineCap="round"
            lineJoin="round"
            tension={el.type === "pen" ? 0.4 : 0}
            {...(el.type === "arrow" ? { hitStrokeWidth: 20 } : {})}
          />
        );

      case "text":
        return (
          <Text
            {...commonProps}
            text={el.data?.text || "Text"}
            fontSize={el.data?.fontSize || 20}
            fill={el.data?.fill || "#111"}
            width={el.width}
            fontFamily="Outfit"
          />
        );

      case "sticky":
        return (
          <Group {...commonProps}>
            <Rect
              width={el.width}
              height={el.height}
              fill={el.data?.fill || "#FEF08A"}
              cornerRadius={8}
              shadowColor="black"
              shadowBlur={6}
              shadowOpacity={0.15}
              shadowOffsetY={2}
            />
            <Text
              text={el.data?.text || "Sticky note"}
              fontSize={el.data?.fontSize || 16}
              padding={12}
              width={el.width}
              height={el.height}
              fill="#111"
              fontFamily="Outfit"
            />
          </Group>
        );

      case "image":
        return <ImageElement el={el} {...commonProps} width={el.width} height={el.height} />;

      default:
        return null;
    }
  };

  // Drawing in progress list
  const drawList = drawing ? [...elements, drawing] : elements;

  const getCursorStyle = () => {
    if (activeTool === "eraser") return "cell";
    if (activeTool === "select") return "default";
    return "crosshair";
  };

  return (
    <div className="absolute inset-0 canvas-grid" data-testid="whiteboard-canvas">
      <Stage
        width={width}
        height={height}
        ref={stageRef}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
        draggable={activeTool === "select" && selectedIds.length === 0}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        style={{ cursor: getCursorStyle() }}
      >
        <Layer ref={layerRef}>
          {drawList
            .slice()
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map((el) => renderShapeElement(el))}
          <Transformer
            ref={trRef}
            rotateEnabled
            anchorSize={7}
            borderStroke="#FF5722"
            anchorStroke="#FF5722"
          />
        </Layer>
      </Stage>

      {editingText && (
        <textarea
          autoFocus
          value={editingText.value}
          onChange={(e) => setEditingText((t) => ({ ...t, value: e.target.value }))}
          onBlur={commitTextEditor}
          onKeyDown={(e) => {
            if (e.key === "Escape") commitTextEditor();
            if (e.key === "Enter" && !e.shiftKey && editingText.type === "text") {
              e.preventDefault();
              commitTextEditor();
            }
          }}
          data-testid="text-editor-overlay"
          className="fixed z-50 p-2 rounded-md border-2 border-primary bg-card text-foreground outline-none resize-none shadow-lg text-sm"
          style={{
            left: editingText.x,
            top: editingText.y,
            width: editingText.w,
            minHeight: editingText.h,
          }}
        />
      )}
    </div>
  );
}
