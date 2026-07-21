import { useBoardStore } from "../../store/boardStore";
import styles from "./CanvasToolbar.module.css";

// ─── Tool definitions ──────────────────────────────────────────────────────────
const TOOLS = [
  { id: "select",  icon: "⬡", label: "Select",   key: "V", group: "select" },
  { id: "pan",     icon: "✥", label: "Pan",       key: "H", group: "select" },
  null, // divider
  { id: "pen",     icon: "✏", label: "Pen",       key: "P", group: "draw" },
  { id: "eraser",  icon: "⌫", label: "Eraser",    key: "E", group: "draw" },
  null,
  { id: "rect",    icon: "▭", label: "Rectangle", key: "R", group: "shape" },
  { id: "circle",  icon: "◯", label: "Circle",    key: "C", group: "shape" },
  { id: "line",    icon: "╱", label: "Line",      key: "L", group: "shape" },
  { id: "arrow",   icon: "→", label: "Arrow",     key: "A", group: "shape" },
  null,
  { id: "text",    icon: "T", label: "Text",      key: "T", group: "text" },
  { id: "sticky",  icon: "🗒", label: "Sticky",    key: "S", group: "text" },
];

// ─── Color presets ─────────────────────────────────────────────────────────────
const STROKE_COLORS = [
  "#ffffff", "#f87171", "#fb923c", "#fbbf24",
  "#4ade80", "#60a5fa", "#a78bfa", "#f472b6",
];

const FILL_COLORS = [
  "transparent", "#1e1e2e", "#f87171", "#fbbf24",
  "#4ade80", "#60a5fa", "#a78bfa", "#f472b6",
];

const STROKE_WIDTHS = [1, 2, 4, 8];

export default function CanvasToolbar() {
  const {
    activeTool, setActiveTool,
    strokeColor, setStrokeColor,
    fillColor, setFillColor,
    strokeWidth, setStrokeWidth,
  } = useBoardStore();

  return (
    <aside className={styles.toolbar}>
      {/* ── Tools ─────────────────────────────────────────────────────────── */}
      <div className={styles.toolGroup}>
        {TOOLS.map((tool, i) =>
          tool === null ? (
            <div key={`div-${i}`} className={styles.divider} />
          ) : (
            <button
              key={tool.id}
              className={`${styles.toolBtn} ${activeTool === tool.id ? styles.active : ""}`}
              onClick={() => setActiveTool(tool.id)}
              title={`${tool.label} (${tool.key})`}
              aria-label={tool.label}
            >
              <span className={styles.toolIcon}>{tool.icon}</span>
              <span className={styles.toolKey}>{tool.key}</span>
            </button>
          )
        )}
      </div>

      <div className={styles.separator} />

      {/* ── Stroke color ──────────────────────────────────────────────────── */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Stroke</span>
        <div className={styles.colorGrid}>
          {STROKE_COLORS.map((c) => (
            <button
              key={c}
              className={`${styles.colorDot} ${strokeColor === c ? styles.selectedColor : ""}`}
              style={{ background: c, border: c === "#ffffff" ? "1px solid rgba(255,255,255,0.15)" : "none" }}
              onClick={() => setStrokeColor(c)}
              title={c}
            />
          ))}
        </div>
        {/* Custom color picker */}
        <div className={styles.customColor}>
          <label className={styles.colorPickerLabel}>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className={styles.colorPickerInput}
            />
            <span className={styles.colorPickerPreview} style={{ background: strokeColor }} />
          </label>
        </div>
      </div>

      <div className={styles.separator} />

      {/* ── Fill color ────────────────────────────────────────────────────── */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Fill</span>
        <div className={styles.colorGrid}>
          {FILL_COLORS.map((c) => (
            <button
              key={c}
              className={`${styles.colorDot} ${fillColor === c ? styles.selectedColor : ""}`}
              style={{
                background: c === "transparent" ? "transparent" : c,
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              onClick={() => setFillColor(c)}
              title={c === "transparent" ? "No fill" : c}
            >
              {c === "transparent" && <span className={styles.transparentSlash}>⊘</span>}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.separator} />

      {/* ── Stroke width ──────────────────────────────────────────────────── */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Width</span>
        <div className={styles.widthGroup}>
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              className={`${styles.widthBtn} ${strokeWidth === w ? styles.active : ""}`}
              onClick={() => setStrokeWidth(w)}
              title={`${w}px`}
            >
              <span
                className={styles.widthLine}
                style={{ height: `${w}px`, opacity: strokeWidth === w ? 1 : 0.45 }}
              />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}