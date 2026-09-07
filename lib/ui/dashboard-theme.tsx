"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { btnGoldStyle } from "@/lib/button-3d";

export type DashboardThemeMode = "dark" | "light";

const STORAGE_KEY = "ri-dashboard-theme";

const DashboardThemeContext = createContext<{
  theme: DashboardThemeMode;
  toggleTheme: () => void;
  isLight: boolean;
} | null>(null);

/** Tokens CSS — usar dentro de `.ri-dashboard` */
export const DASH = {
  bg: "var(--dash-bg)",
  sidebar: "var(--dash-sidebar)",
  card: "var(--dash-card)",
  inner: "var(--dash-inner)",
  input: "var(--dash-input-bg)",
  tag: "var(--dash-tag-bg)",
  text: "var(--dash-text)",
  title: "var(--dash-title)",
  muted: "var(--dash-text-muted)",
  border: "var(--dash-border)",
  gold: "var(--dash-gold)",
  compatLow: "var(--dash-compat-low)",
  compatLowText: "var(--dash-compat-low-text)",
  shadow: "var(--dash-shadow)",
} as const;

export const dashFont: CSSProperties = {
  fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, "Segoe UI", sans-serif',
  letterSpacing: "normal",
};

export const dashPage: CSSProperties = {
  minHeight: "100vh",
  background: DASH.bg,
  color: DASH.text,
  ...dashFont,
};

export const dashHeader: CSSProperties = {
  background: DASH.sidebar,
  borderBottom: `1px solid ${DASH.border}`,
  padding: "8px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
  rowGap: 6,
};

export const dashCard: CSSProperties = {
  background: DASH.card,
  border: `1px solid ${DASH.gold}`,
  borderRadius: 16,
  overflow: "hidden",
};

export const dashAside: CSSProperties = {
  background: DASH.sidebar,
  borderRight: `1px solid ${DASH.border}`,
  padding: 16,
  overflowY: "auto",
};

export const dashInput: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: `1px solid ${DASH.border}`,
  borderRadius: 12,
  backgroundColor: DASH.input,
  color: DASH.text,
  fontSize: 13,
  boxSizing: "border-box",
  letterSpacing: "normal",
};

export const dashTag: CSSProperties = {
  background: DASH.gold,
  color: "#000",
  border: "1px solid #000",
  fontSize: 10,
  padding: "4px 8px",
  borderRadius: 10,
  fontWeight: 600,
};

/** Bloco interno: sem moldura — a borda do card pai serve para os dois. */
export const dashInnerBox: CSSProperties = {
  background: DASH.inner,
  border: "none",
  borderRadius: 14,
  overflow: "hidden",
};

export const dashSectionTitle: CSSProperties = {
  color: DASH.title,
  fontWeight: 700,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  textDecorationThickness: "1px",
};

export const dashLabel: CSSProperties = {
  color: DASH.gold,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
};

/** Dourado — somente plano / destaque de marca */
export const dashPlanAccent: CSSProperties = {
  color: DASH.gold,
};

export const dashPlanBox: CSSProperties = {
  ...dashInnerBox,
  border: `1px solid ${DASH.gold}`,
  textAlign: "center",
  padding: 10,
};

/** Notificações importantes — única borda dourada permitida além de plano */
export const dashNotifyImportant: CSSProperties = {
  ...dashCard,
  borderLeft: `4px solid ${DASH.gold}`,
  padding: 14,
  fontWeight: 700,
};

export const dashGhostBtn: CSSProperties = {
  ...btnGoldStyle,
};

export function compatBadgeStyle(_score: number, compact = true): CSSProperties {
  return {
    background: DASH.gold,
    color: "#000",
    fontSize: compact ? 11 : 13,
    padding: compact ? "4px 10px" : "6px 12px",
    borderRadius: 6,
    fontWeight: 800,
    display: "inline-block",
    border: "1px solid #000",
  };
}

function useDashboardThemeState() {
  const [theme, setTheme] = useState<DashboardThemeMode>("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: DashboardThemeMode = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme, isLight: theme === "light" };
}

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) {
    throw new Error("useDashboardTheme deve ser usado dentro de DashboardThemeShell");
  }
  return ctx;
}

export function DashboardThemeShell({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  const value = useDashboardThemeState();

  return (
    <DashboardThemeContext.Provider value={value}>
      <div
        className={["ri-dashboard", className].filter(Boolean).join(" ")}
        data-theme={value.theme}
        style={{ ...dashPage, ...style }}
      >
        {children}
      </div>
    </DashboardThemeContext.Provider>
  );
}
