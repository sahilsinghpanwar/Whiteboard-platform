import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { boardApi } from "@/features/board/api/Board.api.js";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { authAPI as authApi } from "@/features/auth/api/Auth.api.js";
import { Button } from "@/components/ui/button.jsx";
import { Avatar } from "@/components/ui/avatar.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import { Input } from "@/components/ui/input.jsx";
import styles from "./Dashboardpage.module.css";

const QUERY_KEYS = { BOARDS: ["boards"] };

// ─── Board Card ────────────────────────────────────────────────────────────
const BoardCard = ({ board, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOwner = board.owner?._id === user?._id || board.owner === user?._id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={styles.boardCard}
      onClick={() => navigate(`/board/${board._id}`)}
    >
      {/* Thumbnail / Preview area */}
      <div className={styles.cardThumb}>
        {board.thumbnailUrl ? (
          <img src={board.thumbnailUrl} alt={board.title} className={styles.thumbImg} />
        ) : (
          <div className={styles.thumbPlaceholder}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" opacity="0.3">
              <rect x="3" y="3" width="7" height="7" rx="1" fill="var(--accent)"/>
              <rect x="14" y="3" width="7" height="7" rx="1" fill="var(--accent)"/>
              <rect x="3" y="14" width="7" height="7" rx="1" fill="var(--accent)"/>
              <rect x="14" y="14" width="7" height="7" rx="1" fill="var(--accent)"/>
            </svg>
          </div>
        )}
        <div className={styles.cardBadge}>
          {board.isPublic ? "Public" : "Private"}
        </div>
      </div>

      {/* Card info */}
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <h3 className={styles.cardTitle}>{board.title || "Untitled Board"}</h3>
          <p className={styles.cardTime}>
            Updated {board.updatedAt ? formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true }) : "recently"}
          </p>
        </div>

        <div className={styles.cardFooter}>
          {isOwner && (
            <button
              className={styles.deleteBtn}
              onClick={(e) => { e.stopPropagation(); onDelete(board._id); }}
              aria-label="Delete board"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Dashboard Page ────────────────────────────────────────────────────────
const DashboardPage = () => {
  const queryClient = useQueryClient();
  const logoutStore = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.BOARDS,
    queryFn: async () => {
      const res = await boardApi.getAll();
      return res.data.data?.boards || res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (title) => boardApi.create({ title }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOARDS });
      setShowCreateModal(false);
      setNewBoardTitle("");
      toast.success("Board created");
      const createdBoard = res.data?.data?.board || res.data?.data;
      if (createdBoard?._id) {
        navigate(`/board/${createdBoard._id}`);
      }
    },
    onError: (err) => toast.error(err.message || "Failed to create board"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => boardApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOARDS });
      toast.success("Board deleted");
    },
    onError: (err) => toast.error(err.message || "Failed to delete board"),
  });

  const handleLogout = async () => {
    try {
      await logoutStore();
    } catch {
      // ignore
    }
  };

  const boards = Array.isArray(data) ? data : [];
  const filtered = boards.filter((b) =>
    b.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="9" height="9" rx="2" fill="var(--accent)"/>
              <rect x="13" y="2" width="9" height="9" rx="2" fill="var(--accent)" opacity="0.5"/>
              <rect x="2" y="13" width="9" height="9" rx="2" fill="var(--accent)" opacity="0.5"/>
              <rect x="13" y="13" width="9" height="9" rx="2" fill="var(--accent)"/>
            </svg>
            <span className={styles.logoName}>Canvai</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.userName}>{user?.fullName}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.topRow}>
          <div>
            <h1 className={styles.title}>Your boards</h1>
            <p className={styles.subtitle}>
              {boards.length} {boards.length === 1 ? "board" : "boards"}
            </p>
          </div>

          <div className={styles.actions}>
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                className={styles.search}
                placeholder="Search boards…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              New board
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="var(--text-tertiary)" strokeWidth="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="var(--text-tertiary)" strokeWidth="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="var(--text-tertiary)" strokeWidth="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="var(--text-tertiary)" strokeWidth="1.5"/>
              </svg>
            </div>
            <p className={styles.emptyTitle}>
              {search ? "No boards match your search" : "No boards yet"}
            </p>
            <p className={styles.emptyText}>
              {search ? "Try a different keyword" : "Create your first board to start collaborating"}
            </p>
            {!search && (
              <Button onClick={() => setShowCreateModal(true)}>Create a board</Button>
            )}
          </div>
        ) : (
          <motion.div className={styles.grid} layout>
            <AnimatePresence mode="popLayout">
              {filtered.map((board) => (
                <BoardCard
                  key={board._id}
                  board={board}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="e.g. Product Roadmap Q3"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              autoFocus
            />
            <Button
              className="w-full"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate(newBoardTitle || "Untitled Board")}
            >
              {createMutation.isPending ? "Creating..." : "Create board"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;