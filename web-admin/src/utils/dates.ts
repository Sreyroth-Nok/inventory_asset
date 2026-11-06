/** Helpers for plain ISO dates (YYYY-MM-DD) in the user's local time zone. */

export const todayISO = (): string => new Date().toLocaleDateString('en-CA');

export const addDaysISO = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-CA');
};

/** Whole days from a to b (b - a). */
export const daysBetween = (a: string, b: string): number =>
  Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000);

export const formatDate = (iso?: string | null): string =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export type DueState = 'none' | 'ok' | 'soon' | 'today' | 'overdue' | 'returned';

/** Describe an assignment's due date relative to today. */
export const dueInfo = (expected?: string | null, status?: string): { state: DueState; text: string } => {
  if (status === 'Returned') return { state: 'returned', text: '' };
  if (!expected) return { state: 'none', text: 'No return date' };
  const d = daysBetween(todayISO(), expected);
  if (d < 0) return { state: 'overdue', text: `Overdue by ${-d} day${d === -1 ? '' : 's'}` };
  if (d === 0) return { state: 'today', text: 'Due today' };
  if (d <= 3) return { state: 'soon', text: `Due in ${d} day${d === 1 ? '' : 's'}` };
  return { state: 'ok', text: `Due in ${d} days` };
};

export const DUE_COLORS: Record<DueState, string> = {
  none: 'var(--text-dim)',
  ok: 'var(--text-muted)',
  soon: 'var(--accent-amber)',
  today: 'var(--accent-amber)',
  overdue: 'var(--accent-rose)',
  returned: 'var(--text-dim)',
};
