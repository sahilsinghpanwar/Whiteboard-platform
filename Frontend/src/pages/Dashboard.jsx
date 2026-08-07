// import React, { useEffect, useMemo, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
// import { toast } from "sonner";
// import { PenNib, Plus, MagnifyingGlass, SignOut, GearSix } from "@phosphor-icons/react";

// import { useAuth } from "@/context/AuthContext";
// import { boardApi } from "@/lib/services";
// import BoardCard from "@/components/dashboard/BoardCard";
// import CreateBoardModal from "@/components/dashboard/CreateBoardModal";
// import InviteBanner from "@/components/dashboard/InviteBanner";
// import ThemeToggle from "@/components/shared/ThemeToggle";
// import UserAvatar from "@/components/shared/UserAvatar";

// export default function Dashboard() {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const [boards, setBoards] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [creating, setCreating] = useState(false);
//   const [q, setQ] = useState("");

//   const load = async () => {
//     setLoading(true);
//     try {
//       const res = await boardApi.list();
//       // res may be array or { data: [...] }
//       const list = Array.isArray(res) ? res : (res?.data ?? []);
//       setBoards(list);
//     } catch (err) {
//       toast.error(err?.response?.data?.message || "Failed to load boards");
//     } finally { setLoading(false); }
//   };

//   useEffect(() => { load(); }, []);

//   const userId = user?._id || user?.id;
//   const { invites, myBoards } = useMemo(() => {
//     const inv = [], own = [];
//     boards.forEach((b) => {
//       const me = (b.members || []).find((m) => String(m.userId?._id || m.userId) === String(userId));
//       if (me && me.status === "pending") inv.push(b); else own.push(b);
//     });
//     return { invites: inv, myBoards: own };
//   }, [boards, userId]);

//   const filtered = myBoards.filter((b) => (b.title || "").toLowerCase().includes(q.toLowerCase()));

//   const onLogout = async () => { await logout(); navigate("/login"); };

//   return (
//     <div className="min-h-screen bg-background">
//       <header className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur-md">
//         <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
//           <Link to="/dashboard" className="flex items-center gap-2">
//             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
//               <PenNib size={18} weight="fill" color="#fff" />
//             </div>
//             <span className="font-bold tracking-tight text-lg">Kanvas</span>
//           </Link>
//           <div className="flex items-center gap-2">
//             <ThemeToggle />
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <button className="flex items-center gap-2 hover:bg-accent rounded-full pl-2 pr-3 py-1.5 transition-colors" data-testid="user-menu-btn">
//                   <UserAvatar user={user} size={28} />
//                   <span className="text-sm font-medium hidden sm:inline">{user?.fullName?.split(" ")[0]}</span>
//                 </button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end" className="w-52">
//                 <div className="px-2 py-2">
//                   <div className="text-sm font-medium">{user?.fullName}</div>
//                   <div className="text-xs text-muted-foreground">{user?.email}</div>
//                 </div>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem onClick={() => navigate("/settings")} data-testid="menu-settings">
//                   <GearSix size={16} className="mr-2" /> Settings
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={onLogout} data-testid="menu-logout">
//                   <SignOut size={16} className="mr-2" /> Sign out
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </div>
//       </header>

//       <main className="max-w-7xl mx-auto px-6 py-10">
//         <div className="flex items-end justify-between mb-8">
//           <div>
//             <div className="label-mono mb-2">workspace</div>
//             <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Your boards</h1>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="relative">
//               <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
//               <Input placeholder="Search boards…" value={q} onChange={(e) => setQ(e.target.value)}
//                 className="pl-9 h-10 w-56" data-testid="dashboard-search-input" />
//             </div>
//             <Button className="rounded-full gap-1.5 h-10 px-4" onClick={() => setCreating(true)} data-testid="dashboard-new-board-btn">
//               <Plus size={16} weight="bold" /> New board
//             </Button>
//           </div>
//         </div>

//         {invites.length > 0 && (
//           <div className="space-y-2 mb-8">
//             <div className="label-mono">pending invitations</div>
//             {invites.map((b) => <InviteBanner key={b._id} board={b} onUpdated={load} />)}
//           </div>
//         )}

