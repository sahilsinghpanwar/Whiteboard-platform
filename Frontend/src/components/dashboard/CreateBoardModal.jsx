// import React, { useState } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { toast } from "sonner";
// import { boardApi } from "@/lib/services";

// export default function CreateBoardModal({ open, onOpenChange, onCreated }) {
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [isPublic, setIsPublic] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const submit = async () => {
//     if (!title.trim()) return toast.error("Board title is required");
//     setLoading(true);
//     try {
//       const board = await boardApi.create({ title: title.trim(), description: description.trim(), isPublic });
//       const b = board?.data ?? board;
//       toast.success("Board created");
//       onOpenChange(false);
//       setTitle(""); setDescription(""); setIsPublic(false);
//       onCreated?.(b);
//     } catch (err) {
//       toast.error(err?.response?.data?.message || "Failed to create board");
//     } finally { setLoading(false); }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="rounded-2xl" data-testid="create-board-modal">
//         <DialogHeader>
//           <DialogTitle>New board</DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4">
//           <div className="space-y-1.5">
//             <Label htmlFor="btitle">Title</Label>
//             <Input id="btitle" value={title} onChange={(e) => setTitle(e.target.value)}
//               data-testid="create-board-title-input" placeholder="Product roadmap" />
//           </div>
//           <div className="space-y-1.5">
//             <Label htmlFor="bdesc">Description</Label>
//             <Textarea id="bdesc" value={description} onChange={(e) => setDescription(e.target.value)}
//               data-testid="create-board-desc-input" placeholder="Optional — what's this board for?" rows={3} />
//           </div>
//           <div className="flex items-center justify-between rounded-lg border p-3">
//             <div>
//               <div className="text-sm font-medium">Public</div>
//               <div className="text-xs text-muted-foreground">Anyone with the link can view.</div>
//             </div>
//             <Switch checked={isPublic} onCheckedChange={setIsPublic} data-testid="create-board-public-switch" />
//           </div>
//         </div>
//         <DialogFooter>
//           <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
//           <Button onClick={submit} disabled={loading} data-testid="create-board-submit-btn">
//             {loading ? "Creating…" : "Create board"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }




import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { boardApi } from "@/lib/services";

export default function CreateBoardModal({ open, onOpenChange, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim()) return toast.error("Board title is required");
    setLoading(true);
    try {
      const board = await boardApi.create({ title: title.trim(), description: description.trim(), isPublic });
      const b = board?.data ?? board;
      toast.success("Board created");
      onOpenChange(false);
      setTitle(""); setDescription(""); setIsPublic(false);
      onCreated?.(b);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create board");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl" data-testid="create-board-modal">
        <DialogHeader>
          <DialogTitle>New board</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="btitle">Title</Label>
            <Input id="btitle" value={title} onChange={(e) => setTitle(e.target.value)}
              data-testid="create-board-title-input" placeholder="Product roadmap" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bdesc">Description</Label>
            <Textarea id="bdesc" value={description} onChange={(e) => setDescription(e.target.value)}
              data-testid="create-board-desc-input" placeholder="Optional — what's this board for?" rows={3} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">Public</div>
              <div className="text-xs text-muted-foreground">Anyone with the link can view.</div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} data-testid="create-board-public-switch" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading} data-testid="create-board-submit-btn">
            {loading ? "Creating…" : "Create board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
