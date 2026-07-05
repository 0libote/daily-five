export function localDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function daysBetween(from: string, to: string): number {
  const utc = (value: string) => Date.parse(`${value}T00:00:00Z`);
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}
