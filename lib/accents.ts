export type AccentKey = "pink" | "blue" | "green" | "gold" | "purple";

export const ACCENTS: { key: AccentKey; rgb: string; hex: string }[] = [
  { key: "pink", rgb: "255 107 138", hex: "#FF6B8A" },
  { key: "blue", rgb: "74 144 217", hex: "#4A90D9" },
  { key: "green", rgb: "76 175 80", hex: "#4CAF50" },
  { key: "gold", rgb: "201 168 76", hex: "#C9A84C" },
  { key: "purple", rgb: "155 89 182", hex: "#9B59B6" },
];

export function isAccent(v: unknown): v is AccentKey {
  return typeof v === "string" && ACCENTS.some((a) => a.key === v);
}
