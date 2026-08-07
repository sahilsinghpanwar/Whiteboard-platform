import React, { createContext, useContext, useState, useEffect, useRef, useId, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const DialogContext = createContext({
  open: false,
  setOpen: () => {},
  titleId: "",
  descriptionId: "",
});

export function Dialog({ open: controlledOpen, defaultOpen = false, onOpenChange, children }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-desc`;

  const setOpen = useCallback(
    (value) => {
      const nextOpen = typeof value === "function" ? value(open) : value;
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, open, onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open, setOpen, titleId, descriptionId }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children, asChild, onClick, className = "", ...props }) {
  const { setOpen } = useContext(DialogContext);

  const handleTriggerClick = (e) => {
    onClick?.(e);
    setOpen(true);
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
    <button type="button" onClick={handleTriggerClick} className={cn("inline-block cursor-pointer", className)} {...props}>
      {children}
    </button>
  );
}

export function DialogPortal({ children }) {
  return <>{children}</>;
}

export function DialogOverlay({ className = "", onClick }) {
  const { setOpen } = useContext(DialogContext);
  return (
    <div
      className={cn("fixed inset-0 z-50 bg-black/50 backdrop-blur-sm", className)}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
    />
  );
}

export function DialogClose({ children, onClick, ...props }) {
  const { setOpen } = useContext(DialogContext);
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function DialogContent({ className = "", children, onClose, ...props }) {
  const { open, setOpen, titleId, descriptionId } = useContext(DialogContext);
  const contentRef = useRef(null);
  const previousFocusRef = useRef(null);

  const handleClose = useCallback(
    (e) => {
      onClose?.(e);
      setOpen(false);
    },
    [onClose, setOpen]
  );

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement;

    const timer = setTimeout(() => {
      if (contentRef.current) {
        const focusable = contentRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          contentRef.current.focus();
        }
      }
    }, 0);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose(e);
        return;
      }

      if (e.key === "Tab" && contentRef.current) {
        const focusable = Array.from(
          contentRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute("disabled"));

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
      }
    };
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn("relative z-50 w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg outline-none", className)}
        {...props}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
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
  const { titleId } = useContext(DialogContext);
  return <h2 id={titleId} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className = "", ...props }) {
  const { descriptionId } = useContext(DialogContext);
  return <p id={descriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
