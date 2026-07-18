import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: compact ? "4px 8px" : "6px 12px",
        borderRadius: 8,
        border: `1px solid ${isDark ? "#1f2a44" : "#d4d4d8"}`,
        background: isDark ? "transparent" : "#ffffff",
        color: isDark ? "#9fb0c8" : "#334155",
        cursor: "pointer",
        fontSize: 13,
        transition: "all 150ms ease",
      }}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
      {!compact && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
