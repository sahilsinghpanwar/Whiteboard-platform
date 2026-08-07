import React, { createContext, useContext, useState, useCallback } from "react";

const AlertDialogContext = createContext({
  open: false,
  setOpen: () => {},
});

export const AlertDialog = ({ children, open: controlledOpen, defaultOpen = false, onOpenChange }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
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
    <AlertDialogContext.Provider value={{ open, setOpen }}>
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
  const { open } = useContext(AlertDialogContext);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`z-50 max-w-lg rounded-lg border bg-background p-6 shadow-lg ${className}`} {...props}>
        {children}
      </div>
    </div>
  );
};

export const AlertDialogHeader = ({ children, className = "", ...props }) => (
  <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`} {...props}>{children}</div>
);

export const AlertDialogTitle = ({ children, className = "", ...props }) => (
  <h2 className={`text-lg font-semibold ${className}`} {...props}>{children}</h2>
);

export const AlertDialogDescription = ({ children, className = "", ...props }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props}>{children}</p>
);

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
