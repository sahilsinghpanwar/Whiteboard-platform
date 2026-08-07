import React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange && onOpenChange(false)} />
      {children}
    </div>
  );
}

export function DialogTrigger({ children, onClick }) {
  return <div onClick={onClick} className="inline-block cursor-pointer">{children}</div>;
}

export function DialogPortal({ children }) {
  return <>{children}</>;
}

export function DialogOverlay({ className = "" }) {
  return <div className={cn("fixed inset-0 z-50 bg-black/50 backdrop-blur-sm", className)} />;
}

export function DialogClose({ children, onClick }) {
  return <button type="button" onClick={onClick}>{children}</button>;
}

export function DialogContent({ className = "", children, onClose }) {
  return (
    <div className={cn("relative z-50 w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg", className)}>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({ className = "", ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />;
}

export function DialogFooter({ className = "", ...props }) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)} {...props} />;
}

export function DialogTitle({ className = "", ...props }) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className = "", ...props }) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
