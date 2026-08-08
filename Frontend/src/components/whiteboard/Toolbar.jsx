import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette, BoundingBox, Trash } from "@phosphor-icons/react";
import { TOOLS, COLORS, STROKE_WIDTHS } from "./tools";
import { cn } from "@/lib/utils";

export default function Toolbar({
  activeTool,
  onSelectTool,
  color,
  onColorChange,
  strokeWidth,
  onStrokeChange,
  canEdit,
  onSelectAll,
  onClearAll,
  elementCount = 0,
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center p-1 sm:p-1.5 rounded-2xl glass float-shadow max-w-[calc(100vw-1.5rem)]"
        data-testid="whiteboard-toolbar"
      >
        {/* Scrollable Tools Section */}
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar py-0.5 px-0.5">
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
                      "w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
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
        </div>

        <div className="w-px h-5 sm:h-6 bg-border mx-1 shrink-0" />

        {/* Action Buttons: Select All & Clear All */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                disabled={elementCount === 0}
                onClick={onSelectAll}
                data-testid="tool-select-all"
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:bg-primary/10 active:scale-95 text-foreground",
                  elementCount === 0 && "opacity-40 cursor-not-allowed"
                )}
                aria-label="Select All Elements"
              >
                <BoundingBox size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <span className="text-xs">Select All · <kbd className="font-mono">⌘A</kbd></span>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                disabled={!canEdit || elementCount === 0}
                onClick={onClearAll}
                data-testid="tool-clear-all"
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:bg-destructive/10 text-destructive active:scale-95",
                  (!canEdit || elementCount === 0) && "opacity-40 cursor-not-allowed"
                )}
                aria-label="Clear All Elements"
              >
                <Trash size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <span className="text-xs">Clear All Elements</span>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-5 sm:h-6 bg-border mx-1 shrink-0" />

        {/* Color & Stroke Popover (Outside overflow container so popover is NEVER clipped!) */}
        <div className="shrink-0 relative">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg flex items-center justify-center hover:bg-accent group cursor-pointer"
                data-testid="tool-color-picker"
                aria-label="Color Picker"
                title="Click to change color & stroke"
              >
                <span
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-black/20 dark:border-white/30 shadow-xs transition-transform group-hover:scale-110"
                  style={{ background: color }}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="center" className="w-[220px] p-3 space-y-3 shadow-2xl">
              <div>
                <div className="label-mono mb-2 flex items-center justify-between text-[10px]">
                  <span>Color Presets (20)</span>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">{color}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => onColorChange(c)}
                      aria-label={`Color ${c}`}
                      aria-pressed={color === c}
                      className={cn(
                        "w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 cursor-pointer transition-transform hover:scale-110",
                        color === c ? "ring-2 ring-primary ring-offset-1 scale-105" : "border-black/10 dark:border-white/20"
                      )}
                      style={{ background: c }}
                      data-testid={`color-${c.replace("#", "")}`}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Color Input & HEX Box */}
              <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-border">
                <label htmlFor="custom-color-picker" className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground shrink-0">
                  <Palette size={16} />
                  <span>Custom</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="w-18 h-7 px-1 text-[11px] font-mono rounded border border-border bg-background outline-none focus:ring-1 focus:ring-primary uppercase text-center"
                    placeholder="#000000"
                    maxLength={7}
                    data-testid="hex-color-input"
                  />
                  <input
                    id="custom-color-picker"
                    type="color"
                    value={color.startsWith("#") && color.length === 7 ? color : "#111111"}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-border cursor-pointer bg-transparent p-0 overflow-hidden shrink-0"
                    title="Pick custom color"
                    data-testid="custom-color-input"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="label-mono mb-2 text-[10px]">Stroke thickness</div>
                <div className="flex items-center justify-between gap-1">
                  {STROKE_WIDTHS.map((w) => (
                    <button
                      key={w}
                      onClick={() => onStrokeChange(w)}
                      aria-label={`Stroke width ${w}`}
                      aria-pressed={strokeWidth === w}
                      className={cn(
                        "h-8 w-8 rounded-md flex items-center justify-center hover:bg-accent cursor-pointer transition-colors",
                        strokeWidth === w && "bg-primary/10 ring-1 ring-primary"
                      )}
                      data-testid={`stroke-${w}`}
                    >
                      <span className="rounded-full bg-foreground" style={{ width: Math.max(3, w * 1.5), height: Math.max(3, w * 1.5) }} />
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </TooltipProvider>
  );
}


