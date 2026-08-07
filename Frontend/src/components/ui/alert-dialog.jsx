import React from "react";

export const AlertDialog = ({ children, open }) => (open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">{children}</div> : null);
export const AlertDialogTrigger = ({ children }) => <>{children}</>;
export const AlertDialogContent = ({ children, className = "" }) => (
  <div className={`z-50 max-w-lg rounded-lg border bg-background p-6 shadow-lg ${className}`}>{children}</div>
);
export const AlertDialogHeader = ({ children, className = "" }) => <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`}>{children}</div>;
export const AlertDialogTitle = ({ children, className = "" }) => <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
export const AlertDialogDescription = ({ children, className = "" }) => <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
export const AlertDialogFooter = ({ children, className = "" }) => <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}>{children}</div>;
export const AlertDialogAction = ({ children, onClick, className = "" }) => (
  <button onClick={onClick} className={`inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 ${className}`}>{children}</button>
);
export const AlertDialogCancel = ({ children, onClick, className = "" }) => (
  <button onClick={onClick} className={`mt-2 inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground sm:mt-0 ${className}`}>{children}</button>
);
