import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useBoard } from "@/features/board/hooks/Useboard.js";
import BoardHeader from "@/features/board/components/BoardHeader.jsx";
import Canvas from "@/features/board/components/Canvas.jsx";
import BoardToolbar from "@/features/board/components/BoardToolbar.jsx";
import AISidebar from "@/features/board/components/AISidebar.jsx";
import ChatSidebar from "@/features/board/components/ChatSidebar.jsx";
import MembersSidebar from "@/features/board/components/MembersSidebar.jsx";

export default function WhiteboardPage() {
  const { boardId } = useParams();

  // Wire Socket.io real-time collaboration hook
  const { emitElementUpdate, emitElementDelete, emitCursorMove, emitCanvasSave } = useBoard(boardId);

  // Property State for Toolbar
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [stickyBg, setStickyBg] = useState("#fef08a");

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-[#0e0e11] font-sans antialiased text-white select-none">
      {/* Top Header */}
      <BoardHeader boardId={boardId} emitCanvasSave={emitCanvasSave} />

      {/* Main Interactive Drawing Canvas */}
      <main className="flex-1 w-full h-full relative pt-14">
        <Canvas
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          stickyBg={stickyBg}
          emitElementUpdate={emitElementUpdate}
          emitElementDelete={emitElementDelete}
          emitCursorMove={emitCursorMove}
        />
      </main>

      {/* Bottom Floating Glassmorphism Toolbar */}
      <BoardToolbar
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        stickyBg={stickyBg}
        setStickyBg={setStickyBg}
        emitElementUpdate={emitElementUpdate}
      />

      {/* Side Panels */}
      <AISidebar />
      <ChatSidebar />
      <MembersSidebar />
    </div>
  );
}
