/**
 * BoardPage
 *
 * Assembles the entire board experience:
 * [TopBar] + [Canvas + Toolbar + CursorOverlay] + [Chat | AI Panel]
 *
 * This is the single place that connects:
 * - useBoard hook (socket events ↔ board store)
 * - WhiteboardCanvas (Fabric.js rendering)
 * - BoardTopbar (navigation + actions)
 * - ChatPanel / AIPanel (right-side panels)
 * - CursorOverlay (multiplayer presence)
 */

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { boardApi } from "@/api/board.api";
import { useBoard } from "@/hooks/useBoard";
import { useBoardStore } from "@/store/boardStore";
import { QUERY_KEYS } from "@/config/constants";

import BoardTopbar from "@/components/board/BoardTopbar";
import CanvasToolbar from "@/components/canvas/CanvasToolbar";
import WhiteboardCanvas from "@/components/canvas/WhiteboardCanvas";
import CursorOverlay from "@/components/canvas/CursorOverlay";
import ChatPanel from "@/components/chat/ChatPanel";
import AIPanel from "@/components/ai/AIPanel";
import styles from "./BoardPage.module.css";

const BoardPage = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { showChat, showAI, role } = useBoardStore();

  // Connect to the board socket room and wire all events
  const { emitElementUpdate, emitElementDelete, emitCursorMove, emitCanvasSave } =
    useBoard(boardId);

  // Prefetch board metadata for the topbar (canvas state comes via socket)
  const { isError, error } = useQuery({
    queryKey: QUERY_KEYS.BOARD(boardId),
    queryFn: async () => {
      const res = await boardApi.getById(boardId);
      return res.data.data.board;
    },
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      toast.error(error?.message || "Could not load board");
      navigate("/dashboard");
    }
  }, [isError]);

  // Auto-save on Ctrl+S / Cmd+S
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        const elements = useBoardStore.getState().elements;
        emitCanvasSave(elements);
        toast.success("Board saved", { id: "save", duration: 1500 });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [emitCanvasSave]);

  const canEdit = role === "owner" || role === "editor";

  return (
    <div className={styles.page}>
      
      <BoardTopbar boardId={boardId} />

  
      <div className={styles.workspace}>
    
        {canEdit && <CanvasToolbar />}

        
        <WhiteboardCanvas
          onElementUpdate={emitElementUpdate}
          onElementDelete={emitElementDelete}
          onCursorMove={emitCursorMove}
        />

        
        <CursorOverlay />

        
        <AnimatePresence>
          {showChat && <ChatPanel key="chat" boardId={boardId} />}
          {showAI && !showChat && <AIPanel key="ai" boardId={boardId} />}
        </AnimatePresence>
      </div>

      
      <div className={styles.hint}>
        {canEdit && (
          <span>
            <kbd>Del</kbd> delete · <kbd>⌘S</kbd> save
          </span>
        )}
        {!canEdit && (
          <span className={styles.viewerBadge}>View only</span>
        )}
      </div>
    </div>
  );
};

export default BoardPage;