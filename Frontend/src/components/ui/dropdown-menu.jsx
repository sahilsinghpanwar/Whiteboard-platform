import React, { useState, useRef, useEffect, createContext, useContext } from "react";

const DropdownContext = createContext(null);

export const DropdownMenu = ({ children }) => {
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
    <DropdownContext.Provider value={{ open, toggle, close }}>
      <div ref={ref} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const DropdownMenuTrigger = ({ children, asChild, onClick, ...props }) => {
  const ctx = useContext(DropdownContext);
  const handleTriggerClick = (e) => {
    ctx?.toggle();
    if (onClick) onClick(e);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        handleTriggerClick(e);
      },
    });
  }

  return (
    <div onClick={handleTriggerClick} className="cursor-pointer inline-block" {...props}>
      {children}
    </div>
  );
};

export const DropdownMenuContent = ({ children, className = "", align = "right" }) => {
  const ctx = useContext(DropdownContext);
  if (!ctx?.open) return null;

  const alignClass = align === "end" || align === "right" ? "right-0" : "left-0";

  return (
    <div
      className={`absolute ${alignClass} z-50 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-black p-1.5 text-gray-900 dark:text-white shadow-xl animate-in fade-in-0 zoom-in-95 ${className}`}
    >
      {children}
    </div>
  );
};

export const DropdownMenuItem = ({ children, onClick, className = "", ...props }) => {
  const ctx = useContext(DropdownContext);
  const handleItemClick = (e) => {
    if (onClick) onClick(e);
    ctx?.close();
  };

  return (
    <button
      type="button"
      onClick={handleItemClick}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm font-medium outline-none hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const DropdownMenuSeparator = () => <div className="-mx-1 my-1 h-px bg-border" />;
