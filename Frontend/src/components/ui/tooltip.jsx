import React, { createContext, useContext, useState, useEffect, useId } from "react";

const TooltipContext = createContext(null);

export const TooltipProvider = ({ children }) => <>{children}</>;

export const Tooltip = ({ children }) => {
  const defaultId = useId();
  const [customId, setCustomId] = useState(null);
  const tooltipId = customId || defaultId;

  return (
    <TooltipContext.Provider value={{ tooltipId, setCustomId }}>
      <div className="relative group inline-block">{children}</div>
    </TooltipContext.Provider>
  );
};

const mergeAriaDescribedBy = (...ids) => {
  const set = new Set();
  ids.forEach((id) => {
    if (typeof id === "string") {
      id.trim()
        .split(/\s+/)
        .forEach((token) => token && set.add(token));
    }
  });
  return Array.from(set).join(" ") || undefined;
};

export const TooltipTrigger = ({ children, asChild, ...props }) => {
  const ctx = useContext(TooltipContext);

  if (asChild && React.isValidElement(children)) {
    const ariaDescribedBy = mergeAriaDescribedBy(
      children.props["aria-describedby"],
      props["aria-describedby"],
      ctx?.tooltipId
    );

    const combinedClassName = [props.className, children.props.className]
      .filter(Boolean)
      .join(" ");

    const composedProps = { ...props };
    ["onClick", "onFocus", "onMouseEnter", "onKeyDown"].forEach((eventName) => {
      const childHandler = children.props[eventName];
      const propHandler = props[eventName];
      if (childHandler || propHandler) {
        composedProps[eventName] = (e) => {
          childHandler?.(e);
          propHandler?.(e);
        };
      }
    });

    return React.cloneElement(children, {
      ...composedProps,
      "aria-describedby": ariaDescribedBy,
      ...(combinedClassName ? { className: combinedClassName } : {}),
    });
  }

  const ariaDescribedBy = mergeAriaDescribedBy(
    props["aria-describedby"],
    ctx?.tooltipId
  );

  return (
    <div aria-describedby={ariaDescribedBy} {...props}>
      {children}
    </div>
  );
};

export const TooltipContent = ({ children, className = "", id, ...props }) => {
  const ctx = useContext(TooltipContext);
  const setCustomId = ctx?.setCustomId;

  useEffect(() => {
    if (id && setCustomId) {
      setCustomId(id);
    }
  }, [id, setCustomId]);

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
