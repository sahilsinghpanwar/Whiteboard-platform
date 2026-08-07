import { colorForUser } from "@/lib/helpers";

/**
 * Renders remote user cursors as an HTML overlay.
 * cursors: [{ userId, fullName, x, y }]
 */
export default function PresenceCursors({ cursors }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {cursors.map((c) => {
        const color = colorForUser(c.userId);
        return (
          <div
            key={c.userId}
            className="absolute transition-transform duration-75 ease-linear"
            style={{ transform: `translate3d(${c.x}px, ${c.y}px, 0)` }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" className="drop-shadow-md">
              <path d="M2 2 L18 8 L10 10 L8 18 Z" fill={color} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <div
              className="px-2 py-0.5 text-[10px] font-mono text-white rounded-full whitespace-nowrap shadow-sm mt-1 ml-2"
              style={{ background: color }}
            >
              {c.fullName || "Guest"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
