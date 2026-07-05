export function readAnswer(payload: unknown, date: string): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const candidate =
    data[date] ??
    (data.date === date ? data.answer : null) ??
    (typeof data.answers === "object" && data.answers
      ? (data.answers as Record<string, unknown>)[date]
      : null);
  return typeof candidate === "string" && /^[a-z]{5}$/i.test(candidate)
    ? candidate.toUpperCase()
    : null;
}