//         {loading ? (
//           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
//             {Array.from({ length: 4 }).map((_, i) => (
//               <div key={i} className="h-64 rounded-2xl border bg-muted/30 animate-pulse" />
//             ))}
//           </div>
//         ) : filtered.length === 0 ? (
//           <div className="text-center py-24 border-2 border-dashed rounded-2xl" data-testid="empty-boards">
//             <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4">
//               <PenNib size={26} weight="duotone" />
//             </div>
//             <h3 className="text-xl font-semibold tracking-tight">No boards yet</h3>
//             <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">Start with a blank canvas or spin one up with AI.</p>
//             <Button className="rounded-full mt-6 gap-1.5" onClick={() => setCreating(true)}>
//               <Plus size={16} weight="bold" /> Create your first board
//             </Button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="boards-grid">
//             {filtered.map((b) => <BoardCard key={b._id} board={b} currentUserId={userId} />)}
//           </div>
//         )}
//       </main>

//       <CreateBoardModal open={creating} onOpenChange={setCreating} onCreated={(b) => { if (b?._id) navigate(`/board/${b._id}`); else load(); }} />
//     </div>
//   );
// }





import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { PenNib, Plus, MagnifyingGlass, SignOut, GearSix } from "@phosphor-icons/react";

import { useAuth } from "@/context/AuthContext";
import { boardApi } from "@/lib/services";
import BoardCard from "@/components/dashboard/BoardCard";
import CreateBoardModal from "@/components/dashboard/CreateBoardModal";
import InviteBanner from "@/components/dashboard/InviteBanner";
import ThemeToggle from "@/components/shared/ThemeToggle";
import UserAvatar from "@/components/shared/UserAvatar";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await boardApi.list();
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setBoards(list);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load boards");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const userId = user?._id || user?.id;
  const { invites, myBoards } = useMemo(() => {
    const inv = [], own = [];
    boards.forEach((b) => {
      const me = (b.members || []).find((m) => String(m.userId?._id || m.userId) === String(userId));
      if (me && me.status === "pending") inv.push(b); else own.push(b);
    });
    return { invites: inv, myBoards: own };
  }, [boards, userId]);

  const filtered = myBoards.filter((b) => (b.title || "").toLowerCase().includes(q.toLowerCase()));

  const onLogout = async () => { await logout(); navigate("/login"); };

  const handleBoardDeleted = (deletedId) => {
    setBoards((prev) => prev.filter((b) => b._id !== deletedId));
  };

  const handleBoardRenamed = (updated) => {
    const b = updated?.data ?? updated;
    setBoards((prev) => prev.map((board) => board._id === b._id ? { ...board, ...b } : board));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <PenNib size={18} weight="fill" color="#fff" />
            </div>
            <span className="font-bold tracking-tight text-lg">Kanvas</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-accent rounded-full pl-2 pr-3 py-1.5 transition-colors" data-testid="user-menu-btn">
                  <UserAvatar user={user} size={28} />
                  <span className="text-sm font-medium hidden sm:inline">{user?.fullName?.split(" ")[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-2">
                  <div className="text-sm font-medium">{user?.fullName}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")} data-testid="menu-settings">
                  <GearSix size={16} className="mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} data-testid="menu-logout">
                  <SignOut size={16} className="mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="label-mono mb-2">workspace</div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Your boards</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search boards…" value={q} onChange={(e) => setQ(e.target.value)}
                className="pl-9 h-10 w-56" data-testid="dashboard-search-input" />
            </div>
            <Button className="rounded-full gap-1.5 h-10 px-4" onClick={() => setCreating(true)} data-testid="dashboard-new-board-btn">
              <Plus size={16} weight="bold" /> New board
            </Button>
          </div>
        </div>

        {invites.length > 0 && (
          <div className="space-y-2 mb-8">
            <div className="label-mono">pending invitations</div>
            {invites.map((b) => <InviteBanner key={b._id} board={b} onUpdated={load} />)}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl border bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed rounded-2xl" data-testid="empty-boards">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4">
              <PenNib size={26} weight="duotone" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight">No boards yet</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">Start with a blank canvas or spin one up with AI.</p>
            <Button className="rounded-full mt-6 gap-1.5" onClick={() => setCreating(true)}>
              <Plus size={16} weight="bold" /> Create your first board
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="boards-grid">
            {filtered.map((b) => (
              <BoardCard
                key={b._id}
                board={b}
                currentUserId={userId}
                onDeleted={handleBoardDeleted}
                onRenamed={handleBoardRenamed}
              />
            ))}
          </div>
        )}
      </main>

      <CreateBoardModal
        open={creating}
        onOpenChange={setCreating}
        onCreated={(b) => { if (b?._id) navigate(`/board/${b._id}`); else load(); }}
      />
    </div>
  );
}
