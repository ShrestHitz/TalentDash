import aliases from "./aliases.json";

const ALIASES: Record<string, string> = aliases;

const LEGAL_SUFFIXES = [
  "private limited", "pvt ltd", "pvt. ltd.", "pvt. ltd", "pvt ltd.",
  "limited", "ltd.", "ltd", "inc.", "inc", "llc", "llp",
  "corporation", "corp.", "corp", "co.", "co",
  "technologies", "technology", "tech",
  "solutions", "services", "systems", "software",
  "india", "global", "international", "worldwide",
  "bpo", "bpm", "digital", "ventures", "group",
  "internet", "online",
];

export function normalizeCompanyName(raw: string): string {
  let name = raw.toLowerCase().trim();

  // Remove common domain suffixes
  name = name.replace(/\.com$/, "").replace(/\.in$/, "").replace(/\.io$/, "");

  // Remove special characters except spaces and hyphens
  name = name.replace(/[^\w\s-]/g, " ");

  // Remove legal suffixes (longest first to avoid partial matches)
  const sorted = [...LEGAL_SUFFIXES].sort((a, b) => b.length - a.length);
  for (const suffix of sorted) {
    const re = new RegExp(`\\b${suffix.replace(/\./g, "\\.")}\\b`, "gi");
    name = name.replace(re, "");
  }

  // Collapse whitespace
  name = name.replace(/\s+/g, " ").trim();

  // Check alias table
  if (ALIASES[name]) {
    return ALIASES[name];
  }

  // Remove remaining single-char tokens
  name = name.split(" ").filter((t) => t.length > 1).join(" ").trim();

  return name;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}
