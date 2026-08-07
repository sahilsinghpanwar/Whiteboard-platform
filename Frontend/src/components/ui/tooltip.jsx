import { createContext, useContext, useId } from "react";

const TooltipContext = createContext(null);

export const TooltipProvider = ({ children }) => <>{children}</>;

export const Tooltip = ({ children }) => {
  const generatedId = useId();
  return (
    <TooltipContext.Provider value={{ tooltipId: generatedId }}>
      <div className="relative group inline-block">{children}</div>
    </TooltipContext.Provider>
  );
};

export const TooltipTrigger = ({ children, asChild, ...props }) => {
  const ctx = useContext(TooltipContext);
  const ariaDescribedBy = props["aria-describedby"] || ctx?.tooltipId;
  return (
    <div aria-describedby={ariaDescribedBy} data-as-child={asChild || undefined} {...props}>
      {children}
    </div>
  );
};

export const TooltipContent = ({ children, className = "", id, ...props }) => {
  const ctx = useContext(TooltipContext);
  const contentId = id || ctx?.tooltipId;
  return (
    <div
      id={contentId}
      role="tooltip"
      className={`absolute bottom-full mb-2 hidden group-hover:block group-focus-within:block z-50 rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
