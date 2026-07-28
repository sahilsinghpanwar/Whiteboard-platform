import { useBoardStore } from "@/store/boardStore";
import { useAuthStore } from "@/store/authStore";
import styles from "./CursorOverlay.module.css";

const RemoteCursor = ({ cursor }) => (
  <div
    className={styles.cursor}
    style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
  >
    {/* Cursor pointer shape */}
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" className={styles.cursorArrow}>
      <path d="M0 0L0 14L4 10L7 17L9 16L6 9L11 9L0 0Z" fill={cursor.color} />
      <path d="M0 0L0 14L4 10L7 17L9 16L6 9L11 9L0 0Z" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
    </svg>
    {/* Name tag */}
    <div className={styles.nameTag} style={{ background: cursor.color }}>
      {cursor.fullName}
    </div>
  </div>
);

const CursorOverlay = () => {
  const cursors = useBoardStore((s) => s.cursors);
  const currentUserId = useAuthStore((s) => s.user?._id);

  const otherCursors = Object.entries(cursors).filter(
    ([userId]) => userId !== currentUserId
  );

  if (otherCursors.length === 0) return null;

  return (
    <div className={styles.overlay} aria-hidden="true">
      {otherCursors.map(([userId, cursor]) => (
        <RemoteCursor key={userId} cursor={cursor} />
      ))}
    </div>
  );
};

export default CursorOverlay;