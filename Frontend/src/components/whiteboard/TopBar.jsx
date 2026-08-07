import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ArrowLeft, DownloadSimple, UsersThree, Circle } from "@phosphor-icons/react";
import UserAvatar from "@/components/shared/UserAvatar";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";

export default function TopBar({
  board,
  activeUsers = [],
  canEdit,
  saving,
  onRename,
  onExport,
}) {
  const users = Array.isArray(activeUsers) ? activeUsers : [];
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const titleProp = board?.title || "Untitled Board";
  const [title, setTitle] = useState(titleProp);
  const [prevTitleProp, setPrevTitleProp] = useState(titleProp);

  if (titleProp !== prevTitleProp) {
    setPrevTitleProp(titleProp);
    setTitle(titleProp);
  }

  const containerClass = isDark
    ? "bg-black text-white border-neutral-800 shadow-md"
    : "bg-white text-gray-900 border-slate-200 shadow-md";

  const textMutedClass = isDark ? "text-neutral-400" : "text-gray-500";
  const textHoverClass = isDark ? "hover:text-white" : "hover:text-gray-900";
  const dividerClass = isDark ? "bg-neutral-800" : "bg-slate-200";

  return (
    <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none pr-[340px]">
      {/* Left Section: Back button + Title input + Save status */}
      <div className={`pointer-events-auto flex items-center gap-3 px-3.5 py-2 rounded-xl border ${containerClass}`}>
        <Link
          to="/dashboard"
          className={`${textMutedClass} ${textHoverClass} transition-colors`}
          data-testid="board-back-btn"
          title="Back to Dashboard"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className={`w-px h-5 ${dividerClass}`} />
        <input
          className="bg-transparent outline-none text-sm font-semibold tracking-tight w-48 focus:ring-2 focus:ring-primary/30 rounded px-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={(e) => {
            const val = e.target.value.trim();
            if (val && val !== board?.title) {
              onRename?.(val);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.target.blur();
            }
          }}
          data-testid="board-title-input"
          disabled={!canEdit}
        />
        <div className={`label-mono flex items-center gap-1.5 text-xs ${textMutedClass}`}>
          <Circle
            size={8}
            weight="fill"
            className={saving ? "text-yellow-500 animate-pulse" : "text-green-500"}
          />
          {saving ? "saving" : "saved"}
        </div>
      </div>

      {/* Right Section: Active Users (Clickable with Profile Card) + Export + Theme */}
      <div className={`pointer-events-auto flex items-center gap-3 px-3.5 py-2 rounded-xl border ${containerClass}`}>
        <div className="flex items-center -space-x-2" data-testid="presence-avatars">
          {users.slice(0, 5).map((u) => {
            const name = u.fullName || u.name || u.email || "Active User";
            const email = u.email || "";
            const role = u.role || "Member";

            return (
              <Popover key={u.userId || u._id || u.id || name}>
                <PopoverTrigger asChild>
                  <button
                    className="ring-2 ring-background rounded-full hover:scale-105 transition-transform outline-none cursor-pointer"
                    title={`Click to view profile of ${name}`}
                  >
                    <UserAvatar user={u} size={28} />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="center" className="w-56 p-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={u} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{name}</p>
                      {email && <p className={`text-xs ${textMutedClass} truncate`}>{email}</p>}
                      <span className="inline-block mt-1 text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-muted">
                        {role}
                      </span>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}

          {users.length > 5 && (
            <div className={`w-7 h-7 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-medium ${textMutedClass}`}>
              +{users.length - 5}
            </div>
          )}

          {users.length === 0 && (
            <div className={`flex items-center gap-1.5 text-xs ${textMutedClass}`}>
              <UsersThree size={14} /> Just you
            </div>
          )}
        </div>

        <div className={`w-px h-5 ${dividerClass}`} />

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="gap-1.5" data-testid="export-menu-btn">
              <DownloadSimple size={16} /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport?.("png")} data-testid="export-png">
              PNG image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport?.("pdf")} data-testid="export-pdf">
              PDF document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport?.("json")} data-testid="export-json">
              JSON data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
      </div>
    </div>
  );
}
