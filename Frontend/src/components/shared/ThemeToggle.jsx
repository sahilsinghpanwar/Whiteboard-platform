import { Button } from "@/components/ui/button";
import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={`rounded-full ${className}`}
      data-testid="theme-toggle"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
    </Button>
  );
}
