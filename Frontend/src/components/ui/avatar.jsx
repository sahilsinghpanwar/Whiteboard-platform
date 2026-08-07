import { useState } from "react";

export const Avatar = ({ children, className = "", ...props }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`} {...props}>
    {children}
  </div>
);

export const AvatarImage = ({ src, alt = "", className = "", onError, ...props }) => {
  const [errorSrc, setErrorSrc] = useState(null);

  const hasError = errorSrc === src;

  if (!src || hasError) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 aspect-square h-full w-full object-cover ${className}`}
      onError={(e) => {
        setErrorSrc(src);
        if (onError) onError(e);
      }}
      {...props}
    />
  );
};

export const AvatarFallback = ({ children, className = "", ...props }) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-muted font-medium ${className}`} {...props}>
    {children}
  </div>
);
