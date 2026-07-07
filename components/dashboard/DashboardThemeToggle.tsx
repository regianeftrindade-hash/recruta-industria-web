"use client";

import { useDashboardTheme } from "@/lib/dashboard-theme";

export default function DashboardThemeToggle() {
  const { theme, toggleTheme } = useDashboardTheme();

  return (
    <button
      type="button"
      className="dash-theme-toggle"
      onClick={toggleTheme}
      title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {theme === "dark" ? "☀️ Claro" : "🌙 Escuro"}
    </button>
  );
}
