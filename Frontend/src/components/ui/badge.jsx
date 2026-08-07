import React from "react";

export const Badge = ({ children, className = "", variant = "default", ...props }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors ${className}`}
    {...props}
  >
    {children}
  </span>
);
