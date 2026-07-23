import React, { useState, useRef, useEffect } from "react";

export function CanvasElement({
  element,
  isSelected,
  onSelect,
  onUpdate,
  isReadOnly,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(element.data?.text || "");
  const textareaRef = useRef(null);

  useEffect(() => {
    setTextValue(element.data?.text || "");
  }, [element.data?.text]);

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
      data: { ...element.data, text: textValue },
    });
  };

  const strokeColor = element.data?.strokeColor || "#ffffff";
  const fillColor = element.data?.fillColor || "transparent";
  const strokeWidth = element.data?.strokeWidth || 2;
  const opacity = element.data?.opacity ?? 1;

  // ─── Image Element ───────────────────────────────────────────────────────
  if (element.type === "image") {
    const { x, y, width = 240, height = 180 } = element;
    const imageUrl = element.data?.url || element.data?.src;

    return (
      <g
        transform={`translate(${x}, ${y})`}
        onClick={(e) => { e.stopPropagation(); onSelect(element.id, e.shiftKey); }}
      >
        <image
          href={imageUrl}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
          className="rounded-lg shadow-lg"
        />
        {isSelected && (
          <rect
            x={-3}
            y={-3}
            width={width + 6}
            height={height + 6}
            rx={6}
            fill="none"
            stroke="#6366f1"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        )}
      </g>
    );
  }

  // ─── Freehand Path ───────────────────────────────────────────────────────
  if (element.type === "draw") {
    const points = element.data?.points || [];
    if (points.length === 0) return null;

    const pathData = points.reduce((acc, point, index) => {
      return index === 0
        ? `M ${point.x} ${point.y}`
        : `${acc} L ${point.x} ${point.y}`;
    }, "");

    return (
      <g onClick={(e) => { e.stopPropagation(); onSelect(element.id, e.shiftKey); }}>
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
            stroke="#6366f1"
            strokeWidth={strokeWidth + 4}
            strokeDasharray="4 4"
            opacity={0.7}
          />
        )}
      </g>
    );
  }

  // ─── Rectangle ───────────────────────────────────────────────────────────
  if (element.type === "rect") {
    const { x, y, width = 120, height = 80 } = element;
    const rx = element.data?.borderRadius || 6;

    return (
      <g
        transform={`translate(${x}, ${y})`}
        onClick={(e) => { e.stopPropagation(); onSelect(element.id, e.shiftKey); }}
        onDoubleClick={() => !isReadOnly && setIsEditing(true)}
      >
        <rect
          width={Math.max(width, 10)}
          height={Math.max(height, 10)}
          rx={rx}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
        {isSelected && (
          <rect
            x={-3}
            y={-3}
            width={Math.max(width, 10) + 6}
            height={Math.max(height, 10) + 6}
            rx={rx + 2}
            fill="none"
            stroke="#6366f1"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        )}
        {/* Inline Label / Text */}
        {(textValue || isEditing) && (
          <foreignObject x={8} y={8} width={Math.max(width - 16, 20)} height={Math.max(height - 16, 20)}>
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
                className="w-full h-full bg-transparent border-none outline-none resize-none text-center font-sans text-sm text-white"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-center font-sans text-sm text-white overflow-hidden pointer-events-none">
                {textValue}
              </div>
            )}
          </foreignObject>
        )}
      </g>
    );
  }

  // ─── Circle / Ellipse ───────────────────────────────────────────────────
  if (element.type === "circle") {
    const { x, y, width = 100, height = 100 } = element;
    const rx = Math.max(width / 2, 5);
    const ry = Math.max(height / 2, 5);
    const cx = x + rx;
    const cy = y + ry;

    return (
      <g
        onClick={(e) => { e.stopPropagation(); onSelect(element.id, e.shiftKey); }}
        onDoubleClick={() => !isReadOnly && setIsEditing(true)}
      >
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
        {isSelected && (
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx + 3}
            ry={ry + 3}
            fill="none"
            stroke="#6366f1"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        )}
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
                className="w-full h-full bg-transparent border-none outline-none resize-none text-center font-sans text-sm text-white"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-center font-sans text-sm text-white overflow-hidden pointer-events-none">
                {textValue}
              </div>
            )}
          </foreignObject>
        )}
      </g>
    );
  }

  // ─── Line / Arrow ────────────────────────────────────────────────────────
  if (element.type === "line" || element.type === "arrow") {
    const { x, y, width = 100, height = 0 } = element;
    const x2 = x + width;
    const y2 = y + height;

    return (
      <g onClick={(e) => { e.stopPropagation(); onSelect(element.id, e.shiftKey); }}>
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
            stroke="#6366f1"
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
      <g
        transform={`translate(${x}, ${y})`}
        onClick={(e) => { e.stopPropagation(); onSelect(element.id, e.shiftKey); }}
        onDoubleClick={() => !isReadOnly && setIsEditing(true)}
      >
        <rect
          width={width}
          height={height}
          rx={4}
          fill={stickyBg}
          style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))" }}
        />
        {isSelected && (
          <rect
            x={-3}
            y={-3}
            width={width + 6}
            height={height + 6}
            rx={6}
            fill="none"
            stroke="#6366f1"
            strokeWidth={2}
          />
        )}
        <foreignObject x={12} y={12} width={width - 24} height={height - 24}>
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
      </g>
    );
  }

  // ─── Text Box ───────────────────────────────────────────────────────────
  if (element.type === "text") {
    const { x, y, width = 180, height = 50 } = element;
    const fontSize = element.data?.fontSize || 18;

    return (
      <g
        transform={`translate(${x}, ${y})`}
        onClick={(e) => { e.stopPropagation(); onSelect(element.id, e.shiftKey); }}
        onDoubleClick={() => !isReadOnly && setIsEditing(true)}
      >
        {isSelected && (
          <rect
            x={-4}
            y={-4}
            width={width + 8}
            height={height + 8}
            rx={4}
            fill="none"
            stroke="#6366f1"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        )}
        <foreignObject x={0} y={0} width={width} height={height}>
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
      </g>
    );
  }

  return null;
}

export default CanvasElement;
