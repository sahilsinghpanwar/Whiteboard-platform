import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useBoardStore } from "../store/Boardstore.js";
import { boardApi } from "../api/Board.api.js";
import { Users, UserPlus, Copy, Check, Shield, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export function MembersSidebar() {
  const { boardId } = useParams();
  const { showMembers, toggleMembers, board } = useBoardStore();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!showMembers) return null;

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Board link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter an email address");

    setIsLoading(true);
    try {
      await boardApi.addMember(boardId, { email, role });
      toast.success(`Invited ${email} as ${role}`);
      setEmail("");
    } catch (err) {
      toast.error(err.message || "Failed to invite member");
    } finally {
      setIsLoading(false);
    }
  };

  const members = board?.members || [];

  return (
    <aside className="fixed right-4 top-20 z-40 w-80 max-h-[82vh] bg-[#18181c]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white animate-in slide-in-from-right-5 duration-200 font-sans">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-indigo-900/40">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Share & Members</h2>
        </div>
        <button
          onClick={toggleMembers}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Copy Link Section */}
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
          <label className="text-xs font-semibold text-zinc-300 block">Share Board Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-zinc-400 font-mono truncate outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow"
              title="Copy Link"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="space-y-3 pt-1">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-indigo-400" />
            Invite Collaborator
          </label>
          <div className="space-y-2">
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center gap-2">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="editor" className="bg-[#18181c] text-white">Can Edit (Editor)</option>
                <option value="viewer" className="bg-[#18181c] text-white">Can View (Viewer)</option>
              </select>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {isLoading ? "Inviting..." : "Send Invite"}
              </button>
            </div>
          </div>
        </form>

        {/* Members List */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <span className="text-xs font-semibold text-zinc-400 block">Board Members ({members.length || 1})</span>
          {members.length === 0 ? (
            <div className="text-xs text-zinc-500 py-2">Only you have access to this board.</div>
          ) : (
            members.map((m, index) => (
              <div
                key={m._id || index}
                className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {(m.user?.fullName?.[0] || m.email?.[0] || "U").toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate">{m.user?.fullName || m.email}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{m.email}</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                  {m.role || "Editor"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

export default MembersSidebar;
