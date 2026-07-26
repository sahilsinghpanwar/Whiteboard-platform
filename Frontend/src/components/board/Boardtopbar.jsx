import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/api/board.api";
import { useBoardStore } from "@/store/boardStore";
import { QUERY_KEYS, MEMBER_ROLES } from "@/config/constants";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import styles from "./BoardTopbar.module.css";

// ─── Export helper ─────────────────────────────────────────────────────────
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Members Modal ─────────────────────────────────────────────────────────
const MembersModal = ({ boardId, board, role, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [memberRole, setMemberRole] = useState("editor");
  const [emailError, setEmailError] = useState("");

  const addMutation = useMutation({
    mutationFn: () => boardApi.addMember(boardId, { email, role: memberRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOARD(boardId) });
      setEmail("");
      toast.success("Member invited");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId) => boardApi.removeMember(boardId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOARD(boardId) });
      toast.success("Member removed");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleInvite = () => {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Enter a valid email");
      return;
    }
    setEmailError("");
    addMutation.mutate();
  };

  const isOwner = role === MEMBER_ROLES.OWNER;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Board members" size="md">
      {/* Owner */}
      {board?.owner && (
        <div className={styles.memberSection}>
          <span className={styles.memberSectionLabel}>Owner</span>
          <div className={styles.memberRow}>
            <Avatar user={board.owner} size="sm" />
            <div className={styles.memberInfo}>
              <span className={styles.memberName}>{board.owner.fullName}</span>
              <span className={styles.memberEmail}>{board.owner.email}</span>
            </div>
            <span className={styles.roleBadge}>owner</span>
          </div>
        </div>
      )}

      {/* Members list */}
      {board?.members?.length > 0 && (
        <div className={styles.memberSection}>
          <span className={styles.memberSectionLabel}>Members</span>
          {board.members.map((m) => (
            <div key={m.userId?._id || m._id} className={styles.memberRow}>
              <Avatar user={m.userId} size="sm" />
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{m.userId?.fullName}</span>
                <span className={styles.memberEmail}>{m.userId?.email}</span>
              </div>
              <span className={styles.roleBadge}>{m.role}</span>
              {isOwner && (
                <button
                  className={styles.removeBtn}
                  onClick={() => removeMutation.mutate(m.userId?._id)}
                  aria-label={`Remove ${m.userId?.fullName}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite section — owner only */}
      {isOwner && (
        <div className={styles.inviteSection}>
          <span className={styles.memberSectionLabel}>Invite by email</span>
          <div className={styles.inviteRow}>
            <Input
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              error={emailError}
            />
            <select
              className={styles.roleSelect}
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <Button
            fullWidth
            size="sm"
            isLoading={addMutation.isPending}
            onClick={handleInvite}
          >
            Send invite
          </Button>
        </div>
      )}
    </Modal>
  );
};

//  BoardTopbar 
const BoardTopbar = ({ boardId }) => {
  const navigate = useNavigate();
  const { board, role, activeUsers, toggleChat, toggleAI, showChat, showAI } =
    useBoardStore();

  const [showMembers, setShowMembers] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const res = await boardApi.exportJSON(boardId);
      triggerDownload(res.data, `board_${boardId}.json`);
      toast.success("Exported as JSON");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await boardApi.exportCSV(boardId);
      triggerDownload(res.data, `board_${boardId}.csv`);
      toast.success("Exported as CSV");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className={styles.topbar}>
        {/* Left: back + title */}
        <div className={styles.left}>
          <button
            className={styles.backBtn}
            onClick={() => navigate("/dashboard")}
            aria-label="Back to dashboard"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className={styles.divider} />

          <h1 className={styles.boardTitle}>
            {board?.title || "Loading…"}
          </h1>

          {role && (
            <span className={`${styles.rolePill} ${styles[`role_${role}`]}`}>
              {role}
            </span>
          )}
        </div>

        {/* Center: active users */}
        <div className={styles.center}>
          {activeUsers.slice(0, 5).map((u) => (
            <div key={u.userId} className={styles.activeUser} title={u.fullName}>
              <Avatar
                user={{ fullName: u.fullName, profileImageUrl: u.profileImageUrl }}
                size="xs"
                color={u.color}
              />
            </div>
          ))}
          {activeUsers.length > 5 && (
            <div className={styles.moreUsers}>+{activeUsers.length - 5}</div>
          )}
        </div>

        {/* Right: action buttons */}
        <div className={styles.right}>
          {/* Export dropdown */}
          <div className={styles.exportGroup}>
            <button
              className={styles.iconBtn}
              onClick={handleExportJSON}
              disabled={isExporting}
              title="Export as JSON"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>JSON</span>
            </button>
            <button
              className={styles.iconBtn}
              onClick={handleExportCSV}
              disabled={isExporting}
              title="Export as CSV"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>CSV</span>
            </button>
          </div>

          <div className={styles.divider} />

          {/* Members */}
          <button
            className={styles.iconBtn}
            onClick={() => setShowMembers(true)}
            title="Members"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span>Members</span>
          </button>

          {/* AI */}
          <button
            className={`${styles.iconBtn} ${showAI ? styles.iconBtnActive : ""}`}
            onClick={toggleAI}
            title="AI Assistant"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
            <span>AI</span>
          </button>

          {/* Chat */}
          <button
            className={`${styles.iconBtn} ${showChat ? styles.iconBtnActive : ""}`}
            onClick={toggleChat}
            title="Chat"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
            <span>Chat</span>
          </button>
        </div>
      </div>

      <MembersModal
        boardId={boardId}
        board={board}
        role={role}
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
      />
    </>
  );
};

export default BoardTopbar;