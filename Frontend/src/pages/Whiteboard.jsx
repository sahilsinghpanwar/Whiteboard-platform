import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBoard } from "@/features/board/hooks/Useboard.js";
import { boardApi } from "@/features/board/api/Board.api.js";
import { useBoardStore } from "@/features/board/store/Boardstore.js";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import BoardHeader from "@/features/board/components/BoardHeader.jsx";
import Canvas from "@/features/board/components/Canvas.jsx";
import BoardToolbar from "@/features/board/components/BoardToolbar.jsx";
import BottomToolbar from "@/features/board/components/BottomToolbar.jsx";
import AISidebar from "@/features/board/components/AISidebar.jsx";
import ChatSidebar from "@/features/board/components/ChatSidebar.jsx";
import MembersSidebar from "@/features/board/components/MembersSidebar.jsx";
import toast from "react-hot-toast";

const toIdStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return val._id.toString();
  return String(val);
};

export default function WhiteboardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setBoard, setElements, setViewport } = useBoardStore();

  const [loading, setLoading] = useState(true);

  // Wire Socket.io real-time collaboration hook
  const { emitElementUpdate, emitElementDelete, emitCursorMove, emitCanvasSave } = useBoard(boardId);

  // Property State for Toolbar
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [stickyBg, setStickyBg] = useState("#fef08a");

  // Fetch initial board details
  useEffect(() => {
    if (!boardId) return;

    let isMounted = true;
    const loadBoard = async () => {
      try {
        setLoading(true);
        const res = await boardApi.getById(boardId);
        const fetchedBoard = res.data?.data?.board || res.data?.data;

        if (!isMounted || !fetchedBoard) return;

        const currentUserId = toIdStr(user?._id || user?.id);
        const ownerId = toIdStr(fetchedBoard.owner);
        let userRole = 'viewer';
        if (ownerId === currentUserId) {
          userRole = 'owner';
        } else {
          const member = fetchedBoard.members?.find((m) => toIdStr(m.userId) === currentUserId);
          if (member) userRole = member.role;
        }

        setBoard(fetchedBoard, userRole);
        if (Array.isArray(fetchedBoard.canvas?.elements)) {
          setElements(fetchedBoard.canvas.elements);
        }
        if (fetchedBoard.canvas?.viewport) {
          setViewport(fetchedBoard.canvas.viewport);
        }
      } catch (err) {
        if (!isMounted) return;
        toast.error(err.response?.data?.message || err.message || "Failed to load whiteboard");
        navigate("/dashboard");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBoard();

    return () => {
      isMounted = false;
    };
  }, [boardId, user?._id]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#0e0e11] flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-[#6D5EF7] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium text-zinc-400">Loading whiteboard session...</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-[#0e0e11] font-sans antialiased text-white select-none">
      {/* Top Header */}
      <BoardHeader boardId={boardId} emitCanvasSave={emitCanvasSave} />

      {/* Main canvas — offset for header (top), left toolbar (left), bottom bar */}
      <main className="flex-1 w-full h-full relative pt-16 pl-16 pb-12">
        <Canvas
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          stickyBg={stickyBg}
          emitElementUpdate={emitElementUpdate}
          emitElementDelete={emitElementDelete}
          emitCursorMove={emitCursorMove}
          emitCanvasSave={emitCanvasSave}
        />
      </main>

      {/* Left vertical drawing toolbar */}
      <BoardToolbar
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        stickyBg={stickyBg}
        setStickyBg={setStickyBg}
        emitElementUpdate={emitElementUpdate}
        emitCanvasSave={emitCanvasSave}
      />

      {/* Bottom floating controls — zoom, undo, redo, hand, fit */}
      <BottomToolbar emitCanvasSave={emitCanvasSave} />

      {/* Right side panels */}
      <AISidebar emitElementUpdate={emitElementUpdate} />
      <ChatSidebar />
      <MembersSidebar />
    </div>
  );
}

