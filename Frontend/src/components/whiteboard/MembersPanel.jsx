import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserPlus, Crown, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { boardApi } from "@/lib/services";
import UserAvatar from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";

export default function MembersPanel({ board, currentUser, onBoardUpdate }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [busy, setBusy] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState(null);

  const userId = currentUser?._id || currentUser?.id;
  const ownerId = board?.owner?._id || board?.owner;
  const isOwner = String(ownerId) === String(userId);

  const invite = async () => {
    const value = email.trim();
    if (!value) { toast.error("Email required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { toast.error("Enter a valid email"); return; }
    setBusy(true);
    try {
      const updated = await boardApi.invite(board._id, { email: value, role });
      onBoardUpdate?.(updated?.data ?? updated);
      toast.success("Invitation sent");
      setEmail("");
    } catch (e) { toast.error(e?.response?.data?.message || "Invite failed"); }
    finally { setBusy(false); }
  };

  const updateRole = async (memberId, newRole) => {
    if (busyMemberId === memberId || busy) return;
    setBusyMemberId(memberId);
    try {
      const updated = await boardApi.updateRole(board._id, memberId, newRole);
      onBoardUpdate?.(updated?.data ?? updated);
      toast.success("Role updated");
    } catch (e) { toast.error(e?.response?.data?.message || "Could not update"); }
    finally { setBusyMemberId(null); }
  };

  const removeMember = async (memberId) => {
    if (busyMemberId === memberId || busy) return;
    setBusyMemberId(memberId);
    try {
      const updated = await boardApi.removeMember(board._id, memberId);
      onBoardUpdate?.(updated?.data ?? updated);
      toast.success("Member removed");
    } catch (e) { toast.error(e?.response?.data?.message || "Could not remove"); }
    finally { setBusyMemberId(null); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="text-sm font-semibold">Members</div>
      </div>

      {isOwner && (
        <div className="p-4 border-b space-y-2">
          <div className="label-mono">invite by email</div>
          <div className="flex gap-2">
            <Input placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="invite-email-input" />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-24" data-testid="invite-role-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full gap-1.5" onClick={invite} disabled={busy || Boolean(busyMemberId)} data-testid="invite-submit-btn">
            <UserPlus size={16} /> {busy ? "Inviting…" : "Send invitation"}
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {/* Owner row */}
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <UserAvatar user={board.owner} size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium flex items-center gap-1.5 truncate">
                {board.owner?.fullName || "Owner"} <Crown size={12} weight="fill" className="text-yellow-500 shrink-0" />
              </div>
              <div className="text-xs text-muted-foreground truncate">{board.owner?.email}</div>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono uppercase">owner</Badge>
          </div>
          {(board.members || []).map((m) => {
            const memberId = m.userId?._id || m.userId;
            const isMemberBusy = busyMemberId === memberId || busy;
            return (
              <div key={memberId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50" data-testid={`member-row-${memberId}`}>
                <UserAvatar user={m.userId || m} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.userId?.fullName || "Member"}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.userId?.email}</div>
                </div>
                {m.status === "pending"
                  ? <Badge variant="outline" className="text-[10px] font-mono uppercase">pending</Badge>
                  : isOwner ? (
                    <Select value={m.role} onValueChange={(v) => updateRole(memberId, v)} disabled={isMemberBusy}>
                      <SelectTrigger className="w-24 h-8" data-testid={`member-role-${memberId}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] font-mono uppercase">{m.role}</Badge>
                  )}
                {isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-muted-foreground hover:text-destructive p-1 disabled:opacity-50 disabled:pointer-events-none" disabled={isMemberBusy} data-testid={`remove-member-${memberId}`}>
                        <Trash size={14} />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove member?</AlertDialogTitle>
                        <AlertDialogDescription>They'll lose access to this board immediately.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeMember(memberId)}>Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
