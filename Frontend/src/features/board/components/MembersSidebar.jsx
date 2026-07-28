import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBoardStore } from "../store/Boardstore.js";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { boardApi } from "../api/Board.api.js";
import { X, Link2, Check, Send, Crown, Pencil, Eye, Wifi } from "lucide-react";
import toast from "react-hot-toast";

/*  Avatar colors */
const AVATAR_COLORS = [
  "#6D5EF7", "#10B981", "#F59E0B", "#3B82F6",
  "#EF4444", "#8B5CF6", "#14B8A6", "#F97316",
];

/* Role definitions */
const ROLE_CFG = {
  owner:  { label: "Owner",  Icon: Crown,  bg: "#FEF3C7", color: "#D97706", border: "#FDE68A" },
  editor: { label: "Editor", Icon: Pencil, bg: "#EDE9FE", color: "#6D5EF7", border: "#C4B5FD" },
  viewer: { label: "Viewer", Icon: Eye,    bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
};

/* RoleBadge */
function RoleBadge({ role }) {
  const cfg = ROLE_CFG[role] || ROLE_CFG.editor;
  return (
    <span
      style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0"
    >
      <cfg.Icon style={{ width: 11, height: 11 }} />
      {cfg.label}
    </span>
  );
}

/* PermissionToggle */
function PermissionToggle({ memberId, currentRole, onRoleChange, isChanging }) {
  const isEditor = currentRole === "editor";

  return (
    <button
      onClick={() => onRoleChange(memberId, isEditor ? "viewer" : "editor")}
      disabled={isChanging}
      title={isEditor ? "Click to change to Can View" : "Click to change to Can Edit"}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "4px 5px 4px 8px",
        gap: 6,
        border: isEditor ? "1.5px solid #C4B5FD" : "1.5px solid #E5E7EB",
        backgroundColor: isEditor ? "#EDE9FE" : "#F3F4F6",
        cursor: isChanging ? "not-allowed" : "pointer",
        opacity: isChanging ? 0.6 : 1,
        transition: "all 0.22s ease",
        flexShrink: 0,
        outline: "none",
        whiteSpace: "nowrap",
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: isEditor ? "#6D5EF7" : "#6B7280",
          fontFamily: "Inter, system-ui, sans-serif",
          transition: "color 0.22s ease",
          userSelect: "none",
        }}
      >
        {isEditor ? "Can Edit" : "Can View"}
      </span>

      {/* Track + Knob */}
      <span
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          width: 28,
          height: 16,
          borderRadius: 999,
          backgroundColor: isEditor ? "#6D5EF7" : "#D1D5DB",
          transition: "background-color 0.22s ease",
          flexShrink: 0,
        }}
      >
        <motion.span
          layout
          animate={{ x: isEditor ? 14 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
          }}
        />
      </span>
    </button>
  );
}

/* Avatar */
function UserAvatar({ name = "U", colorIndex = 0, isOnline = false }) {
  const bg = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  return (
    <div className="relative flex-shrink-0" style={{ width: 38, height: 38 }}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: bg, fontSize: 15 }}
      >
        {(name?.[0] || "U").toUpperCase()}
      </div>
      {isOnline && (
        <span
          className="absolute rounded-full border-2 border-white"
          style={{ width: 10, height: 10, bottom: 0, right: 0, backgroundColor: "#34D399" }}
        />
      )}
    </div>
  );
}

/* Section divider */
const Divider = () => <div style={{ height: 1, backgroundColor: "#F0F1F5", margin: "0 0" }} />;

