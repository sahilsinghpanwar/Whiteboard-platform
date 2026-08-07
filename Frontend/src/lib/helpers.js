export const CURSOR_COLORS = [
  "#FF3B30", "#007AFF", "#34C759", "#FF9500", "#AF52DE", "#FF2D55", "#00C7BE", "#5856D6",
];

export const colorForUser = (userId) => {
  if (!userId) return CURSOR_COLORS[0];
  let hash = 0;
  const s = String(userId);
  for (let i = 0; i < s.length; i++) hash = (hash << 5) - hash + s.charCodeAt(i);
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
};

export const initials = (name) => {
  if (!name) return "?";
  return name.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
};

export const formatDate = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
};

export const uid = () => `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// re-export cn from utils.js if imported from here for convenience
export { cn } from "./utils";
