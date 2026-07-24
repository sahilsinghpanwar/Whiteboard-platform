import React, { useState, useRef, useEffect } from "react";

export function CanvasElement({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onResizeStart,
  isReadOnly,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(element.data?.text || element.data?.content || "");
  const textareaRef = useRef(null);

  useEffect(() => {
    setTextValue(element.data?.text || element.data?.content || "");
  }, [element.data?.text, element.data?.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleTextBlur = () => {
    setIsEditing(false);
    onUpdate({
      ...element,
      data: { ...element.data, text: textValue, content: textValue },
    });
  };

  const strokeColor = element.data?.strokeColor || "#6D5EF7";
  const fillColor = element.data?.fillColor || element.data?.bgColor || "transparent";
  const strokeWidth = element.data?.strokeWidth || 2;
  const opacity = element.data?.opacity ?? 1;

  const handlePointerDown = (e) => {
    e.stopPropagation();
    onSelect(element.id, e.shiftKey, e);
  };

  // Helper render for Corner Resize Handles
  const renderResizeHandles = (x, y, width, height) => {
    if (!isSelected || isReadOnly) return null;

    const handles = [
      { id: "nw", cx: x, cy: y, cursor: "nwse-resize" },
      { id: "ne", cx: x + width, cy: y, cursor: "nesw-resize" },
      { id: "se", cx: x + width, cy: y + height, cursor: "nwse-resize" },
      { id: "sw", cx: x, cy: y + height, cursor: "nesw-resize" },
    ];

    return (
      <g>
        {/* Selection Bounding Outline */}
        <rect
          x={x - 3}
          y={y - 3}
          width={Math.max(width, 10) + 6}
          height={Math.max(height, 10) + 6}
          rx={6}
          fill="none"
          stroke="#6D5EF7"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />

        {/* Handles */}
        {handles.map((h) => (
          <circle
            key={h.id}
            cx={h.cx}
            cy={h.cy}
            r={5}
            fill="#ffffff"
            stroke="#6D5EF7"
            strokeWidth={2}
            style={{ cursor: h.cursor }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeStart?.(element.id, h.id, e);
            }}
          />
        ))}
      </g>
    );
  };

  // ─── Image Element ───────────────────────────────────────────────────────
  if (element.type === "image") {
    const { x, y, width = 240, height = 180 } = element;
    const imageUrl = element.data?.url || element.data?.src;

    return (
      <g onPointerDown={handlePointerDown}>
        <image
          x={x}
          y={y}
          href={imageUrl}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
          style={{ borderRadius: 8 }}
        />
        {renderResizeHandles(x, y, width, height)}
      </g>
    );
  }

  // ─── Freehand Path ───────────────────────────────────────────────────────
  if (element.type === "draw") {
    const points = element.data?.points || [];
    if (points.length === 0) return null;

    const pathData = points.reduce((acc, point, index) => {
      return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, "");

    return (
      <g onPointerDown={handlePointerDown}>
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={opacity}
        />
        {isSelected && (
          <path
            d={pathData}
            fill="none"
            stroke="#6D5EF7"
            strokeWidth={strokeWidth + 4}
            strokeDasharray="4 4"
            opacity={0.6}
          />
        )}
      </g>
    );
  }

  // ─── Rectangle ───────────────────────────────────────────────────────────
  if (element.type === "rect") {
    const { x, y, width = 140, height = 90 } = element;
    const rx = element.data?.borderRadius || 8;

    return (
      <g onPointerDown={handlePointerDown} onDoubleClick={() => !isReadOnly && setIsEditing(true)}>
        <rect
          x={x}
          y={y}
          width={Math.max(width, 10)}
          height={Math.max(height, 10)}
          rx={rx}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
        {/* Inline Label / Text */}
        {(textValue || isEditing) && (
          <foreignObject x={x + 8} y={y + 8} width={Math.max(width - 16, 20)} height={Math.max(height - 16, 20)}>
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onBlur={handleTextBlur}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Escape") handleTextBlur();
                }}
                className="w-full h-full bg-transparent border-none outline-none resize-none text-center font-sans text-sm font-medium"
                style={{ color: element.data?.textColor || strokeColor }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-center font-sans text-sm font-medium overflow-hidden pointer-events-none"
                style={{ color: element.data?.textColor || strokeColor }}
              >
                {textValue}
              </div>
            )}
          </foreignObject>
        )}
        {renderResizeHandles(x, y, width, height)}
      </g>
    );
  }

  // ─── Circle / Ellipse ───────────────────────────────────────────────────
  if (element.type === "circle") {
    const { x, y, width = 110, height = 110 } = element;
    const rx = Math.max(width / 2, 5);
    const ry = Math.max(height / 2, 5);
    const cx = x + rx;
    const cy = y + ry;

    return (
      <g onPointerDown={handlePointerDown} onDoubleClick={() => !isReadOnly && setIsEditing(true)}>
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
        {(textValue || isEditing) && (
          <foreignObject x={x + 10} y={y + 10} width={Math.max(width - 20, 20)} height={Math.max(height - 20, 20)}>
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onBlur={handleTextBlur}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Escape") handleTextBlur();
                }}
                className="w-full h-full bg-transparent border-none outline-none resize-none text-center font-sans text-sm font-medium"
                style={{ color: element.data?.textColor || strokeColor }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-center font-sans text-sm font-medium overflow-hidden pointer-events-none"
                style={{ color: element.data?.textColor || strokeColor }}
              >
                {textValue}
              </div>
            )}
          </foreignObject>
        )}
        {renderResizeHandles(x, y, width, height)}
      </g>
    );
  }

  // ─── Line / Arrow ────────────────────────────────────────────────────────
  if (element.type === "line" || element.type === "arrow") {
    const { x, y, width = 120, height = 0 } = element;
    const x2 = x + width;
    const y2 = y + height;

    return (
      <g onPointerDown={handlePointerDown}>
        <line
          x1={x}
          y1={y}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          markerEnd={element.type === "arrow" ? `url(#arrow-${element.id})` : undefined}
          opacity={opacity}
        />
        {element.type === "arrow" && (
          <marker
            id={`arrow-${element.id}`}
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
          </marker>
        )}
        {isSelected && (
          <line
            x1={x}
            y1={y}
            x2={x2}
            y2={y2}
            stroke="#6D5EF7"
            strokeWidth={strokeWidth + 4}
            strokeDasharray="4 4"
            opacity={0.6}
          />
        )}
      </g>
    );
  }

  // ─── Sticky Note ─────────────────────────────────────────────────────────
  if (element.type === "sticky") {
    const { x, y, width = 160, height = 160 } = element;
    const stickyBg = element.data?.bgColor || "#fef08a";
    const stickyTextColor = element.data?.textColor || "#1e293b";

    return (
      <g onPointerDown={handlePointerDown} onDoubleClick={() => !isReadOnly && setIsEditing(true)}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={6}
          fill={stickyBg}
          style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25))" }}
        />
        <foreignObject x={x + 12} y={y + 12} width={width - 24} height={height - 24}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onBlur={handleTextBlur}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Escape") handleTextBlur();
              }}
              className="w-full h-full bg-transparent border-none outline-none resize-none font-medium text-sm leading-snug"
              style={{ color: stickyTextColor }}
              placeholder="Type note..."
            />
          ) : (
            <div
              className="w-full h-full font-medium text-sm leading-snug whitespace-pre-wrap overflow-hidden"
              style={{ color: stickyTextColor }}
            >
              {textValue || <span className="opacity-40 italic">Double-click to type</span>}
            </div>
          )}
        </foreignObject>
        {renderResizeHandles(x, y, width, height)}
      </g>
    );
  }

  // ─── Text Box ───────────────────────────────────────────────────────────
  if (element.type === "text") {
    const { x, y, width = 180, height = 50 } = element;
    const fontSize = element.data?.fontSize || 18;

    return (
      <g onPointerDown={handlePointerDown} onDoubleClick={() => !isReadOnly && setIsEditing(true)}>
        <foreignObject x={x} y={y} width={width} height={height}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onBlur={handleTextBlur}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Escape") handleTextBlur();
              }}
              className="w-full h-full bg-transparent border-none outline-none resize-none font-sans leading-tight font-medium"
              style={{ color: strokeColor, fontSize: `${fontSize}px` }}
              placeholder="Type text..."
            />
          ) : (
            <div
              className="w-full h-full font-sans leading-tight font-medium whitespace-pre-wrap overflow-hidden"
              style={{ color: strokeColor, fontSize: `${fontSize}px` }}
            >
              {textValue || <span className="opacity-40 italic">Type text</span>}
            </div>
          )}
        </foreignObject>
        {renderResizeHandles(x, y, width, height)}
      </g>
    );
  }

  return null;
}

export default CanvasElement;
