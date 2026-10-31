const KEY = "ldx_refs";
const MAX = 10;

function normalize(ref: string): string {
  return ref.trim();
}

/** Hanya daftar kode referensi terakhir; status selalu diambil dari database. */
export function readRefs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string")
      .map(normalize)
      .filter(Boolean)
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function saveRef(ref: string) {
  if (typeof window === "undefined") return;
  const value = normalize(ref);
  if (!value) return;
  try {
    const next = [value, ...readRefs().filter((item) => item !== value)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage penuh / private mode */
  }
}

export function removeRef(ref: string) {
  if (typeof window === "undefined") return;
  try {
    const next = readRefs().filter((item) => item !== ref);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearRefs() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
