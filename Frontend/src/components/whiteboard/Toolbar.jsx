import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TOOLS, COLORS, STROKE_WIDTHS } from "./tools";
import { cn } from "@/lib/utils";

export default function Toolbar({ activeTool, onSelectTool, color, onColorChange, strokeWidth, onStrokeChange, canEdit }) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1.5 rounded-2xl glass float-shadow"
        data-testid="whiteboard-toolbar"
      >
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const active = activeTool === t.id;
          return (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>
                <button
                  disabled={!canEdit && t.id !== "select"}
                  onClick={() => onSelectTool(t.id)}
                  data-testid={`tool-${t.id}`}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    "hover:bg-primary/10 active:scale-95",
                    active && "bg-primary text-primary-foreground hover:bg-primary",
                    !canEdit && t.id !== "select" && "opacity-40 cursor-not-allowed"
                  )}
                  aria-label={t.label}
                >
                  <Icon size={18} weight={active ? "fill" : "regular"} />
                </button>
              </TooltipTrigger>
              <TooltipContent><span className="text-xs">{t.label} · <kbd className="font-mono">{t.shortcut}</kbd></span></TooltipContent>
            </Tooltip>
          );
        })}

        <div className="w-px h-6 bg-border mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-accent"
              data-testid="tool-color-picker"
              aria-label="Color"
            >
              <span className="w-5 h-5 rounded-full border" style={{ background: color }} />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-auto p-2">
            <div className="grid grid-cols-5 gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  className={cn("w-7 h-7 rounded-full border-2", color === c ? "ring-2 ring-primary ring-offset-1" : "")}
                  style={{ background: c }}
                  data-testid={`color-${c.replace("#", "")}`}
                />
              ))}
            </div>
            <div className="label-mono mt-3 mb-1.5">stroke</div>
            <div className="flex items-center gap-1.5">
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w}
                  onClick={() => onStrokeChange(w)}
                  className={cn("h-8 w-8 rounded-md flex items-center justify-center hover:bg-accent", strokeWidth === w && "bg-primary/10 ring-1 ring-primary")}
                  data-testid={`stroke-${w}`}
                >
                  <span className="rounded-full bg-foreground" style={{ width: w * 2, height: w * 2 }} />
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  );
}
