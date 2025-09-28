// client/src/lib/utils.ts
export function cn(
  ...classes: Array<string | undefined | null | false | Record<string, boolean>>
): string {
  const out: string[] = [];
  for (const c of classes) {
    if (!c) continue;
    if (typeof c === "string") out.push(c);
    else {
      for (const [k, v] of Object.entries(c)) if (v) out.push(k);
    }
  }
  return out.join(" ");
}
