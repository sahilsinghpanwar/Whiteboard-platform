// import React from "react";
// import { Button } from "@/components/ui/button";
// import { toast } from "sonner";
// import { boardApi } from "@/lib/services";
// import { Envelope } from "@phosphor-icons/react";

// export default function InviteBanner({ board, onUpdated }) {
//   const accept = async () => {
//     try { await boardApi.accept(board._id); toast.success(`Joined "${board.title}"`); onUpdated?.(); }
//     catch (e) { toast.error(e?.response?.data?.message || "Could not accept"); }
//   };
//   const decline = async () => {
//     try { await boardApi.decline(board._id); toast.success("Declined"); onUpdated?.(); }
//     catch (e) { toast.error(e?.response?.data?.message || "Could not decline"); }
//   };

//   return (
//     <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border bg-primary/5" data-testid={`invite-${board._id}`}>
//       <div className="flex items-center gap-3">
//         <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
//           <Envelope size={18} weight="duotone" />
//         </div>
//         <div>
//           <div className="text-sm font-medium">Invitation to <span className="text-primary">{board.title}</span></div>
//           <div className="text-xs text-muted-foreground">You've been invited to collaborate.</div>
//         </div>
//       </div>
//       <div className="flex items-center gap-2">
//         <Button size="sm" variant="ghost" onClick={decline} data-testid={`invite-decline-${board._id}`}>Decline</Button>
//         <Button size="sm" onClick={accept} data-testid={`invite-accept-${board._id}`}>Accept</Button>
//       </div>
//     </div>
//   );
// }




import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { boardApi } from "@/lib/services";
import { Envelope } from "@phosphor-icons/react";

export default function InviteBanner({ board, onUpdated }) {
  const accept = async () => {
    try { await boardApi.accept(board._id); toast.success(`Joined "${board.title}"`); onUpdated?.(); }
    catch (e) { toast.error(e?.response?.data?.message || "Could not accept"); }
  };
  const decline = async () => {
    try { await boardApi.decline(board._id); toast.success("Declined"); onUpdated?.(); }
    catch (e) { toast.error(e?.response?.data?.message || "Could not decline"); }
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border bg-primary/5" data-testid={`invite-${board._id}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
          <Envelope size={18} weight="duotone" />
        </div>
        <div>
          <div className="text-sm font-medium">Invitation to <span className="text-primary">{board.title}</span></div>
          <div className="text-xs text-muted-foreground">You've been invited to collaborate.</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={decline} data-testid={`invite-decline-${board._id}`}>Decline</Button>
        <Button size="sm" onClick={accept} data-testid={`invite-accept-${board._id}`}>Accept</Button>
      </div>
    </div>
  );
}
