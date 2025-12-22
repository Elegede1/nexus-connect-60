import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative w-14 h-8 rounded-full p-1 transition-all duration-500",
        "bg-muted hover:shadow-md",
        isDark ? "bg-muted" : "bg-amber/20"
      )}
      aria-label="Toggle theme"
    >
      {/* Background gradient transition */}
      <span
        className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-500",
          "bg-gradient-to-r from-violet/20 to-deep-blue/20",
          isDark ? "opacity-100" : "opacity-0"
        )}
      />
      
      {/* Toggle knob with icon */}
      <span
        className={cn(
          "relative flex items-center justify-center w-6 h-6 rounded-full",
          "transition-all duration-500 ease-out",
          "shadow-md",
          isDark 
            ? "translate-x-6 bg-violet text-white" 
            : "translate-x-0 bg-amber text-white"
        )}
      >
        <Sun
          className={cn(
            "absolute h-4 w-4 transition-all duration-500",
            isDark 
              ? "rotate-90 scale-0 opacity-0" 
              : "rotate-0 scale-100 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "absolute h-4 w-4 transition-all duration-500",
            isDark 
              ? "rotate-0 scale-100 opacity-100" 
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </span>
    </button>
  );
}
