import { startOfWeek, format, parseISO, isValid } from "date-fns";

export function mondayOf(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const monday = startOfWeek(isValid(d) ? d : new Date(), { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

export function formatWeekLabel(weekOf: string): string {
  const d = parseISO(weekOf);
  if (!isValid(d)) return weekOf;
  return format(d, "MMM d, yyyy");
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
