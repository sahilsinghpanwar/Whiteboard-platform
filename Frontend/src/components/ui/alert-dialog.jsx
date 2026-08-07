import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useId } from "react";

const AlertDialogContext = createContext({
  open: false,
  setOpen: () => {},
  titleId: "",
  descriptionId: "",
});

export const AlertDialog = ({ children, open: controlledOpen, defaultOpen = false, onOpenChange }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const titleId = useId();
  const descriptionId = useId();
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

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
    <AlertDialogContext.Provider value={{ open, setOpen, titleId, descriptionId }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

export const AlertDialogTrigger = ({ children, asChild, onClick, ...props }) => {
  const { setOpen } = useContext(AlertDialogContext);

  const handleClick = (e) => {
    onClick?.(e);
    setOpen(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        handleClick(e);
      },
    });
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
};

export const AlertDialogContent = ({ children, className = "", ...props }) => {
  const { open, setOpen, titleId, descriptionId } = useContext(AlertDialogContext);
  const contentRef = useRef(null);
  const previousFocusRef = useRef(null);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement;

    const timer = setTimeout(() => {
      if (contentRef.current) {
        if (contentRef.current.contains(document.activeElement)) {
          return;
        }
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
        handleClose();
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

  const ariaLabelledBy = props["aria-labelledby"] || (props["aria-label"] ? undefined : titleId);
  const ariaDescribedBy = props["aria-describedby"] || descriptionId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={contentRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={`z-50 max-w-lg rounded-lg border bg-background p-6 shadow-lg outline-none ${className}`}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

export const AlertDialogHeader = ({ children, className = "", ...props }) => (
  <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`} {...props}>{children}</div>
);

export const AlertDialogTitle = ({ children, className = "", id, ...props }) => {
  const { titleId } = useContext(AlertDialogContext);
  return (
    <h2 id={id || titleId} className={`text-lg font-semibold ${className}`} {...props}>{children}</h2>
  );
};

export const AlertDialogDescription = ({ children, className = "", id, ...props }) => {
  const { descriptionId } = useContext(AlertDialogContext);
  return (
    <p id={id || descriptionId} className={`text-sm text-muted-foreground ${className}`} {...props}>{children}</p>
  );
};

export const AlertDialogFooter = ({ children, className = "", ...props }) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`} {...props}>{children}</div>
);

export const AlertDialogAction = ({ children, onClick, className = "", ...props }) => {
  const { setOpen } = useContext(AlertDialogContext);
  return (
    <button
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={`inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const AlertDialogCancel = ({ children, onClick, className = "", ...props }) => {
  const { setOpen } = useContext(AlertDialogContext);
  return (
    <button
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={`mt-2 inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground sm:mt-0 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
