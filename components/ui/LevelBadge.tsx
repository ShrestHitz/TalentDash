import { LEVEL_DISPLAY } from "@/lib/levels";
import type { LevelEnum } from "@/types";

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  "L3": { bg: "#fff1f2", text: "#e11d48" },
  "L4": { bg: "#f0fdf4", text: "#16a34a" },
  "L5": { bg: "#fefce8", text: "#ca8a04" },
  "L6": { bg: "#fff7ed", text: "#ea580c" },
  "L7": { bg: "#fdf4ff", text: "#9333ea" },
  "SDE-I": { bg: "#fff1f2", text: "#e11d48" },
  "SDE-II": { bg: "#f0fdf4", text: "#16a34a" },
  "SDE-III": { bg: "#fefce8", text: "#ca8a04" },
  "IC4": { bg: "#fff7ed", text: "#ea580c" },
  "IC5": { bg: "#fdf4ff", text: "#9333ea" },
  "IC6": { bg: "#fdf2f8", text: "#db2777" },
  "M1": { bg: "#f8fafc", text: "#475569" },
  "M2": { bg: "#f1f5f9", text: "#334155" },
};

export function LevelBadge({ level, size = "md" }: { level: LevelEnum; size?: "sm" | "md" }) {
  const colors = LEVEL_COLORS[level as string] ?? { bg: "#f1f5f9", text: "#475569" };
  const padding = size === "sm" ? "2px 6px" : "2px 8px";
  const fontSize = size === "sm" ? "10px" : "11px";

  return (
    <span style={{
      display: "inline-block",
      background: colors.bg,
      color: colors.text,
      padding,
      borderRadius: 9999,
      fontSize,
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      {LEVEL_DISPLAY[level as string] ?? level}
    </span>
  );
}
