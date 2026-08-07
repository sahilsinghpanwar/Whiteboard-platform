import React from "react";

export const Textarea = React.forwardRef(({ className = "", ...props }, ref) => (
  <textarea
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    ref={ref}
    {...props}
  />
));

Textarea.displayName = "Textarea";
