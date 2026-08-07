import React from "react";

export const TooltipProvider = ({ children }) => <>{children}</>;

export const Tooltip = ({ children }) => <div className="relative group inline-block">{children}</div>;

export const TooltipTrigger = ({ children, asChild, ...props }) => <div {...props}>{children}</div>;

export const TooltipContent = ({ children, className = "" }) => (
  <div className={`absolute bottom-full mb-2 hidden group-hover:block z-50 rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md ${className}`}>
    {children}
  </div>
);
