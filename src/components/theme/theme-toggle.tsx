import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={resolved === "dark" ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
      className={cn(
        "h-9 w-9 inline-flex items-center justify-center rounded-full border border-hairline text-ink-muted hover:text-ink hover:border-ink/50 transition",
        className,
      )}
    >
      {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}