/* Main Sidebar */
export function MembersSidebar() {
  const { boardId } = useParams();
  const { showMembers, toggleMembers, board, activeUsers, role: currentRole } = useBoardStore();
  const { user: currentUser } = useAuthStore();

  const [email, setEmail]             = useState("");
  const [role, setRole]               = useState("editor");
  const [isCopied, setIsCopied]       = useState(false);
  const [isInviting, setIsInviting]   = useState(false);
  const [changingMemberId, setChangingMemberId] = useState(null);

  if (!showMembers) return null;

  const members = board?.members || [];
  const liveIds = new Set(activeUsers.map((u) => u.userId || u._id));
  const isOwner = currentRole === "owner";

  /* handlers */
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast.success("Board link copied!");
    setTimeout(() => setIsCopied(false), 2200);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return toast.error("Enter an email address");

    const ownerEmail = (board?.owner?.email || "").toLowerCase();
    if (ownerEmail && cleanEmail === ownerEmail) {
      return toast.error("This user is already the board owner");
    }

    const currentEmail = (currentUser?.email || "").toLowerCase();
    if (currentEmail && cleanEmail === currentEmail) {
      return toast.error("You are already a member of this board");
    }

    setIsInviting(true);
    try {
      const res = await boardApi.addMember(boardId, { email: cleanEmail, role });
      toast.success("Member access updated for " + cleanEmail);
      setEmail("");
      const updatedBoard = res.data?.data?.board || res.data?.data;
      if (updatedBoard) {
        useBoardStore.getState().setBoard(updatedBoard);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update member");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (targetMemberId, newRole) => {
    setChangingMemberId(targetMemberId);
    try {
      const res = await boardApi.updateMemberRole(boardId, targetMemberId, { role: newRole });
      const label = newRole === "editor" ? "Can Edit" : "Can View";
      toast.success(`Permission changed to ${label}`);
      const updatedBoard = res.data?.data?.board || res.data?.data;
      if (updatedBoard) {
        useBoardStore.getState().setBoard(updatedBoard);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update role");
    } finally {
      setChangingMemberId(null);
    }
  };

  const handleRemoveMember = async (targetMemberId) => {
    try {
      const res = await boardApi.removeMember(boardId, targetMemberId);
      toast.success("Member removed");
      const updatedBoard = res.data?.data?.board || res.data?.data;
      if (updatedBoard) {
        useBoardStore.getState().setBoard(updatedBoard);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to remove member");
    }
  };

  const boardUrl  = window.location.href;
  const shortUrl  = boardUrl.replace(/^https?:\/\//, "").slice(0, 32) + (boardUrl.length > 32 ? "..." : "");

  /* inline style objects — 100% reliable, no Tailwind JIT surprises */
  const card = {
    position: "fixed", right: 16, top: 64, zIndex: 40,
    width: 320, maxHeight: "calc(100vh - 80px)",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    border: "1px solid #E8E9F0",
    boxShadow: "0 12px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
    display: "flex", flexDirection: "column",
    fontFamily: "Inter, system-ui, sans-serif",
    overflow: "hidden",
  };

  const scrollBody = {
    flex: 1, overflowY: "auto", overflowX: "hidden",
  };

  const section = {
    padding: "16px 20px",
    borderBottom: "1px solid #F0F1F5",
  };

  const lastSection = {
    padding: "16px 20px",
  };

  const sectionTitle = {
    fontSize: 13, fontWeight: 700, color: "#0F0F1A",
    marginBottom: 12, display: "flex", alignItems: "center", gap: 8,
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    padding: "10px 14px", borderRadius: 12,
    border: "1px solid #E5E7EB", fontSize: 13,
    color: "#0F0F1A", backgroundColor: "#F9FAFB",
    outline: "none", fontFamily: "inherit",
  };

  const purpleInputStyle = {
    width: "100%", boxSizing: "border-box",
    padding: "10px 14px", borderRadius: 12,
    border: "none", fontSize: 13,
    color: "#0F0F1A", backgroundColor: "#ffffff",
    outline: "none", fontFamily: "inherit",
  };

  const selectStyle = {
    flex: 1, padding: "8px 10px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.18)",
    color: "#ffffff", fontSize: 12, fontWeight: 600,
    cursor: "pointer", outline: "none", fontFamily: "inherit",
  };

  const sendBtn = {
    flex: 1, padding: "9px 12px", borderRadius: 10,
    backgroundColor: "#5049D4", color: "#ffffff",
    fontSize: 12, fontWeight: 700, cursor: "pointer",
    border: "none", fontFamily: "inherit",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    opacity: isInviting || !email.trim() ? 0.5 : 1,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 340 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 340 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={card}
    >
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0F1F5", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0F0F1A", margin: 0 }}>
          Share &amp; Members
        </h2>
        <button
          onClick={toggleMembers}
          style={{ width: 32, height: 32, borderRadius: 8, border: "none", backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F3F4F6"; e.currentTarget.style.color = "#374151"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={scrollBody}>

        {/* Share this board */}
        <div style={section}>
          <p style={sectionTitle}>Share this board</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* URL */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, minWidth: 0 }}>
              <Link2 style={{ width: 14, height: 14, color: "#9CA3AF", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shortUrl}</span>
            </div>
            {/* Copy btn */}
            <button
              onClick={handleCopyLink}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                padding: "9px 14px", borderRadius: 12, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", fontFamily: "inherit",
                backgroundColor: isCopied ? "#10B981" : "#6D5EF7",
                color: "#ffffff",
                boxShadow: isCopied ? "0 2px 8px rgba(16,185,129,0.25)" : "0 2px 8px rgba(109,94,247,0.25)",
                transition: "all 0.2s",
              }}
            >
              {isCopied
                ? <><Check style={{ width: 13, height: 13 }} /> Copied!</>
                : "Copy link"
              }
            </button>
          </div>
        </div>

        {/* Invite to board */}
        {(isOwner || currentRole === "editor") && (
          <div style={section}>
            <form onSubmit={handleInvite}>
              <div style={{ backgroundColor: "#6D5EF7", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", margin: 0 }}>Invite to board</p>
              <input
                type="email"
                placeholder="Enter email addresses"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={purpleInputStyle}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={selectStyle}
                >
                  <option value="editor" style={{ color: "#0F0F1A", backgroundColor: "#ffffff" }}>Can edit</option>
                  <option value="viewer" style={{ color: "#0F0F1A", backgroundColor: "#ffffff" }}>Can view</option>
                </select>
                <button
                  type="submit"
                  disabled={isInviting || !email.trim()}
                  style={sendBtn}
                >
                  {isInviting ? "Sending..." : (
                    <><Send style={{ width: 13, height: 13 }} /> Send Invite</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
        )}

        {/* Online now */}
        {activeUsers.length > 0 && (
          <div style={section}>
            <p style={sectionTitle}>
              Online Now
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#059669", backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", padding: "2px 8px", borderRadius: 999 }}>
                <Wifi style={{ width: 10, height: 10 }} />
                {activeUsers.length} live
              </span>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {activeUsers.map((u, i) => {
                const isYou =
                  u.userId === (currentUser?._id || currentUser?.id) ||
                  u.fullName === currentUser?.fullName;
                return (
                  <div key={u.userId || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                    <UserAvatar name={u.fullName} colorIndex={i} isOnline />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0F0F1A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.fullName || "Collaborator"}
                        {isYou && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, color: "#9CA3AF" }}>(You)</span>}
                      </p>
                      <p style={{ fontSize: 11, color: "#10B981", fontWeight: 500, margin: 0, marginTop: 2 }}>Active now</p>
                    </div>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#34D399", flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Board Members */}
        <div style={lastSection}>
          <p style={sectionTitle}>
            Board Members
            {members.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#ffffff", backgroundColor: "#6D5EF7", padding: "2px 8px", borderRadius: 999, minWidth: 20, textAlign: "center" }}>
                {members.length}
              </span>
            )}
          </p>

          {members.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 18 }}>👤</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: 0 }}>Only you have access</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: "4px 0 0" }}>Invite people above to collaborate</p>
            </div>
          ) : (
            <div>
              {members.map((m, index) => {
                const userObj = m.userId || m.user || {};
                const memberName = userObj.fullName || m.email || "Member";
                const memberEmail = userObj.email || m.email || "";
                const memberId = userObj._id || userObj.id || m.userId;
                const isYou =
                  String(memberId) === String(currentUser?._id || currentUser?.id) ||
                  memberName === currentUser?.fullName;
                const isLive = liveIds.has(String(memberId));

                return (
                  <div
                    key={m._id || index}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: index > 0 ? "1px solid #F0F1F5" : "none" }}
                  >
                    <UserAvatar name={memberName} colorIndex={index} isOnline={isLive} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0F0F1A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {memberName}
                        {isYou && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, color: "#9CA3AF" }}>(You)</span>}
                        {m.status === 'pending' && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 500, color: "#F59E0B" }}>(Pending)</span>}
                      </p>
                      {memberEmail && (
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{memberEmail}</p>
                      )}
                    </div>
                    {isOwner && !isYou ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <PermissionToggle
                          memberId={memberId}
                          currentRole={m.role}
                          onRoleChange={handleRoleChange}
                          isChanging={changingMemberId === memberId}
                        />
                        <button
                          onClick={() => handleRemoveMember(memberId)}
                          title="Remove member"
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            border: "none",
                            backgroundColor: "transparent",
                            color: "#9CA3AF",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.backgroundColor = "#FEE2E2"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                          <X style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    ) : (
                      <RoleBadge role={m.role} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}

export default MembersSidebar;
