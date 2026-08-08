import { Cursor, Pencil, Rectangle, Circle, TextT, Note, LineSegment, ArrowUpRight, Eraser, Image as ImageIcon } from "@phosphor-icons/react";

export const TOOLS = [
  { id: "select", label: "Select", icon: Cursor, shortcut: "V" },
  { id: "pen",    label: "Pen",    icon: Pencil,    shortcut: "P" },
  { id: "rect",   label: "Rectangle", icon: Rectangle, shortcut: "R" },
  { id: "ellipse",label: "Ellipse", icon: Circle, shortcut: "O" },
  { id: "line",   label: "Line",   icon: LineSegment, shortcut: "L" },
  { id: "arrow",  label: "Arrow",  icon: ArrowUpRight, shortcut: "A" },
  { id: "text",   label: "Text",   icon: TextT,   shortcut: "T" },
  { id: "sticky", label: "Sticky", icon: Note,    shortcut: "S" },
  { id: "image",  label: "Image",  icon: ImageIcon, shortcut: "I" },
  { id: "eraser", label: "Eraser", icon: Eraser,  shortcut: "E" },
];

export const COLORS = [
  "#111111", "#475569", "#94A3B8", "#FFFFFF",
  "#EF4444", "#F97316", "#F59E0B", "#EAB308",
  "#10B981", "#14B8A6", "#06B6D4", "#3B82F6",
  "#6366F1", "#8B5CF6", "#D946EF", "#EC4899",
  "#F43F5E", "#FEF08A", "#BBF7D0", "#BFDBFE",
];

export const STROKE_WIDTHS = [1, 2, 4, 6, 10];

export const DEFAULT_FONT_SIZE = 20;

export const SHORTCUT_MAP = TOOLS.reduce((acc, t) => { acc[t.shortcut.toLowerCase()] = t.id; return acc; }, {});
