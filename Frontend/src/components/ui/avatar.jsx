import React from "react";

export const Avatar = ({ children, className = "", ...props }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`} {...props}>
    {children}
  </div>
);

export const AvatarImage = ({ src, alt = "", className = "", ...props }) => (
  <img src={src} alt={alt} className={`aspect-square h-full w-full object-cover ${className}`} {...props} />
);

export const AvatarFallback = ({ children, className = "", ...props }) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-muted font-medium ${className}`} {...props}>
    {children}
  </div>
);
