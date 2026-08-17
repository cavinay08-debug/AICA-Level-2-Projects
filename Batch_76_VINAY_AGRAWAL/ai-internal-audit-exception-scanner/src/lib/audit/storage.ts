import type { AppSettings, AuditLogEntry, ExceptionReview, ReviewStatus, Transaction } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const KEYS = {
  transactions: "audit.transactions.v1",
  reviews: "audit.reviews.v1",
  settings: "audit.settings.v1",
  log: "audit.log.v1",
  observations: "audit.observations.v1",
} as const;

const canStore = () => typeof window !== "undefined" && !!window.localStorage;

function read<T>(key: string, fallback: T): T {
  if (!canStore()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — keep working in memory */
  }
}

export const loadTransactions = () => read<Transaction[]>(KEYS.transactions, []);
export const saveTransactions = (t: Transaction[]) => write(KEYS.transactions, t);

export const loadReviews = () => read<Record<string, ExceptionReview>>(KEYS.reviews, {});
export const saveReviews = (r: Record<string, ExceptionReview>) => write(KEYS.reviews, r);

export const loadSettings = (): AppSettings => ({
  ...DEFAULT_SETTINGS,
  ...read<Partial<AppSettings>>(KEYS.settings, {}),
});
export const saveSettings = (s: AppSettings) => write(KEYS.settings, s);

export const loadObservations = () => read<string>(KEYS.observations, "");
export const saveObservations = (v: string) => write(KEYS.observations, v);

export const loadAuditLog = () => read<AuditLogEntry[]>(KEYS.log, []);

export function appendAuditLog(entry: {
  reference: string;
  action: string;
  previousStatus?: ReviewStatus | undefined;
  newStatus?: ReviewStatus | undefined;
  note?: string | undefined;
}): AuditLogEntry[] {
  const log = loadAuditLog();
  const next: AuditLogEntry[] = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    },
    ...log,
  ].slice(0, 500);
  write(KEYS.log, next);
  return next;
}

export function clearAuditLog(): AuditLogEntry[] {
  write(KEYS.log, []);
  return [];
}
