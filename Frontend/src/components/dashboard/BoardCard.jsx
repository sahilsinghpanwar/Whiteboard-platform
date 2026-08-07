// import React from "react";
// import { Link } from "react-router-dom";
// import { Badge } from "@/components/ui/badge";
// import { UsersThree, Clock, LockKey, Globe } from "@phosphor-icons/react";
// import { formatDate } from "@/lib/helpers";
// import UserAvatar from "@/components/shared/UserAvatar";

// export default function BoardCard({ board, currentUserId }) {
//   const ownerId = board.owner?._id || board.owner;
//   const isOwner = String(ownerId) === String(currentUserId);
//   const members = board.members || [];
//   const acceptedMembers = members.filter((m) => m.status === "accepted");
//   const total = acceptedMembers.length + 1;

//   return (
//     <Link
//       to={`/board/${board._id}`}
//       className="group flex flex-col p-5 rounded-2xl border bg-card hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer"
//       data-testid={`board-card-${board._id}`}
//     >
//       <div className="flex items-start justify-between mb-4">
//         <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest">
//           {isOwner ? "Owner" : "Member"}
//         </Badge>
//         {board.isPublic
//           ? <Globe size={16} className="text-muted-foreground" />
//           : <LockKey size={16} className="text-muted-foreground" />}
//       </div>

//       <div className="h-24 rounded-lg canvas-grid border mb-4 relative overflow-hidden">
//         {board.thumbnail && <img src={board.thumbnail} alt="" className="w-full h-full object-cover" />}
//       </div>

//       <h3 className="font-semibold tracking-tight text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
//         {board.title}
//       </h3>
//       <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
//         {board.description || "No description"}
//       </p>

//       <div className="flex items-center justify-between mt-4 pt-4 border-t">
//         <div className="flex items-center -space-x-2">
//           {board.owner && typeof board.owner === "object" && <UserAvatar user={board.owner} size={26} />}
//           {acceptedMembers.slice(0, 3).map((m, i) => (
//             <UserAvatar key={i} user={m.userId || m} size={26} />
//           ))}
//           {total > 4 && (
//             <div className="w-[26px] h-[26px] rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
//               +{total - 4}
//             </div>
//           )}
//         </div>
//         <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
//           <Clock size={12} /> {formatDate(board.lastActivityAt || board.updatedAt)}
//         </div>
//       </div>
//     </Link>
//   );
// }


import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Clock, LockKey, Globe, DotsThreeVertical, PencilSimple, Trash } from "@phosphor-icons/react";
import { formatDate } from "@/lib/helpers";
import { boardApi } from "@/lib/services";
import { toast } from "sonner";
import UserAvatar from "@/components/shared/UserAvatar";

export default function BoardCard({ board, currentUserId, onDeleted, onRenamed }) {
  const navigate = useNavigate();
  const ownerId = board.owner?._id || board.owner;
  const isOwner = String(ownerId) === String(currentUserId);
  const members = board.members || [];
  const acceptedMembers = members.filter((m) => m.status === "accepted");
  const total = acceptedMembers.length + 1;

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameVal, setRenameVal] = useState(board.title || "");
  const [renaming, setRenaming] = useState(false);

  const doRename = async () => {
    if (!renameVal.trim()) return toast.error("Title is required");
    setRenaming(true);
    try {
      const updated = await boardApi.update(board._id, { title: renameVal.trim() });
      toast.success("Board renamed");
      setRenameOpen(false);
      onRenamed?.(updated?.data ?? updated);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Rename failed");
    } finally { setRenaming(false); }
  };

  const doDelete = async () => {
    try {
      await boardApi.remove(board._id);
      toast.success("Board deleted");
      onDeleted?.(board._id);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <>
      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename board</DialogTitle>
          </DialogHeader>
          <Input
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doRename()}
            autoFocus
            data-testid="rename-board-input"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={doRename} disabled={renaming} data-testid="rename-board-submit">
              {renaming ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div
        className="group flex flex-col p-5 rounded-2xl border bg-card hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer relative"
        data-testid={`board-card-${board._id}`}
      >
        {/* Actions menu (owner only) */}
        {isOwner && (
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.preventDefault()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground"
                  data-testid={`board-card-menu-${board._id}`}
                  onClick={(e) => e.preventDefault()}
                >
                  <DotsThreeVertical size={16} weight="bold" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => { e.preventDefault(); setRenameVal(board.title || ""); setRenameOpen(true); }}
                  data-testid={`board-rename-${board._id}`}
                >
                  <PencilSimple size={14} className="mr-2" /> Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div
                      className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-destructive/10 text-destructive"
                      onClick={(e) => e.preventDefault()}
                      data-testid={`board-delete-trigger-${board._id}`}
                    >
                      <Trash size={14} className="mr-2" /> Delete
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete board?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete <strong>{board.title}</strong> and all its content. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={doDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid={`board-delete-confirm-${board._id}`}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <Link to={`/board/${board._id}`} className="flex flex-col flex-1">
          <div className="flex items-start justify-between mb-4">
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest">
              {isOwner ? "Owner" : "Member"}
            </Badge>
            {board.isPublic
              ? <Globe size={16} className="text-muted-foreground" />
              : <LockKey size={16} className="text-muted-foreground" />}
          </div>

          <div className="h-24 rounded-lg canvas-grid border mb-4 relative overflow-hidden">
            {board.thumbnail && <img src={board.thumbnail} alt="" className="w-full h-full object-cover" />}
          </div>

          <h3 className="font-semibold tracking-tight text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {board.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
            {board.description || "No description"}
          </p>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center -space-x-2">
              {board.owner && typeof board.owner === "object" && <UserAvatar user={board.owner} size={26} />}
              {acceptedMembers.slice(0, 3).map((m, i) => (
                <UserAvatar key={i} user={m.userId || m} size={26} />
              ))}
              {total > 4 && (
                <div className="w-[26px] h-[26px] rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
                  +{total - 4}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Clock size={12} /> {formatDate(board.lastActivityAt || board.updatedAt)}
            </div>
          </div>
        </Link>
      </div>
    </>
  );
}
