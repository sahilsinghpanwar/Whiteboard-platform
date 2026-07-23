import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { boardApi } from "@/features/board/api/Board.api.js";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import styles from "./Dashboardpage.module.css";

const QUERY_KEYS = { BOARDS: ["boards"] };

// ─── Brand Logo ───────────────────────────────────────────────────────────────
const BrandLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="9" height="9" rx="2" fill="#7C6EF8" />
    <rect x="13" y="2" width="9" height="9" rx="2" fill="#7C6EF8" opacity="0.5" />
    <rect x="2" y="13" width="9" height="9" rx="2" fill="#7C6EF8" opacity="0.5" />
    <rect x="13" y="13" width="9" height="9" rx="2" fill="#7C6EF8" />
  </svg>
);

// ─── Board Card ───────────────────────────────────────────────────────────────
const BoardCard = ({ board, onDelete, isPending, onAccept, onDecline }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOwner = board.owner?._id === user?._id || board.owner === user?._id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={styles.boardCard}
      onClick={() => { if (!isPending) navigate(`/board/${board._id}`); }}
      style={{ cursor: isPending ? 'default' : 'pointer' }}
    >
      {/* Thumbnail area */}
      <div className={styles.cardThumb}>
        {board.thumbnailUrl ? (
          <img src={board.thumbnailUrl} alt={board.title} className={styles.thumbImg} />
        ) : (
          <div className={styles.thumbPlaceholder}>
            <div className={styles.thumbGridPattern} />
            <div className={styles.thumbIconWrap}>
              <BrandLogo />
            </div>
          </div>
        )}
        <div className={`${styles.cardBadge} ${board.isPublic ? styles.badgePublic : styles.badgePrivate}`}>
          {board.isPublic ? "Public" : "Private"}
        </div>
      </div>

      {/* Card Info */}
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <h3 className={styles.cardTitle}>{board.title || "Untitled Board"}</h3>
          <p className={styles.cardTime}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Updated {board.updatedAt ? formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true }) : "recently"}
          </p>
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.ownerInfo}>
            <div className={styles.ownerAvatar}>
              {board.owner?.fullName ? board.owner.fullName[0].toUpperCase() : "U"}
            </div>
            <span className={styles.ownerName}>{isOwner ? "You" : board.owner?.fullName || "Collaborator"}</span>
          </div>

          {isPending ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={styles.acceptBtn}
                style={{ background: '#7C6EF8', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); onAccept(board._id); }}
              >
                Accept
              </button>
              <button
                className={styles.declineBtn}
                style={{ background: '#E2E8F0', color: '#333', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); onDecline(board._id); }}
              >
                Decline
              </button>
            </div>
          ) : isOwner ? (
            <button
              className={styles.deleteBtn}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(board._id);
              }}
              title="Delete board"
              aria-label="Delete board"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutStore = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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
      toast.success("Board created successfully!");
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

  const acceptMutation = useMutation({
    mutationFn: (id) => boardApi.acceptInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOARDS });
      toast.success("Invitation accepted!");
    },
    onError: (err) => toast.error(err.message || "Failed to accept invitation"),
  });

  const declineMutation = useMutation({
    mutationFn: (id) => boardApi.declineInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOARDS });
      toast.success("Invitation declined");
    },
    onError: (err) => toast.error(err.message || "Failed to decline invitation"),
  });

  const handleLogout = async () => {
    try {
      await logoutStore();
      navigate("/");
    } catch {
      // ignore
    }
  };

  const boards = Array.isArray(data) ? data : [];
  const filtered = boards.filter((b) =>
    b.title?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingInvitations = filtered.filter((b) => {
    const member = b.members?.find((m) => m.userId?._id === user?._id || m.userId === user?._id);
    return member?.status === 'pending';
  });
  
  const activeBoards = filtered.filter((b) => {
    const isOwner = b.owner?._id === user?._id || b.owner === user?._id;
    if (isOwner) return true;
    const member = b.members?.find((m) => m.userId?._id === user?._id || m.userId === user?._id);
    return member?.status === 'accepted';
  });

  return (
    <div className={styles.page}>
      {/* Navbar Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logoLink}>
            <BrandLogo />
            <span className={styles.logoName}>Canvai</span>
          </Link>

          <div className={styles.headerRight}>
            <div className={styles.userBadge}>
              <div className={styles.userAvatar}>
                {user?.fullName ? user.fullName[0].toUpperCase() : "U"}
              </div>
              <span className={styles.userName}>{user?.fullName || "User"}</span>
            </div>
            <button className={styles.logoutBtn} onClick={() => setShowLogoutModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className={styles.main}>
        <div className={styles.mainInner}>
          {/* Top Banner */}
          <div className={styles.topRow}>
            <div className={styles.titleWrap}>
              <h1 className={styles.title}>
                Welcome back, <span className={styles.titleName}>{user?.fullName?.split(" ")[0] || "Creator"}</span>
              </h1>
              <p className={styles.subtitle}>
                You have {activeBoards.length} {activeBoards.length === 1 ? "whiteboard" : "whiteboards"} in your workspace
              </p>
            </div>

            <div className={styles.actions}>
              {/* Search Bar */}
              <div className={styles.searchWrap}>
                <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  className={styles.search}
                  placeholder="Search whiteboards…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Create Board Button */}
              <button
                className={styles.createBtn}
                onClick={() => setShowCreateModal(true)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                New board
              </button>
            </div>
          </div>

          {/* Grid Content */}
          {isLoading ? (
            <div className={styles.loadingGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#7C6EF8" strokeWidth="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#7C6EF8" strokeWidth="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#7C6EF8" strokeWidth="1.5" />
                  <path d="M17.5 14v7M14 17.5h7" stroke="#7C6EF8" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>
                {search ? "No boards found" : "No whiteboards yet"}
              </h3>
              <p className={styles.emptyText}>
                {search
                  ? `No whiteboards match "${search}". Try another keyword.`
                  : "Create your first interactive AI whiteboard to start brainstorming with your team."}
              </p>
              {!search && (
                <button
                  className={styles.createBtn}
                  onClick={() => setShowCreateModal(true)}
                  style={{ marginTop: 8 }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Create a whiteboard
                </button>
              )}
            </div>
          ) : (
            <>
              {pendingInvitations.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginBottom: '16px' }}>Pending Invitations</h2>
                  <motion.div className={styles.grid} layout>
                    <AnimatePresence mode="popLayout">
                      {pendingInvitations.map((board) => (
                        <BoardCard
                          key={board._id}
                          board={board}
                          isPending={true}
                          onAccept={(id) => acceptMutation.mutate(id)}
                          onDecline={(id) => declineMutation.mutate(id)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}

              {activeBoards.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginBottom: '16px' }}>Your Whiteboards</h2>
                  <motion.div className={styles.grid} layout>
                    <AnimatePresence mode="popLayout">
                      {activeBoards.map((board) => (
                        <BoardCard
                          key={board._id}
                          board={board}
                          onDelete={(id) => deleteMutation.mutate(id)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Create Board Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className={styles.modalContent}>
          <DialogHeader>
            <DialogTitle className={styles.modalTitle}>Create New Board</DialogTitle>
          </DialogHeader>
          <div className={styles.modalForm}>
            <div className={styles.field}>
              <label className={styles.modalLabel}>Board Name</label>
              <input
                className={styles.modalInput}
                placeholder="e.g. Product Roadmap Q3"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !createMutation.isPending) {
                    createMutation.mutate(newBoardTitle || "Untitled Board");
                  }
                }}
                autoFocus
              />
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.submitModalBtn}
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate(newBoardTitle || "Untitled Board")}
              >
                {createMutation.isPending ? "Creating..." : "Create board"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className={styles.modalContent}>
          <DialogHeader>
            <DialogTitle className={styles.modalTitle}>Sign Out</DialogTitle>
          </DialogHeader>
          <div className={styles.modalForm}>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 16 }}>
              Are you sure you want to sign out?
            </p>
            {user?.email && (
              <div style={{ padding: "12px", backgroundColor: "#F3F4F6", borderRadius: "8px", marginBottom: "24px" }}>
                <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>Signed in as</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "4px 0 0" }}>{user.email}</p>
              </div>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.submitModalBtn}
                style={{ backgroundColor: "#EF4444" }}
                onClick={handleLogout}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;