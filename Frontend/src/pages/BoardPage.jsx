import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import jsPDF from "jspdf";

import { useAuth } from "@/context/AuthContext";
import { useBoardSockets } from "@/hooks/useBoardSockets";
import { boardApi, uploadApi } from "@/lib/services";
import Canvas from "@/components/whiteboard/Canvas";
import Toolbar from "@/components/whiteboard/Toolbar";
import TopBar from "@/components/whiteboard/TopBar";
import RightDock from "@/components/whiteboard/RightDock";
import PresenceCursors from "@/components/whiteboard/PresenceCursors";
import { SHORTCUT_MAP } from "@/components/whiteboard/tools";
import { uid } from "@/lib/helpers";

const useWindowSize = () => {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return size;
};

export default function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { w, h } = useWindowSize();

  const [board, setBoard] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [cursors, setCursors] = useState({}); // { userId: {x,y, fullName} }
  const [activeTool, setActiveTool] = useState("select");
  const [color, setColor] = useState("#111111");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isDockOpen, setIsDockOpen] = useState(() => window.innerWidth >= 1024);

  const userId = user?._id || user?.id;
  const ownerId = board?.owner?._id || board?.owner;
  const myMember = board?.members?.find((m) => String(m.userId?._id || m.userId) === String(userId));
  const myRole = String(ownerId) === String(userId) ? "owner" : myMember?.role;
  const canEdit = myRole === "owner" || myRole === "editor";

  const { connected, onCollab, onChat, emitCollab, emitChat } = useBoardSockets(boardId);

  // Load board
  useEffect(() => {
    (async () => {
      try {
        const res = await boardApi.get(boardId);
        const b = res?.data ?? res;
        setBoard(b);
        setElements(b?.canvas?.elements || []);
      } catch (e) {
        toast.error(e?.response?.data?.message || "Board not found");
        navigate("/dashboard");
      }
    })();
  }, [boardId, navigate]);

  // Socket listeners
  useEffect(() => {
    const off1 = onCollab("room:users", ({ users }) => setActiveUsers(users || []));
    const off2 = onCollab("user:joined", ({ user: u }) => {
      setActiveUsers((prev) => (prev.some((p) => String(p.userId) === String(u.userId)) ? prev : [...prev, u]));
      toast.success(`${u.fullName || "Someone"} joined`);
    });
    const off3 = onCollab("user:left", ({ users }) => setActiveUsers(users || []));
    const off4 = onCollab("element:updated", ({ element }) => {
      setElements((prev) => {
        const idx = prev.findIndex((e) => e.id === element.id);
        if (idx === -1) return [...prev, element];
        const next = [...prev]; next[idx] = { ...next[idx], ...element };
        return next;
      });
    });
    const off5 = onCollab("element:deleted", ({ elementIds }) => {
      setElements((prev) => prev.filter((e) => !elementIds.includes(e.id)));
    });
    const off6 = onCollab("canvas:updated", ({ canvas }) => setElements(canvas?.elements || []));
    const off7 = onCollab("cursor:moved", ({ userId: uid2, fullName, x, y }) => {
      setCursors((prev) => ({ ...prev, [uid2]: { userId: uid2, fullName, x, y, t: Date.now() } }));
    });
    const off8 = onCollab("board:updated", ({ board: b }) => setBoard(b));
    const off9 = onCollab("error", ({ message }) => toast.error(message));
    return () => { off1(); off2(); off3(); off4(); off5(); off6(); off7(); off8(); off9(); };
  }, [onCollab]);

  // Prune stale cursors
  useEffect(() => {
    const t = setInterval(() => {
      setCursors((prev) => {
        const now = Date.now();
        const next = {};
        for (const k of Object.keys(prev)) if (now - prev[k].t < 5000) next[k] = prev[k];
        return next;
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  // Shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target?.tagName === "INPUT" || e.target?.tagName === "TEXTAREA") return;
      if (e.target?.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (SHORTCUT_MAP[key]) { setActiveTool(SHORTCUT_MAP[key]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const upsertElement = useCallback((el) => {
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === el.id);
      if (idx === -1) return [...prev, el];
      const next = [...prev]; next[idx] = el;
      return next;
    });
    if (canEdit) emitCollab("element:update", { boardId, element: el });
    // Persistence handled by collab service (server side)
  }, [emitCollab, boardId, canEdit]);

  const deleteElements = useCallback((ids) => {
    setElements((prev) => prev.filter((e) => !ids.includes(e.id)));
    if (canEdit) emitCollab("element:delete", { boardId, elementIds: ids });
  }, [emitCollab, boardId, canEdit]);

  const lastCursorEmitRef = useRef(0);
  const pendingCursorTimerRef = useRef(null);
  const latestCursorPosRef = useRef(null);

  const emitCursor = useCallback((pos) => {
    emitCollab("cursor:move", { boardId, x: pos.x, y: pos.y });
    lastCursorEmitRef.current = Date.now();
  }, [emitCollab, boardId]);

  const onCursorMove = useCallback((pos) => {
    latestCursorPosRef.current = pos;
    const now = Date.now();
    const elapsed = now - lastCursorEmitRef.current;

    if (elapsed >= 50) {
      if (pendingCursorTimerRef.current) {
        clearTimeout(pendingCursorTimerRef.current);
        pendingCursorTimerRef.current = null;
      }
      emitCursor(pos);
    } else if (!pendingCursorTimerRef.current) {
      pendingCursorTimerRef.current = setTimeout(() => {
        pendingCursorTimerRef.current = null;
        if (latestCursorPosRef.current) {
          emitCursor(latestCursorPosRef.current);
        }
      }, 50 - elapsed);
    }
  }, [emitCursor]);

  useEffect(() => {
    return () => {
      if (pendingCursorTimerRef.current) {
        clearTimeout(pendingCursorTimerRef.current);
      }
    };
  }, []);

  const onRename = async (title) => {
    setSaving(true);
    try {
      const updated = await boardApi.update(boardId, { title });
      setBoard(updated?.data ?? updated);
      toast.success("Renamed");
    } catch (e) { toast.error(e?.response?.data?.message || "Rename failed"); }
    finally { setSaving(false); }
  };

  // Image upload (paste / drag file)
  const handleImageInsert = async (file) => {
    if (!canEdit) return;
    try {
      toast.loading("Uploading image…", { id: "upimg" });
      const res = await uploadApi.boardImage(file, boardId);
      const url = res?.url || res?.data?.url || res?.secure_url || res?.data?.secure_url;
      if (!url) throw new Error("No URL returned");
      const el = { id: uid(), type: "image", x: 100, y: 100, width: 320, height: 200, data: { src: url } };
      upsertElement(el);
      toast.success("Image added", { id: "upimg" });
    } catch (e) { toast.error(e?.response?.data?.message || "Upload failed", { id: "upimg" }); }
  };

  // Drop/paste image handlers
  useEffect(() => {
    const onDrop = (e) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f && f.type.startsWith("image/")) handleImageInsert(f);
    };
    const onOver = (e) => e.preventDefault();
    const onPaste = (e) => {
      const items = e.clipboardData?.items || [];
      for (const it of items) if (it.type.startsWith("image/")) { const f = it.getAsFile(); if (f) handleImageInsert(f); }
    };
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragover", onOver);
    window.addEventListener("paste", onPaste);
    return () => { window.removeEventListener("drop", onDrop); window.removeEventListener("dragover", onOver); window.removeEventListener("paste", onPaste); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, canEdit]);

  const fileRef = useRef(null);

  const handleSelectTool = useCallback((tool) => {
    if (tool === "image") {
      if (canEdit) {
        fileRef.current?.click();
      }
      setActiveTool("select");
      return;
    }
    setActiveTool(tool);
  }, [canEdit]);

  // Export
  const onExport = async (type) => {
    try {
      if (type === "json") {
        const blob = new Blob([JSON.stringify(elements, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${board?.title || "board"}.json`; a.click();
        URL.revokeObjectURL(url);
        return;
      }
      // Render PNG from Konva stage
      const stage = document.querySelector(".konvajs-content canvas");
      if (!stage) throw new Error("Canvas not ready");
      const dataUrl = stage.toDataURL("image/png");
      if (type === "png") {
        const a = document.createElement("a");
        a.href = dataUrl; a.download = `${board?.title || "board"}.png`; a.click();
      } else if (type === "pdf") {
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [w, h] });
        pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
        pdf.save(`${board?.title || "board"}.pdf`);
      }
      toast.success(`Exported as ${type.toUpperCase()}`);
    } catch (e) { toast.error(e?.message || "Export failed"); }
  };

  const selectedElements = useMemo(
    () => elements.filter((e) => selectedIds.includes(e.id)),
    [elements, selectedIds]
  );

  const cursorList = useMemo(() => Object.values(cursors).filter((c) => String(c.userId) !== String(userId)), [cursors, userId]);

  if (!board) return <div className="min-h-screen flex items-center justify-center label-mono">Loading board…</div>;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-background">
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageInsert(f); e.target.value = ""; }}
        data-testid="hidden-image-upload" />

      <Canvas
        elements={elements}
        onElementUpsert={upsertElement}
        onElementsDelete={deleteElements}
        onCursorMove={onCursorMove}
        activeTool={activeTool} color={color} strokeWidth={strokeWidth} canEdit={canEdit}
        selectedIds={selectedIds} setSelectedIds={setSelectedIds}
        width={w} height={h}
        scale={scale} setScale={setScale}
        stagePos={stagePos} setStagePos={setStagePos}
      />

      <PresenceCursors cursors={cursorList} scale={scale} stagePos={stagePos} />

      <TopBar
        board={board} activeUsers={activeUsers} canEdit={canEdit}
        saving={saving} onRename={onRename} onExport={onExport}
        isDockOpen={isDockOpen}
        onToggleDock={() => setIsDockOpen((prev) => !prev)}
      />

      <Toolbar
        activeTool={activeTool} onSelectTool={handleSelectTool}
        color={color} onColorChange={setColor}
        strokeWidth={strokeWidth} onStrokeChange={setStrokeWidth}
        canEdit={canEdit}
      />

      {isDockOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsDockOpen(false)}
          data-testid="dock-backdrop"
        />
      )}

      <RightDock
        boardId={boardId} board={board} currentUser={user}
        selectedElements={selectedElements}
        onBoardUpdate={setBoard}
        onChat={onChat} emitChat={emitChat}
        isOpen={isDockOpen}
        onClose={() => setIsDockOpen(false)}
      />

      {!connected && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 label-mono bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 rounded-full px-3 py-1">
          reconnecting…
        </div>
      )}
    </div>
  );
}
