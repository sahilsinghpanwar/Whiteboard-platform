import React, { useState, useRef, useEffect, createContext, useContext } from "react";

const PopoverContext = createContext(null);

export const Popover = ({ children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  return (
    <PopoverContext.Provider value={{ open, toggle, close }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger = ({ children, asChild, onClick, ...props }) => {
  const ctx = useContext(PopoverContext);
  const handleClick = (e) => {
    ctx?.toggle();
    if (onClick) onClick(e);
  };

  return (
    <div onClick={handleClick} className="cursor-pointer inline-block" {...props}>
      {children}
    </div>
  );
};

export const PopoverContent = ({ children, className = "", align = "center", side = "bottom" }) => {
  const ctx = useContext(PopoverContext);
  if (!ctx?.open) return null;

  const sideClass = side === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const alignClass =
    align === "end" || align === "right"
      ? "right-0"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "left-0";

  return (
    <div
      className={`absolute ${sideClass} ${alignClass} z-50 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-black p-3 text-gray-900 dark:text-white shadow-xl animate-in fade-in-0 zoom-in-95 ${className}`}
    >
      {children}
    </div>
  );
};
