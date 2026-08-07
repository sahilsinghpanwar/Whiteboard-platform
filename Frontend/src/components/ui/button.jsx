import React from "react";
import { cn } from "@/lib/utils";

const buttonVariantStyles = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  outline: "border border-border bg-background hover:bg-muted hover:text-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-muted hover:text-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  link: "text-primary underline-offset-4 hover:underline",
};

const buttonSizeStyles = {
  default: "h-9 px-4 py-2 text-sm",
  xs: "h-6 px-2 text-xs",
  sm: "h-8 px-3 text-xs",
  lg: "h-10 px-8 text-base",
  icon: "h-9 w-9",
  "icon-xs": "h-6 w-6",
  "icon-sm": "h-8 w-8",
  "icon-lg": "h-10 w-10",
};

const baseStyle = "group/button inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";

export const buttonVariants = ({ variant = "default", size = "default", className = "" } = {}) => {
  return cn(baseStyle, buttonVariantStyles[variant] || buttonVariantStyles.default, buttonSizeStyles[size] || buttonSizeStyles.default, className);
};

export const Button = React.forwardRef(({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, className })}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";
